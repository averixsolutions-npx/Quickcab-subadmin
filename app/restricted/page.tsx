"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, ShieldOff, LogOut, Phone } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/utils";

interface RestrictionInfo {
  code: "SUBADMIN_SUSPENDED" | "SUBADMIN_BLOCKED";
  reason: string;
}

export default function RestrictedPage() {
  const router = useRouter();
  const { subAdminName, logout } = useAuthStore();
  const [restriction, setRestriction] = useState<RestrictionInfo | null>(null);

  useEffect(() => {
    // Read restriction info stored by the axios interceptor
    const stored = localStorage.getItem("qc_subadmin_restriction");
    if (stored) {
      try {
        setRestriction(JSON.parse(stored));
      } catch {
        setRestriction({
          code: "SUBADMIN_SUSPENDED",
          reason: "Your access has been restricted by the admin.",
        });
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("qc_subadmin_restriction");
    logout();
    router.push("/login");
  };

  const isBlocked = restriction?.code === "SUBADMIN_BLOCKED";

  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[420px]"
      >
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
          isBlocked
            ? "bg-brand-red-muted"
            : "bg-orange-50"
        )}>
          {isBlocked
            ? <ShieldOff size={32} className="text-brand-red" />
            : <ShieldAlert size={32} className="text-orange-500" />
          }
        </div>

        {/* Title */}
        <h1 className={cn(
          "text-2xl font-semibold text-center mb-3",
          isBlocked ? "text-brand-red" : "text-orange-600"
        )}>
          {isBlocked ? "Access Blocked" : "Access Suspended"}
        </h1>

        {/* Subadmin name */}
        {subAdminName && (
          <p className="text-center text-light-text-2 text-sm mb-6">
            Account: <span className="font-semibold text-light-text">{subAdminName}</span>
          </p>
        )}

        {/* Reason card */}
        <div className={cn(
          "card shadow-card mb-4 border-2",
          isBlocked ? "border-brand-red/20" : "border-orange-200"
        )}>
          <p className="text-[12px] font-medium text-light-text-3 mb-1.5 uppercase tracking-wider">
            Reason
          </p>
          <p className="text-[14px] text-light-text leading-relaxed">
            {restriction?.reason ?? "Your access has been restricted by the admin."}
          </p>
        </div>

        {/* Info message */}
        <div className="card shadow-card mb-6 space-y-3">
          <div className="flex items-start gap-3 text-light-text-2 text-sm">
            <Phone size={16} className="text-brand-purple shrink-0 mt-0.5" />
            <span>
              {isBlocked
                ? "Your account has been permanently blocked. Contact the admin to understand the reason."
                : "Your account has been temporarily suspended. Contact the admin to get it resolved."
              }
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center justify-center gap-2",
            "border-2 font-medium text-sm rounded-xl px-4 py-3",
            "transition-all duration-200",
            isBlocked
              ? "border-brand-red text-brand-red hover:bg-brand-red-muted"
              : "border-orange-400 text-orange-600 hover:bg-orange-50"
          )}
        >
          <LogOut size={16} />
          Logout
        </button>
      </motion.div>
    </div>
  );
}
