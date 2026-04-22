import { useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Sparkles,
  GraduationCap,
  ChevronRight,
  Mail,
  ArrowUp,
  ArrowDown,
  Trash2,
  Heart,
  Group,
} from "lucide-react";
import { RightClickMenu, type ContextMenuItem } from "~/components/ContextMenu";

type SortField = "name" | "studentId" | "performance" | "potential";
type SortOrder = "asc" | "desc";

interface Student {
  id: number;
  name: string;
  email?: string | null;
  studentId?: string | null;
  specialAttention?: boolean;
  group?: { name: string } | null;
  _count: {
    assignments: number;
    exams: number;
    mistakes: number;
    examMistakes: number;
  };
}

interface ClassStudentsProps {
  students: Student[];
  onStudentClick: (studentId: number) => void;
  onDeleteStudent: (student: Student) => void;
  onSpecialAttention: (student: Student) => void;
  onAddToGroup: (student: Student) => void;
  onShowAddStudentModal: () => void;
}

export function ClassStudents({
  students,
  onStudentClick,
  onDeleteStudent,
  onSpecialAttention,
  onAddToGroup,
  onShowAddStudentModal,
}: ClassStudentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (newSortBy: SortField) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const getContextMenuItems = (student: Student): ContextMenuItem[] => [
    {
      label: "删除学生",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: () => onDeleteStudent(student),
      className: "text-red-700 hover:bg-red-50",
    },
    {
      label: student.specialAttention ? "取消特别关注" : "特别关注",
      icon: <Heart className="w-4 h-4" />,
      onClick: () => onSpecialAttention(student),
      className: "text-pink-700 hover:bg-pink-50",
    },
    {
      label: "添加到小组",
      icon: <Group className="w-4 h-4" />,
      onClick: () => onAddToGroup(student),
      className: "text-blue-700 hover:bg-blue-50",
    },
  ];

  // Filter and sort students
  const filteredAndSortedStudents = students
    .filter(
      (student) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email &&
          student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.studentId &&
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name, "zh-CN");
          break;
        case "studentId": {
          const aId = a.studentId || "";
          const bId = b.studentId || "";
          const aNum = parseInt(aId);
          const bNum = parseInt(bId);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
          } else {
            comparison = aId.localeCompare(bId);
          }
          break;
        }
        case "performance": {
          const aScore = a._count.assignments + a._count.exams;
          const bScore = b._count.assignments + b._count.exams;
          comparison = aScore - bScore;
          break;
        }
        case "potential": {
          const aPotential = a._count.mistakes + a._count.examMistakes;
          const bPotential = b._count.mistakes + b._count.examMistakes;
          comparison = bPotential - aPotential;
          break;
        }
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  return (
    <div className="card animate-slide-up">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Users className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-bold text-gray-900">班级学生</h3>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索学生..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
              />
            </div>

            {/* Sort buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">排序:</span>
              <button
                onClick={() => handleSort("name")}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                  sortBy === "name"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                姓名
                {sortBy === "name" &&
                  (sortOrder === "asc" ? (
                    <ArrowUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 ml-1" />
                  ))}
              </button>
              <button
                onClick={() => handleSort("studentId")}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                  sortBy === "studentId"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                学号
                {sortBy === "studentId" &&
                  (sortOrder === "asc" ? (
                    <ArrowUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 ml-1" />
                  ))}
              </button>
              <button
                onClick={() => handleSort("performance")}
                className={`flex items-center px-3 py-2 text-sm rounded-lg transition-all ${
                  sortBy === "performance"
                    ? "bg-blue-100 text-blue-700 border border-blue-200"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                综合
                {sortBy === "performance" &&
                  (sortOrder === "asc" ? (
                    <ArrowUp className="w-3 h-3 ml-1" />
                  ) : (
                    <ArrowDown className="w-3 h-3 ml-1" />
                  ))}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {filteredAndSortedStudents.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredAndSortedStudents.map((student) => (
              <RightClickMenu
                key={student.id}
                items={getContextMenuItems(student)}
              >
                <div
                  onClick={() => onStudentClick(student.id)}
                  className="card-interactive p-4 border-0 bg-gradient-to-r from-gray-50 to-blue-50/30 hover:from-blue-50 hover:to-indigo-50 animate-slide-up cursor-pointer group"
                >
                  {/* Student basic info row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform">
                          <span className="text-white font-bold text-sm">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {student.specialAttention && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                            <Heart className="w-2 h-2 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-sm">
                          {student.name}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          {student.studentId && (
                            <div className="flex items-center text-xs text-gray-500">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              学号: {student.studentId}
                            </div>
                          )}
                          {student.group && (
                            <div className="flex items-center text-xs text-blue-600">
                              <Group className="w-3 h-3 mr-1" />
                              {student.group.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-sm font-bold text-blue-600">
                          {student._count.assignments}
                        </div>
                        <div className="text-xs text-gray-500">作业</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-purple-600">
                          {student._count.exams}
                        </div>
                        <div className="text-xs text-gray-500">考试</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-bold text-orange-600">
                          {student._count.mistakes + student._count.examMistakes}
                        </div>
                        <div className="text-xs text-gray-500">错题</div>
                      </div>
                    </div>
                    {student.email && (
                      <div className="flex items-center text-gray-500 text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        <span className="truncate max-w-20">{student.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </RightClickMenu>
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-blue-600" />
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-2">还没有学生</h4>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              添加您的第一个学生，开始班级管理和进度跟踪
            </p>
            <button
              onClick={onShowAddStudentModal}
              className="btn-primary text-lg px-8 py-4 group"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              添加学生
              <Sparkles className="w-5 h-5 ml-2 group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        ) : (
          <div className="text-center py-8">
            <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">没有找到匹配&quot;{searchTerm}&quot;的学生</p>
            <button
              onClick={() => setSearchTerm("")}
              className="text-blue-600 hover:text-blue-500 text-sm mt-2 font-medium"
            >
              清除搜索
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
