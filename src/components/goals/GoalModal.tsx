'use client';

import { Modal } from '@/components/ui/Modal';
import { GoalForm, GoalFormData } from './GoalForm';
import type { GoalWithProgress } from '@/types';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal?: GoalWithProgress | null;
  onSubmit: (data: GoalFormData) => Promise<void>;
}

export function GoalModal({ isOpen, onClose, goal, onSubmit }: GoalModalProps) {
  const handleSubmit = async (data: GoalFormData) => {
    await onSubmit(data);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edytuj cel' : 'Nowy cel finansowy'}
      size="md"
    >
      <GoalForm goal={goal} onSubmit={handleSubmit} onCancel={onClose} />
    </Modal>
  );
}
