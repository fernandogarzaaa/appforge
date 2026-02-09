import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import AICodeCompletion from './AICodeCompletion';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CodeEditorWithCompletion({
  value,
  onChange,
  placeholder: placeholderText,
  language = 'javascript',
  context = '',
  className,
  rows = 10,
  showAIBadge = true
}) {
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Control' || e.ctrlKey) {
      setShowSuggestions(true);
    }
  };

  const handleSuggestion = (code) => {
    if (textareaRef.current) {
      const before = value.substring(0, cursorPosition);
      const after = value.substring(cursorPosition);
      const newValue = before + code + after;
      onChange(newValue);

      setTimeout(() => {
        textareaRef.current.selectionStart = cursorPosition + code.length;
        textareaRef.current.selectionEnd = cursorPosition + code.length;
        textareaRef.current.focus();
      }, 0);
    }
    setShowSuggestions(false);
  };

  useEffect(() => {
    const handleKeyUp = (e) => {
      if (e.key === 'Control') {
        setShowSuggestions(false);
      }
    };

    window.addEventListener('keyup', handleKeyUp);
    return () => window.removeEventListener('keyup', handleKeyUp);
  }, []);

  return (
    <div className="relative">
      {showAIBadge && (
        <Badge
          className="absolute top-2 right-2 z-10 bg-purple-600 text-white"
          variant="default"
        >
          <Sparkles className="w-3 h-3 mr-1" />
          AI Completion
        </Badge>
      )}

      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={(e) => setCursorPosition(e.target.selectionStart)}
        placeholder={placeholderText}
        className={className}
        rows={rows}
      />

      {showSuggestions && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0 }}>
          <AICodeCompletion
            value={value}
            cursorPosition={cursorPosition}
            language={language}
            context={context}
            onSuggestion={handleSuggestion}
          />
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        Hold <kbd className="px-1.5 py-0.5 bg-gray-200 rounded font-mono">Ctrl</kbd> for AI suggestions
      </div>
    </div>
  );
}