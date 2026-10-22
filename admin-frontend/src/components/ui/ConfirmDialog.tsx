import React from 'react';
import { AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy bỏ',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertCircle className="w-6 h-6 text-rose-600" />,
    warning: <AlertTriangle className="w-6 h-6 text-amber-600" />,
    primary: <HelpCircle className="w-6 h-6 text-emerald-700" />,
  };

  const buttonVariantMap = {
    danger: 'danger' as const,
    warning: 'primary' as const,
    primary: 'primary' as const,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="mb-3 rounded-full bg-stone-100 p-3">
          {iconMap[variant]}
        </div>
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        <p className="mt-2 text-xs text-stone-500 leading-relaxed max-w-xs">
          {message}
        </p>

        <div className="mt-6 flex w-full justify-center gap-3">
          <Button
            variant="outline"
            size="md"
            className="flex-1"
            disabled={isLoading}
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button
            variant={buttonVariantMap[variant]}
            size="md"
            className="flex-1"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
