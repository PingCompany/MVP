"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  CodeSquare,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Send,
  AtSign,
  Paperclip,
} from "lucide-react";
import TurndownService from "turndown";
import { cn } from "@/lib/utils";

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// Turndown rules for strikethrough and code blocks
turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

function htmlToMarkdown(html: string): string {
  // Tiptap wraps empty content in <p></p>
  if (!html || html === "<p></p>") return "";
  return turndown.turndown(html).trim();
}

function markdownToHtml(markdown: string): string {
  if (!markdown) return "";
  // Simple markdown→HTML for loading existing content into editor
  // Handles the most common cases for editing
  let html = markdown
    // Code blocks (fenced)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trimEnd()}</code></pre>`;
    })
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    // Italic
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Blockquote
    .replace(/^>\s?(.+)$/gm, "<blockquote><p>$1</p></blockquote>")
    // Unordered list items
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>")
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Line breaks → paragraphs
    .split("\n\n")
    .map((block) => {
      if (
        block.startsWith("<pre>") ||
        block.startsWith("<blockquote>") ||
        block.startsWith("<li>")
      ) {
        return block;
      }
      return `<p>${block.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*?<\/li>)+/g, (match) => `<ul>${match}</ul>`);

  return html;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded p-1 transition-colors",
        isActive
          ? "bg-foreground/10 text-foreground"
          : "text-foreground/30 hover:bg-surface-3 hover:text-foreground/60",
        disabled && "cursor-not-allowed opacity-30"
      )}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 border-t border-subtle px-1 py-1">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="Bold (⌘B)"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="Italic (⌘I)"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="Strikethrough (⌘⇧X)"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="Inline code (⌘E)"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="Code block"
      >
        <CodeSquare className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="Bullet list"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-foreground/10" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="Quote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="Link"
      >
        <LinkIcon className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  );
}

export interface RichTextComposerHandle {
  focus: () => void;
  clear: () => void;
  isEmpty: () => boolean;
  getMarkdown: () => string;
  insertText: (text: string) => void;
}

interface RichTextComposerProps {
  placeholder?: string;
  onSend?: (markdown: string) => void;
  onTyping?: () => void;
  /** Initial content in markdown format (for edit mode) */
  initialContent?: string;
  /** Show the @ and attachment buttons */
  showActions?: boolean;
  /** Show toolbar — default true */
  showToolbar?: boolean;
  /** Is this a DM composer */
  isDM?: boolean;
  /** Called on Escape key */
  onEscape?: () => void;
  /** Disable Enter-to-send (for edit mode) */
  enterToSave?: boolean;
  /** Called on Enter-to-save (edit mode) */
  onSave?: (markdown: string) => void;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Class for the outer wrapper */
  className?: string;
}

export const RichTextComposer = forwardRef<RichTextComposerHandle, RichTextComposerProps>(
  function RichTextComposer(
    {
      placeholder = "Write a message...",
      onSend,
      onTyping,
      initialContent,
      showActions = false,
      showToolbar = true,
      isDM = false,
      onEscape,
      enterToSave,
      onSave,
      autoFocus = false,
      className,
    },
    ref
  ) {
    // Use refs to avoid stale closures in handleKeyDown
    const onSendRef = useRef(onSend);
    const onSaveRef = useRef(onSave);
    const onEscapeRef = useRef(onEscape);
    const onTypingRef = useRef(onTyping);
    const enterToSaveRef = useRef(enterToSave);
    useEffect(() => {
      onSendRef.current = onSend;
      onSaveRef.current = onSave;
      onEscapeRef.current = onEscape;
      onTypingRef.current = onTyping;
      enterToSaveRef.current = enterToSave;
    });

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: false, // No headings in chat messages
          horizontalRule: false,
        }),
        Placeholder.configure({ placeholder }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-ping-purple underline cursor-pointer",
          },
        }),
      ],
      content: initialContent ? markdownToHtml(initialContent) : "",
      autofocus: autoFocus,
      editorProps: {
        attributes: {
          class:
            "prose-none min-h-[20px] max-h-32 overflow-y-auto text-sm text-foreground focus:outline-none",
        },
        handleKeyDown: (view, event) => {
          // Enter without shift → send/save
          if (event.key === "Enter" && !event.shiftKey && !event.altKey) {
            const ed = view.state;
            // Allow Enter inside code blocks — check the current node
            const { $from } = ed.selection;
            const inCodeBlock = $from.parent.type.name === "codeBlock";
            const inListItem = $from.parent.type.name === "listItem" ||
              $from.node(-1)?.type.name === "listItem";
            if (inCodeBlock || inListItem) {
              return false; // Let Tiptap handle it
            }
            event.preventDefault();
            if (enterToSaveRef.current && onSaveRef.current) {
              const html = view.dom.closest(".ProseMirror")?.innerHTML ?? "";
              const md = htmlToMarkdown(html);
              if (md) onSaveRef.current(md);
            } else if (onSendRef.current) {
              const html = view.dom.closest(".ProseMirror")?.innerHTML ?? "";
              const md = htmlToMarkdown(html);
              if (md) {
                onSendRef.current(md);
                // Clear after sending — need to defer to avoid ProseMirror state issues
                setTimeout(() => {
                  const tr = view.state.tr;
                  tr.delete(0, view.state.doc.content.size);
                  view.dispatch(tr);
                }, 0);
              }
            }
            return true;
          }
          if (event.key === "Escape" && onEscapeRef.current) {
            event.preventDefault();
            onEscapeRef.current();
            return true;
          }
          return false;
        },
      },
      onUpdate: () => {
        onTypingRef.current?.();
      },
    });

    const handleSend = useCallback(() => {
      if (!editor) return;
      const md = htmlToMarkdown(editor.getHTML());
      if (!md) return;
      onSend?.(md);
      editor.commands.clearContent(true);
    }, [editor, onSend]);

    useImperativeHandle(ref, () => ({
      focus: () => editor?.commands.focus(),
      clear: () => editor?.commands.clearContent(true),
      isEmpty: () => editor?.isEmpty ?? true,
      getMarkdown: () => htmlToMarkdown(editor?.getHTML() ?? ""),
      insertText: (text: string) => editor?.commands.insertContent(text),
    }));

    const isEmpty = editor?.isEmpty ?? true;

    return (
      <div className={cn("rounded border border-subtle bg-surface-2 focus-within:border-foreground/15", className)}>
        <div className="px-3 py-2">
          <EditorContent editor={editor} />
        </div>

        {showToolbar && editor && <Toolbar editor={editor} />}

        {/* Action row */}
        <div className="flex items-center justify-between px-2 pb-1.5">
          <div className="flex items-center gap-0.5">
            {showActions && !isDM && (
              <button
                type="button"
                onClick={() => {
                  editor?.commands.insertContent("@");
                  editor?.commands.focus();
                }}
                className="rounded p-1 text-foreground/25 hover:bg-surface-3 hover:text-foreground/60"
                title="Mention"
              >
                <AtSign className="h-3.5 w-3.5" />
              </button>
            )}
            {showActions && (
              <button
                type="button"
                disabled
                title="File attachments coming soon"
                className="rounded p-1 text-foreground/25 opacity-50 cursor-not-allowed"
              >
                <Paperclip className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {onSend && (
            <button
              type="button"
              onClick={handleSend}
              disabled={isEmpty}
              className={cn(
                "rounded p-1 transition-colors",
                !isEmpty
                  ? "bg-ping-purple text-white hover:bg-ping-purple-hover"
                  : "text-foreground/20"
              )}
              title="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
