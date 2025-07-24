import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Send, Bold, Italic, Code } from 'lucide-react';

interface MessageComposerProps {
  onSendMessage: (content: any) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false
}) => {
  const [isSending, setIsSending] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some features for simple messaging
        heading: false,
        bulletList: false,
        orderedList: false,
        blockquote: false,
        horizontalRule: false,
        dropcursor: false,
        gapcursor: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[40px] max-h-[200px] overflow-y-auto p-3 text-gray-900 dark:text-white',
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-resize functionality could be added here
    },
  });

  const handleSend = async () => {
    if (!editor || isSending) return;

    const content = editor.getJSON();
    const text = editor.getText().trim();

    if (!text) return; // Don't send empty messages

    try {
      setIsSending(true);
      await onSendMessage(content);
      
      // Clear editor after successful send
      editor.commands.clearContent();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Could show error toast here
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const toggleBold = () => {
    editor?.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    editor?.chain().focus().toggleItalic().run();
  };

  const toggleCode = () => {
    editor?.chain().focus().toggleCode().run();
  };

  if (!editor) {
    return (
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="text-center text-gray-500">Loading editor...</div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        <button
          onClick={toggleBold}
          disabled={disabled}
          className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('bold') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : ''
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </button>
        
        <button
          onClick={toggleItalic}
          disabled={disabled}
          className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('italic') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : ''
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </button>
        
        <button
          onClick={toggleCode}
          disabled={disabled}
          className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            editor.isActive('code') ? 'bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white' : ''
          }`}
          title="Inline Code (Ctrl+E)"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* Editor */}
      <div className="flex items-end p-4 space-x-3">
        <div className="flex-1 min-h-[40px] max-h-[200px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <EditorContent
            editor={editor}
            onKeyDown={handleKeyDown}
            className="w-full"
            placeholder={placeholder}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={disabled || isSending || !editor.getText().trim()}
          className="flex-shrink-0 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          title="Send message (Enter)"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {/* Footer hint */}
      <div className="px-4 pb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
};