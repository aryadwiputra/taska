import { router } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    destroy as githubDestroy,
    auth as githubAuth,
} from '@/routes/projects/github';

function GitHubIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
        </svg>
    );
}

interface GitHubIntegration {
    provider_user_id: string;
    metadata: {
        nickname: string;
        name: string;
        avatar: string | null;
    } | null;
}

interface Props {
    workspaceSlug: string;
    projectSlug: string;
    integration: GitHubIntegration | null;
}

export function GithubSettingsTab({
    workspaceSlug,
    projectSlug,
    integration,
}: Props) {
    const [disconnecting, setDisconnecting] = useState(false);
    const isConnected = integration !== null;
    const meta = integration?.metadata ?? null;

    function handleDisconnect() {
        if (!confirm('Disconnect GitHub from this project?')) {
            return;
        }

        setDisconnecting(true);
        router.delete(
            githubDestroy.url({
                workspace: workspaceSlug,
                project: projectSlug,
            }),
            {
                preserveScroll: true,
                onFinish: () => setDisconnecting(false),
            },
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <GitHubIcon className="size-8" />
                    <div>
                        <CardTitle>GitHub</CardTitle>
                        <CardDescription>
                            Connect your project to GitHub to link commits and
                            pull requests to tasks.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {isConnected ? (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3 rounded-md border p-3">
                            {meta?.avatar && (
                                <img
                                    src={meta.avatar}
                                    alt=""
                                    className="size-8 rounded-full"
                                />
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    {meta?.name ??
                                        meta?.nickname ??
                                        'Connected'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    @{meta?.nickname ?? 'unknown'}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="size-2 rounded-full bg-emerald-500" />
                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                    Connected
                                </span>
                            </div>
                        </div>

                        <div className="rounded-md border p-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                Webhook URL
                            </p>
                            <code className="block rounded bg-muted px-2 py-1.5 text-xs break-all">
                                {`${window.location.origin}/workspaces/${workspaceSlug}/projects/${projectSlug}/github/webhook`}
                            </code>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                                Add this URL to your GitHub repository webhooks
                                with the secret configured in your
                                <code className="mx-1 rounded bg-muted px-1">
                                    GITHUB_WEBHOOK_SECRET
                                </code>
                                environment variable.
                            </p>
                        </div>

                        <div className="rounded-md border p-3">
                            <p className="mb-2 text-xs font-medium text-muted-foreground">
                                How it works
                            </p>
                            <ul className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Push commits to your default branch with{' '}
                                    <code className="rounded bg-muted px-1">
                                        {workspaceSlug}-N
                                    </code>{' '}
                                    in the message to link to tasks.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Use{' '}
                                    <code className="rounded bg-muted px-1">
                                        closes PROJ-N
                                    </code>{' '}
                                    in commit messages to auto-complete tasks.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 size-1 shrink-0 rounded-full bg-muted-foreground" />
                                    Mention task codes in PR titles to link pull
                                    requests.
                                </li>
                            </ul>
                        </div>

                        <div>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={disconnecting}
                                onClick={handleDisconnect}
                            >
                                {disconnecting
                                    ? 'Disconnecting...'
                                    : 'Disconnect GitHub'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <Button type="button" variant="default" asChild>
                            <a
                                href={githubAuth.url({
                                    workspace: workspaceSlug,
                                    project: projectSlug,
                                })}
                                className="inline-flex items-center gap-2"
                            >
                                <GitHubIcon className="size-4" />
                                <span>Connect GitHub</span>
                            </a>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
