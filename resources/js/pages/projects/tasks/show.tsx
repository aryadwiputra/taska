'use no memo';

import type { RequestPayload } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Paperclip, Plus, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AttachmentPreviewDialog } from '@/components/attachment-preview-dialog';
import { BranchInfo } from '@/components/git-info';
import { MentionInput } from '@/components/mention-autocomplete';
import { PageHeader } from '@/components/page-header';
import { TaskComment } from '@/components/task-comment';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useSocketEvent } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';
import { show as projectShow } from '@/routes/projects';
import {
    destroy as destroyTask,
    store as storeTask,
    update as updateTask,
    show as taskShow,
} from '@/routes/projects/tasks';
import {
    destroy as destroyAttachment,
    store as storeAttachment,
} from '@/routes/projects/tasks/attachments';
import {
    destroy as destroyComment,
    store as storeComment,
    typing as typingRoute,
    update as updateComment,
} from '@/routes/projects/tasks/comments';
import {
    destroy as destroyRelation,
    store as storeRelation,
} from '@/routes/projects/tasks/relations';

interface UserRef {
    id: number;
    name: string;
    avatar: string | null;
}

interface TaskData {
    id: number;
    task_number: number;
    code: string;
    title: string;
    description: string | null;
    status: string;
    due_date: string | null;
    start_date: string | null;
    story_points: number | null;
    completed_at: string | null;
    parent_id: number | null;
    project_id: number;
    created_at: string;
    updated_at: string;
    priority: {
        id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    } | null;
    task_type: { id: number; name: string; key: string; color: string | null };
    reporter: UserRef | null;
    assignees: UserRef[];
    labels: Array<{
        id: number;
        name: string;
        slug: string;
        color: string | null;
    }>;
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    watchers: UserRef[];
    watcher_count: number;
    children: Array<{
        id: number;
        code: string;
        title: string;
        completed_at: string | null;
        priority: {
            id: number;
            name: string;
            key: string;
            level: number;
            color: string | null;
        } | null;
    }>;
    parent: { id: number; code: string; title: string } | null;
    relations: Array<{
        id: number;
        type: string;
        related_task: { id: number; code: string; title: string };
    }>;
}

interface CommentItem {
    id: number;
    body: string;
    created_at: string;
    edited_at: string | null;
    user: UserRef;
    replies: Array<{
        id: number;
        body: string;
        created_at: string;
        user: UserRef;
    }>;
}

interface ActivityItem {
    id: number;
    action: string;
    field_name: string | null;
    old_value: string | null;
    new_value: string | null;
    created_at: string;
    user: UserRef | null;
}

interface AttachmentItem {
    id: number;
    file_name: string;
    file_size: number;
    mime_type: string | null;
    url: string;
    download_url: string;
    is_previewable: boolean;
    is_image: boolean;
    is_pdf: boolean;
    created_at: string;
    uploader: UserRef;
}

interface TaskOptions {
    assignees: Array<UserRef & { email: string }>;
    labels: Array<{
        id: number;
        name: string;
        slug: string;
        color: string | null;
    }>;
    epics: Array<{
        id: number;
        name: string;
        color: string | null;
        status: string;
    }>;
    sprints: Array<{
        id: number;
        name: string;
        status: string;
        start_date: string | null;
        end_date: string | null;
    }>;
    priorities: Array<{
        id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    }>;
    task_types: Array<{
        id: number;
        name: string;
        key: string;
        color: string | null;
    }>;
    board_columns: Array<{
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    }>;
    available_parent_tasks: Array<{ id: number; code: string; title: string }>;
    project_tasks: Array<{ id: number; code: string; title: string }>;
}

interface Workspace {
    id: number;
    name: string;
    slug: string;
}

interface ProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
    color: string | null;
}

interface Props {
    workspace: Workspace;
    project: ProjectData;
    task: TaskData;
    comments: CommentItem[];
    attachments: AttachmentItem[];
    activities: ActivityItem[];
    options: TaskOptions;
    has_github_integration: boolean;
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-500',
    medium: 'bg-amber-500',
    high: 'bg-orange-500',
    highest: 'bg-red-500',
};

const relationLabels: Record<string, string> = {
    relates_to: 'task.relates_to',
    blocks: 'task.blocks',
    blocked_by: 'task.blocked_by',
    duplicates: 'task.duplicates',
};

