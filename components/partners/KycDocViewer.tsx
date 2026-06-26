"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ZoomIn, ZoomOut, RotateCw, Download, FileX, CheckCircle, XCircle,
  AlertCircle, RefreshCw, Upload, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Inline loaders (unique to KYC flow) ──────────────────
// Three-dot pulse loader — used inside KYC action buttons. Tiny enough for
// xs buttons, smooth without dependencies.
function ThreeDotsLoader({ tone = "currentColor" }: { tone?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className="inline-flex items-center gap-[3px]"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-[5px] h-[5px] rounded-full kyc-dot-pulse"
          style={{
            background: tone,
            animationDelay: `${i * 140}ms`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes kycDotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.45; }
          40%           { transform: scale(1);   opacity: 1;    }
        }
        .kyc-dot-pulse {
          animation: kycDotPulse 1s ease-in-out infinite both;
        }
      `}</style>
    </span>
  );
}

// Card-level processing overlay — sits on top of the doc image while the
// admin's approve/reject is in-flight on THIS specific card. Tone = brand
// colour for approve (purple) or red for reject.
function CardProcessingOverlay({ label, tone }: { label: string; tone: "approve" | "reject" }) {
  const ring = tone === "approve" ? "#7C5CFF" : "#EF4444";
  const text = tone === "approve" ? "Approving" : "Rejecting";
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-black/55 via-black/45 to-black/55 backdrop-blur-[2px] pointer-events-none"
    >
      <svg width="34" height="34" viewBox="0 0 34 34" className="kyc-ring-spin">
        <defs>
          <linearGradient id={`kyc-tail-${tone}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"  stopColor={ring} stopOpacity="0" />
            <stop offset="100%" stopColor={ring} stopOpacity="1" />
          </linearGradient>
        </defs>
        <circle cx="17" cy="17" r="13" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
        <circle
          cx="17" cy="17" r="13" fill="none"
          stroke={`url(#kyc-tail-${tone})`}
          strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray="55 100" transform="rotate(-90 17 17)"
        />
      </svg>
      <p className="text-[11px] font-semibold text-white tracking-wide">
        {text} {label}…
      </p>
      <style jsx>{`
        @keyframes kycRingSpin { to { transform: rotate(360deg); } }
        .kyc-ring-spin { animation: kycRingSpin 0.9s linear infinite; }
      `}</style>
    </motion.div>
  );
}

// ─── Types ────────────────────────────────────────────────
export interface DocItem {
  label: string;
  fieldKey: string;        // e.g. "aadhaarFront", "drivingLicence"
  url: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectReason: string | null;
  isResubmitted?: boolean; // true if this doc is in resubmittedDocuments[]
}

interface KycDocViewerProps {
  docs: DocItem[];
  userId?: string;
  onApproveDoc?: (fieldKey: string) => void;
  onRejectDoc?: (fieldKey: string, reason: string) => void;
  onUploadDoc?: (fieldKey: string, file: File) => void;
  uploadingField?: string | null;
  loading?: boolean;
  // Field key of the doc currently being approved/rejected — drives the
  // per-card spinner and image overlay. Optional, additive.
  processingField?: string | null;
}

