import { useState } from "react";
import { toast } from "sonner";
import { getErrorMessage } from "../../services/serviceError";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";

export type ConfirmDialogVariant = "destructive" | "primary";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel: string;
  errorFallbackMessage: string;
  onConfirm: () => Promise<void>;
  variant?: ConfirmDialogVariant;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  pendingLabel,
  errorFallbackMessage,
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  const [isPending, setIsPending] = useState(false);

  const handleConfirm = async () => {
    setIsPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      toast.error(getErrorMessage(error, errorFallbackMessage));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <AlertDialogContent className="rounded-none border-[#30292b] bg-[#24191b] text-[#f8f8f8]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[#ebe9e9]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[#bababa]">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={isPending}
            className="h-11 rounded-none border-[#30292b] bg-transparent text-[#f8f8f8] hover:bg-white/5 hover:text-[#f8f8f8]"
          >
            Cancelar
          </AlertDialogCancel>
          <Button variant={variant} size="touch" className="rounded-none" disabled={isPending} onClick={handleConfirm}>
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
