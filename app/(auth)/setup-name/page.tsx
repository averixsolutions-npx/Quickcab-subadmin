"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, UserCircle } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function SetupNamePage() {
  const router = useRouter();
  const { setName } = useAuthStore();
  const [name, setNameValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    setIsLoading(true);
    try {
      await authApi.setName(trimmed);
      setName(trimmed);
      toast.success(`Welcome, ${trimmed}!`);
      router.push("/partners");
    } catch {
      toast.error("Failed to set name. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px]"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-purple-muted flex items-center justify-center mx-auto mb-4">
            <UserCircle size={28} className="text-brand-purple" />
          </div>
          <h1 className="text-2xl font-semibold text-light-text mb-2">
            What&apos;s your name?
          </h1>
          <p className="text-light-text-2 text-sm leading-relaxed">
            Your name will appear on all activity logs so the admin can track your actions.
            This is mandatory and cannot be skipped.
          </p>
        </div>

        <div className="card shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-light-text mb-1.5">
                Your Full Name <span className="text-brand-red">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setNameValue(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Rahul Sharma"
                autoFocus
                className={cn("input-base", error && "border-brand-red")}
              />
              {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
            </div>

            <div className="px-3 py-2.5 rounded-lg bg-brand-purple-muted text-xs text-brand-purple">
              This name will be stored and shown to the admin in the activity log.
              Make sure it&apos;s your real name.
            </div>

            <button
              type="submit"
              disabled={isLoading || name.trim().length < 2}
              className={cn(
                "w-full flex items-center justify-center gap-2",
                "bg-brand-purple hover:bg-brand-purple-dark text-white font-medium text-sm",
                "rounded-xl px-4 py-3 transition-all duration-200",
                "disabled:opacity-50 disabled:cursor-not-allowed shadow-purple-glow"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Dashboard →"
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
