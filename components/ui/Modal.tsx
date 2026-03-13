"use client";

import * as React from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
}: ModalProps) {
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [open]);

  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`fixed inset-0 z-50 m-auto max-h-[85vh] w-full max-w-md rounded-lg border border-zinc-200 bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/20 ${className}`}
    >
      <div className="flex flex-col">
        <div className="flex items-start justify-between p-5">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 className="text-base font-semibold text-zinc-900">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-sm text-zinc-500">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 rounded-sm p-1 text-zinc-500 transition-colors hover:text-zinc-900"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        </div>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </dialog>
  );
}

export { Modal };
