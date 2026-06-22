import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store as invitationStore } from '@/routes/workspaces/invitations';

interface InviteEntry {
    id: number;
    email: string;
    role: string;
}

interface StepInviteProps {
    workspaceSlug: string;
    onSkip: () => void;
    onDone: () => void;
}

export function StepInvite({ workspaceSlug, onSkip, onDone }: StepInviteProps) {
    const { t } = useTranslation();
    const [invites, setInvites] = useState<InviteEntry[]>([]);
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('member');
    const [sending, setSending] = useState(false);

    const addInvite = () => {
        if (!email.trim()) {
            return;
        }

        setInvites([...invites, { id: Date.now(), email: email.trim(), role }]);
        setEmail('');
        setRole('member');
    };

    const removeInvite = (id: number) => {
        setInvites(invites.filter((i) => i.id !== id));
    };

    const sendInvites = async () => {
        setSending(true);

        try {
            for (const invite of invites) {
                const response = await fetch(
                    invitationStore.url({ workspace: workspaceSlug }),
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-XSRF-TOKEN': decodeURIComponent(
                                document.cookie.match(
                                    /XSRF-TOKEN=([^;]+)/,
                                )?.[1] ?? '',
                            ),
                        },
                        body: JSON.stringify({
                            email: invite.email,
                            role: invite.role,
                        }),
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to send invite');
                }
            }

            onDone();
        } catch {
            toast.error(t('error.something_went_wrong'));
        } finally {
            setSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('onboarding.invite_title')}</CardTitle>
                <CardDescription>
                    {t('onboarding.invite_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder={t(
                                'onboarding.invite_email_placeholder',
                            )}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addInvite();
                                }
                            }}
                            className="flex-1"
                        />
                        <Select value={role} onValueChange={setRole}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    {t('onboarding.admin')}
                                </SelectItem>
                                <SelectItem value="manager">
                                    {t('onboarding.manager')}
                                </SelectItem>
                                <SelectItem value="member">
                                    {t('onboarding.member')}
                                </SelectItem>
                                <SelectItem value="viewer">
                                    {t('onboarding.viewer')}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addInvite}
                            disabled={!email.trim()}
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>

                    {invites.length > 0 && (
                        <div className="flex flex-col gap-2">
                            {invites.map((invite) => (
                                <div
                                    key={invite.id}
                                    className="flex items-center justify-between rounded-md border px-3 py-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <span className="truncate text-sm">
                                            {invite.email}
                                        </span>
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            {invite.role}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-6"
                                        onClick={() => removeInvite(invite.id)}
                                    >
                                        <X className="size-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onSkip}
                            className="flex-1"
                        >
                            {t('common.skip')}
                        </Button>
                        <Button
                            type="button"
                            onClick={sendInvites}
                            disabled={invites.length === 0 || sending}
                            className="flex-1"
                        >
                            {sending
                                ? t('common.sending')
                                : t('onboarding.send_invites', {
                                      count: invites.length,
                                  })}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
