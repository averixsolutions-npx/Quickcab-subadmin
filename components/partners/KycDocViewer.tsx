"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, CheckCircle, XCircle, Eye, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
  const [uploading, setUploading] = useState(false);
  const [reviewing, setReviewing] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [showImage, setShowImage] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop() ?? "jpg";
    setUploading(true);
    try {
      const { uploadUrl, fileKey, publicUrl } = await partnersApi.getKycUploadUrl(fieldKey, ext);
      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
      await partnersApi.saveKycDocImage(userId, fieldKey, fileKey);
      toast.success(`${label} uploaded successfully`);
      onRefresh();
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReview = async (status: "APPROVED" | "REJECTED") => {
    setReviewing(status);
    try {
      await partnersApi.reviewDocument(userId, fieldKey, status);
      toast.success(`Document ${status.toLowerCase()}`);
      onRefresh();
    } catch {
      toast.error("Action failed. Please try again.");
    } finally {
      setReviewing(null);
    }
  };

  const statusColor = {
    APPROVED:     "text-brand-green",
    REJECTED:     "text-brand-red",
    PENDING:      "text-brand-orange",
    NOT_SUBMITTED:"text-light-text-3 dark:text-dark-text-3",
  };

  const statusLabel = {
    APPROVED:     "Approved",
    REJECTED:     "Rejected",
    PENDING:      "Pending Review",
    NOT_SUBMITTED:"Not Submitted",
  };

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-light-text dark:text-dark-text">{label}</p>
        <span className={cn("text-xs font-medium", statusColor[doc?.status ?? "NOT_SUBMITTED"])}>
          {statusLabel[doc?.status ?? "NOT_SUBMITTED"]}
        </span>
      </div>

      {doc?.url ? (
        <div className="relative">
          {showImage ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-light-surface-2 dark:bg-dark-surface-2">
              <Image src={doc.url} alt={label} fill className="object-contain" />
            </div>
          ) : (
            <button
              onClick={() => setShowImage(true)}
              className="w-full h-20 rounded-xl bg-light-surface-2 dark:bg-dark-surface-2 flex items-center justify-center gap-2 text-sm text-light-text-2 dark:text-dark-text-2 hover:bg-light-border dark:hover:bg-dark-border transition-colors border border-light-border dark:border-dark-border"
            >
              <Eye size={16} />
              View Document
            </button>
          )}
        </div>
      ) : (
        <div className="h-20 rounded-xl bg-light-surface-2 dark:bg-dark-surface-2 flex items-center justify-center border border-dashed border-light-border-2 dark:border-dark-border-2">
          <p className="text-xs text-light-text-3 dark:text-dark-text-3">No document uploaded</p>
        </div>
      )}

      {doc?.rejectReason && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-brand-red-muted text-xs text-brand-red">
          <AlertCircle size={13} className="shrink-0 mt-0.5" />
          <span>{doc.rejectReason}</span>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {doc?.status === "PENDING" && (
          <>
            <Button
              size="sm"
              variant="secondary"
              icon={<CheckCircle size={13} />}
              loading={reviewing === "APPROVED"}
              disabled={reviewing === "REJECTED"}
              onClick={() => handleReview("APPROVED")}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<XCircle size={13} />}
              loading={reviewing === "REJECTED"}
              disabled={reviewing === "APPROVED"}
              onClick={() => handleReview("REJECTED")}
            >
              Reject
            </Button>
          </>
        )}

        <label className={cn("cursor-pointer", uploading && "opacity-60 pointer-events-none")}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-light-surface-2 dark:bg-dark-surface border border-light-border dark:border-dark-border text-light-text-2 dark:text-dark-text-2 hover:bg-light-border dark:hover:bg-dark-border transition-colors">
            {uploading ? (
              <><Loader2 size={12} className="animate-spin" /> Uploading...</>
            ) : (
              <><Upload size={12} /> Upload</>
            )}
          </span>
        </label>
      </div>
    </div>
  );
}
