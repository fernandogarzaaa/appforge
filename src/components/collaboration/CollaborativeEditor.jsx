/**
 * Collaborative Editor Component
 * Real-time editor with presence awareness, live cursors, and conflict resolution
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCollaboration } from '@/contexts/CollaborationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Copy,
  Download,
  Undo2,
  Redo2,
  Send,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2',
];

function getColorForUser(userId) {
  const index = userId.charCodeAt(0) % USER_COLORS.length;
  return USER_COLORS[index];
}

export default function CollaborativeEditor({ documentId, initialContent = '' }) {
  const {
    isConnected,
    activeUsers,
    cursorPositions,
    documentVersion,
    editHistory,
    sendEdit,
    sendMessage,
    sendCursor,
  } = useCollaboration();

  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [lastSavedVersion, setLastSavedVersion] = useState(0);
  const [messageInput, setMessageInput] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const textareaRef = useRef(null);
  const updateTimeoutRef = useRef(null);

  // Track cursor position changes
  const handleCursorMove = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const position = textarea.selectionStart;
    const text = textarea.value;

    // Calculate line and column
    const lines = text.substring(0, position).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;

    const rect = textarea.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top;

    sendCursor(x, y, line, column);
  }, [sendCursor]);

  // Handle content changes
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    const oldContent = content;

    // Add to undo stack
    setUndoStack((prev) => [...prev, oldContent]);
    setRedoStack([]); // Clear redo stack on new edit

    setContent(newContent);

    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Send edit with debounce (500ms)
    updateTimeoutRef.current = setTimeout(() => {
      const operation = {
        type: 'replace',
        from: 0,
        to: oldContent.length,
        text: newContent,
      };
      sendEdit(operation);
    }, 500);

    handleCursorMove();
  };

  // Undo action
  const handleUndo = () => {
    if (undoStack.length === 0) {
      toast.info('No more undos available');
      return;
    }

    const previousContent = undoStack[undoStack.length - 1];
    setRedoStack((prev) => [...prev, content]);
    setUndoStack((prev) => prev.slice(0, -1));
    setContent(previousContent);

    if (textareaRef.current) {
      textareaRef.current.value = previousContent;
    }

    sendEdit({
      type: 'undo',
      version: documentVersion,
    });

    toast.info('Undo performed');
  };

  // Redo action
  const handleRedo = () => {
    if (redoStack.length === 0) {
      toast.info('No more redos available');
      return;
    }

    const nextContent = redoStack[redoStack.length - 1];
    setUndoStack((prev) => [...prev, content]);
    setRedoStack((prev) => prev.slice(0, -1));
    setContent(nextContent);

    if (textareaRef.current) {
      textareaRef.current.value = nextContent;
    }

    sendEdit({
      type: 'redo',
      version: documentVersion,
    });

    toast.info('Redo performed');
  };

  // Save document
  const handleSave = () => {
    setSavedContent(content);
    setLastSavedVersion(documentVersion);

    sendEdit({
      type: 'save',
      content,
      version: documentVersion,
    });

    toast.success('Document saved');
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(content).then(() => {
      toast.success('Copied to clipboard');
    });
  };

  // Download as file
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `document-${documentId}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Document downloaded');
  };

  // Send message
  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput, 'text');
      setMessageInput('');
      toast.success('Message sent');
    }
  };

  // Has unsaved changes
  const hasUnsavedChanges = content !== savedContent;

  // Count lines
  const lineCount = content.split('\n').length;
  const charCount = content.length;

  return (
    <div className="space-y-4">
      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle>Collaborative Editor</CardTitle>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300">
                      Connected
                    </span>
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 dark:bg-red-950">
                    <AlertCircle className="w-3 h-3 mr-1 text-red-600 dark:text-red-400" />
                    <span className="text-xs text-red-700 dark:text-red-300">
                      Offline
                    </span>
                  </Badge>
                )}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950">
                    <span className="text-xs text-yellow-700 dark:text-yellow-300">
                      Unsaved changes
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span>v{documentVersion}</span>
              <span>{lineCount} lines</span>
              <span>{charCount} chars</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </Button>

            <div className="w-px bg-slate-200 dark:bg-slate-700" />

            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasUnsavedChanges || !isConnected}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              title="Copy to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              title="Download as file"
            >
              <Download className="w-4 h-4" />
            </Button>

            <div className="flex-1" />

            <Button
              size="sm"
              variant={showMessages ? 'default' : 'outline'}
              onClick={() => setShowMessages(!showMessages)}
            >
              <Send className="w-4 h-4 mr-1" />
              Chat ({activeUsers.length})
            </Button>
          </div>

          {/* Editor */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onMouseMove={handleCursorMove}
              onKeyUp={handleCursorMove}
              placeholder="Start typing... (Your changes are synced in real-time)"
              className="w-full h-96 p-4 font-mono text-sm border border-slate-200 dark:border-slate-700 rounded-lg
                        bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50
                        placeholder-slate-500 dark:placeholder-slate-400
                        focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
            />

            {/* Remote Cursors */}
            {Object.entries(cursorPositions).map(([userId, cursorData]) => {
              const user = activeUsers.find((u) => u.userId === userId);
              if (!user) return null;

              return (
                <motion.div
                  key={userId}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${cursorData.x}px`,
                    top: `${cursorData.y}px`,
                  }}
                >
                  <div
                    className="w-0.5 h-6 rounded-full"
                    style={{ backgroundColor: getColorForUser(userId) }}
                  />
                  <div
                    className="absolute top-0 left-0 mt-1 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                    style={{ backgroundColor: getColorForUser(userId) }}
                  >
                    {user.userName}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Undo/Redo Count */}
          <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-400">
            <span>Undos: {undoStack.length}</span>
            <span>Redos: {redoStack.length}</span>
            <span>Edit history: {editHistory.length}</span>
          </div>
        </CardContent>
      </Card>

      {/* Message Chat Panel */}
      {showMessages && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle>Collaboration Chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && handleSendMessage()
                  }
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg
                           bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-50
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button size="sm" onClick={handleSendMessage}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
