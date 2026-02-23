/// <reference types="react" />

declare module '@/components/ui/card' {
  import * as React from 'react';
  
  export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  export const Card: React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>;
  export const CardHeader: React.ForwardRefExoticComponent<CardHeaderProps & React.RefAttributes<HTMLDivElement>>;
  export const CardTitle: React.ForwardRefExoticComponent<CardTitleProps & React.RefAttributes<HTMLDivElement>>;
  export const CardContent: React.ForwardRefExoticComponent<CardContentProps & React.RefAttributes<HTMLDivElement>>;
  export const CardDescription: React.ForwardRefExoticComponent<CardDescriptionProps & React.RefAttributes<HTMLDivElement>>;
  export const CardFooter: React.ForwardRefExoticComponent<CardFooterProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/button' {
  import * as React from 'react';
  
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
    asChild?: boolean;
  }
  
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/label' {
  import * as React from 'react';
  
  export interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
    children?: React.ReactNode;
    htmlFor?: string;
  }
  
  export const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
}

declare module '@/components/ui/input' {
  import * as React from 'react';
  
  export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
  
  export const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
}

declare module '@/components/ui/badge' {
  import * as React from 'react';
  
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }
  
  export function Badge(props: BadgeProps): JSX.Element;
}

declare module '@/components/ui/progress' {
  import * as React from 'react';
  
  export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
    indicatorClassName?: string;
  }
  
  export const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/scroll-area' {
  import * as React from 'react';
  
  export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
  }
  
  export const ScrollArea: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/textarea' {
  import * as React from 'react';
  
  export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    placeholder?: string;
    rows?: number;
  }
  
  export const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
}

declare module '@/components/ui/dialog' {
  import * as React from 'react';
  import * as DialogPrimitive from '@radix-ui/react-dialog';
  
  export const Dialog: typeof DialogPrimitive.Root;
  export const DialogTrigger: typeof DialogPrimitive.Trigger;
  export const DialogPortal: typeof DialogPrimitive.Portal;
  export const DialogClose: typeof DialogPrimitive.Close;
  
  export interface DialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DialogOverlay: React.ForwardRefExoticComponent<DialogOverlayProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  export const DialogContent: React.ForwardRefExoticComponent<DialogContentProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DialogHeader: React.FC<DialogHeaderProps>;
  
  export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DialogFooter: React.FC<DialogFooterProps>;
  
  export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  export const DialogTitle: React.ForwardRefExoticComponent<DialogTitleProps & React.RefAttributes<HTMLHeadingElement>>;
  
  export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
  export const DialogDescription: React.ForwardRefExoticComponent<DialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
}

