import { Smartphone, Wifi, WifiOff } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    status as statusRoute,
    connect as connectRoute,
    disconnect as disconnectRoute,
} from '@/routes/workspaces/settings/whatsapp';

interface Props {
    workspaceSlug: string;
}

export function WhatsAppSettingsTab({ workspaceSlug }: Props) {
    const { t } = useTranslation();
    const [ready, setReady] = useState(false);
    const [qr, setQr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(() => {
        fetch(statusRoute.url({ workspace: workspaceSlug }))
            .then((r) => r.json())
            .then((data) => {
                setReady(data.ready);
                setQr(data.qr || null);
            })
            .catch(() => setReady(false))
            .finally(() => setLoading(false));
    }, [workspaceSlug]);

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 5000);

        return () => clearInterval(interval);
    }, [fetchStatus]);

    const handleConnect = () => {
        fetch(connectRoute.url({ workspace: workspaceSlug }), {
            method: 'POST',
            headers: {
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        }).then(fetchStatus);
    };

    const handleDisconnect = () => {
        fetch(disconnectRoute.url({ workspace: workspaceSlug }), {
            method: 'DELETE',
            headers: {
                'X-XSRF-TOKEN': decodeURIComponent(
                    document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                ),
            },
        }).then(fetchStatus);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Smartphone className="size-5" />
                    <CardTitle>{t('settings.whatsapp')}</CardTitle>
                </div>
                <CardDescription>
                    {t('settings.whatsapp_description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                        {t('settings.whatsapp_gateway')}:
                    </span>
                    {loading ? (
                        <span className="text-sm text-muted-foreground">
                            {t('common.loading')}
                        </span>
                    ) : ready ? (
                        <span className="inline-flex items-center gap-1 text-sm text-green-600">
                            <Wifi className="size-3.5" />
                            {t('common.connected')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                            <WifiOff className="size-3.5" />
                            {t('common.disconnected')}
                        </span>
                    )}
                </div>

                {!ready && qr && (
                    <div className="flex justify-center">
                        <img src={qr} alt="QR Code" className="size-48" />
                    </div>
                )}

                <div className="flex gap-3">
                    {!ready && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleConnect}
                        >
                            {t('settings.connect_whatsapp')}
                        </Button>
                    )}
                    {ready && (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={handleDisconnect}
                        >
                            {t('settings.disconnect_whatsapp')}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
