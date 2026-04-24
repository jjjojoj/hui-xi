import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import { getErrorMessage } from "~/utils/trpcError";
import {
  DashboardShell,
  EmptyState,
  MetricCard,
  ModuleButton,
  Panel,
} from "~/components/dashboard/DashboardShell";
import { StudentPerformanceChart } from "~/components/student/StudentPerformanceChart";
import {
  Award,
  BookOpen,
  Brain,
  CheckCircle,
  Clock,
  FileText,
  Target,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";

const studentProfileParamsSchema = z.object({
  classId: z.string(),
  studentId: z.string(),
});

export const Route = createFileRoute("/classes/$classId/students/$studentId/")({
  component: StudentProfile,
});

function StudentProfile() {
  const navigate = useNavigate();
  const { classId, studentId } = studentProfileParamsSchema.parse(
    Route.useParams(),
  );
  const classIdNumber = Number.parseInt(classId, 10);
  const studentIdNumber = Number.parseInt(studentId, 10);
  const { authToken, teacher } = useAuthStore();
  const trpc = useTRPC();
  const [timeRange, setTimeRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "all"
  >("30d");

  const studentQuery = useQuery({
    ...trpc.getStudentProfileData.queryOptions({
      authToken: authToken || "",
      studentId: studentIdNumber,
    }),
    retry: false,
    enabled:
      !!authToken &&
      Number.isFinite(studentIdNumber) &&
      Number.isFinite(classIdNumber),
  });

  const performanceTrendsQuery = useQuery({
    ...trpc.getStudentPerformanceTrends.queryOptions({
      authToken: authToken || "",
      studentId: studentIdNumber,
      timeRange,
    }),
    retry: false,
    enabled:
      !!authToken &&
      Number.isFinite(studentIdNumber) &&
      Number.isFinite(classIdNumber),
  });

  if (!teacher) {
    return null;
  }

  const studentData = studentQuery.data?.student;
  const statistics = studentQuery.data?.statistics;
  const studentErrorMessage = studentQuery.isError
    ? getErrorMessage(studentQuery.error)
    : null;
  const studentErrorDescription =
    studentErrorMessage === "请求的资源不存在"
      ? "当前学生不存在，或当前演示账号没有权限访问这份学生档案。你可以先返回班级页，从该班学生列表进入。"
      : studentErrorMessage ||
        "当前学生不存在，或者当前演示账号没有权限访问这份学生档案。你可以先返回班级页，从该班学生列表进入。";
  const proficiencyPercent = statistics?.averageProficiency
    ? Math.round(statistics.averageProficiency * 33.33)
    : 0;

  return (
    <DashboardShell
      activeNav="students"
      title={studentData?.name || "学生档案"}
      subtitle={
        studentData?.class?.name
          ? `${studentData.class.name} · 查看作业、考试、错题和知识点变化。`
          : "查看学生的学习趋势、知识掌握和阶段记录。"
      }
      selectedClassIdOverride={classIdNumber}
      onSelectedClassChange={(nextClassId) => {
        void navigate({
          to: "/classes/$classId",
          params: { classId: nextClassId.toString() },
        });
      }}
      showDateRangeBadge={false}
      actions={(ctx) => (
        <>
          <ModuleButton
            icon={BookOpen}
            onClick={() =>
              void navigate({
                to: "/classes/$classId",
                params: { classId },
              })
            }
          >
            返回班级
          </ModuleButton>
          <ModuleButton icon={Upload} onClick={ctx.openUploadForSelectedClass}>
            上传作业
          </ModuleButton>
          <ModuleButton icon={Brain} onClick={ctx.openQuestionGenerator}>
            题目生成
          </ModuleButton>
        </>
      )}
    >
      {() => {
        if (studentQuery.isLoading && !studentData && !studentQuery.isError) {
          return (
            <div className="space-y-6">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg border border-slate-200 bg-white"
                />
              ))}
            </div>
          );
        }

        if (studentQuery.isError) {
          return (
            <EmptyState
              icon={User}
              title="无法查看该学生资料"
              description={studentErrorDescription}
            />
          );
        }

        if (!studentData) {
          return (
            <EmptyState
              icon={User}
              title="未找到学生"
              description="当前学生不存在，或者你没有访问该学生资料的权限。"
            />
          );
        }

        return (
          <>
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                title="作业数量"
                value={`${statistics?.totalAssignments || 0}`}
                caption="累计提交"
                trend="持续更新"
                tone="up"
                icon={FileText}
                iconClassName="bg-blue-500"
              />
              <MetricCard
                title="考试数量"
                value={`${statistics?.totalExams || 0}`}
                caption="阶段记录"
                trend="可追踪"
                tone="up"
                icon={Award}
                iconClassName="bg-violet-500"
              />
              <MetricCard
                title="错题总数"
                value={`${statistics?.totalMistakes || 0}`}
                caption="需要继续跟进"
                trend={
                  (statistics?.totalMistakes || 0) > 0 ? "建议复盘" : "状态稳定"
                }
                tone={(statistics?.totalMistakes || 0) > 0 ? "down" : "up"}
                icon={Target}
                iconClassName="bg-orange-500"
              />
              <MetricCard
                title="平均熟练度"
                value={`${proficiencyPercent}%`}
                caption="知识点整体水平"
                trend={proficiencyPercent >= 70 ? "保持巩固" : "继续提升"}
                tone={proficiencyPercent >= 70 ? "up" : "neutral"}
                icon={TrendingUp}
                iconClassName="bg-emerald-500"
              />
            </section>

            <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="xl:col-span-8">
                <StudentPerformanceChart
                  timeRange={timeRange}
                  onTimeRangeChange={setTimeRange}
                  data={performanceTrendsQuery.data}
                />
              </div>

              <div className="space-y-6 xl:col-span-4">
                <Panel title="学生信息" subtitle="基础资料与当前归属班级">
                  <div className="space-y-4 text-sm">
                    <DetailRow label="姓名" value={studentData.name} />
                    <DetailRow
                      label="学号"
                      value={studentData.studentId || "暂无学号"}
                    />
                    <DetailRow
                      label="班级"
                      value={studentData.class?.name || "-"}
                    />
                    <DetailRow
                      label="邮箱"
                      value={studentData.email || "暂无邮箱"}
                    />
                    <DetailRow
                      label="加入时间"
                      value={new Date(studentData.createdAt).toLocaleDateString(
                        "zh-CN",
                      )}
                    />
                  </div>
                </Panel>

                <Panel title="错题高频" subtitle="近期最需要优先复盘的知识点">
                  {statistics?.mistakesByKnowledgeArea &&
                  statistics.mistakesByKnowledgeArea.length > 0 ? (
                    <div className="space-y-3">
                      {statistics.mistakesByKnowledgeArea
                        .slice(0, 5)
                        .map((area) => (
                          <div
                            key={area.name}
                            className="rounded-lg bg-slate-50 px-4 py-4 ring-1 ring-slate-100"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                                  <Brain className="h-4 w-4" />
                                </span>
                                <span className="text-sm font-semibold text-slate-900">
                                  {area.name}
                                </span>
                              </div>
                              <span className="text-sm font-bold text-orange-600">
                                {area.count} 次
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                      <Target className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="mt-3 text-sm font-medium text-slate-500">
                        暂无错题记录
                      </p>
                    </div>
                  )}
                </Panel>
              </div>
            </section>

            <section className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
              <Panel
                title="最近作业"
                subtitle="展示最近 5 份作业的处理状态"
                className="xl:col-span-6"
              >
                {studentData.assignments.length > 0 ? (
                  <RecordList
                    items={studentData.assignments
                      .slice(0, 5)
                      .map((assignment) => ({
                        id: assignment.id,
                        title: assignment.title,
                        date: new Date(assignment.createdAt).toLocaleDateString(
                          "zh-CN",
                        ),
                        complete: Boolean(assignment.analysis),
                        type: "作业",
                      }))}
                  />
                ) : (
                  <ListEmpty icon={FileText} label="暂无作业记录" />
                )}
              </Panel>

              <Panel
                title="最近试卷"
                subtitle="展示最近 5 份试卷的处理状态"
                className="xl:col-span-6"
              >
                {studentData.exams.length > 0 ? (
                  <RecordList
                    items={studentData.exams.slice(0, 5).map((exam) => ({
                      id: exam.id,
                      title: exam.title,
                      date: new Date(exam.createdAt).toLocaleDateString(
                        "zh-CN",
                      ),
                      complete: Boolean(exam.analysis),
                      type: "试卷",
                    }))}
                  />
                ) : (
                  <ListEmpty icon={Award} label="暂无试卷记录" />
                )}
              </Panel>
            </section>

            <Panel title="知识掌握清单" subtitle="当前学生的知识点掌握等级">
              {studentData.studentKnowledgeAreas.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {studentData.studentKnowledgeAreas.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg bg-slate-50 px-4 py-4 ring-1 ring-slate-100"
                    >
                      <div className="text-sm font-semibold text-slate-900">
                        {item.knowledgeArea.name}
                      </div>
                      <div className="mt-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.proficiencyLevel === "advanced"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.proficiencyLevel === "intermediate"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {formatProficiencyLabel(item.proficiencyLevel)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
                  <Brain className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    暂无知识点掌握记录
                  </p>
                </div>
              )}
            </Panel>
          </>
        );
      }}
    </DashboardShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="max-w-[70%] text-right font-medium text-slate-900">
        {value}
      </span>
    </div>
  );
}

function RecordList({
  items,
}: {
  items: Array<{
    id: number;
    title: string;
    date: string;
    complete: boolean;
    type: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-lg bg-slate-50 px-4 py-4 ring-1 ring-slate-100"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {item.title}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {item.type} · {item.date}
              </div>
            </div>
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                item.complete
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              {item.complete ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Clock className="h-3.5 w-3.5" />
              )}
              {item.complete ? "已分析" : "待分析"}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListEmpty({
  icon: Icon,
  label,
}: {
  icon: typeof FileText;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
      <Icon className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function formatProficiencyLabel(level: string | null | undefined) {
  if (level === "advanced") return "熟练";
  if (level === "intermediate") return "中等";
  return "初级";
}
