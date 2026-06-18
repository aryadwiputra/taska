import { useEffect, useRef, useState } from 'react';

interface Member {
    id: number;
    name: string;
    avatar: string | null;
}

interface Props {
    value: string;
    onChange: (value: string) => void;
    members: Member[];
    placeholder?: string;
}

export function MentionInput({ value, onChange, members, placeholder }: Props) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [mentionIndex, setMentionIndex] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const normalizedQuery = mentionQuery?.toLowerCase() ?? '';
    const filteredMembers = normalizedQuery
        ? members.filter((m) => m.name.toLowerCase().includes(normalizedQuery))
        : members;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                textareaRef.current &&
                !textareaRef.current.contains(event.target as Node)
            ) {
                setMentionQuery(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const detectMention = (newValue: string, cursorPos: number) => {
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex !== -1) {
            const query = textBeforeCursor.slice(atIndex + 1);

            if (
                !query.includes(' ') &&
                !query.includes('\n') &&
                !query.includes('@')
            ) {
                setMentionQuery(query);
                setMentionIndex(-1);

                return;
            }
        }

        setMentionQuery(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        const cursorPos = e.target.selectionStart;
        detectMention(newValue, cursorPos);
    };

    const handleClick = () => {
        if (!textareaRef.current) {
            return;
        }

        const cursorPos = textareaRef.current.selectionStart;
        detectMention(value, cursorPos);
    };

    const insertMention = (member: Member) => {
        if (!textareaRef.current) {
            return;
        }

        const cursorPos = textareaRef.current.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPos);
        const atIndex = textBeforeCursor.lastIndexOf('@');

        if (atIndex === -1) {
            return;
        }

        const mentionText = member.name.replace(/\s+/g, '');
        const before = value.slice(0, atIndex);
        const after = value.slice(cursorPos);
        const newValue = `${before}@${mentionText} ${after}`;

        onChange(newValue);
        setMentionQuery(null);

        setTimeout(() => {
            if (textareaRef.current) {
                const newPos = atIndex + mentionText.length + 2;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (mentionQuery && filteredMembers.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex((prev) =>
                    Math.min(prev + 1, filteredMembers.length - 1),
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                if (
                    mentionIndex >= 0 &&
                    mentionIndex < filteredMembers.length
                ) {
                    e.preventDefault();
                    insertMention(filteredMembers[mentionIndex]);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setMentionQuery(null);
            }
        }
    };

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={handleChange}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                rows={3}
            />
            {mentionQuery && filteredMembers.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute left-0 z-50 mt-1 max-h-48 w-64 overflow-y-auto rounded-md border bg-popover shadow-elevated"
                >
                    {filteredMembers.slice(0, 8).map((member, index) => (
                        <button
                            key={member.id}
                            type="button"
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${index === mentionIndex ? 'bg-accent text-accent-foreground' : ''} hover:bg-accent hover:text-accent-foreground`}
                            onClick={() => insertMention(member)}
                            onMouseEnter={() => setMentionIndex(index)}
                        >
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span>{member.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
