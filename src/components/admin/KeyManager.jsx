import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useViewMode } from '@/contexts/ViewModeContext';

const getMaskedValue = (value = '') => {
  const length = Math.max(8, Math.min(value.length || 8, 32));
  return '•'.repeat(length);
};

export default function KeyManager({
  value = '',
  label,
  masked = true,
  className,
}) {
  const { isBeginnerMode } = useViewMode();
  const [isVisible, setIsVisible] = useState(!masked);
  const [copied, setCopied] = useState(false);

  const displayValue = useMemo(() => {
    if (!value) return '';
    return isVisible ? value : getMaskedValue(value);
  }, [isVisible, value]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <Card
      className={cn(
        "border-spectrum-purple-100/70 bg-gradient-to-br from-spectrum-purple-50/80 to-spectrum-indigo-50/80",
        "dark:from-spectrum-purple-950/30 dark:to-spectrum-indigo-950/20",
        className
      )}
    >
      <CardContent className={cn("space-y-3", isBeginnerMode ? "p-5" : "p-4")}>
        {label && (
          <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            value={displayValue}
            readOnly
            aria-label={label ? `${label} value` : 'Sensitive value'}
            className="font-mono tracking-wide"
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setIsVisible((prev) => !prev)}
              aria-label={isVisible ? 'Hide value' : 'Show value'}
            >
              {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy value to clipboard"
              disabled={!value}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {!isBeginnerMode && (
          <p className="text-xs text-muted-foreground">
            Values are masked by default. Use the eye icon to reveal temporarily.
          </p>
        )}
      </CardContent>
    </Card>
  );
}