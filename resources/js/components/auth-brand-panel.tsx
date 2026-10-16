import { useTranslation } from 'react-i18next';
import AppLogoIcon from '@/components/app-logo-icon';

/**
 * Left-hand brand panel for the split auth layout.
 *
 * Holds the identity (mark, name, tagline) so the form column keeps a single
 * focal point. Hidden below `lg`, where the layout collapses to the form
 * alone. The three bars at the foot repeat the symbol's own geometry: the
 * top bar is the frame, the two below it are active work.
 */
export default function AuthBrandPanel() {
    const { t } = useTranslation();

    return (
        <div className="relative hidden h-full flex-col justify-between bg-[#0F172A] p-12 lg:flex">
            <div className="flex items-center gap-2.5">
                <AppLogoIcon className="size-8 text-white" />
                <span className="text-lg font-semibold tracking-[-0.02em] text-white">
                    Taska
                </span>
            </div>

            <div className="max-w-md">
                <p className="text-3xl leading-[1.15] font-semibold tracking-[-0.035em] text-balance text-white">
                    {t('auth.panel_headline')}
                </p>
                <p className="mt-4 text-base leading-7 text-[#CBD5E1]">
                    {t('auth.panel_support')}
                </p>
            </div>

            <div className="flex flex-col gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-40 rounded-full bg-white/90" />
                <span className="h-2.5 w-16 rounded-full bg-[#2B94FF]" />
                <span className="h-2.5 w-16 rounded-full bg-[#2B94FF]/55" />
            </div>
        </div>
    );
}
