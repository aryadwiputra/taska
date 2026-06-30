import { Form, Head } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';
import NotificationPreferenceController from '@/actions/App/Http/Controllers/Settings/NotificationPreferenceController';
import Heading from '@/components/heading';
import { Button } from '@/components/ui/button';
import { edit } from '@/routes/notifications';

interface ChannelInfo {
    key: string;
    name: string;
    label: string;
}

interface NotificationPreference {
    label: string;
    channels: Record<string, boolean>;
}

type Props = {
    preferences: Record<string, NotificationPreference>;
    channels: ChannelInfo[];
};

export default function NotificationSettings({ preferences, channels }: Props) {
    const { t } = useTranslation();

    return (
        <>
            <Head title={t('settings.notifications')} />

            <h1 className="sr-only">{t('settings.notifications')}</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title={t('settings.notifications')}
                    description={t('settings.manage_notifications_description')}
                />

                <Form
                    action={NotificationPreferenceController.update.url()}
                    method="put"
                    options={{
                        preserveScroll: true,
                    }}
                >
                    {({ processing }) => (
                        <>
                            <div className="overflow-hidden overflow-x-auto rounded-lg border">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left font-medium">
                                                {t('settings.event')}
                                            </th>
                                            {channels.map((ch) => (
                                                <th
                                                    key={ch.key}
                                                    className="px-3 py-3 text-center font-medium"
                                                >
                                                    {ch.name}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(preferences).map(
                                            ([type, pref]) => (
                                                <tr
                                                    key={type}
                                                    className="border-b last:border-b-0"
                                                >
                                                    <td className="px-4 py-3">
                                                        {pref.label}
                                                    </td>
                                                    {channels.map((ch) => (
                                                        <td
                                                            key={ch.key}
                                                            className="px-3 py-3 text-center"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                name={`preferences[${type}][channels][${ch.key}]`}
                                                                defaultChecked={
                                                                    pref
                                                                        .channels[
                                                                        ch.key
                                                                    ] ?? true
                                                                }
                                                                value="1"
                                                                className="size-4 rounded border-gray-300"
                                                            />
                                                        </td>
                                                    ))}
                                                </tr>
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-notifications-button"
                                >
                                    {t('common.save')}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}

NotificationSettings.layout = {
    breadcrumbs: [
        {
            title: 'Notification settings',
            href: edit(),
        },
    ],
};
