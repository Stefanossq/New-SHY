import * as React from 'react';
import { Dialog as DialogPrimitive, AlertDialog as AlertDialogPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { buttonVariants } from './button';

/**
 * Accessible modal built on Radix Dialog: focus trap, Esc to close, scroll lock,
 * aria-labelledby/-describedby wiring and focus restoration come for free.
 */
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const overlayClass = 'fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-overlay-in';
const contentClass =
  'fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto custom-scrollbar rounded-xl border border-gray-800 bg-gray-900 text-gray-100 shadow-2xl shadow-black/50 data-[state=open]:animate-content-in focus:outline-none';

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { hideClose?: boolean }
>(({ className, children, hideClose = false, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className={overlayClass} />
    <DialogPrimitive.Content ref={ref} className={cn(contentClass, 'max-w-md', className)} {...props}>
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="absolute right-3 top-3 rounded-md p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-1 border-b border-gray-800 bg-gray-950/60 p-5 pr-12', className)} {...props} />
);

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-end gap-2 border-t border-gray-800 p-4', className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-sm font-bold text-white', className)} {...props} />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-xs text-gray-400', className)} {...props} />
));
DialogDescription.displayName = 'DialogDescription';

/* ------------------------------------------------------------------ */
/* Confirmation dialog — replaces the blocking window.confirm()        */
/* ------------------------------------------------------------------ */

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className={overlayClass} />
        <AlertDialogPrimitive.Content className={cn(contentClass, 'max-w-sm p-5')}>
          <AlertDialogPrimitive.Title className="text-sm font-bold text-white">{title}</AlertDialogPrimitive.Title>
          <AlertDialogPrimitive.Description className="mt-2 text-xs leading-relaxed text-gray-400">
            {description}
          </AlertDialogPrimitive.Description>
          <div className="mt-5 flex justify-end gap-2">
            <AlertDialogPrimitive.Cancel className={buttonVariants({ variant: 'ghost' })}>{cancelLabel}</AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action
              className={buttonVariants({ variant: destructive ? 'destructive' : 'primary' })}
              onClick={onConfirm}
            >
              {confirmLabel}
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
