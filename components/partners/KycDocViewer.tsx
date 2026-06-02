"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, ZoomOut, RotateCw, Download, FileX,
  CheckCircle, XCircle, AlertCircle, Upload, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { partnersApi } from "@/lib/api/partners";
import type { KycDocument } from "@/types/partner";
import toast from "react-hot-toast";
import axios from "axios";

interface KycDocViewerProps {
  userId: string;
  fieldKey: string;
  label: string;
  doc?: KycDocument;
  onRefresh: () => void;
}

export function KycDocViewer({ userId, fieldKey, label, doc, onRefresh }: KycDocViewerProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const openLightbox = () => {
    setLightboxOpen(true);
    setZoom(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoom(1);
    setRotation(0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    setUploading(true);
    try {
      const { uploadUrl, publicUrl } = await partnersApi.getKycUploadUrl(fieldKey, ext);
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
      await partnersApi.saveKycDocImage(userId, fieldKey, publicUrl);
      toast.success(`${label} uploaded successfully`);
      onRefresh();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleApprove = async () => {
    setReviewing("APPROVED");
    try {
      await partnersApi.reviewDocument(userId, fieldKey, "APPROVED");
      toast.success("Document approved");
      onRefresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setReviewing(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim()) return;
    setReviewing("REJECTED");
    try {
      await partnersApi.reviewDocument(userId, fieldKey, "REJECTED", rejectReason.trim());
      toast.success("Document rejected");
      setShowRejectInput(false);
      setRejectReason("");
      onRefresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setReviewing(null);
    }
  };

  const status = doc?.status ?? "NOT_SUBMITTED";
  const url = doc?.url;

  const statusBorder = {
    PENDING:       "border-light-border dark:border-dark-border",
    APPROVED:      "border-green-400 dark:border-brand-green",
    REJECTED:      "border-brand-red",
    NOT_SUBMITTED: "border-light-border dark:border-dark-border",
  }[status];

  const statusBg = {
    PENDING:       "",
    APPROVED:      "bg-green-50/40 dark:bg-brand-green-muted/20",
    REJECTED:      "bg-red-50/40 dark:bg-brand-red-muted/20",
    NOT_SUBMITTED: "",
  }[status];

  return (
    <>
      <div className={cn("rounded-xl overflow-hidden border-2", statusBorder, statusBg, "bg-white dark:bg-dark-surface transition-colors")}>

        {/* Image area */}
        {url ? (
          <div className="group relative overflow-hidden cursor-pointer h-28" onClick={openLightbox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className="w-full h-full object-contain bg-light-surface-2 dark:bg-dark-surface-2 transition-transform duration-300 group-hover:scale-105"
              onError={(e) => { console.error(`[KYC] Image failed to load for ${label}:`, url); }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />
          </div>
        ) : (
          <div className={cn(
            "flex flex-col items-center justify-center gap-2 h-28",
            "border-b border-dashed border-light-border dark:border-dark-border",
            "bg-light-surface-2 dark:bg-dark-surface"
          )}>
            <FileX size={22} className="text-light-text-3 dark:text-dark-text-3" />
            <p className="text-[11px] text-light-text-3 dark:text-dark-text-3">Not uploaded</p>
          </div>
        )}

        {/* Label + status row */}
        <div className="px-3 py-2 border-t border-light-border dark:border-dark-border">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[12px] font-semibold text-light-text dark:text-dark-text">{label}</p>
            {status === "APPROVED" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-brand-green">
                <CheckCircle size={11} /> APPROVED
              </span>
            )}
            {status === "REJECTED" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-brand-red">
                <XCircle size={11} /> REJECTED
              </span>
            )}
            {status === "PENDING" && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-light-text-3 dark:text-dark-text-3">
                <AlertCircle size={11} /> PENDING
              </span>
            )}
          </div>
          {doc?.rejectReason && status === "REJECTED" && (
            <p className="text-[11px] text-brand-red mt-1 leading-relaxed">
              Reason: {doc.rejectReason}
            </p>
          )}
        </div>

        {/* Approve / Reject buttons */}
        {status === "PENDING" && (
          <div className="px-3 pb-2 flex gap-2">
            <button
              onClick={handleApprove}
              disabled={reviewing === "APPROVED"}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold",
                "text-white bg-brand-purple hover:bg-brand-purple-dark",
                "transition-colors disabled:opacity-50"
              )}
            >
              {reviewing === "APPROVED" ? "..." : "✓ Approve"}
            </button>
            <button
              onClick={() => setShowRejectInput(true)}
              disabled={!!reviewing}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold",
                "text-brand-red bg-brand-red-muted border border-brand-red/20",
                "hover:bg-red-100 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
              )}
            >
              ✕ Reject
            </button>
          </div>
        )}

        {/* Upload button */}
        <div className="px-3 pb-3">
          <label className={cn(
            "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg cursor-pointer",
            "text-[11px] font-semibold border border-light-border dark:border-dark-border",
            "text-light-text-2 dark:text-dark-text-2",
            "hover:bg-light-surface-2 dark:hover:bg-dark-surface hover:border-brand-purple hover:text-brand-purple",
            "transition-colors",
            uploading && "opacity-50 pointer-events-none"
          )}>
            {uploading ? (
              <><Loader2 size={11} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={11} /> {url ? "Replace Image" : "Upload Image"}</>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="sr-only"
              disabled={uploading}
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && url && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeLightbox}
              className="absolute inset-0 bg-black/90"
            />

            {/* Toolbar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 flex items-center gap-1.5 mb-4 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur-sm"
            >
              <span className="text-white/80 text-[13px] font-medium pr-2 max-w-[160px] truncate">
                {label}
              </span>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={() => setZoom(p => Math.max(0.25, parseFloat((p - 0.25).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>
              <span className="text-white/60 text-[12px] font-mono w-11 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(p => Math.min(5, parseFloat((p + 0.25).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <button
                onClick={() => setRotation(p => (p + 90) % 360)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Rotate 90°"
              >
                <RotateCw size={15} />
              </button>
              <button
                onClick={() => { setZoom(1); setRotation(0); }}
                className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white/60 hover:text-white text-[11px] font-medium transition-colors"
              >
                Reset
              </button>
              <div className="w-px h-5 bg-white/20 mx-1" />
              <a
                href={url}
                download
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Download"
              >
                <Download size={15} />
              </a>
              <button
                onClick={closeLightbox}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </motion.div>

            {/* Image viewport */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 overflow-auto rounded-2xl"
              style={{ width: "min(90vw, 820px)", height: "min(72vh, 620px)" }}
              onWheel={(e) => {
                const delta = e.deltaY < 0 ? 0.1 : -0.1;
                setZoom(p => Math.min(5, Math.max(0.25, parseFloat((p + delta).toFixed(2)))));
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "100%",
                  minHeight: "100%",
                  width: zoom > 1 ? `${zoom * 100}%` : "100%",
                  height: zoom > 1 ? `${zoom * 100}%` : "100%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={label}
                  draggable={false}
                  className="select-none"
                  style={{
                    width: zoom > 1 ? "100%" : "auto",
                    height: zoom > 1 ? "auto" : "100%",
                    maxWidth: zoom > 1 ? "none" : "100%",
                    maxHeight: zoom > 1 ? "none" : "100%",
                    objectFit: "contain",
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.15s ease",
                  }}
                />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative z-10 mt-3 text-white/25 text-[11px]"
            >
              Scroll to zoom · Click outside to close
            </motion.p>
          </div>
        )}
      </AnimatePresence>

      {/* Reject reason modal */}
      <AnimatePresence>
        {showRejectInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowRejectInput(false)}
              className="absolute inset-0 bg-black/60"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-dark-surface rounded-2xl p-6 shadow-2xl"
            >
              <h3 className="font-bold text-[15px] text-light-text dark:text-dark-text mb-1">
                Reject Document
              </h3>
              <p className="text-[13px] text-light-text-2 dark:text-dark-text-2 mb-4">
                Type the reason — the partner will see this message and must fix this document before resubmitting.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Image is blurry, please upload a clearer photo..."
                className="input-base resize-none w-full mb-4"
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason(""); }}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectReason.trim() || !!reviewing}
                  className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white bg-brand-red hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  Reject Document
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
