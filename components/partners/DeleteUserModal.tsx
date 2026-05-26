"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  partnerName: string;
}

export function DeleteUserModal({ open, onClose, onConfirm, partnerName }: DeleteUserModalProps) {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setConfirmation(""); setError(""); };
  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmation !== "DELETE") {
      setError('Type "DELETE" to confirm');
      return;
    }
    setLoading(true);
    try {
      await onConfirm();
      reset();
    } catch {
      setError("Failed to delete. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Delete Partner Account" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="px-3 py-3 rounded-lg bg-brand-red-muted border border-brand-red/20 text-sm text-brand-red">
          This action is <strong>irreversible</strong>. All data for{" "}
          <strong>{partnerName}</strong> will be permanently deleted.
        </div>

        <div>
          <label className="block text-sm font-medium text-light-text dark:text-dark-text mb-1.5">
            Type <span className="font-mono font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => { setConfirmation(e.target.value); setError(""); }}
            placeholder="DELETE"
            className={cn("input-base font-mono", error && "border-brand-red")}
            autoComplete="off"
          />
          {error && <p className="text-xs text-brand-red mt-1">{error}</p>}
        </div>

        <div className="flex gap-3 justify-end pt-1">
          <Button variant="secondary" size="sm" type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            loading={loading}
            disabled={confirmation !== "DELETE"}
          >
            Delete Account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
