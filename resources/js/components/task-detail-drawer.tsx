import type { RequestPayload } from '@inertiajs/core';
import { router, usePage } from '@inertiajs/react';
import {
    Activity,
    ChevronRight,
    Eye,
    EyeOff,
    ExternalLink,
    ListTree,
    Loader2,
    MessageSquare,
    Paperclip,
    Plus,
    Trash2,
    Upload,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AttachmentPreviewDialog } from '@/components/attachment-preview-dialog';
import { MentionInput } from '@/components/mention-autocomplete';
import { TaskComment } from '@/components/task-comment';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetTitle,
} from '@/components/ui/sheet';
import { useSocketEvent } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';
import {
    destroy as destroyTask,
    show as showTask,
    store as storeTask,
    update as updateTask,
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

interface TaskDetail {
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
    parent: {
        id: number;
        code: string;
        title: string;
    } | null;
    relations: Array<{
        id: number;
        type: string;
        related_task: {
            id: number;
            code: string;
            title: string;
        };
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
    available_parent_tasks: Array<{
        id: number;
        code: string;
        title: string;
    }>;
    project_tasks: Array<{
        id: number;
        code: string;
        title: string;
    }>;
}

interface Props {
    workspaceSlug: string | null;
    projectSlug: string | null;
    taskId: number | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onDelete?: () => void;
}

const priorityColors: Record<string, string> = {
    lowest: 'bg-gray-400 dark:bg-gray-500',
    low: 'bg-blue-400 dark:bg-blue-500',
    medium: 'bg-amber-400 dark:bg-amber-500',
    high: 'bg-orange-400 dark:bg-orange-500',
    highest: 'bg-red-400 dark:bg-red-500',
    urgent: 'bg-red-500 dark:bg-red-600',
};

export function TaskDetailDrawer({
    workspaceSlug,
    projectSlug,
    taskId,
    open,
    onOpenChange,
    onDelete,
}: Props) {
    const { t } = useTranslation();
    const user = usePage().props.auth?.user as { id: number } | null;
    const [loading, setLoading] = useState(false);
    const [task, setTask] = useState<TaskDetail | null>(null);
    const [options, setOptions] = useState<TaskOptions>({
        assignees: [],
        labels: [],
        epics: [],
        sprints: [],
        priorities: [],
        task_types: [],
        board_columns: [],
        available_parent_tasks: [],
        project_tasks: [],
    });
    const [comments, setComments] = useState<CommentItem[]>([]);
    const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [commentBody, setCommentBody] = useState('');
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [previewAttachment, setPreviewAttachment] =
        useState<AttachmentItem | null>(null);
    const [newRelationTaskId, setNewRelationTaskId] = useState<string>('none');
    const [newRelationType, setNewRelationType] =
        useState<string>('relates_to');
    const [subTaskTitle, setSubTaskTitle] = useState('');
    const [projectId, setProjectId] = useState<number | null>(null);
    const [typingUsers, setTypingUsers] = useState<
        Array<{ userId: number; name: string }>
    >([]);
    const typingTimersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
        new Map(),
    );
    const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
        null,
    );
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!open || !workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        /* eslint-disable react-hooks/set-state-in-effect */
        setLoading(true);
        setTask(null);
        setProjectId(null);
        setOptions({
            assignees: [],
            labels: [],
            epics: [],
            sprints: [],
            priorities: [],
            task_types: [],
            board_columns: [],
            available_parent_tasks: [],
            project_tasks: [],
        });
        setComments([]);
        setAttachments([]);
        setActivities([]);
        setTypingUsers([]);
        /* eslint-enable react-hooks/set-state-in-effect */

        fetch(
            showTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                signal: controller.signal,
            },
        )
            .then((r) => r.json())
            .then((data) => {
                setTask(data.task);
                setProjectId(data.task.project_id);

                setOptions(data.options);

                setComments(data.comments);

                setAttachments(data.attachments);

                setActivities(data.activities);
            })
            .catch((err: unknown) => {
                if ((err as Error)?.name !== 'AbortError') {
                    console.error(err);
                }
            })
            .finally(() => setLoading(false));

        return () => {
            controller.abort();
        };
    }, [open, taskId, workspaceSlug, projectSlug]);

    const refreshTaskDetails = () => {
        if (!workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        fetch(
            showTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
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
    };

    const patchTask = (
        payload: RequestPayload,
        optimisticTask?: TaskDetail,
    ) => {
        if (!workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        if (optimisticTask) {
            setTask(optimisticTask);
        }

        router.patch(
            updateTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            payload,
            { preserveScroll: true },
        );
    };

    const updateTaskDraft = (partial: Partial<TaskDetail>) => {
        setTask((current) => (current ? { ...current, ...partial } : current));
    };

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'comment.created',
        (e: { task_id: number; commentId: number; body: string }) => {
            if (e.task_id !== taskId || !user) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, taskId, user],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'task.field.updated',
        (e: { taskId: number }) => {
            if (e.taskId !== taskId) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'task.moved',
        (e: { taskId: number }) => {
            if (e.taskId !== taskId) {
                return;
            }

            refreshTaskDetails();
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'task.deleted',
        (e: { taskId: number }) => {
            if (e.taskId !== taskId) {
                return;
            }

            onOpenChange(false);
            setTask(null);
            onDelete?.();
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
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
            if (e.task_id !== taskId) {
                return;
            }

            const newItem: ActivityItem = {
                id: e.activity_id,
                action: e.action,
                field_name: e.field_name,
                old_value: e.old_value,
                new_value: e.new_value,
                created_at: e.timestamp,
                user: { id: e.user_id, name: e.user_name, avatar: null },
            };

            setActivities((prev) => [newItem, ...prev].slice(0, 20));
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'comment.updated',
        (e: { taskId: number; commentId: number; body: string }) => {
            if (e.taskId !== taskId) {
                return;
            }

            setComments((prev) =>
                prev.map((c) =>
                    c.id === e.commentId ? { ...c, body: e.body } : c,
                ),
            );
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'comment.deleted',
        (e: { taskId: number; commentId: number }) => {
            if (e.taskId !== taskId) {
                return;
            }

            setComments((prev) => prev.filter((c) => c.id !== e.commentId));
        },
        [projectId, taskId],
    );

    useSocketEvent(
        projectId ? `project.${projectId}` : '',
        'comment.typing',
        (e: { task_id: number; user_id: number; user_name: string }) => {
            if (e.task_id !== taskId || e.user_id === user?.id) {
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
        [projectId, taskId, user?.id],
    );

    const handleAssigneeToggle = (assignee: UserRef, checked: boolean) => {
        if (!task) {
            return;
        }

        const assignees = checked
            ? [...task.assignees, assignee]
            : task.assignees.filter((item) => item.id !== assignee.id);

        patchTask(
            { assignee_ids: assignees.map((item) => item.id) },
            { ...task, assignees },
        );
    };

    const handleLabelToggle = (
        label: TaskOptions['labels'][number],
        checked: boolean,
    ) => {
        if (!task) {
            return;
        }

        const labels = checked
            ? [...task.labels, label]
            : task.labels.filter((item) => item.id !== label.id);

        patchTask(
            { label_ids: labels.map((item) => item.id) },
            { ...task, labels },
        );
    };

    const handleEpicChange = (value: string) => {
        if (!task) {
            return;
        }

        const epics =
            value === 'none'
                ? []
                : options.epics.filter((item) => item.id === Number(value));

        patchTask(
            { epic_ids: epics.map((item) => item.id) },
            { ...task, epics },
        );
    };

    const handleSprintChange = (value: string) => {
        if (!task) {
            return;
        }

        const sprints =
            value === 'none'
                ? []
                : options.sprints.filter((item) => item.id === Number(value));

        patchTask(
            { sprint_ids: sprints.map((item) => item.id) },
            { ...task, sprints },
        );
    };

    const sendTypingPing = useCallback(() => {
        if (!workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        fetch(
            typingRoute.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            {
                method: 'POST',
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            },
        ).catch(() => {});
    }, [workspaceSlug, projectSlug, taskId]);

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

    const handleAddComment = (e: React.FormEvent) => {
        e.preventDefault();

        if (!commentBody.trim() || !workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        if (typingDebounceRef.current) {
            clearTimeout(typingDebounceRef.current);
        }

        router.post(
            storeComment.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
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
        if (!workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        router.patch(
            updateComment.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
                comment: commentId,
            }),
            { body },
            {
                preserveScroll: true,
                onSuccess: refreshTaskDetails,
            },
        );
    };

    const handleDeleteComment = (commentId: number) => {
        if (
            !workspaceSlug ||
            !projectSlug ||
            !taskId ||
            !confirm(t('task.delete_comment'))
        ) {
            return;
        }

        router.delete(
            destroyComment.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
                comment: commentId,
            }),
            {
                preserveScroll: true,
                onSuccess: refreshTaskDetails,
            },
        );
    };

    const handleUploadAttachment = (event: React.FormEvent) => {
        event.preventDefault();

        if (!attachmentFile || !workspaceSlug || !projectSlug || !taskId) {
            return;
        }

        router.post(
            storeAttachment.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            { file: attachmentFile },
            {
                forceFormData: true,
                preserveScroll: true,
                onSuccess: () => {
                    setAttachmentFile(null);
                    refreshTaskDetails();
                },
            },
        );
    };

    const handleDeleteAttachment = (attachmentId: number) => {
        if (
            !workspaceSlug ||
            !projectSlug ||
            !taskId ||
            !confirm(t('task.delete_attachment'))
        ) {
            return;
        }

        router.delete(
            destroyAttachment.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
                attachment: attachmentId,
            }),
            {
                preserveScroll: true,
                onSuccess: refreshTaskDetails,
            },
        );
    };

    const isWatchedByCurrentUser = () => {
        if (!task || !user) {
            return false;
        }

        return task.watchers.some((w) => w.id === user.id);
    };

    const handleWatcherToggle = () => {
        if (!workspaceSlug || !projectSlug || !taskId || !task) {
            return;
        }

        const currentlyWatching = isWatchedByCurrentUser();
        const newWatchers = currentlyWatching
            ? task.watchers.filter((w) => w.id !== user!.id)
            : [...task.watchers, user as unknown as UserRef];

        const optimisticWatcherCount = currentlyWatching
            ? task.watcher_count - 1
            : task.watcher_count + 1;

        setTask({
            ...task,
            watchers: newWatchers,
            watcher_count: Math.max(0, optimisticWatcherCount),
        });

        router.patch(
            updateTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            {
                watcher_ids: newWatchers.map((w) => w.id),
            },
            { preserveScroll: true },
        );
    };

    const handleParentChange = (value: string) => {
        if (!workspaceSlug || !projectSlug || !taskId || !task) {
            return;
        }

        const parentId = value === 'none' ? null : Number(value);
        const parent =
            value === 'none'
                ? null
                : (options.available_parent_tasks.find(
                      (item) => item.id === Number(value),
                  ) ?? null);

        patchTask(
            { parent_id: parentId },
            { ...task, parent_id: parentId, parent },
        );
    };

    const handleSubTaskToggle = (childId: number, completed: boolean) => {
        if (!workspaceSlug || !projectSlug || !task) {
            return;
        }

        router.patch(
            updateTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: childId,
            }),
            {
                completed_at: completed ? new Date().toISOString() : null,
            },
            { preserveScroll: true, onSuccess: refreshTaskDetails },
        );
    };

    const handleAddSubTask = (e: React.FormEvent) => {
        e.preventDefault();

        if (!subTaskTitle.trim() || !workspaceSlug || !projectSlug || !task) {
            return;
        }

        router.post(
            storeTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
            }),
            {
                title: subTaskTitle,
                task_type_id: options.task_types[0]?.id ?? 1,
                parent_id: task.id,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setSubTaskTitle('');
                    refreshTaskDetails();
                },
            },
        );
    };

    const handleAddRelation = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !workspaceSlug ||
            !projectSlug ||
            !taskId ||
            !task ||
            newRelationTaskId === 'none'
        ) {
            return;
        }

        router.post(
            storeRelation.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            {
                related_task_id: Number(newRelationTaskId),
                relation_type: newRelationType,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewRelationTaskId('none');
                    setNewRelationType('relates_to');
                    refreshTaskDetails();
                },
            },
        );
    };

    const handleRemoveRelation = (relationId: number) => {
        if (
            !workspaceSlug ||
            !projectSlug ||
            !taskId ||
            !task ||
            !confirm(t('task.remove_relation'))
        ) {
            return;
        }

        router.delete(
            destroyRelation.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
                relation: relationId,
            }),
            {
                preserveScroll: true,
                onSuccess: refreshTaskDetails,
            },
        );
    };

    const handleDeleteTask = () => {
        if (
            !workspaceSlug ||
            !projectSlug ||
            !taskId ||
            !confirm(t('task.delete_task'))
        ) {
            return;
        }

        router.delete(
            destroyTask.url({
                workspace: workspaceSlug,
                project: projectSlug,
                task: taskId,
            }),
            {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                    setTask(null);
                    onDelete?.();
                },
            },
        );
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[720px] max-w-[90vw] overflow-y-auto p-0 sm:max-w-[720px]">
                <SheetTitle className="sr-only">
                    {task ? task.title : t('task.task_details')}
                </SheetTitle>
                <SheetDescription className="sr-only">
                    {t('task.task_details_description')}
                </SheetDescription>
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : task ? (
                    <div className="flex flex-col">
                        <div className="border-b px-6 pt-8 pb-5">
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
                                            aria-label={t('task.aria_title')}
                                        />
                                    </div>
                                    <div className="flex shrink-0 gap-1">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                                if (
                                                    workspaceSlug &&
                                                    projectSlug &&
                                                    task
                                                ) {
                                                    window.open(
                                                        showTask.url({
                                                            workspace:
                                                                workspaceSlug,
                                                            project:
                                                                projectSlug,
                                                            task: task.id,
                                                        }),
                                                        '_blank',
                                                    );
                                                }
                                            }}
                                            aria-label={t(
                                                'task.aria_open_full_page',
                                            )}
                                        >
                                            <ExternalLink className="size-5" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive"
                                            onClick={handleDeleteTask}
                                            aria-label={t(
                                                'task.aria_delete_task',
                                            )}
                                        >
                                            <Trash2 className="size-5" />
                                        </Button>
                                    </div>
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
                                        <Badge
                                            key={sprint.id}
                                            variant="secondary"
                                        >
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
                        </div>

                        <div className="flex flex-col gap-6 px-6 py-4">
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
                                    placeholder={t('task.add_description')}
                                    className="mt-2 min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.status')}
                                    </Label>
                                    <Select
                                        value={String(
                                            task.board_column?.id ?? '',
                                        )}
                                        onValueChange={(value) => {
                                            const column =
                                                options.board_columns.find(
                                                    (item) =>
                                                        item.id ===
                                                        Number(value),
                                                );

                                            if (!column || !task.board_column) {
                                                return;
                                            }

                                            patchTask(
                                                { board_column_id: column.id },
                                                {
                                                    ...task,
                                                    status: column.status_key,
                                                    board_column: column,
                                                },
                                            );
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.board_columns.map(
                                                (column) => (
                                                    <SelectItem
                                                        key={column.id}
                                                        value={String(
                                                            column.id,
                                                        )}
                                                    >
                                                        {column.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.type')}
                                    </Label>
                                    <Select
                                        value={String(task.task_type.id)}
                                        onValueChange={(value) => {
                                            const taskType =
                                                options.task_types.find(
                                                    (item) =>
                                                        item.id ===
                                                        Number(value),
                                                );

                                            if (!taskType) {
                                                return;
                                            }

                                            patchTask(
                                                { task_type_id: taskType.id },
                                                {
                                                    ...task,
                                                    task_type: taskType,
                                                },
                                            );
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {options.task_types.map(
                                                (taskType) => (
                                                    <SelectItem
                                                        key={taskType.id}
                                                        value={String(
                                                            taskType.id,
                                                        )}
                                                    >
                                                        {taskType.name}
                                                    </SelectItem>
                                                ),
                                            )}
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
                                        onValueChange={(value) => {
                                            const priority =
                                                value === 'none'
                                                    ? null
                                                    : (options.priorities.find(
                                                          (item) =>
                                                              item.id ===
                                                              Number(value),
                                                      ) ?? null);

                                            patchTask(
                                                {
                                                    priority_id:
                                                        priority?.id ?? null,
                                                },
                                                { ...task, priority },
                                            );
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">
                                                {t('task.no_priority')}
                                            </SelectItem>
                                            {options.priorities.map(
                                                (priority) => (
                                                    <SelectItem
                                                        key={priority.id}
                                                        value={String(
                                                            priority.id,
                                                        )}
                                                    >
                                                        {priority.name}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.story_points')}
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={task.story_points ?? ''}
                                        placeholder="—"
                                        onChange={(event) => {
                                            const value =
                                                event.target.value === ''
                                                    ? null
                                                    : parseInt(
                                                          event.target.value,
                                                          10,
                                                      );
                                            updateTaskDraft({
                                                story_points: value,
                                            });
                                            patchTask({ story_points: value });
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.epic')}
                                    </Label>
                                    <Select
                                        value={
                                            task.epics[0]
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
                                                {t('task.no_epic')}
                                            </SelectItem>
                                            {options.epics.map((epic) => (
                                                <SelectItem
                                                    key={epic.id}
                                                    value={String(epic.id)}
                                                >
                                                    {epic.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.sprint')}
                                    </Label>
                                    <Select
                                        value={
                                            task.sprints[0]
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
                                                {t('task.no_sprint')}
                                            </SelectItem>
                                            {options.sprints.map((sprint) => (
                                                <SelectItem
                                                    key={sprint.id}
                                                    value={String(sprint.id)}
                                                >
                                                    {sprint.name}
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
                                                {t('task.no_parent')}
                                            </SelectItem>
                                            {options.available_parent_tasks.map(
                                                (parentTask) => (
                                                    <SelectItem
                                                        key={parentTask.id}
                                                        value={String(
                                                            parentTask.id,
                                                        )}
                                                    >
                                                        {parentTask.code}:{' '}
                                                        {parentTask.title}
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
                                        value={formatDateInput(task.start_date)}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value || null;
                                            updateTaskDraft({
                                                start_date: value,
                                            });
                                            patchTask({ start_date: value });
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.due_date')}
                                    </Label>
                                    <Input
                                        type="date"
                                        value={formatDateInput(task.due_date)}
                                        onChange={(event) => {
                                            const value =
                                                event.target.value || null;
                                            updateTaskDraft({
                                                due_date: value,
                                            });
                                            patchTask({ due_date: value });
                                        }}
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.reporter')}
                                    </Label>
                                    <p className="mt-1 text-sm">
                                        {task.reporter?.name ?? 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <ListTree className="size-4" />
                                    <h3 className="text-sm font-semibold">
                                        {t('task.sub_tasks')}
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {
                                            task.children.filter(
                                                (c) => c.completed_at,
                                            ).length
                                        }
                                        /{task.children.length}
                                    </span>
                                </div>

                                {task.children.length > 0 ? (
                                    <div className="mb-3 flex flex-col rounded-md border">
                                        {task.children.map((child) => (
                                            <div
                                                key={child.id}
                                                className="flex items-center gap-2 border-b px-3 py-2 last:border-0"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        !!child.completed_at
                                                    }
                                                    onChange={() =>
                                                        handleSubTaskToggle(
                                                            child.id,
                                                            !child.completed_at,
                                                        )
                                                    }
                                                    className="size-4 shrink-0 accent-primary"
                                                />
                                                <span
                                                    className={cn(
                                                        'min-w-0 flex-1 truncate text-sm',
                                                        child.completed_at &&
                                                            'text-muted-foreground line-through',
                                                    )}
                                                >
                                                    {child.code}: {child.title}
                                                </span>
                                                {child.priority && (
                                                    <div
                                                        className={cn(
                                                            'size-2 shrink-0 rounded-full',
                                                            priorityColors[
                                                                child.priority
                                                                    .key
                                                            ] ??
                                                                'bg-muted-foreground',
                                                        )}
                                                    />
                                                )}
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 text-muted-foreground"
                                                    onClick={() => {
                                                        onOpenChange(false);
                                                        window.setTimeout(
                                                            () => {
                                                                const event =
                                                                    new CustomEvent(
                                                                        'open-task',
                                                                        {
                                                                            detail: {
                                                                                taskId: child.id,
                                                                            },
                                                                        },
                                                                    );
                                                                window.dispatchEvent(
                                                                    event,
                                                                );
                                                            },
                                                            300,
                                                        );
                                                    }}
                                                >
                                                    <ChevronRight className="size-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        {t('task.no_sub_tasks')}
                                    </p>
                                )}

                                <form
                                    onSubmit={handleAddSubTask}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        value={subTaskTitle}
                                        onChange={(e) =>
                                            setSubTaskTitle(e.target.value)
                                        }
                                        placeholder={t('task.add_sub_task')}
                                        className="h-8 text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        size="sm"
                                        disabled={!subTaskTitle.trim()}
                                    >
                                        <Plus className="size-3" />
                                        <span>{t('common.add')}</span>
                                    </Button>
                                </form>
                            </div>

                            <Separator />

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.assignees')}
                                    </Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {options.assignees.map((assignee) => {
                                            const selected =
                                                task.assignees.some(
                                                    (item) =>
                                                        item.id === assignee.id,
                                                );

                                            return (
                                                <Button
                                                    key={assignee.id}
                                                    type="button"
                                                    variant={
                                                        selected
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAssigneeToggle(
                                                            assignee,
                                                            !selected,
                                                        )
                                                    }
                                                >
                                                    {assignee.name}
                                                </Button>
                                            );
                                        })}
                                        {options.assignees.length === 0 && (
                                            <span className="text-sm text-muted-foreground">
                                                {t('task.no_members')}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                        {t('task.labels')}
                                    </Label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {options.labels.map((label) => {
                                            const selected = task.labels.some(
                                                (item) => item.id === label.id,
                                            );

                                            return (
                                                <Button
                                                    key={label.id}
                                                    type="button"
                                                    variant={
                                                        selected
                                                            ? 'secondary'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        handleLabelToggle(
                                                            label,
                                                            !selected,
                                                        )
                                                    }
                                                >
                                                    <span
                                                        className="size-2 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                label.color ??
                                                                '#64748b',
                                                        }}
                                                    />
                                                    {label.name}
                                                </Button>
                                            );
                                        })}
                                        {options.labels.length === 0 && (
                                            <span className="text-sm text-muted-foreground">
                                                {t('task.no_labels')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs tracking-wider text-muted-foreground uppercase">
                                    {t('task.created')}
                                </Label>
                                <p className="mt-1 text-sm">
                                    {new Date(
                                        task.created_at,
                                    ).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <Paperclip className="size-4" />
                                    <h3 className="text-sm font-semibold">
                                        {t('task.attachments')}
                                    </h3>
                                </div>

                                <form
                                    onSubmit={handleUploadAttachment}
                                    className="mb-4 flex flex-col gap-2 sm:flex-row"
                                >
                                    <Input
                                        type="file"
                                        onChange={(event) =>
                                            setAttachmentFile(
                                                event.target.files?.[0] ?? null,
                                            )
                                        }
                                        className="text-sm"
                                    />
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={!attachmentFile}
                                    >
                                        <Upload className="size-4" />
                                        <span>{t('common.upload')}</span>
                                    </Button>
                                </form>

                                {attachments.length > 0 ? (
                                    <div className="flex flex-col rounded-md border">
                                        {attachments.map((attachment) => (
                                            <div
                                                key={attachment.id}
                                                className="flex items-center justify-between gap-3 border-b px-3 py-2 last:border-0"
                                            >
                                                <a
                                                    href={
                                                        attachment.download_url
                                                    }
                                                    className="min-w-0 flex-1"
                                                >
                                                    <span className="block truncate text-sm font-medium hover:underline">
                                                        {attachment.file_name}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatBytes(
                                                            attachment.file_size,
                                                        )}{' '}
                                                        {t('common.by')}{' '}
                                                        {
                                                            attachment.uploader
                                                                .name
                                                        }
                                                    </span>
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
                                                {attachment.is_previewable && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 text-muted-foreground"
                                                        onClick={() =>
                                                            setPreviewAttachment(
                                                                attachment,
                                                            )
                                                        }
                                                    >
                                                        <Eye className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t('task.no_attachments')}
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <ListTree className="size-4" />
                                    <h3 className="text-sm font-semibold">
                                        {t('task.relations')}
                                    </h3>
                                </div>

                                {task.relations.length > 0 ? (
                                    <div className="mb-3 flex flex-col rounded-md border">
                                        {task.relations.map((rel) => (
                                            <div
                                                key={rel.id}
                                                className="flex items-center gap-2 border-b px-3 py-2 last:border-0"
                                            >
                                                <span className="text-xs font-medium text-muted-foreground uppercase">
                                                    {rel.type.replace(
                                                        /_/g,
                                                        ' ',
                                                    )}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate text-sm">
                                                    {rel.related_task.code}:{' '}
                                                    {rel.related_task.title}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() =>
                                                        handleRemoveRelation(
                                                            rel.id,
                                                        )
                                                    }
                                                >
                                                    <X className="size-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mb-3 text-sm text-muted-foreground">
                                        {t('task.no_relations')}
                                    </p>
                                )}

                                <form
                                    onSubmit={handleAddRelation}
                                    className="flex flex-wrap items-end gap-2"
                                >
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                            {t('task.title')}
                                        </Label>
                                        <Select
                                            value={newRelationTaskId}
                                            onValueChange={setNewRelationTaskId}
                                        >
                                            <SelectTrigger className="h-8 w-40 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">
                                                    {t('task.select_task')}
                                                </SelectItem>
                                                {options.project_tasks
                                                    .filter(
                                                        (t) =>
                                                            t.id !== task.id &&
                                                            !task.relations.some(
                                                                (r) =>
                                                                    r
                                                                        .related_task
                                                                        .id ===
                                                                    t.id,
                                                            ),
                                                    )
                                                    .map((t) => (
                                                        <SelectItem
                                                            key={t.id}
                                                            value={String(t.id)}
                                                        >
                                                            {t.code}: {t.title}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <Label className="text-[10px] tracking-wider text-muted-foreground uppercase">
                                            {t('task.type')}
                                        </Label>
                                        <Select
                                            value={newRelationType}
                                            onValueChange={setNewRelationType}
                                        >
                                            <SelectTrigger className="h-8 w-28 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="relates_to">
                                                    {t('relation.relates_to')}
                                                </SelectItem>
                                                <SelectItem value="blocks">
                                                    {t('relation.blocks')}
                                                </SelectItem>
                                                <SelectItem value="duplicates">
                                                    {t('relation.duplicates')}
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        size="sm"
                                        disabled={newRelationTaskId === 'none'}
                                    >
                                        <Plus className="size-3" />
                                        <span>{t('common.add')}</span>
                                    </Button>
                                </form>
                            </div>

                            <Separator />

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <MessageSquare className="size-4" />
                                    <h3 className="text-sm font-semibold">
                                        {t('task.comments')}
                                    </h3>
                                </div>

                                <form
                                    onSubmit={handleAddComment}
                                    className="mb-4"
                                >
                                    <MentionInput
                                        value={commentBody}
                                        onChange={handleCommentInputChange}
                                        members={options.assignees}
                                        placeholder={t('task.write_comment')}
                                    />
                                    {typingUsers.length > 0 && (
                                        <p className="mt-1 text-xs text-muted-foreground italic">
                                            {typingUsers
                                                .map((u) => u.name)
                                                .join(', ')}{' '}
                                            typing...
                                        </p>
                                    )}
                                </form>

                                {comments.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {comments.map((comment) => (
                                            <TaskComment
                                                key={comment.id}
                                                comment={comment}
                                                currentUserId={user?.id ?? null}
                                                onUpdate={handleUpdateComment}
                                                onDelete={handleDeleteComment}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t('task.no_comments')}
                                    </p>
                                )}
                            </div>

                            <Separator />

                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <Activity className="size-4" />
                                    <h3 className="text-sm font-semibold">
                                        {t('task.activity')}
                                    </h3>
                                </div>

                                {activities.length > 0 ? (
                                    <div className="flex flex-col">
                                        {activities.map((item, i) => (
                                            <div
                                                key={item.id}
                                                className="flex items-start gap-3 py-2"
                                            >
                                                <div className="flex flex-col items-center gap-1 pt-0.5">
                                                    <div className="size-2 rounded-full bg-muted-foreground/30" />
                                                    {i <
                                                        activities.length -
                                                            1 && (
                                                        <div className="w-px flex-1 bg-border" />
                                                    )}
                                                </div>
                                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                    <p className="text-sm">
                                                        {item.user && (
                                                            <span className="font-medium">
                                                                {item.user.name}
                                                            </span>
                                                        )}{' '}
                                                        {formatAction(
                                                            item.action,
                                                            item.field_name,
                                                            item.old_value,
                                                            item.new_value,
                                                            t,
                                                        )}
                                                    </p>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTimeAgo(
                                                            item.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="py-4 text-center text-sm text-muted-foreground">
                                        {t('task.no_activity')}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-20">
                        <p className="text-sm text-muted-foreground">
                            {t('task.task_not_found')}
                        </p>
                    </div>
                )}
                <AttachmentPreviewDialog
                    open={previewAttachment !== null}
                    onOpenChange={(open) => {
                        if (!open) {
                            setPreviewAttachment(null);
                        }
                    }}
                    fileName={previewAttachment?.file_name ?? ''}
                    url={previewAttachment?.url ?? ''}
                    downloadUrl={previewAttachment?.download_url ?? ''}
                    isImage={previewAttachment?.is_image ?? false}
                    isPdf={previewAttachment?.is_pdf ?? false}
                />
            </SheetContent>
        </Sheet>
    );
}

function formatAction(
    action: string,
    field: string | null,
    oldVal: string | null,
    newVal: string | null,
    t: (key: string, options?: Record<string, unknown>) => string,
): string {
    switch (action) {
        case 'created':
            return t('task_activity.created');
        case 'status_changed':
            return t('task_activity.changed_status', {
                from: oldVal,
                to: newVal,
            });
        case 'priority_changed':
            return t('task_activity.changed_priority', {
                from: oldVal,
                to: newVal,
            });
        case 'due_date_changed':
            return t('task_activity.changed_due_date', {
                from: oldVal,
                to: newVal,
            });
        case 'parent_changed':
            return t('task_activity.changed_parent', {
                from: oldVal ?? 'none',
                to: newVal ?? 'none',
            });
        case 'assigned':
            return `${t('task_activity.assigned')} ${newVal}`;
        case 'unassigned':
            return `${t('task_activity.unassigned')} ${oldVal}`;
        case 'watcher_added':
            return `${t('task_activity.added_watcher')} ${newVal}`;
        case 'watcher_removed':
            return `${t('task_activity.removed_watcher')} ${oldVal}`;
        case 'relation_added':
            return `${t('task_activity.added')} ${newVal ?? 'relation'}`;
        case 'relation_removed':
            return t('task_activity.removed_relation');
        case 'epic_changed':
            return t('task_activity.changed_epic', {
                from: oldVal ?? 'none',
                to: newVal ?? 'none',
            });
        case 'sprint_changed':
            return t('task_activity.changed_sprint', {
                from: oldVal ?? 'none',
                to: newVal ?? 'none',
            });
        case 'updated':
            return field
                ? `${t('task_activity.updated')} ${field}`
                : t('task_activity.updated');
        default:
            return action.replace(/_/g, ' ');
    }
}

function formatDateInput(date: string | null): string {
    return date ? date.slice(0, 10) : '';
}

function formatBytes(bytes: number): string {
    if (bytes === 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(
        Math.floor(Math.log(bytes) / Math.log(1024)),
        units.length - 1,
    );

    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatTimeAgo(date: string): string {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) {
        return 'just now';
    }

    if (diffMins < 60) {
        return `${diffMins}m ago`;
    }

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }

    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
