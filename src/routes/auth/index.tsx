import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LoginForm } from "~/components/LoginForm";
import { RegisterForm } from "~/components/RegisterForm";
import { useAuthStore } from "~/stores/authStore";
import { 
  GraduationCap, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Sparkles,
  Brain,
} from "lucide-react";

export const Route = createFileRoute("/auth/")({
  component: AuthPage,
});

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      const { userRole } = useAuthStore.getState();
      if (userRole === "parent") {
        navigate({ to: "/parent-dashboard" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => {
    const { userRole } = useAuthStore.getState();
    if (userRole === "parent") {
      navigate({ to: "/parent-dashboard" });
    } else {
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl float-slow"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl float-medium"></div>
      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl float-fast"></div>
      
      <div className="relative min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-primary p-12 flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-full blur-xl float-slow"></div>
          <div className="absolute bottom-20 right-32 w-24 h-24 bg-purple-400/20 rounded-full blur-lg float-medium"></div>
          <div className="absolute top-1/2 right-8 w-16 h-16 bg-indigo-400/20 rounded-full blur-md float-fast"></div>
          
          <div className="relative z-10 animate-fade-in">
            <div className="flex items-center mb-8">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mr-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">智评</h1>
            </div>
            
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              用{" "}
              <span className="text-blue-200">AI智能分析</span> 
              {" "}改变您的教学方式
            </h2>
            
            <p className="text-blue-100 text-xl mb-12 leading-relaxed">
              简化作业管理，分析学生表现，获得深度洞察，
              帮助每个学生取得成功。已有数千名教育工作者在使用我们的平台。
            </p>

            <div className="space-y-8">
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">智能作业分析</h3>
                  <p className="text-blue-100">AI智能反馈和评分辅助，提供详细见解</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">轻松班级管理</h3>
                  <p className="text-blue-100">使用直观工具组织学生并跟踪进度</p>
                </div>
              </div>
              
              <div className="flex items-start group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-2">学习表现分析</h3>
                  <p className="text-blue-100">全面洞察和精美可视化报告</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-white/10 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-sm mb-1">全球教育工作者信赖</div>
                  <div className="text-blue-200 text-sm">加入已在使用智评的10,000+教师</div>
                </div>
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full border-2 border-white"></div>
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full border-2 border-white flex items-center justify-center">
                    <span className="text-white text-xs font-bold">+</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-md animate-slide-up">
            {/* Mobile-only logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center mr-3 shadow-glow">
                <GraduationCap className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gradient-primary">智评</h1>
            </div>

            {/* Welcome text */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">欢迎！</h3>
                <p className="text-gray-600">登录您的教师账户开始使用</p>
              </div>
            </div>

            {/* Auth Forms */}
            <div className="animate-scale-in">
              {isLogin ? (
                <LoginForm
                  onSuccess={handleAuthSuccess}
                  onSwitchToRegister={() => setIsLogin(false)}
                />
              ) : (
                <RegisterForm
                  onSuccess={() => setIsLogin(true)}
                  onSwitchToLogin={() => setIsLogin(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