// ─── Single Document Card ─────────────────────────────────
function DocCard({
  doc,
  onView,
  onApprove,
  onReject,
  onUpload,
  isUploading,
  loading,
  processingField,
}: {
  doc: DocItem;
  onView: (url: string, label: string) => void;
  onApprove?: (fieldKey: string) => void;
  onReject?: (fieldKey: string) => void;
  onUpload?: (fieldKey: string, file: File) => void;
  isUploading?: boolean;
  loading?: boolean;
  processingField?: string | null;
}) {
  console.log(`[KYC_DOC] Rendering doc: ${doc.label}`);
  console.log(`[KYC_DOC] URL received from API: ${doc.url}`);
  console.log(`[KYC_DOC] Status: ${doc.status}`);

  const statusBorder = {
    PENDING: "border-light-border dark:border-dark-border",
    APPROVED: "border-green-400 dark:border-brand-green",
    REJECTED: "border-brand-red",
  }[doc.status];

  const statusBg = {
    PENDING: "",
    APPROVED: "bg-green-50/40 dark:bg-brand-green-muted/20",
    REJECTED: "bg-red-50/40 dark:bg-brand-red-muted/20",
  }[doc.status];

  if (!doc.url) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 h-40 rounded-xl",
          "border-2 border-dashed",
          statusBorder,
          "bg-light-surface-2 dark:bg-dark-surface"
        )}
      >
        <FileX size={22} className="text-light-text-3 dark:text-dark-text-3" />
        <div className="text-center">
          <p className="text-[12px] font-medium text-light-text-2 dark:text-dark-text-2">
            {doc.label}
          </p>
          <p className="text-[11px] text-light-text-3 dark:text-dark-text-3">
            Not uploaded
          </p>
        </div>
        {onUpload && (
          <label className={cn(
            "mt-1 flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-pointer",
            "text-[11px] font-semibold text-brand-purple",
            "bg-brand-purple-muted dark:bg-brand-purple-muted-dark",
            "hover:bg-brand-purple/20 transition-colors",
            isUploading && "opacity-50 pointer-events-none"
          )}>
            {isUploading ? (
              <><Loader2 size={11} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={11} /> Add Image</>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(doc.fieldKey, file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    );
  }

  const isProcessing = processingField === doc.fieldKey;

  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border-2 transition-all",
        statusBorder, statusBg,
        "bg-white dark:bg-dark-surface",
        isProcessing && "kyc-card-glow"
      )}
    >
      {isProcessing && (
        <style jsx>{`
          @keyframes kycCardGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(124, 92, 255, 0.0); }
            50%      { box-shadow: 0 0 0 6px rgba(124, 92, 255, 0.18); }
          }
          .kyc-card-glow { animation: kycCardGlow 1.4s ease-in-out infinite; }
        `}</style>
      )}
      {/* Resubmitted badge */}
      {doc.isResubmitted && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-purple text-white text-[11px] font-semibold">
          <RefreshCw size={11} />
          Resubmitted — review again
        </div>
      )}

      {/* Image area — click anywhere to open viewer */}
      <div
        className="group relative overflow-hidden cursor-pointer"
        onClick={() => onView(doc.url!, doc.label)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doc.url}
          alt={doc.label}
          className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
          onLoad={() => {
            console.log(`[KYC_DOC] ✅ Image loaded successfully — ${doc.label}`);
            console.log(`[KYC_DOC] URL: ${doc.url}`);
          }}
          onError={(e) => {
            console.error(`[KYC_DOC] ❌ Image failed to load — ${doc.label}`);
            console.error(`[KYC_DOC] URL that failed: ${doc.url}`);
            console.error(`[KYC_DOC] Error event:`, e);
          }}
        />
        {/* Subtle dark tint on hover — no buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 pointer-events-none" />

        {/* Processing overlay — only on the card currently being approved/rejected */}
        <AnimatePresence>
          {processingField === doc.fieldKey && (
            <CardProcessingOverlay
              label={doc.label}
              tone={doc.status === "REJECTED" ? "reject" : "approve"}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Label + status */}
      <div className="px-3 py-2 border-t border-light-border dark:border-dark-border">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[12px] font-semibold text-light-text dark:text-dark-text">
            {doc.label}
          </p>
          {doc.status === "APPROVED" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 dark:text-brand-green">
              <CheckCircle size={11} /> APPROVED
            </span>
          )}
          {doc.status === "REJECTED" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-brand-red">
              <XCircle size={11} /> REJECTED
            </span>
          )}
          {doc.status === "PENDING" && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-light-text-3 dark:text-dark-text-3">
              <AlertCircle size={11} /> PENDING
            </span>
          )}
        </div>

        {/* Reject reason display */}
        {doc.rejectReason && doc.status === "REJECTED" && (
          <p className="text-[11px] text-brand-red mt-1 leading-relaxed">
            Reason: {doc.rejectReason}
          </p>
        )}
      </div>

      {/* Per-document action buttons */}
      {(onApprove || onReject) && doc.status !== "APPROVED" && (
        <div className="px-3 pb-2 flex gap-2">
          {onApprove && (
            <button
              onClick={() => onApprove(doc.fieldKey)}
              disabled={loading}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold",
                "inline-flex items-center justify-center gap-1.5",
                "text-white bg-brand-purple hover:bg-brand-purple-dark",
                "transition-colors disabled:opacity-50"
              )}
            >
              {processingField === doc.fieldKey ? (
                <>
                  <ThreeDotsLoader tone="#FFFFFF" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle size={11} />
                  Approve
                </>
              )}
            </button>
          )}
          {doc.status !== "REJECTED" && onReject && (
            <button
              onClick={() => onReject(doc.fieldKey)}
              disabled={loading}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[11px] font-semibold",
                "inline-flex items-center justify-center gap-1.5",
                "text-brand-red bg-brand-red-muted border border-brand-red/20",
                "hover:bg-red-100 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
              )}
            >
              {processingField === doc.fieldKey ? (
                <>
                  <ThreeDotsLoader />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle size={11} />
                  Reject
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Admin upload/replace image button — always shown when onUpload is provided */}
      {onUpload && (
        <div className="px-3 pb-3">
          <label className={cn(
            "flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg cursor-pointer",
            "text-[11px] font-semibold",
            "border border-light-border dark:border-dark-border",
            "text-light-text-2 dark:text-dark-text-2",
            "hover:bg-light-surface-2 dark:hover:bg-dark-surface hover:border-brand-purple hover:text-brand-purple",
            "transition-colors",
            isUploading && "opacity-50 pointer-events-none"
          )}>
            {isUploading ? (
              <><Loader2 size={11} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={11} /> {doc.url ? "Replace Image" : "Upload Image"}</>
            )}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="sr-only"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(doc.fieldKey, file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Main KycDocViewer ────────────────────────────────────
export function KycDocViewer({
  docs,
  userId,
  onApproveDoc,
  onRejectDoc,
  onUploadDoc,
  uploadingField,
  loading,
  processingField,
}: KycDocViewerProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState("");
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const openLightbox = (url: string, label: string) => {
    setLightboxUrl(url);
    setLightboxLabel(label);
    setZoom(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxUrl(null);
    setZoom(1);
    setRotation(0);
  };

  const handleRejectConfirm = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    onRejectDoc?.(rejectTarget, rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  return (
    <>
      {/* Doc Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {docs.map((doc) => (
          <DocCard
            key={doc.fieldKey}
            doc={doc}
            onView={openLightbox}
            onApprove={onApproveDoc ? (key) => onApproveDoc(key) : undefined}
            onReject={
              onRejectDoc
                ? (key) => {
                    setRejectTarget(key);
                    setRejectReason("");
                  }
                : undefined
            }
            onUpload={onUploadDoc}
            isUploading={uploadingField === doc.fieldKey}
            loading={loading}
            processingField={processingField}
          />
        ))}
      </div>

      {/* Lightbox — zoom · rotate · mouse-wheel zoom */}
      <AnimatePresence>
        {lightboxUrl && (
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
                {lightboxLabel}
              </span>

              <div className="w-px h-5 bg-white/20 mx-1" />

              {/* Zoom out */}
              <button
                onClick={() => setZoom(p => Math.max(0.25, parseFloat((p - 0.10).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Zoom out"
              >
                <ZoomOut size={15} />
              </button>

              {/* Zoom % */}
              <span className="text-white/60 text-[12px] font-mono w-11 text-center">
                {Math.round(zoom * 100)}%
              </span>

              {/* Zoom in */}
              <button
                onClick={() => setZoom(p => Math.min(5, parseFloat((p + 0.10).toFixed(2))))}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Zoom in"
              >
                <ZoomIn size={15} />
              </button>

              <div className="w-px h-5 bg-white/20 mx-1" />

              {/* Rotate 90° clockwise */}
              <button
                onClick={() => setRotation(p => (p + 90) % 360)}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Rotate 90°"
              >
                <RotateCw size={15} />
              </button>

              {/* Reset */}
              <button
                onClick={() => { setZoom(1); setRotation(0); }}
                className="px-3 h-8 rounded-lg bg-white/10 hover:bg-white/25 text-white/60 hover:text-white text-[11px] font-medium transition-colors"
              >
                Reset
              </button>

              <div className="w-px h-5 bg-white/20 mx-1" />

              {/* Download */}
              <a
                href={lightboxUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                title="Download"
              >
                <Download size={15} />
              </a>

              {/* Close */}
              <button
                onClick={closeLightbox}
                className="w-8 h-8 rounded-lg bg-white/10 hover:bg-red-500/50 flex items-center justify-center text-white transition-colors"
                title="Close"
              >
                <X size={15} />
              </button>
            </motion.div>

            {/* Image viewport — overflow-auto so zoomed content is scrollable */}
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
                  width: "100%",
                  height: "100%",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={lightboxUrl}
                  alt={lightboxLabel}
                  draggable={false}
                  className="select-none"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    transform: `rotate(${rotation}deg) scale(${zoom})`,
                    transition: "transform 0.15s ease",
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </motion.div>

            {/* Hint */}
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

      {/* Per-document Reject Reason Modal */}
      <AnimatePresence>
        {rejectTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRejectTarget(null)}
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
                Type the reason — the partner will see this exact message and must fix this document before resubmitting.
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
                  onClick={() => setRejectTarget(null)}
                  className="px-4 py-2 rounded-xl text-[13px] font-medium text-light-text-2 dark:text-dark-text-2 hover:bg-light-surface-2 dark:hover:bg-dark-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={!rejectReason.trim() || loading}
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

// ─── KYC Approve / Reject action bar (full KYC decision) ──
export function KycActionBar({
  kycStatus,
  onApprove,
  onReject,
  loading,
  approving,
  rejecting,
}: {
  kycStatus: string;
  onApprove: () => void;
  onReject: () => void;
  loading?: boolean;
  // Optional, additive — when provided, only the matching button shows a
  // spinner. Falls back to `loading` so existing callers keep working.
  approving?: boolean;
  rejecting?: boolean;
}) {
  const showApproveSpinner = approving ?? loading ?? false;
  const showRejectSpinner  = rejecting ?? loading ?? false;
  const isBusy = !!(loading || approving || rejecting);
  if (kycStatus === "APPROVED") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 dark:bg-brand-green-muted border border-green-200 dark:border-brand-green/20">
        <CheckCircle size={16} className="text-green-600 dark:text-brand-green" />
        <p className="text-[13px] font-medium text-green-700 dark:text-brand-green">
          KYC Approved
        </p>
      </div>
    );
  }

  if (kycStatus === "REJECTED") {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-red-muted border border-brand-red/20">
        <XCircle size={16} className="text-brand-red" />
        <p className="text-[13px] font-medium text-brand-red">
          KYC Rejected — awaiting resubmission
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onReject}
        disabled={isBusy}
        className={cn(
          "relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium",
          "text-brand-red bg-brand-red-muted border border-brand-red/20",
          "hover:bg-red-100 dark:hover:bg-red-950 transition-colors disabled:opacity-60"
        )}
      >
        {showRejectSpinner ? <ThreeDotsLoader /> : <XCircle size={14} />}
        {showRejectSpinner ? "Rejecting KYC..." : "Reject KYC (all pending docs)"}
        {showRejectSpinner && (
          <>
            <span className="kyc-shimmer absolute inset-0 pointer-events-none" />
            <style jsx>{`
              @keyframes kycShimmer {
                0%   { transform: translateX(-120%); }
                100% { transform: translateX(120%); }
              }
              .kyc-shimmer {
                background: linear-gradient(90deg, transparent, rgba(239,68,68,0.18), transparent);
                animation: kycShimmer 1.4s ease-in-out infinite;
              }
            `}</style>
          </>
        )}
      </button>
      <button
        onClick={onApprove}
        disabled={isBusy}
        className={cn(
          "relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium",
          "text-white bg-brand-purple hover:bg-brand-purple-dark",
          "shadow-purple-glow transition-colors disabled:opacity-60"
        )}
      >
        {showApproveSpinner ? <ThreeDotsLoader tone="#FFFFFF" /> : <CheckCircle size={14} />}
        {showApproveSpinner ? "Approving KYC..." : "Approve KYC"}
        {showApproveSpinner && (
          <>
            <span className="kyc-shimmer-approve absolute inset-0 pointer-events-none" />
            <style jsx>{`
              @keyframes kycShimmerApprove {
                0%   { transform: translateX(-120%); }
                100% { transform: translateX(120%); }
              }
              .kyc-shimmer-approve {
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
                animation: kycShimmerApprove 1.4s ease-in-out infinite;
              }
            `}</style>
          </>
        )}
      </button>
    </div>
  );
}
