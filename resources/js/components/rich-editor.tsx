'use no memo';

import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    Bold,
    Heading1,
    Heading2,
    Italic,
    List,
    ListOrdered,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function ToolButton({
    onClick,
    active,
    children,
}: {
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            className={cn(
                'h-8 w-8 p-0',
                active && 'bg-accent text-accent-foreground',
            )}
        >
            {children}
        </Button>
    );
}

interface Props {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
}

export function RichEditor({ content, onChange, placeholder }: Props) {
    const { t } = useTranslation();

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({
                placeholder: placeholder ?? t('docs.doc_content'),
            }),
        ],
        content,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
            },
        },
    });

    if (!editor) {
        return null;
    }

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
                <ToolButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                >
                    <Bold className="size-3.5" />
                </ToolButton>
                <ToolButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                >
                    <Italic className="size-3.5" />
                </ToolButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <ToolButton
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 1 }).run()
                    }
                    active={editor.isActive('heading', { level: 1 })}
                >
                    <Heading1 className="size-3.5" />
                </ToolButton>
                <ToolButton
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                    active={editor.isActive('heading', { level: 2 })}
                >
                    <Heading2 className="size-3.5" />
                </ToolButton>
                <div className="mx-1 h-4 w-px bg-border" />
                <ToolButton
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    active={editor.isActive('bulletList')}
                >
                    <List className="size-3.5" />
                </ToolButton>
                <ToolButton
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    active={editor.isActive('orderedList')}
                >
                    <ListOrdered className="size-3.5" />
                </ToolButton>
            </div>
            <EditorContent editor={editor} />
        </div>
    );
}
