'use no memo';

import { useEffect, useState } from 'react';
import { embed as embedTask } from '@/routes/projects/tasks';
const TASK_REF_REGEX = /\/task:([A-Z]+-\d+)\b/g;

function escapeHtml(value: string) {
    return value.replace(/[&<>"']/g, (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[character] ?? character,
    );
}

interface TaskInfo {
    code: string;
    task_id: number;
    task_title: string;
    url: string;
}

interface Props {
    content: string;
    workspaceSlug: string;
}

export function TaskEmbedRenderer({ content, workspaceSlug }: Props) {
    const [taskMap, setTaskMap] = useState<Record<string, TaskInfo>>({});

    useEffect(() => {
        const matches = [...content.matchAll(TASK_REF_REGEX)].map((m) => m[1]);
        const uniqueCodes = [...new Set(matches)];

        if (uniqueCodes.length === 0) {
            return;
        }

        Promise.all(
            uniqueCodes.map((code) =>
                fetch(
                    embedTask.url({ workspace: workspaceSlug }, { query: { q: code } }),
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                )
                    .then((r) => r.json())
                    .then((data) => {
                        if (data.found) {
                            return [code, data] as [string, TaskInfo];
                        }

                        return [code, null] as [string, null];
                    })
                    .catch(() => [code, null] as [string, null]),
            ),
        ).then((results) => {
            const map: Record<string, TaskInfo> = {};

            for (const [code, info] of results) {
                if (info) {
                    map[code] = info;
                }

            }

            setTaskMap(map);
        });
    }, [content, workspaceSlug]);

    const htmlWithLinks = content.replace(
        TASK_REF_REGEX,
        (match, code) => {
            const info = taskMap[code];

            if (info) {
                return `<a href="${escapeHtml(info.url)}" class="doc-task-ref doc-task-ref--found" data-task-id="${info.task_id}">${match}</a>`;
            }

            return `<span class="doc-task-ref doc-task-ref--pending" data-task-code="${code}">${match}</span>`;
        },
    );

    if (Object.keys(taskMap).length === 0 && ![...content.matchAll(TASK_REF_REGEX)].length) {
        return (
            <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    }

    return (
        <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: htmlWithLinks }}
        />
    );
}
