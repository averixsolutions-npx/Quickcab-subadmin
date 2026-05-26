"use client";

import { motion } from "framer-motion";
import { ShieldOff, Phone } from "lucide-react";

export default function DisabledPage() {
  return (
    <div className="min-h-screen bg-light-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[400px] text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-red-muted flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={32} className="text-brand-red" />
        </div>
        <h1 className="text-2xl font-semibold text-light-text mb-3">Access Disabled</h1>
        <p className="text-light-text-2 text-sm leading-relaxed mb-6">
          SubAdmin access has been temporarily disabled by the admin.
          Please contact the admin to restore access.
        </p>
        <div className="card shadow-card text-left space-y-3">
          <div className="flex items-center gap-3 text-light-text-2 text-sm">
            <Phone size={16} className="text-brand-purple shrink-0" />
            <span>Contact your admin to get access restored</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