export default function TaskShow({
    workspace,
    project,
    task: initialTask,
    comments: initialComments,
    attachments: initialAttachments,
    activities: initialActivities,
    options: initialOptions,
    has_github_integration,
}: Props) {
    const { t, i18n } = useTranslation();
    const { user } = usePage().props.auth as { user: { id: number } };
    const projectId = initialTask.project_id;

    const [task, setTask] = useState<TaskData>(initialTask);
    const [options, setOptions] = useState<TaskOptions>(initialOptions);
    const [comments, setComments] = useState<CommentItem[]>(initialComments);
    const [attachments, setAttachments] =
        useState<AttachmentItem[]>(initialAttachments);
    const [activities, setActivities] =
        useState<ActivityItem[]>(initialActivities);
    const [commentBody, setCommentBody] = useState('');
    const [showAttachmentDialog, setShowAttachmentDialog] = useState(false);
    const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState('');
    const [attachmentPreviewName, setAttachmentPreviewName] = useState('');
    const [attachmentPreviewDownloadUrl, setAttachmentPreviewDownloadUrl] =
        useState('');
    const [attachmentPreviewIsImage, setAttachmentPreviewIsImage] =
        useState(false);
    const [attachmentPreviewIsPdf, setAttachmentPreviewIsPdf] = useState(false);
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [taskDeleted, setTaskDeleted] = useState(false);
    const [typingUsers, setTypingUsers] = useState<
        Array<{ userId: number; name: string }>
    >([]);
    const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
        new Map(),
    );

    const refreshTaskDetails = useCallback(() => {
        fetch(
            taskShow.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        )
            .then((r) => r.json())
            .then((data) => {
                setTask(data.task);
                setOptions(data.options);
                setComments(data.comments);
                setAttachments(data.attachments);
                setActivities(data.activities);
            });
    }, [workspace.slug, project.slug, task.id]);

    const patchTask = (payload: RequestPayload, optimisticTask?: TaskData) => {
        if (optimisticTask) {
            setTask(optimisticTask);
        }

        router.patch(
            updateTask.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            payload,
            { preserveScroll: true },
        );
    };

    const updateTaskDraft = (partial: Partial<TaskData>) => {
        setTask((current) => ({ ...current, ...partial }));
    };

    const isWatchedByCurrentUser = () =>
        task.watchers.some((w) => w.id === user?.id);

    const handleWatcherToggle = () => {
        const watchers = isWatchedByCurrentUser()
            ? task.watchers.filter((w) => w.id !== user?.id)
            : [...task.watchers, { id: user?.id ?? 0, name: '', avatar: null }];
        patchTask(
            { watcher_ids: watchers.map((w) => w.id) },
            { ...task, watchers, watcher_count: watchers.length },
        );
    };

    const handleDeleteTask = () => {
        if (!confirm(t('task.delete_task'))) {
            return;
        }

        router.delete(
            destroyTask.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            {
                onSuccess: () =>
                    router.visit(
                        projectShow.url({
                            workspace: workspace.slug,
                            project: project.slug,
                        }),
                    ),
            },
        );
    };

    const handleAssigneeToggle = (assignee: UserRef, checked: boolean) => {
        const assignees = checked
            ? [...task.assignees, assignee]
            : task.assignees.filter((a) => a.id !== assignee.id);
        patchTask(
            { assignee_ids: assignees.map((a) => a.id) },
            { ...task, assignees },
        );
    };

    const handleLabelToggle = (
        label: TaskOptions['labels'][number],
        checked: boolean,
    ) => {
        const labels = checked
            ? [...task.labels, label]
            : task.labels.filter((l) => l.id !== label.id);
        patchTask({ label_ids: labels.map((l) => l.id) }, { ...task, labels });
    };

    const handleEpicChange = (value: string) => {
        const epics =
            value === 'none'
                ? []
                : options.epics.filter((e) => e.id === Number(value));
        patchTask({ epic_ids: epics.map((e) => e.id) }, { ...task, epics });
    };

    const handleSprintChange = (value: string) => {
        const sprints =
            value === 'none'
                ? []
                : options.sprints.filter((s) => s.id === Number(value));
        patchTask(
            { sprint_ids: sprints.map((s) => s.id) },
            { ...task, sprints },
        );
    };

    const handleStatusChange = (value: string) => {
        const column = options.board_columns.find(
            (c) => c.id === Number(value),
        );

        if (!column) {
            return;
        }

        patchTask(
            { board_column_id: column.id },
            { ...task, status: column.status_key, board_column: column },
        );
    };

    const handlePriorityChange = (value: string) => {
        const priority =
            value === 'none'
                ? null
                : (options.priorities.find((p) => p.id === Number(value)) ??
                  null);
        patchTask({ priority_id: priority?.id ?? null }, { ...task, priority });
    };

    const handleTaskTypeChange = (value: string) => {
        const taskType = options.task_types.find((t) => t.id === Number(value));

        if (!taskType) {
            return;
        }

        patchTask(
            { task_type_id: taskType.id },
            { ...task, task_type: taskType },
        );
    };

    const handleParentChange = (value: string) => {
        const parentId = value === 'none' ? null : Number(value);
        patchTask(
            { parent_id: parentId },
            {
                ...task,
                parent_id: parentId,
                parent: parentId
                    ? (options.available_parent_tasks.find(
                          (t) => t.id === parentId,
                      ) ?? null)
                    : null,
            },
        );
    };

    const handleSubtaskToggle = (childId: number, completed: boolean) => {
        router.patch(
            updateTask.url({
                workspace: workspace.slug,
                project: project.slug,
                task: childId,
            }),
            { completed_at: completed ? new Date().toISOString() : null },
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleAddSubtask = (title: string) => {
        if (!title.trim()) {
            return;
        }

        router.post(
            storeTask.url({ workspace: workspace.slug, project: project.slug }),
            {
                title,
                parent_id: task.id,
                task_type_id: task.task_type.id,
                priority_id: task.priority?.id ?? null,
                board_column_id: task.board_column.id,
            },
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentBody.trim()) {
            return;
        }

        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        router.post(
            storeComment.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            { body: commentBody },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentBody('');
                    refreshTaskDetails();
                },
            },
        );
    };

    const handleUpdateComment = (commentId: number, body: string) => {
        router.patch(
            updateComment.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
                comment: commentId,
            }),
            { body },
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (!confirm(t('task.delete_comment'))) {
            return;
        }

        router.delete(
            destroyComment.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
                comment: commentId,
            }),
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleAttachmentUpload = (files: FileList | null) => {
        if (!files?.length) {
            return;
        }

        for (const file of Array.from(files)) {
            const formData = new FormData();
            formData.append('file', file);
            router.post(
                storeAttachment.url({
                    workspace: workspace.slug,
                    project: project.slug,
                    task: task.id,
                }),
                formData,
            { preserveScroll: true, onSuccess: () => setTimeout(refreshTaskDetails, 100) },
            );
        }
    };

    const handleDeleteAttachment = (attachmentId: number) => {
        if (!confirm(t('task.delete_attachment'))) {
            return;
        }

        router.delete(
            destroyAttachment.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
                attachment: attachmentId,
            }),
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleAddRelation = (type: string, relatedTaskId: number) => {
        router.post(
            storeRelation.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            { relation_type: type, related_task_id: relatedTaskId },
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleDeleteRelation = (relationId: number) => {
        router.delete(
            destroyRelation.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
                relation: relationId,
            }),
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const sendTypingPing = useCallback(() => {
        fetch(
            typingRoute.url({
                workspace: workspace.slug,
                project: project.slug,
                task: task.id,
            }),
            {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            },
        ).catch(() => {});
    }, [workspace.slug, project.slug, task.id]);

    const handleCommentInputChange = useCallback(
        (value: string) => {
            setCommentBody(value);

            if (typingDebounceRef.current) {
                clearTimeout(typingDebounceRef.current);
            }

            typingDebounceRef.current = setTimeout(sendTypingPing, 1500);
        },
        [sendTypingPing],
    );

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) {
            return t('common.bytes', { count: bytes });
        }

        if (bytes < 1024 * 1024) {
            return t('common.kilobytes', { size: (bytes / 1024).toFixed(1) });
        }

        return t('common.megabytes', {
            size: (bytes / (1024 * 1024)).toFixed(1),
        });
    };

    const formatDate = (date: string | null) => {
        if (!date) {
            return t('common.none');
        }

        return new Date(date).toLocaleDateString(i18n.language, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatActivityValue = (value: string | null) => {
        if (!value) {
            return t('common.none');
        }

        try {
            const parsed = JSON.parse(value);

            if (typeof parsed === 'object' && parsed !== null) {
                if ('name' in parsed) {
                    return parsed.name;
                }

                if (Array.isArray(parsed)) {
                    return parsed.map((i) => i.name ?? i).join(', ');
                }
            }

            return String(parsed);
        } catch {
            return value;
        }
    };

    useSocketEvent(
        `project.${projectId}`,
        'comment.created',
        (e: { task_id: number }) => {
            if (e.task_id !== task.id || !user) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, task.id, user],
    );

    useSocketEvent(
        `project.${projectId}`,
        'task.field.updated',
        (e: { taskId: number }) => {
            if (e.taskId !== task.id) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, task.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'task.moved',
        (e: { taskId: number }) => {
            if (e.taskId !== task.id) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, task.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'activity.logged',
        (e: {
            task_id: number;
            activity_id: number;
            action: string;
            field_name: string | null;
            old_value: string | null;
            new_value: string | null;
            user_id: number;
            user_name: string;
            timestamp: string;
        }) => {
            if (e.task_id !== task.id) {
                return;
            }

            setActivities((prev) => [
                {
                    id: e.activity_id,
                    action: e.action,
                    field_name: e.field_name,
                    old_value: e.old_value,
                    new_value: e.new_value,
                    created_at: e.timestamp,
                    user: e.user_id
                        ? { id: e.user_id, name: e.user_name, avatar: null }
                        : null,
                },
                ...prev,
            ]);
        },
        [projectId, task.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'task.deleted',
        (e: { taskId: number }) => {
            if (e.taskId !== task.id) {
                return;
            }

            setTaskDeleted(true);
        },
        [projectId, task.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'comment.typing',
        (e: { task_id: number; user_id: number; user_name: string }) => {
            if (e.task_id !== task.id || e.user_id === user?.id) {
                return;
            }

            setTypingUsers((prev) => {
                if (prev.some((u) => u.userId === e.user_id)) {
                    return prev;
                }

                return [...prev, { userId: e.user_id, name: e.user_name }];
            });

            const existing = typingTimersRef.current.get(e.user_id);

            if (existing) {
                clearTimeout(existing);
            }

            typingTimersRef.current.set(
                e.user_id,
                setTimeout(() => {
                    setTypingUsers((prev) =>
                        prev.filter((u) => u.userId !== e.user_id),
                    );
                    typingTimersRef.current.delete(e.user_id);
                }, 4000),
            );
        },
        [projectId, task.id, user?.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'comment.updated',
        (e: { taskId: number; commentId: number; body: string }) => {
            if (e.taskId !== task.id) {
                return;
            }

            setComments((prev) =>
                prev.map((c) =>
                    c.id === e.commentId ? { ...c, body: e.body } : c,
                ),
            );
        },
        [projectId, task.id],
    );

    useSocketEvent(
        `project.${projectId}`,
        'comment.deleted',
        (e: { taskId: number; commentId: number }) => {
            if (e.taskId !== task.id) {
                return;
            }

            setComments((prev) => prev.filter((c) => c.id !== e.commentId));
        },
        [projectId, task.id],
    );

    return (
        <>
            <Head
                title={t('task.show_title', {
                    code: task.code,
                    project: project.name,
                })}
            />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <PageHeader
                    title={task.code}
                    description={project.name}
                    backHref={projectShow({
                        workspace: workspace.slug,
                        project: project.slug,
                    })}
                    backLabel={project.name}
                />

                <div className="mx-auto flex w-full max-w-6xl gap-8">
                    <div className="flex min-w-0 flex-1 flex-col gap-6">
                        <div className="flex flex-col gap-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <span className="font-mono text-xs text-muted-foreground">
                                        {task.code}
                                    </span>
                                    <Input
                                        value={task.title}
                                        onChange={(event) =>
                                            updateTaskDraft({
                                                title: event.target.value,
                                            })
                                        }
                                        onBlur={() =>
                                            patchTask({ title: task.title })
                                        }
                                        className="mt-1 h-auto border-0 bg-transparent px-0 py-0 text-lg font-semibold shadow-none focus-visible:ring-0"
                                        aria-label={t('task.show_title_aria')}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={handleDeleteTask}
                                    aria-label={t('task.delete_button_aria')}
                                >
                                    <Trash2 className="size-5" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {task.priority && (
                                    <Badge
                                        variant="outline"
                                        className="gap-1.5"
                                    >
                                        <div
                                            className={cn(
                                                'size-2 rounded-full',
                                                priorityColors[
                                                    task.priority.key
                                                ] ?? 'bg-muted-foreground',
                                            )}
                                        />
                                        {task.priority.name}
                                    </Badge>
                                )}
                                <Badge variant="secondary">
                                    {task.task_type.name}
                                </Badge>
                                <Badge
                                    variant="outline"
                                    className="font-mono text-xs"
                                >
                                    {task.board_column.name}
                                </Badge>
                                {task.epics.map((epic) => (
                                    <Badge
                                        key={epic.id}
                                        variant="outline"
                                        className="gap-1.5"
                                        style={{
                                            borderColor:
                                                epic.color ?? undefined,
                                            color: epic.color ?? undefined,
                                        }}
                                    >
                                        <span
                                            className="size-2 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    epic.color ?? '#64748b',
                                            }}
                                        />
                                        {epic.name}
                                    </Badge>
                                ))}
                                {task.sprints.map((sprint) => (
                                    <Badge key={sprint.id} variant="secondary">
                                        {sprint.name}
                                    </Badge>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    variant={
                                        isWatchedByCurrentUser()
                                            ? 'secondary'
                                            : 'outline'
                                    }
                                    size="sm"
                                    onClick={handleWatcherToggle}
                                    className="gap-1.5"
                                >
                                    {isWatchedByCurrentUser() ? (
                                        <Eye className="size-4" />
                                    ) : (
                                        <EyeOff className="size-4" />
                                    )}
                                    <span>
                                        {isWatchedByCurrentUser()
                                            ? t('task.watching')
                                            : t('task.watch')}
                                    </span>
                                    {task.watcher_count > 0 && (
                                        <span className="ml-0.5 text-muted-foreground">
                                            {task.watcher_count}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.description')}
                            </Label>
                            <textarea
                                value={task.description ?? ''}
                                onChange={(event) =>
                                    updateTaskDraft({
                                        description: event.target.value,
                                    })
                                }
                                onBlur={() =>
                                    patchTask({
                                        description: task.description ?? '',
                                    })
                                }
                                placeholder={t(
                                    'task.add_description_placeholder',
                                )}
                                className="mt-2 min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                            />
                        </div>

                        <div>
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.sub_tasks')}
                            </Label>
                            <div className="mt-2 flex flex-col gap-1">
                                {task.children.length > 0 ? (
                                    task.children.map((child) => (
                                        <div
                                            key={child.id}
                                            className="flex items-center gap-3 rounded-md border px-3 py-2"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    child.completed_at !== null
                                                }
                                                onChange={(e) =>
                                                    handleSubtaskToggle(
                                                        child.id,
                                                        e.target.checked,
                                                    )
                                                }
                                                className="size-4 shrink-0 rounded border-gray-300"
                                            />
                                            {child.priority && (
                                                <div
                                                    className={cn(
                                                        'size-2 shrink-0 rounded-full',
                                                        priorityColors[
                                                            child.priority.key
                                                        ] ??
                                                            'bg-muted-foreground',
                                                    )}
                                                />
                                            )}
                                            <Link
                                                href={taskShow.url({
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                    task: child.id,
                                                })}
                                                className={cn(
                                                    'min-w-0 flex-1 text-sm hover:underline',
                                                    child.completed_at &&
                                                        'text-muted-foreground line-through',
                                                )}
                                            >
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {child.code}
                                                </span>{' '}
                                                {child.title}
                                            </Link>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('task.no_sub_tasks')}
                                    </p>
                                )}
                                <SubtaskForm onAdd={handleAddSubtask} />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.attachments')}
                            </Label>
                            <div className="mt-2 flex flex-col gap-2">
                                {attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center gap-3 rounded-md border px-3 py-2"
                                    >
                                        <Paperclip className="size-4 shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <button
                                                type="button"
                                                className="text-sm hover:underline"
                                                onClick={() => {
                                                    if (
                                                        attachment.is_previewable
                                                    ) {
                                                        setAttachmentPreviewUrl(
                                                            attachment.url,
                                                        );
                                                        setAttachmentPreviewName(
                                                            attachment.file_name,
                                                        );
                                                        setAttachmentPreviewDownloadUrl(
                                                            attachment.download_url,
                                                        );
                                                        setAttachmentPreviewIsImage(
                                                            attachment.is_image,
                                                        );
                                                        setAttachmentPreviewIsPdf(
                                                            attachment.is_pdf,
                                                        );
                                                        setShowAttachmentDialog(
                                                            true,
                                                        );
                                                    } else {
                                                        window.open(
                                                            attachment.download_url,
                                                            '_blank',
                                                        );
                                                    }
                                                }}
                                            >
                                                {attachment.file_name}
                                            </button>
                                            <p className="text-xs text-muted-foreground">
                                                {formatFileSize(
                                                    attachment.file_size,
                                                )}{' '}
                                                ·{' '}
                                                {formatDate(
                                                    attachment.created_at,
                                                )}
                                            </p>
                                        </div>
                                        <a
                                            href={attachment.download_url}
                                            className="text-muted-foreground hover:text-foreground"
                                            download
                                        >
                                            <svg
                                                className="size-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                                />
                                            </svg>
                                        </a>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="size-8 text-muted-foreground hover:text-destructive"
                                            onClick={() =>
                                                handleDeleteAttachment(
                                                    attachment.id,
                                                )
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                ))}
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={(e) =>
                                            handleAttachmentUpload(
                                                e.target.files,
                                            )
                                        }
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        className="gap-1.5"
                                    >
                                        <Upload className="size-3.5" />{' '}
                                        {t('common.upload')}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.relations')}
                            </Label>
                            <div className="mt-2 flex flex-col gap-1">
                                {task.relations.length > 0 ? (
                                    task.relations.map((relation) => (
                                        <div
                                            key={relation.id}
                                            className="flex items-center gap-3 rounded-md border px-3 py-2"
                                        >
                                            <span className="text-xs text-muted-foreground">
                                                {t(
                                                    relationLabels[
                                                        relation.type
                                                    ] ?? relation.type,
                                                )}
                                            </span>
                                            <Link
                                                href={taskShow.url({
                                                    workspace: workspace.slug,
                                                    project: project.slug,
                                                    task: relation.related_task
                                                        .id,
                                                })}
                                                className="min-w-0 flex-1 text-sm hover:underline"
                                            >
                                                <span className="font-mono text-xs text-muted-foreground">
                                                    {relation.related_task.code}
                                                </span>{' '}
                                                {relation.related_task.title}
                                            </Link>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    handleDeleteRelation(
                                                        relation.id,
                                                    )
                                                }
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        {t('task.no_relations')}
                                    </p>
                                )}
                                <RelationForm
                                    projectTasks={options.project_tasks}
                                    onAdd={handleAddRelation}
                                    currentTaskId={task.id}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.comments', { count: comments.length })}
                            </Label>
                            <div className="mt-2 flex flex-col gap-4">
                                <form
                                    onSubmit={handleAddComment}
                                    className="flex gap-2"
                                >
                                    <div className="flex-1">
                                        <MentionInput
                                            value={commentBody}
                                            onChange={handleCommentInputChange}
                                            placeholder={t(
                                                'task.write_comment',
                                            )}
                                            members={options.assignees}
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={!commentBody.trim()}
                                    >
                                        {t('task.comment_button')}
                                    </Button>
                                </form>

                                {typingUsers.length > 0 && (
                                    <p className="text-xs text-muted-foreground italic">
                                        {typingUsers.length === 1
                                            ? t('task.typing_single', {
                                                  name: typingUsers[0].name,
                                              })
                                            : t('task.typing_plural', {
                                                  count: typingUsers.length,
                                              })}
                                    </p>
                                )}

                                {comments.map((comment) => (
                                    <TaskComment
                                        key={comment.id}
                                        comment={comment}
                                        currentUserId={user?.id}
                                        onUpdate={handleUpdateComment}
                                        onDelete={handleDeleteComment}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="hidden w-72 shrink-0 flex-col gap-6 md:flex">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.status')}
                                </Label>
                                <Select
                                    value={String(task.board_column.id)}
                                    onValueChange={handleStatusChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.board_columns.map((column) => (
                                            <SelectItem
                                                key={column.id}
                                                value={String(column.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="size-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                column.color ??
                                                                '#64748b',
                                                        }}
                                                    />
                                                    {column.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.type')}
                                </Label>
                                <Select
                                    value={String(task.task_type.id)}
                                    onValueChange={handleTaskTypeChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.task_types.map((type) => (
                                            <SelectItem
                                                key={type.id}
                                                value={String(type.id)}
                                            >
                                                {type.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.priority')}
                                </Label>
                                <Select
                                    value={
                                        task.priority
                                            ? String(task.priority.id)
                                            : 'none'
                                    }
                                    onValueChange={handlePriorityChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('common.none')}
                                        </SelectItem>
                                        {options.priorities.map((p) => (
                                            <SelectItem
                                                key={p.id}
                                                value={String(p.id)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={cn(
                                                            'size-2 rounded-full',
                                                            priorityColors[
                                                                p.key
                                                            ] ??
                                                                'bg-muted-foreground',
                                                        )}
                                                    />
                                                    {p.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.story_points')}
                                </Label>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={task.story_points ?? ''}
                                    onChange={(e) =>
                                        updateTaskDraft({
                                            story_points: e.target.value
                                                ? Number(e.target.value)
                                                : null,
                                        })
                                    }
                                    onBlur={() =>
                                        patchTask({
                                            story_points: task.story_points,
                                        })
                                    }
                                    placeholder={t('common.none')}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.sprint')}
                                </Label>
                                <Select
                                    value={
                                        task.sprints.length > 0
                                            ? String(task.sprints[0].id)
                                            : 'none'
                                    }
                                    onValueChange={handleSprintChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('common.none')}
                                        </SelectItem>
                                        {options.sprints.map((s) => (
                                            <SelectItem
                                                key={s.id}
                                                value={String(s.id)}
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.epic')}
                                </Label>
                                <Select
                                    value={
                                        task.epics.length > 0
                                            ? String(task.epics[0].id)
                                            : 'none'
                                    }
                                    onValueChange={handleEpicChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('common.none')}
                                        </SelectItem>
                                        {options.epics.map((e) => (
                                            <SelectItem
                                                key={e.id}
                                                value={String(e.id)}
                                            >
                                                {e.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.parent_task')}
                                </Label>
                                <Select
                                    value={
                                        task.parent_id
                                            ? String(task.parent_id)
                                            : 'none'
                                    }
                                    onValueChange={handleParentChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">
                                            {t('common.none')}
                                        </SelectItem>
                                        {options.available_parent_tasks.map(
                                            (t) => (
                                                <SelectItem
                                                    key={t.id}
                                                    value={String(t.id)}
                                                >
                                                    {t.code} {t.title}
                                                </SelectItem>
                                            ),
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.start_date')}
                                </Label>
                                <Input
                                    type="date"
                                    value={task.start_date ?? ''}
                                    onChange={(e) =>
                                        updateTaskDraft({
                                            start_date: e.target.value || null,
                                        })
                                    }
                                    onBlur={() =>
                                        patchTask({
                                            start_date: task.start_date,
                                        })
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.due_date')}
                                </Label>
                                <Input
                                    type="date"
                                    value={task.due_date ?? ''}
                                    onChange={(e) =>
                                        updateTaskDraft({
                                            due_date: e.target.value || null,
                                        })
                                    }
                                    onBlur={() =>
                                        patchTask({ due_date: task.due_date })
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.reporter')}
                                </Label>
                                {task.reporter ? (
                                    <div className="flex items-center gap-2">
                                        <Avatar className="size-6">
                                            <AvatarImage
                                                src={
                                                    task.reporter.avatar ??
                                                    undefined
                                                }
                                            />
                                            <AvatarFallback className="text-xs">
                                                {task.reporter.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm">
                                            {task.reporter.name}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm text-muted-foreground">
                                        {t('common.none')}
                                    </span>
                                )}
                            </div>

                            {has_github_integration && (
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.git_branch')}
                                    </Label>
                                    <BranchInfo
                                        task={task}
                                        project={project}
                                        workspace={workspace}
                                        hasIntegration={has_github_integration}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.assignees')}
                            </Label>
                            <div className="flex flex-wrap gap-1">
                                {task.assignees.map((assignee) => (
                                    <Button
                                        key={assignee.id}
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() =>
                                            handleAssigneeToggle(
                                                assignee,
                                                false,
                                            )
                                        }
                                    >
                                        <Avatar className="size-4">
                                            <AvatarImage
                                                src={
                                                    assignee.avatar ?? undefined
                                                }
                                            />
                                            <AvatarFallback className="text-[10px]">
                                                {assignee.name
                                                    .split(' ')
                                                    .map((n) => n[0])
                                                    .join('')}
                                            </AvatarFallback>
                                        </Avatar>
                                        {assignee.name} <X className="size-3" />
                                    </Button>
                                ))}
                            </div>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    const member = options.assignees.find(
                                        (a) => a.id === Number(value),
                                    );

                                    if (
                                        member &&
                                        !task.assignees.some(
                                            (a) => a.id === member.id,
                                        )
                                    ) {
                                        handleAssigneeToggle(member, true);
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8">
                                    <Plus className="mr-1 size-3" />
                                    <SelectValue
                                        placeholder={t('task.add_assignee')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.assignees
                                        .filter(
                                            (a) =>
                                                !task.assignees.some(
                                                    (ta) => ta.id === a.id,
                                                ),
                                        )
                                        .map((member) => (
                                            <SelectItem
                                                key={member.id}
                                                value={String(member.id)}
                                            >
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.labels')}
                            </Label>
                            <div className="flex flex-wrap gap-1">
                                {task.labels.map((label) => (
                                    <Badge
                                        key={label.id}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {label.color && (
                                            <div
                                                className="size-2 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        label.color,
                                                }}
                                            />
                                        )}
                                        {label.name}
                                        <button
                                            type="button"
                                            className="ml-0.5 text-muted-foreground hover:text-foreground"
                                            onClick={() =>
                                                handleLabelToggle(label, false)
                                            }
                                        >
                                            <X className="size-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                            <Select
                                value=""
                                onValueChange={(value) => {
                                    const label = options.labels.find(
                                        (l) => l.id === Number(value),
                                    );

                                    if (
                                        label &&
                                        !task.labels.some(
                                            (l) => l.id === label.id,
                                        )
                                    ) {
                                        handleLabelToggle(label, true);
                                    }
                                }}
                            >
                                <SelectTrigger className="h-8">
                                    <Plus className="mr-1 size-3" />
                                    <SelectValue
                                        placeholder={t('task.add_label')}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {options.labels
                                        .filter(
                                            (l) =>
                                                !task.labels.some(
                                                    (tl) => tl.id === l.id,
                                                ),
                                        )
                                        .map((label) => (
                                            <SelectItem
                                                key={label.id}
                                                value={String(label.id)}
                                            >
                                                {label.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                {t('task.created')}
                            </Label>
                            <span className="text-sm">
                                {formatDate(task.created_at)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mx-auto w-full max-w-6xl">
                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                        {t('task.activity')}
                    </Label>
                    <div className="mt-2 flex flex-col gap-3">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 text-sm"
                            >
                                <Avatar className="mt-0.5 size-6">
                                    <AvatarImage
                                        src={activity.user?.avatar ?? undefined}
                                    />
                                    <AvatarFallback className="text-[10px]">
                                        {activity.user?.name
                                            ?.split(' ')
                                            .map((n) => n[0])
                                            .join('') ?? '?'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                    <p>
                                        <span className="font-medium">
                                            {activity.user?.name ??
                                                t('common.system')}
                                        </span>{' '}
                                        {activity.action === 'created' &&
                                            t('task_activity.created')}
                                        {activity.action === 'updated' && (
                                            <>
                                                <span className="text-muted-foreground">
                                                    {t('task_activity.changed')}
                                                </span>{' '}
                                                <span className="font-medium">
                                                    {activity.field_name}
                                                </span>{' '}
                                                {t('task_activity.from')}{' '}
                                                <span className="text-muted-foreground">
                                                    {formatActivityValue(
                                                        activity.old_value,
                                                    )}
                                                </span>{' '}
                                                {t('task_activity.to')}{' '}
                                                <span className="text-muted-foreground">
                                                    {formatActivityValue(
                                                        activity.new_value,
                                                    )}
                                                </span>
                                            </>
                                        )}
                                        {activity.action === 'commented' &&
                                            t('task_activity.added_comment')}
                                        {activity.action === 'deleted' &&
                                            t('task_activity.deleted_item')}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(activity.created_at)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {showAttachmentDialog && (
                <AttachmentPreviewDialog
                    open={showAttachmentDialog}
                    onOpenChange={setShowAttachmentDialog}
                    url={attachmentPreviewUrl}
                    fileName={attachmentPreviewName}
                    downloadUrl={attachmentPreviewDownloadUrl}
                    isImage={attachmentPreviewIsImage}
                    isPdf={attachmentPreviewIsPdf}
                />
            )}

            <Dialog
                open={taskDeleted}
                onOpenChange={(open) => {
                    if (!open) {
                        router.visit(
                            projectShow.url({
                                workspace: workspace.slug,
                                project: project.slug,
                            }),
                        );
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {t('task.task_deleted_title')}
                        </DialogTitle>
                        <DialogDescription>
                            {t('task.task_deleted_description')}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end">
                        <Button
                            onClick={() =>
                                router.visit(
                                    projectShow.url({
                                        workspace: workspace.slug,
                                        project: project.slug,
                                    }),
                                )
                            }
                        >
                            {t('task.go_to_project')}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SubtaskForm({ onAdd }: { onAdd: (title: string) => void }) {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            return;
        }

        onAdd(title);
        setTitle('');
        setOpen(false);
    };

    if (!open) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start gap-1.5 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Plus className="size-3.5" /> {t('task.add_sub_task')}
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('task.sub_task_placeholder')}
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        setOpen(false);
                    }
                }}
            />
            <Button type="submit" size="sm" disabled={!title.trim()}>
                {t('common.add')}
            </Button>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
            >
                {t('common.cancel')}
            </Button>
        </form>
    );
}

function RelationForm({
    projectTasks,
    onAdd,
    currentTaskId,
}: {
    projectTasks: Array<{ id: number; code: string; title: string }>;
    onAdd: (type: string, relatedTaskId: number) => void;
    currentTaskId: number;
}) {
    const { t } = useTranslation();
    const [type, setType] = useState('relates_to');
    const [taskId, setTaskId] = useState('');
    const [open, setOpen] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!taskId) {
            return;
        }

        onAdd(type, Number(taskId));
        setTaskId('');
        setOpen(false);
    };

    if (!open) {
        return (
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-start gap-1.5 text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Plus className="size-3.5" /> {t('task.add_relation')}
            </Button>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-8">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="relates_to">
                        {t('relation.relates_to')}
                    </SelectItem>
                    <SelectItem value="blocks">
                        {t('relation.blocks')}
                    </SelectItem>
                    <SelectItem value="blocked_by">
                        {t('relation.blocked_by')}
                    </SelectItem>
                    <SelectItem value="duplicates">
                        {t('relation.duplicates')}
                    </SelectItem>
                </SelectContent>
            </Select>
            <Select value={taskId} onValueChange={setTaskId}>
                <SelectTrigger className="h-8">
                    <SelectValue placeholder={t('task.select_task')} />
                </SelectTrigger>
                <SelectContent>
                    {projectTasks
                        .filter((t) => t.id !== currentTaskId)
                        .map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                                {t.code} {t.title}
                            </SelectItem>
                        ))}
                </SelectContent>
            </Select>
            <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!taskId}>
                    {t('common.add')}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpen(false)}
                >
                    {t('common.cancel')}
                </Button>
            </div>
        </form>
    );
}
