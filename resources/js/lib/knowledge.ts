import type {
    Category,
    Article,
    ArticleAttachment,
} from '@/types/knowledge';

function getCsrfToken(): string {
    return decodeURIComponent(
        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
    );
}

async function apiFetch<T>(
    url: string,
    options: RequestInit = {},
): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-XSRF-TOKEN': getCsrfToken(),
            Accept: 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Request failed');
    }

    return response.json();
}

export async function getCategories(
    workspaceSlug: string,
): Promise<{ categories: Category[] }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/categories`,
    );
}

export async function createCategory(
    workspaceSlug: string,
    data: { name: string; description?: string; icon?: string; color?: string },
): Promise<{ category: Category }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/categories`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
}

export async function updateCategory(
    workspaceSlug: string,
    categoryId: number,
    data: Partial<{ name: string; description: string; icon: string; color: string; sort_order: number }>,
): Promise<{ category: Category }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/categories/${categoryId}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
        },
    );
}

export async function deleteCategory(
    workspaceSlug: string,
    categoryId: number,
): Promise<{ message: string }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/categories/${categoryId}`,
        {
            method: 'DELETE',
        },
    );
}

export async function getArticles(
    workspaceSlug: string,
    params?: {
        category?: string;
        status?: string;
        author?: number;
        from_date?: string;
        to_date?: string;
        page?: number;
    },
): Promise<{ data: Article[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const searchParams = new URLSearchParams();

    if (params?.category) searchParams.set('category', params.category);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.author) searchParams.set('author', String(params.author));
    if (params?.from_date) searchParams.set('from_date', params.from_date);
    if (params?.to_date) searchParams.set('to_date', params.to_date);
    if (params?.page) searchParams.set('page', String(params.page));

    const queryString = searchParams.toString();
    const url = `/api/workspaces/${workspaceSlug}/knowledge/articles${queryString ? `?${queryString}` : ''}`;

    return apiFetch(url);
}

export async function searchArticles(
    workspaceSlug: string,
    params?: {
        q?: string;
        category?: string;
        author?: number;
        from_date?: string;
        to_date?: string;
        page?: number;
    },
): Promise<{ data: Article[]; meta: { current_page: number; last_page: number; per_page: number; total: number } }> {
    const searchParams = new URLSearchParams();

    if (params?.q) searchParams.set('q', params.q);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.author) searchParams.set('author', String(params.author));
    if (params?.from_date) searchParams.set('from_date', params.from_date);
    if (params?.to_date) searchParams.set('to_date', params.to_date);
    if (params?.page) searchParams.set('page', String(params.page));

    const queryString = searchParams.toString();
    const url = `/api/workspaces/${workspaceSlug}/knowledge/articles/search${queryString ? `?${queryString}` : ''}`;

    return apiFetch(url);
}

export async function getArticle(
    workspaceSlug: string,
    articleSlug: string,
): Promise<{ article: Article }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}`,
    );
}

export async function createArticle(
    workspaceSlug: string,
    data: {
        title: string;
        content?: string;
        category_id?: number;
        status?: 'draft' | 'published';
    },
): Promise<{ article: Partial<Article> }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles`,
        {
            method: 'POST',
            body: JSON.stringify(data),
        },
    );
}

export async function updateArticle(
    workspaceSlug: string,
    articleSlug: string,
    data: Partial<{
        title: string;
        content: string;
        category_id: number | null;
        status: 'draft' | 'published';
    }>,
): Promise<{ article: Partial<Article> }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}`,
        {
            method: 'PATCH',
            body: JSON.stringify(data),
        },
    );
}

export async function deleteArticle(
    workspaceSlug: string,
    articleSlug: string,
): Promise<{ message: string }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}`,
        {
            method: 'DELETE',
        },
    );
}

export async function getAttachments(
    workspaceSlug: string,
    articleSlug: string,
): Promise<{ attachments: ArticleAttachment[] }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}/attachments`,
    );
}

export async function uploadAttachment(
    workspaceSlug: string,
    articleSlug: string,
    file: File,
): Promise<{ attachment: ArticleAttachment }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}/attachments`,
        {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-XSRF-TOKEN': getCsrfToken(),
            },
            body: formData,
        },
    );

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || data.errors?.file?.[0] || 'Upload failed');
    }

    return response.json();
}

export async function deleteAttachment(
    workspaceSlug: string,
    articleSlug: string,
    attachmentId: number,
): Promise<{ message: string }> {
    return apiFetch(
        `/api/workspaces/${workspaceSlug}/knowledge/articles/${articleSlug}/attachments/${attachmentId}`,
        {
            method: 'DELETE',
        },
    );
}
