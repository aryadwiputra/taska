import { usePage } from '@inertiajs/react';
import { Camera } from 'lucide-react';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Auth } from '@/types';

const timezones = [
    'Asia/Jakarta',
    'Asia/Makassar',
    'Asia/Jayapura',
    'Asia/Singapore',
    'Asia/Kuala_Lumpur',
    'Asia/Bangkok',
    'Asia/Ho_Chi_Minh',
    'Asia/Manila',
    'Asia/Tokyo',
    'Asia/Seoul',
    'Asia/Shanghai',
    'Asia/Kolkata',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Pacific/Auckland',
    'Australia/Sydney',
];

const locales = [
    { value: 'id', label: 'Bahasa Indonesia' },
    { value: 'en', label: 'English' },
];

interface StepProfileProps {
    onSkip: () => void;
    onDone: () => void;
}

export function StepProfile({ onSkip, onDone }: StepProfileProps) {
    const { t } = useTranslation();
    const { auth } = usePage<{ auth: Auth }>().props;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setProcessing(true);

        const form = e.currentTarget;
        const formData = new FormData(form);

        try {
            const response = await fetch(ProfileController.update.url(), {
                method: 'PATCH',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': decodeURIComponent(
                        document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ?? '',
                    ),
                },
                body: formData,
            });

            if (response.ok) {
                onDone();
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('onboarding.profile_title')}</CardTitle>
                <CardDescription>
                    {t('onboarding.profile_description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={handleSubmit}
                    encType="multipart/form-data"
                    className="flex flex-col gap-4"
                >
                    <div className="flex flex-col items-center gap-4">
                        <button
                            type="button"
                            className="relative flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-muted-foreground/30 transition-colors hover:border-muted-foreground/50"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {avatarPreview ? (
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    className="size-full object-cover"
                                />
                            ) : (
                                <Camera className="size-6 text-muted-foreground" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            name="avatar_file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            {t('profile.click_to_upload')}
                        </p>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="timezone">{t('onboarding.timezone')}</Label>
                        <Select
                            defaultValue={auth.user.timezone ?? 'Asia/Jakarta'}
                            name="timezone"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                {timezones.map((tz) => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz.replace(/_/g, ' ')}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label htmlFor="locale">{t('onboarding.language')}</Label>
                        <Select
                            defaultValue={auth.user.locale ?? 'id'}
                            name="locale"
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                            <SelectContent>
                                {locales.map((loc) => (
                                    <SelectItem
                                        key={loc.value}
                                        value={loc.value}
                                    >
                                        {loc.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                            type="submit"
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? t('common.saving') : t('onboarding.save_profile')}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
