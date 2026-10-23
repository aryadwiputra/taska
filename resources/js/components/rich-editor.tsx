'use no memo';

import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { TableKit } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Code,
    Heading1,
    Heading2,
    Heading3,
    ImagePlus,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Strikethrough,
    Table as TableIcon,
    Underline as UnderlineIcon,
    Undo2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { uploadAttachment } from '@/lib/doc-attachments';
import { cn } from '@/lib/utils';

function ToolButton({
    onClick,
    active,
    disabled,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            title={title}
            disabled={disabled}
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

function Divider() {
    return <div className="mx-1 h-4 w-px shrink-0 bg-border" />;
}

interface Props {
    content: string;
    onChange: (html: string) => void;
    placeholder?: string;
    workspaceSlug?: string;
    projectSlug?: string;
    docSlug?: string;
}

export function RichEditor({
    content,
    onChange,
    placeholder,
    workspaceSlug,
    projectSlug,
    docSlug,
}: Props) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                link: false,
            }),
            Underline,
            Link.configure({
                openOnClick: false,
                autolink: true,
                HTMLAttributes: {
                    rel: 'noopener noreferrer',
                    target: '_blank',
                },
            }),
            Image.configure({ inline: false, allowBase64: false }),
            TableKit.configure({
                table: {
                    resizable: true,
                    HTMLAttributes: { class: 'doc-table' },
                },
            }),
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Placeholder.configure({
                placeholder: placeholder ?? t('docs.doc_content'),
            }),
        ],
        content,
        onUpdate: ({ editor }) => onChange(editor.getHTML()),
        editorProps: {
            attributes: {
                class: 'tiptap text-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
            },
        },
    });

    if (!editor) {
        return null;
    }

    const chain = () => editor.chain().focus();

    const setLink = () => {
        const previous = editor.getAttributes('link').href as
            | string
            | undefined;
        const url = window.prompt(t('docs.link_url'), previous ?? 'https://');

        if (url === null) {
            return;
        }

        if (url === '') {
            chain().unsetLink().run();

            return;
        }

        chain().setLink({ href: url }).run();
    };

    const handleImageSelect = async (file: File) => {
        if (!workspaceSlug || !projectSlug || !docSlug) {
            return;
        }

        setUploading(true);

        try {
            const attachment = await uploadAttachment(
                workspaceSlug,
                projectSlug,
                docSlug,
                file,
            );
            const src = attachment.url ?? attachment.preview_url;

            if (src) {
                chain().setImage({ src, alt: file.name }).run();
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
                <ToolButton
                    title={t('docs.undo')}
                    onClick={() => chain().undo().run()}
                    disabled={!editor.can().undo()}
                >
                    <Undo2 className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.redo')}
                    onClick={() => chain().redo().run()}
                    disabled={!editor.can().redo()}
                >
                    <Redo2 className="size-3.5" />
                </ToolButton>
                <Divider />
                <ToolButton
                    title={t('docs.bold')}
                    onClick={() => chain().toggleBold().run()}
                    active={editor.isActive('bold')}
                >
                    <Bold className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.italic')}
                    onClick={() => chain().toggleItalic().run()}
                    active={editor.isActive('italic')}
                >
                    <Italic className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.underline')}
                    onClick={() => chain().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                >
                    <UnderlineIcon className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.strike')}
                    onClick={() => chain().toggleStrike().run()}
                    active={editor.isActive('strike')}
                >
                    <Strikethrough className="size-3.5" />
                </ToolButton>
                <Divider />
                <ToolButton
                    title={t('docs.heading_1')}
                    onClick={() => chain().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                >
                    <Heading1 className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.heading_2')}
                    onClick={() => chain().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                >
                    <Heading2 className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.heading_3')}
                    onClick={() => chain().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                >
                    <Heading3 className="size-3.5" />
                </ToolButton>
                <Divider />
                <ToolButton
                    title={t('docs.bullet_list')}
                    onClick={() => chain().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                >
                    <List className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.ordered_list')}
                    onClick={() => chain().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                >
                    <ListOrdered className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.blockquote')}
                    onClick={() => chain().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                >
                    <Quote className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.code_block')}
                    onClick={() => chain().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                >
                    <Code className="size-3.5" />
                </ToolButton>
                <Divider />
                <ToolButton
                    title={t('docs.link')}
                    onClick={setLink}
                    active={editor.isActive('link')}
                >
                    <Link2 className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.insert_table')}
                    onClick={() =>
                        chain()
                            .insertTable({
                                rows: 3,
                                cols: 3,
                                withHeaderRow: true,
                            })
                            .run()
                    }
                >
                    <TableIcon className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={
                        uploading ? t('docs.uploading') : t('docs.insert_image')
                    }
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || !workspaceSlug}
                >
                    <ImagePlus className="size-3.5" />
                </ToolButton>
                <Divider />
                <ToolButton
                    title={t('docs.align_left')}
                    onClick={() => chain().setTextAlign('left').run()}
                    active={editor.isActive({ textAlign: 'left' })}
                >
                    <AlignLeft className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.align_center')}
                    onClick={() => chain().setTextAlign('center').run()}
                    active={editor.isActive({ textAlign: 'center' })}
                >
                    <AlignCenter className="size-3.5" />
                </ToolButton>
                <ToolButton
                    title={t('docs.align_right')}
                    onClick={() => chain().setTextAlign('right').run()}
                    active={editor.isActive({ textAlign: 'right' })}
                >
                    <AlignRight className="size-3.5" />
                </ToolButton>
                {editor.isActive('table') && (
                    <>
                        <Divider />
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => chain().addRowAfter().run()}
                        >
                            +{t('docs.row')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => chain().addColumnAfter().run()}
                        >
                            +{t('docs.column')}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs text-destructive"
                            onClick={() => chain().deleteTable().run()}
                        >
                            {t('docs.delete_table')}
                        </Button>
                    </>
                )}
            </div>
            <EditorContent editor={editor} />
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];

                    if (file) {
                        void handleImageSelect(file);
                    }

                    event.target.value = '';
                }}
            />
        </div>
    );
}
