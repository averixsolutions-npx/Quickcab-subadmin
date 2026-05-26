"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/constants/navigation";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  const currentPage = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 lg:left-[240px] right-0 h-16 z-20",
        "flex items-center justify-between px-4 md:px-6",
        "bg-white/80 dark:bg-dark-surface-2/80 backdrop-blur-md",
        "border-b border-light-border dark:border-dark-border"
      )}
    >
      <div className="flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface transition-colors"
        >
          <Menu size={18} />
        </motion.button>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25 }}
        >
          <h1 className="text-[15px] font-semibold text-light-text dark:text-dark-text">
            {currentPage?.label ?? "Dashboard"}
          </h1>
        </motion.div>
      </div>
    </header>
  );
}
