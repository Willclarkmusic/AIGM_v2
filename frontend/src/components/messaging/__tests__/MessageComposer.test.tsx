import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageComposer } from '../MessageComposer';

// Mock TipTap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content">
      {editor?.getHTML?.() || ''}
    </div>
  ),
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: vi.fn(() => ({})),
}));

describe('MessageComposer', () => {
  const mockOnSubmit = vi.fn();
  const mockOnFocus = vi.fn();
  const mockOnBlur = vi.fn();

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onFocus: mockOnFocus,
    onBlur: mockOnBlur,
    placeholder: 'Type a message...',
    disabled: false,
    maxLength: 2000,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup default mock editor
    const mockEditor = {
      getHTML: vi.fn().mockReturnValue('<p></p>'),
      getText: vi.fn().mockReturnValue(''),
      getJSON: vi.fn().mockReturnValue({ type: 'doc', content: [] }),
      isEmpty: true,
      commands: {
        setContent: vi.fn(),
        focus: vi.fn(),
        clearContent: vi.fn(),
        toggleBold: vi.fn(),
        toggleItalic: vi.fn(),
        toggleCode: vi.fn(),
      },
      isActive: vi.fn().mockReturnValue(false),
      on: vi.fn(),
      off: vi.fn(),
      view: {
        dom: document.createElement('div')
      }
    };

    const { useEditor } = await import('@tiptap/react');
    (useEditor as any).mockReturnValue(mockEditor);
  });

  describe('Basic Rendering', () => {
    it('should render message composer with placeholder', () => {
      render(<MessageComposer {...defaultProps} />);
      
      expect(screen.getByTestId('message-composer')).toBeInTheDocument();
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should render with custom placeholder', () => {
      const customPlaceholder = 'Start typing your message...';
      render(<MessageComposer {...defaultProps} placeholder={customPlaceholder} />);
      
      // Placeholder should be passed to TipTap editor
      expect(screen.getByTestId('message-composer')).toBeInTheDocument();
    });

    it('should render disabled state', () => {
      render(<MessageComposer {...defaultProps} disabled={true} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });

    it('should render loading state', () => {
      render(<MessageComposer {...defaultProps} loading={true} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Message Input and Validation', () => {
    it('should handle text input correctly', async () => {
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p>Hello world</p>'),
        getText: vi.fn().mockReturnValue('Hello world'),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      // Simulate typing
      const editor = screen.getByTestId('editor-content');
      fireEvent.input(editor, { target: { textContent: 'Hello world' } });

      expect(mockEditor.getText).toHaveBeenCalled();
    });

    it('should validate message length', async () => {
      const longMessage = 'a'.repeat(2001); // Exceeds maxLength
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(`<p>${longMessage}</p>`),
        getText: vi.fn().mockReturnValue(longMessage),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} maxLength={2000} />);
      
      expect(screen.getByText(/message too long/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeDisabled();
    });

    it('should show character count', async () => {
      const message = 'Hello world';
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(`<p>${message}</p>`),
        getText: vi.fn().mockReturnValue(message),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} showCharacterCount={true} />);
      
      expect(screen.getByText(`${message.length}/2000`)).toBeInTheDocument();
    });

    it('should prevent empty message submission', async () => {
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p></p>'),
        getText: vi.fn().mockReturnValue(''),
        isEmpty: true,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      expect(sendButton).toBeDisabled();
    });
  });

  describe('Rich Text Formatting', () => {
    it('should render formatting toolbar', () => {
      render(<MessageComposer {...defaultProps} showToolbar={true} />);
      
      expect(screen.getByTestId('formatting-toolbar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /bold/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /italic/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /code/i })).toBeInTheDocument();
    });

    it('should apply bold formatting', async () => {
      const user = userEvent.setup();
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p><strong>bold text</strong></p>'),
        getText: vi.fn().mockReturnValue('bold text'),
        isEmpty: false,
        commands: {
          toggleBold: vi.fn(),
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        isActive: vi.fn().mockReturnValue(false),
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} showToolbar={true} />);
      
      const boldButton = screen.getByRole('button', { name: /bold/i });
      await user.click(boldButton);

      expect(mockEditor.commands.toggleBold).toHaveBeenCalled();
    });

    it('should apply italic formatting', async () => {
      const user = userEvent.setup();
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p><em>italic text</em></p>'),
        getText: vi.fn().mockReturnValue('italic text'),
        isEmpty: false,
        commands: {
          toggleItalic: vi.fn(),
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        isActive: vi.fn().mockReturnValue(false),
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} showToolbar={true} />);
      
      const italicButton = screen.getByRole('button', { name: /italic/i });
      await user.click(italicButton);

      expect(mockEditor.commands.toggleItalic).toHaveBeenCalled();
    });

    it('should apply code formatting', async () => {
      const user = userEvent.setup();
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p><code>code text</code></p>'),
        getText: vi.fn().mockReturnValue('code text'),
        isEmpty: false,
        commands: {
          toggleCode: vi.fn(),
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        isActive: vi.fn().mockReturnValue(false),
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} showToolbar={true} />);
      
      const codeButton = screen.getByRole('button', { name: /code/i });
      await user.click(codeButton);

      expect(mockEditor.commands.toggleCode).toHaveBeenCalled();
    });
  });

  describe('Message Submission', () => {
    it('should submit message on send button click', async () => {
      const user = userEvent.setup();
      const messageContent = '<p>Hello world</p>';
      const messageText = 'Hello world';
      
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(messageContent),
        getText: vi.fn().mockReturnValue(messageText),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: {
          type: 'doc',
          content: expect.any(Array),
        },
        html: messageContent,
        text: messageText,
      });
    });

    it('should submit message on Enter key press', async () => {
      const messageContent = '<p>Hello world</p>';
      const messageText = 'Hello world';
      
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(messageContent),
        getText: vi.fn().mockReturnValue(messageText),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.keyDown(editor, { key: 'Enter', ctrlKey: false });

      expect(mockOnSubmit).toHaveBeenCalledWith({
        content: {
          type: 'doc',
          content: expect.any(Array),
        },
        html: messageContent,
        text: messageText,
      });
    });

    it('should not submit on Shift+Enter (new line)', async () => {
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p>Hello world</p>'),
        getText: vi.fn().mockReturnValue('Hello world'),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      const editor = screen.getByTestId('editor-content');
      fireEvent.keyDown(editor, { key: 'Enter', shiftKey: true });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should clear editor after successful submission', async () => {
      const user = userEvent.setup();
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p>Hello world</p>'),
        getText: vi.fn().mockReturnValue('Hello world'),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      expect(mockEditor.commands.clearContent).toHaveBeenCalled();
      expect(mockEditor.commands.focus).toHaveBeenCalled();
    });
  });

  describe('Focus and Blur Events', () => {
    it('should call onFocus when editor gains focus', async () => {
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(''),
        getText: vi.fn().mockReturnValue(''),
        isEmpty: true,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'focus') {
            callback();
          }
        }),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);

      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('should call onBlur when editor loses focus', async () => {
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue(''),
        getText: vi.fn().mockReturnValue(''),
        isEmpty: true,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'blur') {
            callback();
          }
        }),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} />);

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<MessageComposer {...defaultProps} />);
      
      expect(screen.getByLabelText(/message input/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      render(<MessageComposer {...defaultProps} showToolbar={true} />);
      
      const boldButton = screen.getByRole('button', { name: /bold/i });
      const italicButton = screen.getByRole('button', { name: /italic/i });
      
      expect(boldButton).toHaveAttribute('tabIndex', '0');
      expect(italicButton).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Error Handling', () => {
    it('should handle editor initialization failure', async () => {
      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(null);

      render(<MessageComposer {...defaultProps} />);
      
      expect(screen.getByText(/editor failed to load/i)).toBeInTheDocument();
    });

    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      const mockOnSubmitWithError = vi.fn().mockRejectedValue(new Error('Network error'));
      
      const mockEditor = {
        getHTML: vi.fn().mockReturnValue('<p>Hello world</p>'),
        getText: vi.fn().mockReturnValue('Hello world'),
        isEmpty: false,
        commands: {
          setContent: vi.fn(),
          focus: vi.fn(),
          clearContent: vi.fn(),
        },
        on: vi.fn(),
        off: vi.fn(),
      };

      const { useEditor } = await import('@tiptap/react');
      (useEditor as any).mockReturnValue(mockEditor);

      render(<MessageComposer {...defaultProps} onSubmit={mockOnSubmitWithError} />);
      
      const sendButton = screen.getByRole('button', { name: /send/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to send message/i)).toBeInTheDocument();
      });
    });
  });
});