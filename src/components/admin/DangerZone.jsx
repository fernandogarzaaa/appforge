import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

export default function DangerZone({
  title = 'Danger Zone',
  description,
  actions = [],
  className,
}) {
  const { isBeginnerMode } = useViewMode();

  return (
    <Alert
      variant="destructive"
      className={cn(
        "border border-destructive/60 bg-destructive/5",
        "rounded-2xl",
        className
      )}
    >
      <AlertTitle className="text-base font-semibold">{title}</AlertTitle>
      {description && (
        <AlertDescription className="text-sm text-destructive/80">
          {description}
        </AlertDescription>
      )}

      <div className={cn("mt-4 flex flex-wrap items-center gap-2", isBeginnerMode && "flex-col items-start")}>
        {actions.map((action, index) => {
          const {
            label,
            onConfirm,
            confirmLabel = 'Confirm',
            cancelLabel = 'Cancel',
            disabled,
            icon: Icon,
            variant = 'destructive',
            actionDescription,
          } = action;

          return (
            <AlertDialog key={action.id || `${label}-${index}`}>
              <AlertDialogTrigger asChild>
                <Button variant={variant} disabled={disabled} aria-label={label}>
                  {Icon && <Icon className="mr-2 h-4 w-4" />}
                  {label}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{label}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {actionDescription || description || 'This action cannot be undone.'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                  <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          );
        })}
      </div>
    </Alert>
  );
}