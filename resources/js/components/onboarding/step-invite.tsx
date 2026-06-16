import { Plus, X } from 'lucide-react';
import { useState } from 'react';
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

        for (const invite of invites) {
            await fetch(invitationStore.url({ workspace: workspaceSlug }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body: JSON.stringify({
                    email: invite.email,
                    role: invite.role,
                }),
            });
        }

        setSending(false);
        onDone();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invite your team</CardTitle>
                <CardDescription>
                    Collaborate with your team members. You can skip this and
                    invite later.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="colleague@example.com"
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
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="member">Member</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
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
                            Skip
                        </Button>
                        <Button
                            type="button"
                            onClick={sendInvites}
                            disabled={invites.length === 0 || sending}
                            className="flex-1"
                        >
                            {sending
                                ? 'Sending...'
                                : `Send ${invites.length} invite${invites.length !== 1 ? 's' : ''}`}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
