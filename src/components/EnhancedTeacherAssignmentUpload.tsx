import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { CheckCircle2, Files, Upload, Users, X } from "lucide-react";
import { useToast } from "~/components/Toast";
import { getErrorMessage } from "~/utils/trpcError";
import { FileUploadZone } from "~/components/assignment/FileUploadZone";
import {
  AssignmentPreview,
  type AssignmentFile,
} from "~/components/assignment/AssignmentPreview";
import { AssignmentConfig } from "~/components/assignment/AssignmentConfig";
import { TeacherCameraCapture } from "~/components/assignment/TeacherCameraCapture";
import { UploadSubmitSection } from "~/components/assignment/UploadSubmitSection";
import { compressImage } from "~/components/assignment/compressImage";

const uploadSchema = z.object({
  title: z.string().min(1, "请填写标题"),
  description: z.string().optional(),
  selectedModel: z.string().min(1, "请选择识别模型"),
  confidenceThreshold: z.number().min(0).max(1).default(0.7),
  autoAssignStudents: z.boolean().default(true),
});

type UploadFormData = z.infer<typeof uploadSchema>;

interface EnhancedTeacherAssignmentUploadProps {
  isOpen: boolean;
  classId: number;
  students?: Array<{ id: number; name: string }>;
  onSuccess?: (uploadedCount: number) => void;
  onClose?: () => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  uploadType?: "assignment" | "exam";
}

type UploadQueueStatus = "idle" | "running" | "paused" | "completed";

