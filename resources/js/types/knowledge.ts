export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
    color: string;
    articles_count: number;
}

export interface Article {
    id: number;
    title: string;
    slug: string;
    content: string | null;
    views: number;
    status: 'draft' | 'published';
    published_at: string | null;
    author: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    category: {
        id: number;
        name: string;
        slug: string;
        color: string;
    } | null;
    attachments: ArticleAttachment[];
    created_at: string;
    updated_at: string;
}

export interface ArticleListItem {
    id: number;
    title: string;
    slug: string;
    views: number;
    status: 'draft' | 'published';
    published_at: string | null;
    author: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    category: {
        id: number;
        name: string;
        slug: string;
        color: string;
    } | null;
    created_at: string;
    updated_at: string;
}

export interface ArticleAttachment {
    id: number;
    file_name: string;
    mime_type: string | null;
    file_size: number;
    file_size_formatted: string;
    is_image: boolean;
    is_pdf: boolean;
    is_previewable: boolean;
    url: string;
    uploaded_by: {
        id: number;
        name: string;
        avatar: string | null;
    } | null;
    created_at: string;
}
