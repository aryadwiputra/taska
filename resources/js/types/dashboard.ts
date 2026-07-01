export interface DashboardTask {
    id: number;
    code: string;
    title: string;
    status: string;
    priority_id: number | null;
    due_date: string | null;
    project: {
        id: number;
        name: string;
        key: string;
        color?: string | null;
    } | null;
}

export interface DashboardProject {
    id: number;
    name: string;
    key: string;
    color: string | null;
    tasks_count: number;
}

export interface DashboardDeadline {
    id: number;
    code: string;
    title: string;
    due_date: string;
    priority_id: number | null;
    project: {
        id: number;
        name: string;
        key: string;
    } | null;
}

export interface DashboardActivity {
    id: number;
    action: string;
    description: string | null;
    created_at: string;
}

export interface DashboardStats {
    assigned: number;
    overdue: number;
    activeProjects: number;
    upcomingDeadlines: number;
}

export interface MyTaskItem {
    id: number;
    code: string;
    title: string;
    status: string;
    due_date: string | null;
    completed_at: string | null;
    priority: {
        id: number;
        name: string;
        key: string;
        level: number;
        color: string | null;
    } | null;
    task_type: {
        id: number;
        name: string;
        key: string;
        color: string | null;
    };
    board_column: {
        id: number;
        name: string;
        status_key: string;
        color: string | null;
    };
    assignees: Array<{
        id: number;
        name: string;
        avatar: string | null;
    }>;
    project: {
        id: number;
        name: string;
        key: string;
        color: string | null;
        slug: string;
    };
    workspace: {
        id: number;
        name: string;
        slug: string;
    };
}

export interface WorkspaceProps {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
}

export interface CurrentWorkspaceProps {
    id: number;
    name: string;
    slug: string;
    logo: string | null;
    role: string;
    projects: Array<{
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
        userRole: string | null;
    }>;
}

declare global {
    interface PageProps {
        workspaces?: WorkspaceProps[];
        currentWorkspace?: CurrentWorkspaceProps | null;
    }
}
