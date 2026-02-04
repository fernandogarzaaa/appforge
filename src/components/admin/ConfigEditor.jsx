import React, { useEffect, useMemo, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { yaml as yamlLang } from '@codemirror/lang-yaml';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers } from '@codemirror/view';
import YAML from 'yaml';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useViewMode } from '@/contexts/ViewModeContext';

const validateConfig = (input, language) => {
  if (!input?.trim()) {
    return null;
  }

  try {
    if (language === 'yaml') {
      YAML.parse(input);
    } else {
      JSON.parse(input);
    }
    return null;
  } catch (error) {
    return error?.message || 'Invalid configuration';
  }
};

export default function ConfigEditor({
  value = '',
  onChange,
  language = 'json',
  readOnly = false,
  className,
}) {
  const { isDark } = useTheme();
  const { isBeginnerMode } = useViewMode();
  const [error, setError] = useState(() => validateConfig(value, language));

  useEffect(() => {
    setError(validateConfig(value, language));
  }, [value, language]);

  const extensions = useMemo(() => {
    const languageExtension = language === 'yaml' ? yamlLang() : json();
    return [lineNumbers(), languageExtension];
  }, [language]);

  const handleChange = (nextValue) => {
    setError(validateConfig(nextValue, language));
    onChange?.(nextValue);
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card text-card-foreground",
        "shadow-sm",
        "border-spectrum-indigo-100/60 dark:border-spectrum-indigo-900/40",
        className
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-spectrum-indigo-100 text-spectrum-indigo-700 dark:bg-spectrum-indigo-500/20 dark:text-spectrum-indigo-200">
            {language === 'yaml' ? 'YAML' : 'JSON'}
          </Badge>
          {!isBeginnerMode && (
            <span className="text-xs text-muted-foreground">Real-time validation enabled</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {error ? (
            <Badge variant="destructive">Invalid</Badge>
          ) : (
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
              Valid
            </Badge>
          )}
          {readOnly && (
            <Badge variant="outline">Read-only</Badge>
          )}
        </div>
      </div>

      <CodeMirror
        value={value}
        height={isBeginnerMode ? '260px' : '320px'}
        theme={isDark ? oneDark : 'light'}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: !isBeginnerMode,
          highlightSelectionMatches: !isBeginnerMode,
        }}
        editable={!readOnly}
        onChange={handleChange}
        aria-label="Configuration editor"
        className="font-mono text-sm"
      />

      {error && (
        <div className="border-t px-4 py-3">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}