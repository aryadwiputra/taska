import { router, useHttp } from '@inertiajs/react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { store as memberStore } from '@/routes/workspaces/members';

interface Props {
    workspaceSlug: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function WorkspaceMemberDialog({
    workspaceSlug,
    open,
    onOpenChange,
}: Props) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState('member');
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [searchResults, setSearchResults] = useState<
        Array<{ id: number; name: string; email: string }>
    >([]);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
        undefined,
    );

    const {
        get,
        processing: searching,
        setData,
    } = useHttp({
        q: '',
    });

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setSelectedUserId(null);
        setData('q', value);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (value.length < 2) {
            setSearchResults([]);

            return;
        }

        debounceRef.current = setTimeout(() => {
            get('/api/users/search', {
                onSuccess: (response) => {
                    setSearchResults(
                        response as Array<{
                            id: number;
                            name: string;
                            email: string;
                        }>,
                    );
                },
            });
        }, 300);
    };

    const handleAdd = () => {
        if (!selectedUserId) {
            return;
        }

        router.post(
            memberStore({ workspace: workspaceSlug }),
            { user_id: selectedUserId, role: selectedRole },
            {
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('members.add_member')}</DialogTitle>
                    <DialogDescription>
                        {t('members.invite_description')}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="member-search">{t('members.search_users')}</Label>
                        <Input
                            id="member-search"
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder={t('members.search_by_email')}
                        />
                    </div>

                    {searchTerm.length >= 2 && (
                        <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border">
                            {searching ? (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    {t('members.searching')}
                                </p>
                            ) : searchResults.length > 0 ? (
                                searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        className={cn(
                                            'flex flex-col gap-0.5 px-3 py-2 text-left transition-colors hover:bg-muted',
                                            selectedUserId === user.id &&
                                                'bg-muted',
                                        )}
                                        onClick={() =>
                                            setSelectedUserId(user.id)
                                        }
                                    >
                                        <span className="text-sm font-medium">
                                            {user.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {user.email}
                                        </span>
                                    </button>
                                ))
                            ) : (
                                <p className="px-3 py-2 text-sm text-muted-foreground">
                                    {t('members.no_users')}
                                </p>
                            )}
                        </div>
                    )}

                    {selectedUserId && (
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="member-role">{t('members.role')}</Label>
                            <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger id="member-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">{t('members.admin')}</SelectItem>
                                    <SelectItem value="manager">
                                        {t('members.manager')}
                                    </SelectItem>
                                    <SelectItem value="member">
                                        {t('members.member')}
                                    </SelectItem>
                                    <SelectItem value="viewer">
                                        {t('members.viewer')}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button onClick={handleAdd} disabled={!selectedUserId}>
                            {t('members.add_member')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
