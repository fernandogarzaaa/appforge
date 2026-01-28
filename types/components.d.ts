/// <reference types="react" />

declare module '@/components/ui/card' {
  import * as React from 'react';
  
  interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  interface CardDescriptionProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
  }
  
  interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
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
  
  interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
    variant?: string;
    size?: string;
    asChild?: boolean;
  }
  
  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;
}

declare module '@/components/ui/label' {
  import * as React from 'react';
  
  interface LabelProps extends React.HTMLAttributes<HTMLLabelElement> {
    children?: React.ReactNode;
    htmlFor?: string;
  }
  
  export const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;
}

declare module '@/components/ui/input' {
  import * as React from 'react';
  
  interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
  
  export const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
}

declare module '@/components/ui/badge' {
  import * as React from 'react';
  
  interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    variant?: string;
    className?: string;
  }
  
  export function Badge(props: BadgeProps): JSX.Element;
}

declare module '@/components/ui/progress' {
  import * as React from 'react';
  
  interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
    value?: number;
  }
  
  export const Progress: React.ForwardRefExoticComponent<ProgressProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/scroll-area' {
  import * as React from 'react';
  
  interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    children?: React.ReactNode;
    className?: string;
  }
  
  export const ScrollArea: React.ForwardRefExoticComponent<ScrollAreaProps & React.RefAttributes<HTMLDivElement>>;
}

declare module '@/components/ui/textarea' {
  import * as React from 'react';
  
  interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    placeholder?: string;
    rows?: number;
  }
  
  export const Textarea: React.ForwardRefExoticComponent<TextareaProps & React.RefAttributes<HTMLTextAreaElement>>;
}
