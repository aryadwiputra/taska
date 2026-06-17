'use no memo';

import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { ReportsTab } from '@/components/reports-tab';
import { show as projectShow } from '@/routes/projects';

interface Props {
    workspace: { id: number; name: string; slug: string };
    project: {
        id: number;
        name: string;
        key: string;
        slug: string;
        color: string | null;
    };
}

export default function ReportsIndex({ workspace, project }: Props) {
    return (
        <>
            <Head title={`Reports — ${project.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto">
                <div className="flex items-center gap-4">
                    <Link
                        href={projectShow({
                            workspace: workspace.slug,
                            project: project.slug,
                        })}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        <span>{project.name}</span>
                    </Link>
                    <span className="text-sm text-muted-foreground">/</span>
                    <span className="text-sm font-medium">Reports</span>
                </div>

                <div className="mx-auto w-full max-w-4xl">
                    <div className="mb-6">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Reports
                        </h1>
                    </div>

                    <ReportsTab
                        workspaceSlug={workspace.slug}
                        projectSlug={project.slug}
                    />
                </div>
            </div>
        </>
    );
}
