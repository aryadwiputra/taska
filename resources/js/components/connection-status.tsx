import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/hooks/socket-context';

export function ConnectionStatus() {
    const { t } = useTranslation();
    const { connected } = useSocket();

    if (connected) {
        return null;
    }

    return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
            <WifiOff className="size-3 text-destructive" />
            <span>{t('connection.disconnected')}</span>
        </div>
    );
}
