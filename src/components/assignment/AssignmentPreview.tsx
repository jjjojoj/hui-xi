import {
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  RotateCcw,
  Brain,
  Trash2,
  Users,
  ImageIcon,
  Pause,
} from "lucide-react";

interface RecognitionResult {
  studentName: string;
  className: string;
  confidence: number;
  reasoning: string;
}

interface AssignmentFile {
  id: string;
  file: File;
  compressedFile?: File;
  previewUrl: string;
  status:
    | "pending"
    | "compressing"
    | "uploading"
    | "recognizing"
    | "processing"
    | "complete"
    | "error"
    | "paused";
  progress: number;
  error?: string;
  assignmentId?: number;
  retryCount: number;
  recognition?: RecognitionResult;
  selectedStudentId?: number;
  uploadedImageUrl?: string;
}

interface AssignmentPreviewProps {
  files: AssignmentFile[];
  maxFiles: number;
  students: Array<{ id: number; name: string }>;
  confidenceThreshold: number;
  queueStatus: string;
  completedCount: number;
  onRemoveFile: (fileId: string) => void;
  onClearCompleted: () => void;
  onRetryFile: (fileId: string) => void;
  onAssignStudentToFile: (fileId: string, studentId: number) => void;
}

const getStatusColor = (status: AssignmentFile["status"]) => {
  switch (status) {
    case "complete":
      return "text-green-600";
    case "error":
      return "text-red-600";
    case "uploading":
    case "processing":
      return "text-blue-600";
    case "recognizing":
      return "text-purple-600";
    case "compressing":
      return "text-yellow-600";
    case "paused":
      return "text-gray-600";
    default:
      return "text-gray-500";
  }
};

const getStatusIcon = (status: AssignmentFile["status"]) => {
  switch (status) {
    case "complete":
      return <CheckCircle className="w-4 h-4" />;
    case "error":
      return <AlertCircle className="w-4 h-4" />;
    case "uploading":
    case "processing":
      return <Loader2 className="w-4 h-4 animate-spin" />;
    case "recognizing":
      return <Brain className="w-4 h-4 animate-pulse" />;
    case "compressing":
      return <ImageIcon className="w-4 h-4 animate-pulse" />;
    case "paused":
      return <Pause className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getStatusMessage = (status: AssignmentFile["status"]) => {
  switch (status) {
    case "compressing":
      return "Compressing image...";
    case "uploading":
      return "Uploading to storage...";
    case "recognizing":
      return "Recognizing student info...";
    case "processing":
      return "Creating assignment...";
    case "complete":
      return "Complete";
    case "error":
      return "Failed";
    case "paused":
      return "Paused";
    default:
      return "Pending";
  }
};

export type { AssignmentFile, RecognitionResult };

export function AssignmentPreview({
  files,
  maxFiles,
  students,
  confidenceThreshold,
  queueStatus,
  completedCount,
  onRemoveFile,
  onClearCompleted,
  onRetryFile,
  onAssignStudentToFile,
}: AssignmentPreviewProps) {
  return (
    <>
      {/* Feature Introduction when no files */}
      {files.length === 0 && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="text-center mb-4">
            <Brain className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              智能作业上传系统
            </h4>
            <p className="text-gray-600 text-sm">
              利用AI技术简化作业管理流程
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-gray-900">智能识别</span>
              </div>
              <p className="text-gray-600">
                AI自动识别作业图片中的学生姓名，并匹配到对应学生档案
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <Users className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-gray-900">自动分配</span>
              </div>
              <p className="text-gray-600">
                根据置信度自动将作业分配给正确的学生，节省手动操作时间
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <ImageIcon className="w-5 h-5 text-purple-600 mr-2" />
                <span className="font-medium text-gray-900">智能压缩</span>
              </div>
              <p className="text-gray-600">
                自动压缩图片文件，确保上传速度快且存储空间优化
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-center mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-900">批量处理</span>
              </div>
              <p className="text-gray-600">
                支持一次上传多个作业图片，系统自动排队处理
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Selected Files ({files.length}/{maxFiles})
            </h4>

            <div className="flex space-x-2">
              {files.some((f) => f.status === "complete") && (
                <button
                  type="button"
                  onClick={onClearCompleted}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center px-3 py-1 rounded-lg hover:bg-gray-100"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear Completed
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {files.map((file) => (
              <div
                key={file.id}
                className="border border-gray-200 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className={`${getStatusColor(file.status)}`}>
                        {getStatusIcon(file.status)}
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                    </div>

                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span>
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                      {file.compressedFile && (
                        <span className="ml-2 text-green-600">
                          →{" "}
                          {(file.compressedFile.size / 1024 / 1024).toFixed(2)}{" "}
                          MB
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 mt-1">
                      {getStatusMessage(file.status)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview Image */}
                <div className="relative">
                  <img
                    src={file.previewUrl}
                    alt="Preview"
                    className="w-full h-24 object-cover rounded-lg border border-gray-200"
                  />
                  {file.status !== "pending" && (
                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-lg flex items-center justify-center">
                      <div
                        className={`${getStatusColor(file.status)} bg-white rounded-full p-2`}
                      >
                        {getStatusIcon(file.status)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {file.status !== "pending" &&
                  file.status !== "complete" &&
                  file.status !== "error" && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                {/* AI Recognition Results */}
                {file.recognition && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-blue-900">
                        AI Recognition
                      </span>
                      <span className="text-xs text-blue-600">
                        {Math.round(file.recognition.confidence * 100)}%
                      </span>
                    </div>

                    <div className="text-xs text-gray-600">
                      <p>
                        <strong>Student:</strong>{" "}
                        {file.recognition.studentName || "Not detected"}
                      </p>
                      <p>
                        <strong>Class:</strong>{" "}
                        {file.recognition.className || "Not detected"}
                      </p>
                    </div>

                    {!file.selectedStudentId &&
                      file.recognition.confidence < confidenceThreshold && (
                        <select
                          onChange={(e) =>
                            onAssignStudentToFile(
                              file.id,
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                          defaultValue=""
                        >
                          <option value="">Assign to student...</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                )}

                {/* Error Message & Retry */}
                {file.status === "error" && (
                  <div className="space-y-2">
                    <p className="text-xs text-red-600">{file.error}</p>
                    {file.retryCount < 3 && (
                      <button
                        type="button"
                        onClick={() => onRetryFile(file.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry ({file.retryCount}/3)
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Status */}
      {queueStatus !== "idle" && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              {queueStatus === "running" && (
                <Zap className="w-5 h-5 animate-pulse text-blue-600 mr-2" />
              )}
              {queueStatus === "paused" && (
                <Pause className="w-5 h-5 text-yellow-600 mr-2" />
              )}
              {queueStatus === "completed" && (
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              )}

              <span className="text-sm font-medium text-gray-700">
                {queueStatus === "running" &&
                  "Processing upload queue with AI recognition..."}
                {queueStatus === "paused" && "Upload queue paused"}
                {queueStatus === "completed" && "Upload queue completed"}
              </span>
            </div>

            <span className="text-sm text-gray-500">
              {completedCount}/{files.length} completed
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{
                width: `${files.length > 0 ? (completedCount / files.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
