"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface BlockModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  partnerName: string;
}

export function BlockModal({ open, onClose, onConfirm, partnerName }: BlockModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setReason(""); setError(""); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Reason is required"); return; }
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      reset();
    } catch {
      setError("Failed to block. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Block Partner" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-light-text-2 dark:text-dark-text-2">
          Blocking <span className="font-medium text-light-text dark:text-dark-text">{partnerName}</span> will permanently ban them from the platform.
          This action is more severe than suspension.
        </p>

        <div>
          <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Reason <span className="text-brand-red">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            placeholder="Explain why this partner is being blocked..."
            rows={3}
            className={cn("input-base resize-none", error && "border-brand-red")}
          />
          {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" size="sm" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" loading={loading}>
            Block Partner
          </Button>
        </div>
      </form>
    </Modal>
  );
}