declare module '@/components/ui/alert' {
  import * as React from 'react';
  
  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
  }
  export const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  export const AlertTitle: React.ForwardRefExoticComponent<AlertTitleProps & React.RefAttributes<HTMLHeadingElement>>;
  
  export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const AlertDescription: React.ForwardRefExoticComponent<AlertDescriptionProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/tabs' {
  import * as React from 'react';
  import * as TabsPrimitive from '@radix-ui/react-tabs';
  
  export const Tabs: typeof TabsPrimitive.Root;
  
  export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const TabsList: React.ForwardRefExoticComponent<TabsListProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
  export const TabsTrigger: React.ForwardRefExoticComponent<TabsTriggerProps & React.RefAttributes<HTMLButtonElement>>;
  
  export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const TabsContent: React.ForwardRefExoticComponent<TabsContentProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/alert-dialog' {
  import * as React from 'react';
  import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
  
  export const AlertDialog: typeof AlertDialogPrimitive.Root;
  export const AlertDialogTrigger: typeof AlertDialogPrimitive.Trigger;
  export const AlertDialogPortal: typeof AlertDialogPrimitive.Portal;
  
  export interface AlertDialogOverlayProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const AlertDialogOverlay: React.ForwardRefExoticComponent<AlertDialogOverlayProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const AlertDialogContent: React.ForwardRefExoticComponent<AlertDialogContentProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const AlertDialogHeader: React.FC<AlertDialogHeaderProps>;
  
  export interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const AlertDialogFooter: React.FC<AlertDialogFooterProps>;
  
  export interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
  export const AlertDialogTitle: React.ForwardRefExoticComponent<AlertDialogTitleProps & React.RefAttributes<HTMLHeadingElement>>;
  
  export interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
  export const AlertDialogDescription: React.ForwardRefExoticComponent<AlertDialogDescriptionProps & React.RefAttributes<HTMLParagraphElement>>;
  
  export interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
  export const AlertDialogAction: React.ForwardRefExoticComponent<AlertDialogActionProps & React.RefAttributes<HTMLButtonElement>>;
  
  export interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}
  export const AlertDialogCancel: React.ForwardRefExoticComponent<AlertDialogCancelProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/dropdown-menu' {
  import * as React from 'react';
  import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
  
  export const DropdownMenu: typeof DropdownMenuPrimitive.Root;
  export const DropdownMenuTrigger: typeof DropdownMenuPrimitive.Trigger;
  export const DropdownMenuGroup: typeof DropdownMenuPrimitive.Group;
  export const DropdownMenuPortal: typeof DropdownMenuPrimitive.Portal;
  export const DropdownMenuSub: typeof DropdownMenuPrimitive.Sub;
  export const DropdownMenuRadioGroup: typeof DropdownMenuPrimitive.RadioGroup;
  
  export interface DropdownMenuSubTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean;
  }
  export const DropdownMenuSubTrigger: React.ForwardRefExoticComponent<DropdownMenuSubTriggerProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuSubContentProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DropdownMenuSubContent: React.ForwardRefExoticComponent<DropdownMenuSubContentProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
    sideOffset?: number;
  }
  export const DropdownMenuContent: React.ForwardRefExoticComponent<DropdownMenuContentProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean;
  }
  export const DropdownMenuItem: React.ForwardRefExoticComponent<DropdownMenuItemProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuCheckboxItemProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DropdownMenuCheckboxItem: React.ForwardRefExoticComponent<DropdownMenuCheckboxItemProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuRadioItemProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DropdownMenuRadioItem: React.ForwardRefExoticComponent<DropdownMenuRadioItemProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
    inset?: boolean;
  }
  export const DropdownMenuLabel: React.ForwardRefExoticComponent<DropdownMenuLabelProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLDivElement> {}
  export const DropdownMenuSeparator: React.ForwardRefExoticComponent<DropdownMenuSeparatorProps & React.RefAttributes<HTMLDivElement>>;
  
  export interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {}
  export const DropdownMenuShortcut: React.FC<DropdownMenuShortcutProps>;
}

// Additional module declarations for non-UI components
declare module '@/components/SovereignStatus' {
  export const SovereignStatus: React.FC;
}

declare module '@/components/SafetyAudit' {
  import { AuditLog } from '@/store/auditStore';
  
  interface SafetyAuditProps {
    logs: AuditLog[];
  }
  
  const SafetyAudit: React.FC<SafetyAuditProps>;
  export default SafetyAudit;
}

declare module '@/components/SecurityAudit' {
  const SecurityAudit: React.FC;
  export default SecurityAudit;
}

declare module '@/components/EvolutionMap' {
  const EvolutionMap: React.FC;
  export default EvolutionMap;
}

declare module '@/components/CommandStream' {
  const CommandStream: React.FC;
  export default CommandStream;
}

declare module '@/components/RecordsVault' {
  const RecordsVault: React.FC;
  export default RecordsVault;
}

declare module '@/components/QCoreVisualizer' {
  interface QCoreVisualizerProps {
    logs: any[];
    isScanning: boolean;
  }
  
  const QCoreVisualizer: React.FC<QCoreVisualizerProps>;
  export default QCoreVisualizer;
}

declare module '@/components/VibeGuide' {
  const VibeGuide: React.FC;
  export default VibeGuide;
}

declare module '@/components/ArtGallery' {
  interface ArtGalleryProps {
    apiUrl: string;
  }
  
  const ArtGallery: React.FC<ArtGalleryProps>;
  export default ArtGallery;
}

declare module '@/components/SovereignDashboard' {
  const SovereignDashboard: React.FC;
  export default SovereignDashboard;
}

declare module '@/components/CodeVendingMachine' {
  const CodeVendingMachine: React.FC;
  export default CodeVendingMachine;
}
