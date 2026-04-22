import { useForm } from "react-hook-form";
import { Settings, X } from "lucide-react";

interface AssignmentConfigProps {
  uploadType: "assignment" | "exam";
  register: ReturnType<typeof useForm>["register"];
  watch: ReturnType<typeof useForm>["watch"];
  errors: ReturnType<typeof useForm>["formState"]["errors"];
  showAdvancedSettings: boolean;
  onToggleAdvancedSettings: () => void;
  models: Array<{ key: string; name: string; isDefault?: boolean }> | undefined;
}

export function AssignmentConfig({
  uploadType,
  register,
  watch,
  errors,
  showAdvancedSettings,
  onToggleAdvancedSettings,
  models,
}: AssignmentConfigProps) {
  const confidenceThreshold = watch("confidenceThreshold");
  const autoAssignStudents = watch("autoAssignStudents");

  return (
    <>
      {/* Assignment Details and Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            {uploadType === "exam" ? "Exam" : "Assignment"} Title
          </label>
          <input
            {...register("title")}
            type="text"
            id="title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder={`e.g., ${
              uploadType === "exam"
                ? "Math Final Exam"
                : "Math Homework Chapter 5"
            }`}
          />
          {errors.title && (
            <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="selectedModel"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            AI Model
          </label>
          <select
            {...register("selectedModel")}
            id="selectedModel"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          >
            {models?.map((model) => (
              <option key={model.key} value={model.key}>
                {model.name}
                {model.isDefault ? " (Default)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <input
            {...register("description")}
            type="text"
            id="description"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            placeholder="Additional notes..."
          />
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={onToggleAdvancedSettings}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center">
            <Settings className="w-5 h-5 text-gray-500 mr-2" />
            <span className="font-medium text-gray-900">Advanced Settings</span>
          </div>
          <div
            className={`transform transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`}
          >
            <X className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        {showAdvancedSettings && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="confidenceThreshold"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                </label>
                <input
                  {...register("confidenceThreshold", { valueAsNumber: true })}
                  type="range"
                  id="confidenceThreshold"
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum confidence required for auto-assignment
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  {...register("autoAssignStudents")}
                  type="checkbox"
                  id="autoAssignStudents"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="autoAssignStudents"
                  className="text-sm font-medium text-gray-700"
                >
                  Auto-assign students based on AI recognition
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
