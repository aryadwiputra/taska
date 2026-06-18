export interface BoardAssignee {
    id: number;
    name: string;
    avatar: string | null;
}

export interface BoardTaskItem {
    id: number;
    task_number: number;
    code: string;
    title: string;
    status: string;
    position: number;
    due_date: string | null;
    story_points: number | null;
    priority: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    } | null;
    task_type: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    };
    assignees: BoardAssignee[];
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
}

export interface BoardColumn {
    id: number;
    name: string;
    status_key: string;
    color: string | null;
    position: number;
    is_done_column: boolean;
    wip_limit: number | null;
    task_count: number;
    tasks: BoardTaskItem[];
}

export interface BoardWorkspace {
    id: number;
    name: string;
    slug: string;
}

export interface BoardProjectData {
    id: number;
    name: string;
    key: string;
    slug: string;
}

export interface BoardData {
    id: number;
    name: string;
    type: string;
    swimlane_field: string;
}

export interface BoardOption {
    id: number;
    name: string;
    type: string;
}
