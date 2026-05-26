"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Shield } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const loginSchema = z.object({
  username: z.string().min(2, "Username is required"),
  password: z.string().min(4, "Password is required"),
});
type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { setAuthenticated, isNameSet } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const { token } = await authApi.login(data.username, data.password);
      setAuthenticated(token);
      document.cookie = "qc_subadmin_auth=1; path=/; max-age=43200";
      toast.success("Login successful!");
      router.push(isNameSet ? "/partners" : "/setup-name");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Invalid username or password";
      setError("root", { message: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg dark:bg-dark-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(94,92,230,0.12) 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(2,230,66,0.06) 0%, transparent 70%)" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[420px] relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-brand-purple flex items-center justify-center shadow-purple-glow">
              <span className="text-white text-lg">🚕</span>
            </div>
            <span className="text-2xl font-bold text-light-text dark:text-dark-text tracking-tight">
              QuickCab
            </span>
          </div>
          <h1 className="text-2xl font-semibold text-light-text dark:text-dark-text mb-2">
            SubAdmin Login
          </h1>
          <p className="text-light-text-2 dark:text-dark-text-2 text-sm">
            Sign in to the SubAdmin dashboard
          </p>
        </div>

        {/* Card */}
        <div className="card shadow-card">
          <div className="flex items-center gap-2 mb-6 px-3 py-2 rounded-lg bg-brand-purple-muted dark:bg-brand-purple-muted-dark w-fit">
            <Shield size={14} className="text-brand-purple" />
            <span className="text-xs font-medium text-brand-purple">SubAdmin Access</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
                Username
              </label>
              <input
                {...register("username")}
                type="text"
                autoComplete="username"
                autoFocus
                placeholder="subadmin"
                className={cn("input-base", errors.username && "border-brand-red")}
              />
              {errors.username && (
                <p className="text-xs text-brand-red mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={cn("input-base pr-12", errors.password && "border-brand-red")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-light-text-3 hover:text-light-text transition-colors p-1"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-brand-red mt-1">{errors.password.message}</p>
              )}
            </div>

            {errors.root && (
              <div className="px-3 py-2.5 rounded-lg bg-brand-red-muted border border-brand-red/20 text-sm text-brand-red">
                {errors.root.message}
              </div>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "w-full flex items-center justify-center gap-2",
                  "bg-brand-purple hover:bg-brand-purple-dark text-white font-medium text-sm",
                  "rounded-xl px-4 py-3 transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-purple-glow"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-light-text-3 mt-6">
          QuickCab SubAdmin Panel — Restricted Access
        </p>
      </motion.div>
    </div>
  );
}
