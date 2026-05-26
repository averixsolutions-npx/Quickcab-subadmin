"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface SuspendModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: { reason: string; isPermanent: boolean; endDate?: string }) => Promise<void>;
  partnerName: string;
}

export function SuspendModal({ open, onClose, onConfirm, partnerName }: SuspendModalProps) {
  const [reason, setReason] = useState("");
  const [isPermanent, setIsPermanent] = useState(false);
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setReason("");
    setIsPermanent(false);
    setEndDate("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) { setError("Reason is required"); return; }
    if (!isPermanent && !endDate) { setError("Please select an end date or mark as permanent"); return; }
    setLoading(true);
    try {
      await onConfirm({ reason: reason.trim(), isPermanent, endDate: isPermanent ? undefined : endDate });
      reset();
    } catch {
      setError("Failed to suspend. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Suspend Partner" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-light-text-2 dark:text-dark-text-2">
          Suspending <span className="font-medium text-light-text dark:text-dark-text">{partnerName}</span> will prevent them from accepting bookings.
        </p>

        <div>
          <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Reason <span className="text-brand-red">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            placeholder="Explain why this partner is being suspended..."
            rows={3}
            className={cn("input-base resize-none", error && !isPermanent && !reason && "border-brand-red")}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isPermanent"
            checked={isPermanent}
            onChange={(e) => { setIsPermanent(e.target.checked); setError(""); }}
            className="w-4 h-4 rounded accent-brand-purple"
          />
          <label htmlFor="isPermanent" className="text-sm text-light-text dark:text-dark-text cursor-pointer">
            Permanent suspension
          </label>
        </div>

        {!isPermanent && (
          <div>
            <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
              Suspension end date <span className="text-brand-red">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => { setEndDate(e.target.value); setError(""); }}
              className={cn("input-base", !endDate && error && "border-brand-red")}
            />
          </div>
        )}

        {error && <p className="text-xs text-brand-red">{error}</p>}

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" size="sm" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" loading={loading}>
            Suspend Partner
          </Button>
        </div>
      </form>
    </Modal>
  );
}
