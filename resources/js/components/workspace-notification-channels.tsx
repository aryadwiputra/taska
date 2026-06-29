import { router } from '@inertiajs/react';
import { MessageCircle, MessageSquare, Plus, Send, Trash2, Webhook } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { store, update as channelUpdate, destroy } from '@/routes/workspaces/settings/notification-channels';

interface NotificationChannelItem {
    id: number;
    driver: string;
    name: string;
    config: Record<string, string>;
    enabled: boolean;
}

interface Props {
    workspaceSlug: string;
    channels: NotificationChannelItem[];
}

const DRIVER_LABELS: Record<string, string> = {
    slack: 'Slack',
    discord: 'Discord',
    telegram: 'Telegram',
    webhook: 'Webhook',
};

const DRIVER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
    slack: MessageSquare,
    discord: MessageCircle,
    telegram: Send,
    webhook: Webhook,
};

function ChannelForm({
    driver,
    workspaceSlug,
    onClose,
}: {
    driver: string;
    workspaceSlug: string;
    onClose: () => void;
}) {
    const [name, setName] = useState('');
    const [config, setConfig] = useState<Record<string, string>>({});

    const configFields: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
        slack: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.slack.com/services/...' }],
        discord: [{ key: 'webhook_url', label: 'Webhook URL', placeholder: 'https://discord.com/api/webhooks/...' }],
        telegram: [
            { key: 'bot_token', label: 'Bot Token', placeholder: '123456:ABC-DEF1234gh' },
            { key: 'chat_id', label: 'Chat ID', placeholder: '-1001234567890' },
        ],
        webhook: [
            { key: 'url', label: 'Webhook URL', placeholder: 'https://example.com/webhook' },
            { key: 'secret', label: 'Secret (optional)', placeholder: '' },
        ],
    };

    const fields = configFields[driver] ?? [];

    const handleSubmit = () => {
        router.post(
            store({ workspace: workspaceSlug }),
            { driver, name, config },
            {
                preserveScroll: true,
                onSuccess: onClose,
            },
        );
    };

    return (
        <div className="space-y-3 rounded-md border p-4">
            <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={DRIVER_LABELS[driver]}
                />
            </div>
            {fields.map((field) => (
                <div key={field.key} className="flex flex-col gap-2">
                    <Label>{field.label}</Label>
                    <Input
                        value={config[field.key] ?? ''}
                        onChange={(e) =>
                            setConfig((prev) => ({ ...prev, [field.key]: e.target.value }))
                        }
                        placeholder={field.placeholder}
                    />
                </div>
            ))}
            <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleSubmit}>
                    Save
                </Button>
                <Button size="sm" variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}

export function WorkspaceNotificationChannels({ workspaceSlug, channels }: Props) {
    const { t } = useTranslation();
    const [adding, setAdding] = useState<string | null>(null);

    const handleToggle = (channel: NotificationChannelItem) => {
        router.put(
            channelUpdate({ workspace: workspaceSlug, channel: channel.id }),
            { enabled: !channel.enabled, name: channel.name, config: channel.config },
            { preserveScroll: true },
        );
    };

    const handleDelete = (channelId: number) => {
        if (!confirm('Remove this channel?')) return;

        router.delete(
            destroy({ workspace: workspaceSlug, channel: channelId }),
            { preserveScroll: true },
        );
    };

    const availableDrivers = ['slack', 'discord', 'telegram', 'webhook'].filter(
        (d) => !adding && !channels.some((c) => c.driver === d),
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Notification Channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    Configure external notification channels for this workspace.
                    Users can then enable/disable each channel in their notification preferences.
                </p>

                {channels.map((channel) => (
                    <div
                        key={channel.id}
                        className="flex items-center gap-3 rounded-md border px-4 py-3"
                    >
                        <div className="flex-1">
                            <p className="text-sm font-medium">{channel.name || DRIVER_LABELS[channel.driver]}</p>
                            <p className="text-xs text-muted-foreground">{DRIVER_LABELS[channel.driver]}</p>
                        </div>
                        <Switch
                            checked={channel.enabled}
                            onCheckedChange={() => handleToggle(channel)}
                        />
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => handleDelete(channel.id)}
                        >
                            <Trash2 className="size-4" />
                        </Button>
                    </div>
                ))}

                {adding && (
                    <ChannelForm
                        driver={adding}
                        workspaceSlug={workspaceSlug}
                        onClose={() => setAdding(null)}
                    />
                )}

                {availableDrivers.length > 0 && (
                    <>
                        <Separator />
                        <div className="flex flex-wrap gap-2">
                            {availableDrivers.map((driver) => {
                                const Icon = DRIVER_ICONS[driver];
                                return (
                                    <Button
                                        key={driver}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdding(driver)}
                                    >
                                        <Icon className="size-4" />
                                        <span className="ml-2">Add {DRIVER_LABELS[driver]}</span>
                                    </Button>
                                );
                            })}
                        </div>
                    </>
                )}

                {channels.length === 0 && !adding && (
                    <div className="flex flex-col items-center gap-2 py-8">
                        <Plus className="size-8 text-muted-foreground/40" />
                        <p className="text-sm text-muted-foreground">
                            No notification channels configured yet.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
