import React, { useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Mention } from '@tiptap/extension-mention';
import EmojiPicker from 'emoji-picker-react';
import { 
  Send, Bold, Italic, Code, Underline as UnderlineIcon, 
  Strikethrough, Quote, List, ListOrdered, ChevronDown,
  Smile, Palette, Highlighter, AtSign, Paperclip
} from 'lucide-react';
import { userMentionSuggestion } from '../../services/userMention';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showHeadingDropdown, setShowHeadingDropdown] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable built-in extensions that we'll configure separately
        strike: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        blockquote: false,
      }),
      Underline,
      Strike,
      Blockquote.configure({
        HTMLAttributes: {
          class: 'border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-2',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc list-inside my-2',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal list-inside my-2',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'mb-1',
        },
      }),
      TextStyle.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            fontSize: {
              default: null,
              parseHTML: element => element.style.fontSize,
              renderHTML: attributes => {
                if (!attributes.fontSize) {
                  return {}
                }
                return {
                  style: `font-size: ${attributes.fontSize}; ${attributes.fontSize === '1.5rem' || attributes.fontSize === '1.25rem' ? 'font-weight: bold;' : ''}`,
                }
              },
            },
          }
        },
      }),
      Color.configure({ 
        types: [TextStyle.name, ListItem.name],
      }),
      Highlight.configure({ 
        multicolor: true,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded font-medium',
        },
        renderLabel({ node }) {
          return `@${node.attrs.label ?? node.attrs.id}`;
        },
        suggestion: userMentionSuggestion,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[40px] max-h-[150px] overflow-y-auto p-3 text-gray-900 dark:text-white resize-none',
        style: 'font-family: inherit;',
      },
    },
    onUpdate: ({ editor }) => {
      // Update character count
      const text = editor.getText();
      setCharacterCount(text.length);
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

  // Text formatting functions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();
  const toggleCode = () => editor?.chain().focus().toggleCode().run();
  
  // Block formatting functions
  const toggleBlockquote = () => editor?.chain().focus().toggleBlockquote().run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () => editor?.chain().focus().toggleOrderedList().run();
  
  // Text size functions using TextStyle with fontSize attribute
  const setTextSize = (size: string | null) => {
    if (!editor) return;
    
    // Clear existing fontSize
    editor.chain().focus().unsetMark('textStyle').run();
    
    // Apply new font size if specified
    if (size === 'xlarge') {
      editor.chain().focus().setMark('textStyle', { fontSize: '1.5rem' }).run();
    } else if (size === 'large') {
      editor.chain().focus().setMark('textStyle', { fontSize: '1.25rem' }).run();
    }
    // For 'normal' or null, we just cleared the mark above
    
    setShowHeadingDropdown(false);
  };
  
  const getCurrentTextSize = () => {
    if (!editor) return 'normal';
    const attrs = editor.getAttributes('textStyle');
    if (attrs.fontSize === '1.5rem') return 'xlarge';
    if (attrs.fontSize === '1.25rem') return 'large';
    return 'normal';
  };
  
  const getTextSizeLabel = () => {
    const size = getCurrentTextSize();
    if (size === 'xlarge') return 'Heading 1';
    if (size === 'large') return 'Heading 2';
    return 'Paragraph';
  };
  
  // Color functions
  const setTextColor = (color: string) => {
    editor?.chain().focus().setColor(color).run();
    setShowColorPicker(false);
  };
  
  const setHighlight = (color: string) => {
    editor?.chain().focus().setHighlight({ color }).run();
    setShowHighlightPicker(false);
  };

  // Emoji functions
  const onEmojiClick = (emojiData: any) => {
    editor?.chain().focus().insertContent(emojiData.emoji).run();
    setShowEmojiPicker(false);
  };

  // Mention function
  const insertMention = () => {
    editor?.chain().focus().insertContent('@').run();
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
      {/* Enhanced Toolbar */}
      <div className="flex items-center flex-wrap gap-1 px-4 py-2 border-b border-gray-100 dark:border-gray-800">
        {/* Text Formatting */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
          <button
            onClick={toggleBold}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('bold') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          
          <button
            onClick={toggleItalic}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('italic') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>

          <button
            onClick={toggleUnderline}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('underline') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </button>

          <button
            onClick={toggleStrike}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('strike') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <button
            onClick={toggleCode}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('code') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Inline Code (Ctrl+E)"
          >
            <Code className="h-4 w-4" />
          </button>
        </div>

        {/* Text Size Dropdown and Blocks */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
          {/* Text Size Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHeadingDropdown(!showHeadingDropdown)}
              disabled={disabled}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 min-w-[100px]"
              title="Text Size"
            >
              <span className="text-xs font-medium">{getTextSizeLabel()}</span>
              <ChevronDown className="h-3 w-3" />
            </button>
            {showHeadingDropdown && (
              <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-20 min-w-[140px]">
                <button
                  onClick={() => setTextSize('normal')}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg ${
                    getCurrentTextSize() === 'normal' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <span className="text-sm">Paragraph</span>
                </button>
                <button
                  onClick={() => setTextSize('xlarge')}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    getCurrentTextSize() === 'xlarge' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <span className="text-lg font-bold">Heading 1</span>
                </button>
                <button
                  onClick={() => setTextSize('large')}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg ${
                    getCurrentTextSize() === 'large' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  <span className="text-base font-bold">Heading 2</span>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={toggleBlockquote}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('blockquote') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Quote"
          >
            <Quote className="h-4 w-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
          <button
            onClick={toggleBulletList}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('bulletList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>

          <button
            onClick={toggleOrderedList}
            disabled={disabled}
            className={`p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed ${
              editor.isActive('orderedList') ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''
            }`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Colors and Highlights */}
        <div className="flex items-center space-x-1 border-r border-gray-200 dark:border-gray-600 pr-2">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              disabled={disabled}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showColorPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-lg z-20">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    '#000000', '#4A4A4A', '#9B9B9B', '#FFFFFF',
                    '#FF0000', '#FF9500', '#FFFF00', '#00FF00',
                    '#0099FF', '#6633FF', '#FF00FF', '#FF6600',
                    '#8B4513', '#2E8B57', '#4B0082', '#DC143C'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setTextColor(color)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:scale-105 transition-all duration-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click a color to apply text color
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowHighlightPicker(!showHighlightPicker)}
              disabled={disabled}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Highlight"
            >
              <Highlighter className="h-4 w-4" />
            </button>
            {showHighlightPicker && (
              <div className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-lg z-20">
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    '#FFFF00', '#FFE135', '#FFCC02', '#00FF00', 
                    '#00FFFF', '#FF00FF', '#FFA500', '#FF69B4',
                    '#98FB98', '#DDA0DD', '#F0E68C', '#87CEEB'
                  ].map((color) => (
                    <button
                      key={color}
                      onClick={() => setHighlight(color)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:scale-105 transition-all duration-200 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Click a color to highlight text
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Special Features */}
        <div className="flex items-center space-x-1">
          <button
            onClick={insertMention}
            disabled={disabled}
            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Mention (@)"
          >
            <AtSign className="h-4 w-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Emoji"
            >
              <Smile className="h-4 w-4" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-1 z-30" ref={emojiPickerRef}>
                <EmojiPicker 
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>

          <button
            disabled={disabled}
            className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach File (Phase 1.5)"
          >
            <Paperclip className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex items-end p-4 space-x-3">
        <div className="flex-1 min-h-[40px] max-h-[200px] border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
          <EditorContent
            editor={editor}
            onKeyDown={handleKeyDown}
            className="w-full tiptap-editor"
            placeholder={placeholder}
          />
          <style>{`
            .tiptap-editor .ProseMirror {
              outline: none;
              padding: 12px;
              min-height: 40px;
              max-height: 200px;
              overflow-y: auto;
            }
            .tiptap-editor .ProseMirror p {
              margin: 0.25rem 0 !important;
              line-height: 1.5 !important;
              font-size: 1rem !important;
            }
            .tiptap-editor .ProseMirror strong {
              font-weight: bold !important;
            }
            .tiptap-editor .ProseMirror em {
              font-style: italic !important;
            }
            .tiptap-editor .ProseMirror u {
              text-decoration: underline !important;
            }
            .tiptap-editor .ProseMirror s {
              text-decoration: line-through !important;
            }
            .tiptap-editor .ProseMirror code {
              background-color: rgba(156, 163, 175, 0.2) !important;
              padding: 2px 4px !important;
              border-radius: 3px !important;
              font-family: 'Courier New', monospace !important;
              font-size: 0.9em !important;
            }
          `}</style>
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
      
      {/* Footer with character count and hints */}
      <div className="flex items-center justify-between px-4 pb-2">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Enter</kbd> to send, <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Shift + Enter</kbd> for new line
        </p>
        {characterCount > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {characterCount} characters
          </div>
        )}
      </div>
    </div>
  );
};