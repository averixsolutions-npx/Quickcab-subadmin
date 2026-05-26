"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { LogOut, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/navigation";
import { useAuthStore } from "@/stores/authStore";
import toast from "react-hot-toast";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { subAdminName, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    document.cookie = "qc_subadmin_auth=; path=/; max-age=0";
    toast.success("Signed out successfully");
    router.push("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen w-[240px] z-40 flex flex-col",
        "bg-white dark:bg-dark-surface-2",
        "border-r border-light-border dark:border-dark-border",
        "transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-light-border dark:border-dark-border shrink-0">
        <button
          onClick={onClose}
          className="lg:hidden absolute right-3 top-4 p-1.5 rounded-lg text-light-text-3 dark:text-dark-text-3 hover:bg-light-surface-2 dark:hover:bg-dark-surface transition-colors"
        >
          <X size={16} />
        </button>
        <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center shadow-purple-glow shrink-0">
          <span className="text-sm">🚕</span>
        </div>
        <div>
          <p className="font-bold text-[15px] text-light-text dark:text-dark-text leading-tight tracking-tight">
            QuickCab
          </p>
          <p className="text-[10px] text-light-text-3 dark:text-dark-text-3 font-medium tracking-wider uppercase">
            SubAdmin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                active
                  ? "bg-brand-purple-muted dark:bg-brand-purple-muted-dark text-brand-purple"
                  : "text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface hover:text-light-text dark:hover:text-dark-text"
              )}
            >
              {active && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-purple rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <Icon
                size={17}
                className={cn(
                  "shrink-0 transition-colors duration-150",
                  active
                    ? "text-brand-purple"
                    : "text-light-text-3 dark:text-dark-text-3 group-hover:text-light-text-2 dark:group-hover:text-dark-text-2"
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {!active && (
                <ChevronRight
                  size={13}
                  className="opacity-0 group-hover:opacity-40 transition-opacity -mr-1 shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — subadmin name + logout */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-white">
              {subAdminName ? getInitials(subAdminName) : "SA"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-light-text dark:text-dark-text truncate">
              {subAdminName ?? "SubAdmin"}
            </p>
            <p className="text-[11px] text-light-text-3 dark:text-dark-text-3 truncate">SubAdmin</p>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-light-text-3 dark:text-dark-text-3 hover:text-brand-red hover:bg-brand-red-muted transition-all duration-150 shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}
