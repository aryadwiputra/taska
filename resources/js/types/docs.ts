export interface DocTreeItem {
    id: number;
    title: string;
    slug: string;
    parent_id: number | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
    author: { id: number; name: string; avatar: string | null } | null;
    children: DocTreeItem[];
}

export interface DocDetail extends DocTreeItem {
    content: string;
    project_id: number;
    breadcrumbs: Array<{ title: string; slug: string }>;
}

export interface DocForm {
    title: string;
    content: string;
    parent_id: number | null;
    slug: string;
}
