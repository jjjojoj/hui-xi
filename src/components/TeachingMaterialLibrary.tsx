import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "~/components/Toast";
import {
  FileText,
  Image,
  Video,
  Music,
  File,
  Trash2,
  Eye,
  ExternalLink,
  Filter,
  Search,
  Plus,
  Calendar,
  Tag,
  X,
} from "lucide-react";
import { useAuthStore } from "~/stores/authStore";
import { TeachingMaterialUpload } from "./TeachingMaterialUpload";
import { ConfirmDialog } from "./ConfirmDialog";
import { ModalWrapper } from "./ModalWrapper";

interface TeachingMaterial {
  id: number;
  title: string;
  description?: string | null;
  contentType: string;
  fileUrl?: string | null;
  textContent?: string | null;
  knowledgeArea?: {
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

type TeachingMaterialContentType =
  | "document"
  | "image"
  | "text"
  | "video"
  | "audio"
  | "other";

interface KnowledgeArea {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
}

const CONTENT_TYPE_OPTIONS: Array<{
  value: TeachingMaterialContentType;
  label: string;
}> = [
  { value: "text", label: "文本" },
  { value: "document", label: "文档" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
  { value: "audio", label: "音频" },
  { value: "other", label: "其他" },
];

function isTeachingMaterialContentType(
  value: string,
): value is TeachingMaterialContentType {
  return CONTENT_TYPE_OPTIONS.some((option) => option.value === value);
}

interface TeachingMaterialLibraryProps {
  onClose?: () => void;
  showHeader?: boolean;
  variant?: "modal" | "page";
}

export function TeachingMaterialLibrary({
  onClose,
  showHeader = true,
  variant = "modal",
}: TeachingMaterialLibraryProps) {
  const toast = useToast();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { authToken } = useAuthStore();
  const [showUpload, setShowUpload] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [selectedMaterial, setSelectedMaterial] =
    useState<TeachingMaterial | null>(null);
  const [selectedContentType, setSelectedContentType] = useState<
    TeachingMaterialContentType | ""
  >("");
  const [selectedKnowledgeArea, setSelectedKnowledgeArea] = useState<
    number | ""
  >("");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch teaching materials
  const {
    data: materialsData,
    isLoading,
    error,
  } = useQuery({
    ...trpc.getTeachingMaterials.queryOptions({
      authToken: authToken!,
      ...(selectedContentType && { contentType: selectedContentType }),
      ...(selectedKnowledgeArea && {
        knowledgeAreaId: selectedKnowledgeArea,
      }),
    }),
    enabled: !!authToken,
  });

  // Get knowledge areas for categorization
  const { data: knowledgeAreasData } = useQuery({
    ...trpc.getKnowledgeAreas.queryOptions({
      authToken: authToken!,
    }),
    enabled: !!authToken,
  });

  const knowledgeAreas: KnowledgeArea[] =
    knowledgeAreasData?.knowledgeAreas ?? [];

  // Delete material mutation
  const deleteMutation = useMutation(
    trpc.deleteTeachingMaterial.mutationOptions(),
  );

  const materials: TeachingMaterial[] = materialsData?.materials ?? [];

  // Filter materials based on search query
  const filteredMaterials = materials.filter(
    (material) =>
      material.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (material.description &&
        material.description
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      material.knowledgeArea?.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  const handleDelete = (materialId: number, title: string) => {
    setDeleteTarget({ id: materialId, title });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMutation.mutateAsync({
        authToken: authToken!,
        materialId: deleteTarget.id,
      });
      toast.success("教学资料删除成功");
      void queryClient.invalidateQueries({
        queryKey: ["teachingMaterials"],
      });
      setDeleteTarget(null);
    } catch {
      toast.error("删除失败，请重试");
    }
  };

  const handleUploadSuccess = () => {
    setShowUpload(false);
    // Use proper tRPC query invalidation
    void queryClient.invalidateQueries({
      queryKey: ["teachingMaterials"],
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="h-5 w-5 text-blue-500" />;
      case "video":
        return <Video className="h-5 w-5 text-purple-500" />;
      case "audio":
        return <Music className="h-5 w-5 text-green-500" />;
      case "text":
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <File className="h-5 w-5 text-orange-500" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "image":
        return "图片";
      case "video":
        return "视频";
      case "audio":
        return "音频";
      case "text":
        return "文本";
      case "document":
        return "文档";
      default:
        return "其他";
    }
  };

  const formatDate = (dateValue: Date | string) => {
    return new Date(dateValue).toLocaleDateString("zh-CN");
  };

  const getPreviewKind = (material: TeachingMaterial) => {
    if (material.contentType === "image" && material.fileUrl) return "image";
    if (material.contentType === "video" && material.fileUrl) return "video";
    if (material.contentType === "audio" && material.fileUrl) return "audio";
    if (
      material.fileUrl &&
      (material.fileUrl.toLowerCase().includes(".pdf") ||
        material.contentType === "document")
    ) {
      return "document";
    }
    if (material.textContent?.trim()) return "text";
    return "generic";
  };

  if (showUpload) {
    return (
      <TeachingMaterialUpload
        onSuccess={handleUploadSuccess}
        onClose={() => setShowUpload(false)}
        variant={variant}
      />
    );
  }

  return (
    <div
      className={
        variant === "page"
          ? "rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
          : "rounded-lg bg-white p-6 shadow-lg"
      }
    >
      {showHeader ? (
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">教学资料库</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              添加资料
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                title="关闭"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            添加资料
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
          <input
            type="text"
            placeholder="搜索教学资料..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={selectedContentType}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedContentType(
                  isTeachingMaterialContentType(value) ? value : "",
                );
              }}
              className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">所有类型</option>
              {CONTENT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {knowledgeAreas.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <select
                value={selectedKnowledgeArea}
                onChange={(e) =>
                  setSelectedKnowledgeArea(
                    e.target.value ? parseInt(e.target.value) : "",
                  )
                }
                className="rounded-md border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">所有知识领域</option>
                {knowledgeAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-sm text-gray-500">
            共 {filteredMaterials.length} 份资料
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="py-12 text-center">
          <p className="text-red-600">加载教学资料时出错，请刷新页面重试</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredMaterials.length === 0 && (
        <div className="py-12 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <p className="mb-4 text-gray-600">
            {searchQuery || selectedContentType
              ? "没有找到匹配的教学资料"
              : "还没有上传任何教学资料"}
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            上传第一份资料
          </button>
        </div>
      )}

      {/* Materials Grid */}
      {!isLoading && !error && filteredMaterials.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((material) => (
            <div
              key={material.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedMaterial(material)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedMaterial(material);
                }
              }}
              className="cursor-pointer rounded-lg border border-gray-200 p-4 transition-shadow hover:border-blue-200 hover:shadow-md"
            >
              {/* Header */}
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getContentTypeIcon(material.contentType)}
                  <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                    {getContentTypeLabel(material.contentType)}
                  </span>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDelete(material.id, material.title);
                  }}
                  className="text-gray-400 hover:text-red-600"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <h3 className="mb-2 line-clamp-2 font-medium text-gray-900">
                {material.title}
              </h3>

              {material.description && (
                <p className="mb-3 line-clamp-2 text-sm text-gray-600">
                  {material.description}
                </p>
              )}

              {/* Knowledge Area */}
              {material.knowledgeArea && (
                <div className="mb-3 flex items-center space-x-1">
                  <Tag className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    {material.knowledgeArea.name}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(material.createdAt)}</span>
                </div>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedMaterial(material);
                  }}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <Eye className="h-3 w-3" />
                  <span>详情</span>
                </button>
              </div>

              {/* Text Content Preview */}
              {material.contentType === "text" && material.textContent && (
                <div className="mt-3 line-clamp-3 rounded bg-gray-50 p-2 text-xs text-gray-600">
                  {material.textContent}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="删除教学资料"
        message={`确定要删除教学资料"${deleteTarget?.title}"吗？此操作不可撤销。`}
        confirmLabel="确认删除"
        cancelLabel="取消"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          void confirmDelete();
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <ModalWrapper
        isOpen={!!selectedMaterial}
        onClose={() => setSelectedMaterial(null)}
        maxWidth="max-w-5xl"
      >
        {selectedMaterial ? (
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    {getContentTypeIcon(selectedMaterial.contentType)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                    {getContentTypeLabel(selectedMaterial.contentType)}
                  </span>
                  {selectedMaterial.knowledgeArea ? (
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-600">
                      {selectedMaterial.knowledgeArea.name}
                    </span>
                  ) : null}
                </div>
                <h3 className="mt-4 text-2xl font-bold text-slate-950">
                  {selectedMaterial.title}
                </h3>
                {selectedMaterial.description ? (
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    {selectedMaterial.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setSelectedMaterial(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-blue-200 hover:text-blue-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 xl:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
                {getPreviewKind(selectedMaterial) === "image" &&
                selectedMaterial.fileUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <img
                      src={selectedMaterial.fileUrl}
                      alt={selectedMaterial.title}
                      className="max-h-[560px] w-full object-contain"
                    />
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "video" &&
                selectedMaterial.fileUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-950">
                    <video
                      src={selectedMaterial.fileUrl}
                      controls
                      className="max-h-[560px] w-full"
                    />
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "audio" &&
                selectedMaterial.fileUrl ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      音频内容
                    </div>
                    <audio
                      src={selectedMaterial.fileUrl}
                      controls
                      className="w-full"
                    />
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "document" &&
                selectedMaterial.fileUrl &&
                selectedMaterial.fileUrl.toLowerCase().includes(".pdf") ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    <iframe
                      src={selectedMaterial.fileUrl}
                      title={selectedMaterial.title}
                      className="h-[620px] w-full"
                    />
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "text" ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      内容预览
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {selectedMaterial.textContent}
                    </div>
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "document" &&
                (!selectedMaterial.fileUrl ||
                  !selectedMaterial.fileUrl.toLowerCase().includes(".pdf")) ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      文档说明
                    </div>
                    <p className="text-sm leading-7 text-slate-600">
                      当前资料已归档为文档类型。若为 Word、Excel
                      或其他文件格式，可以通过右侧按钮在新标签页查看原文件。
                    </p>
                    {selectedMaterial.textContent ? (
                      <div className="mt-4 whitespace-pre-wrap rounded-lg bg-white p-4 text-sm leading-7 text-slate-700 ring-1 ring-slate-100">
                        {selectedMaterial.textContent}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {getPreviewKind(selectedMaterial) === "generic" ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                      {getContentTypeIcon(selectedMaterial.contentType)}
                    </span>
                    <div className="mt-4 text-base font-bold text-slate-900">
                      这份资料暂不支持内嵌预览
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      你仍然可以通过右侧信息区查看元数据，或直接打开原文件。
                    </p>
                  </div>
                ) : null}
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="text-sm font-bold text-slate-900">
                    资料信息
                  </div>
                  <div className="mt-4 space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          创建时间
                        </div>
                        <div className="mt-1 font-medium text-slate-900">
                          {formatDate(selectedMaterial.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Tag className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          知识点
                        </div>
                        <div className="mt-1 font-medium text-slate-900">
                          {selectedMaterial.knowledgeArea?.name || "未关联"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Eye className="mt-0.5 h-4 w-4 text-slate-400" />
                      <div>
                        <div className="text-xs uppercase tracking-wide text-slate-400">
                          资料类型
                        </div>
                        <div className="mt-1 font-medium text-slate-900">
                          {getContentTypeLabel(selectedMaterial.contentType)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedMaterial.fileUrl ? (
                  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="text-sm font-bold text-slate-900">
                      原文件
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      若需要完整查看原始文件，可以直接在新标签页打开。
                    </p>
                    <a
                      href={selectedMaterial.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                      打开原文件
                    </a>
                  </div>
                ) : null}
              </aside>
            </div>
          </div>
        ) : null}
      </ModalWrapper>
    </div>
  );
}