export function EnhancedTeacherAssignmentUpload({
  isOpen,
  classId: _classId,
  students = [],
  onSuccess,
  onClose,
  maxFiles = 10,
  allowMultiple = true,
  uploadType = "assignment",
}: EnhancedTeacherAssignmentUploadProps) {
  const toast = useToast();
  const [files, setFiles] = useState<AssignmentFile[]>([]);
  const [queueStatus, setQueueStatus] = useState<UploadQueueStatus>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const trpc = useTRPC();
  const { authToken } = useAuthStore();

  // Get available AI models
  const modelsQuery = useQuery({
    ...trpc.getAvailableModels.queryOptions(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<UploadFormData>({
    resolver: zodResolver(uploadSchema) as any,
    defaultValues: {
      selectedModel: "siliconcloud/qwen2.5-vl-7b",
      confidenceThreshold: 0.7,
      autoAssignStudents: true,
    },
  });

  const confidenceThreshold = watch("confidenceThreshold");
  const autoAssignStudents = watch("autoAssignStudents");

  const presignedUrlMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).generatePresignedUploadUrl.mutateAsync(data),
  });
  const recognizeStudentMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).recognizeStudentInfo.mutateAsync(data),
  });
  const uploadTeacherAssignmentMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).uploadTeacherAssignment.mutateAsync(data),
  });
  const uploadTeacherExamMutation = useMutation({
    mutationFn: (data: any) =>
      (trpc as any).uploadTeacherExam.mutateAsync(data),
  });

  // ─── File management ───────────────────────────────────────────────

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "请选择图片文件（JPG、PNG、GIF、WebP）";
    }
    if (file.size > 20 * 1024 * 1024) {
      return "文件大小不能超过 20MB";
    }
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return "暂不支持该格式，请使用 JPG、PNG、GIF 或 WebP";
    }
    return null;
  };

  const addFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const currentFileCount = files.length;

      if (currentFileCount + fileArray.length > maxFiles) {
        toast.error(`单次最多上传 ${maxFiles} 份图片`);
        return;
      }

      const validFiles: AssignmentFile[] = [];

      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          toast.error(`${file.name}: ${error}`);
          continue;
        }

        const isDuplicate = files.some(
          (f) =>
            f.file.name === file.name &&
            f.file.size === file.size &&
            f.file.lastModified === file.lastModified,
        );

        if (isDuplicate) {
          toast.error(`${file.name} 已在队列中`);
          continue;
        }

        const previewUrl = URL.createObjectURL(file);

        validFiles.push({
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          previewUrl,
          status: "pending",
          progress: 0,
          retryCount: 0,
        });
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        toast.success(`已加入 ${validFiles.length} 份图片`);
      }
    },
    [files, maxFiles, toast],
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        void addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        void addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  // ─── Camera ────────────────────────────────────────────────────────

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch {
      toast.error("无法访问摄像头，请检查浏览器权限");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      context?.drawImage(video, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            void addFiles([file]);
            stopCamera();
          }
        },
        "image/jpeg",
        0.8,
      );
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  // ─── Upload pipeline ───────────────────────────────────────────────

  const uploadFileToOSS = async (file: File): Promise<string> => {
    try {
      const folderName =
        uploadType === "exam" ? "exam-uploads" : "assignment-uploads";

      const urlResponse: any = await presignedUrlMutation.mutateAsync({
        authToken: authToken!,
        fileName: `teacher-${Date.now()}-${file.name}`,
        fileType: file.type,
        folderName,
      });

      const uploadResponse = await fetch(urlResponse.presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("上传文件失败");
      }

      return urlResponse.objectUrl;
    } catch {
      throw new Error("上传到存储服务失败");
    }
  };

  const processFile = async (fileId: string, formData: UploadFormData) => {
    const fileIndex = files.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return;

    const updateFileStatus = (
      status: AssignmentFile["status"],
      progress: number,
      error?: string,
      updates?: Partial<AssignmentFile>,
    ) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId ? { ...f, status, progress, error, ...updates } : f,
        ),
      );
    };

    try {
      const file = files[fileIndex];
      if (!file) return;

      // Compress image
      updateFileStatus("compressing", 10);
      const compressedFile = await compressImage(file.file);

      updateFileStatus("compressing", 20, undefined, { compressedFile });

      // Upload to OSS
      updateFileStatus("uploading", 30);
      const fileUrl = await uploadFileToOSS(compressedFile);

      updateFileStatus("uploading", 50, undefined, {
        uploadedImageUrl: fileUrl,
      });

      // AI Recognition
      updateFileStatus("recognizing", 60);
      const recognition: any = await recognizeStudentMutation.mutateAsync({
        authToken: authToken!,
        imageUrl: fileUrl,
        modelKey: formData.selectedModel,
      });

      if (recognition.success) {
        updateFileStatus("recognizing", 70, undefined, {
          recognition: recognition.recognition,
        });

        // Auto-assign student if confidence is high enough
        let selectedStudentId: number | undefined;

        if (
          autoAssignStudents &&
          recognition.recognition.confidence >= confidenceThreshold
        ) {
          const matchedStudent = students.find(
            (s) =>
              s.name
                .toLowerCase()
                .includes(recognition.recognition.studentName.toLowerCase()) ||
              recognition.recognition.studentName
                .toLowerCase()
                .includes(s.name.toLowerCase()),
          );

          if (matchedStudent) {
            selectedStudentId = matchedStudent.id;
            updateFileStatus("recognizing", 80, undefined, {
              selectedStudentId,
            });
            toast.success(`已自动匹配到 ${matchedStudent.name}`);
          }
        }

        // If we have a student assignment or confidence is low, create assignment/exam
        if (selectedStudentId || !autoAssignStudents) {
          updateFileStatus("processing", 85);

          const finalStudentId = selectedStudentId || students[0]?.id;

          if (finalStudentId) {
            const uploadMutation =
              uploadType === "exam"
                ? uploadTeacherExamMutation
                : uploadTeacherAssignmentMutation;

            const defaultTitle =
              uploadType === "exam"
                ? `考试 - ${new Date().toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}`
                : `作业 - ${new Date().toLocaleDateString("zh-CN", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}`;

            const finalTitle =
              formData.title && formData.title.trim()
                ? formData.title
                : defaultTitle;

            await uploadMutation.mutateAsync({
              authToken: authToken!,
              studentId: finalStudentId,
              title: `${finalTitle} - ${file.file.name}`,
              description: formData.description,
              imageUrl: fileUrl,
            });

            updateFileStatus("complete", 100);
            setCompletedCount((prev) => prev + 1);
          } else {
            throw new Error("当前班级暂无可分配学生");
          }
        } else {
          // Low confidence, needs manual assignment
          updateFileStatus("complete", 100, undefined, {
            recognition: recognition.recognition,
            uploadedImageUrl: fileUrl,
          });
          setCompletedCount((prev) => prev + 1);
          toast(
            `${file.file.name} 已上传，识别置信度 ${Math.round(recognition.recognition.confidence * 100)}%，建议手动确认学生`,
            {
              icon: "⚠️",
              style: {
                background: "#f59e0b",
                color: "white",
              },
            },
          );
        }
      } else {
        throw new Error("识别失败，请稍后重试");
      }
    } catch (error: unknown) {
      const file = files[fileIndex];

      if (file && file.retryCount < 3) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? {
                  ...f,
                  status: "error",
                  error: getErrorMessage(error),
                  retryCount: f.retryCount + 1,
                }
              : f,
          ),
        );
      } else {
        updateFileStatus("error", 0, getErrorMessage(error));
      }
    }
  };

  const startQueue = async (formData: UploadFormData) => {
    if (!authToken) {
      toast.error("请先登录后再上传");
      return;
    }

    setQueueStatus("running");
    setCompletedCount(0);

    const pendingFiles = files.filter(
      (f) => f.status === "pending" || f.status === "error",
    );

    for (const file of pendingFiles) {
      if (queueStatus === "paused") break;
      await processFile(file.id, formData);
    }

    setQueueStatus("completed");

    const successCount = files.filter((f) => f.status === "complete").length;
    if (successCount > 0) {
      toast.success(
        `已完成 ${successCount} 份${uploadType === "exam" ? "试卷" : "作业"}`,
      );
      onSuccess?.(successCount);
    }
  };

  const pauseQueue = () => {
    setQueueStatus("paused");
  };

  const resumeQueue = (formData: UploadFormData) => {
    setQueueStatus("running");
    void startQueue(formData);
  };

  const retryFile = (fileId: string, formData: UploadFormData) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, status: "pending", error: undefined } : f,
      ),
    );
    void processFile(fileId, formData);
  };

  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== fileId);
    });
  };

  const clearCompleted = () => {
    setFiles((prev) => {
      const completedFiles = prev.filter((f) => f.status === "complete");
      completedFiles.forEach((file) => URL.revokeObjectURL(file.previewUrl));
      return prev.filter((f) => f.status !== "complete");
    });
  };

  const assignStudentToFile = (fileId: string, studentId: number) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId ? { ...f, selectedStudentId: studentId } : f,
      ),
    );
  };

  const onSubmit = (data: UploadFormData) => {
    if (files.length === 0) {
      toast.error("请先选择至少一张图片");
      return;
    }
    void startQueue(data);
  };

  useEffect(() => {
    return () => {
      files.forEach((file) => URL.revokeObjectURL(file.previewUrl));
    };
  }, []);

  if (!isOpen) return null;

  const defaultResumeData: UploadFormData = {
    title: "继续上传",
    description: "",
    selectedModel: "siliconcloud/qwen2.5-vl-7b",
    confidenceThreshold: 0.7,
    autoAssignStudents: true,
  };
  const contentLabel = uploadType === "exam" ? "试卷" : "作业";
  const waitingCount = files.filter((file) => file.status === "pending").length;
  const handleStartCamera = () => {
    void startCamera();
  };
  const submitUpload = handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Upload className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {contentLabel}批量上传
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  上传后自动识别学生信息、归档到班级，并衔接后续的成绩与学情分析。
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                    <Files className="mr-1 inline h-3.5 w-3.5" />
                    已选 {files.length} 份
                  </span>
                  <span className="rounded-full bg-violet-50 px-3 py-1 text-violet-700">
                    <Users className="mr-1 inline h-3.5 w-3.5" />
                    学生 {students.length} 人
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                    已完成 {completedCount} 份
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                    待处理 {waitingCount} 份
                  </span>
                </div>
              </div>
            </div>
            {onClose ? (
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitUpload(event);
          }}
          className="grid gap-6 overflow-y-auto p-6 xl:grid-cols-[minmax(0,1.4fr)_360px]"
        >
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <FileUploadZone
                dragActive={dragActive}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onFileSelect={handleFileSelect}
                onStartCamera={handleStartCamera}
                maxFiles={maxFiles}
                allowMultiple={allowMultiple}
                uploadType={uploadType}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <AssignmentPreview
                files={files}
                maxFiles={maxFiles}
                students={students}
                confidenceThreshold={confidenceThreshold}
                queueStatus={queueStatus}
                completedCount={completedCount}
                onRemoveFile={removeFile}
                onClearCompleted={clearCompleted}
                onRetryFile={(fileId) =>
                  retryFile(fileId, {
                    title: "重试上传",
                    description: "",
                    selectedModel: "siliconcloud/qwen2.5-vl-7b",
                    confidenceThreshold: 0.7,
                    autoAssignStudents: true,
                  })
                }
                onAssignStudentToFile={assignStudentToFile}
              />
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <AssignmentConfig
                uploadType={uploadType}
                register={register}
                watch={watch}
                errors={errors}
                showAdvancedSettings={showAdvancedSettings}
                onToggleAdvancedSettings={() =>
                  setShowAdvancedSettings(!showAdvancedSettings)
                }
                models={modelsQuery.data?.models}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <UploadSubmitSection
                uploadType={uploadType}
                files={files}
                queueStatus={queueStatus}
                completedCount={completedCount}
                onPause={pauseQueue}
                onResume={() => resumeQueue(defaultResumeData)}
              />
            </section>
          </div>
        </form>

        <TeacherCameraCapture
          isOpen={showCamera}
          videoRef={videoRef}
          canvasRef={canvasRef}
          onCapture={capturePhoto}
          onClose={stopCamera}
        />
      </div>
    </div>
  );
}
