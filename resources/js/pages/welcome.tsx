import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle,
    GitBranch,
    LayoutGrid,
    ListTodo,
    Lock,
    Play,
    Shield,
    Users,
    Workflow,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppLogo from '@/components/app-logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard, home, login } from '@/routes';

const navItems = [
    { key: 'features', href: '#features' },
    { key: 'workflow', href: '#workflow' },
    { key: 'stack', href: '#stack' },
] as const;

const techLogos = [
    { name: 'Laravel', src: '/images/tech/laravel.svg', label: 'Laravel' },
    { name: 'React', src: '/images/tech/react.svg', label: 'React' },
    { name: 'TypeScript', src: '/images/tech/typescript.svg', label: 'TypeScript' },
    { name: 'MySQL', src: '/images/tech/mysql.svg', label: 'MySQL' },
] as const;

const featureCards = [
    {
        key: 'board',
        icon: LayoutGrid,
        className: 'md:col-span-7 md:row-span-2',
        highlight: true,
    },
    {
        key: 'backlog',
        icon: ListTodo,
        className: 'md:col-span-5',
        highlight: false,
    },
    {
        key: 'sprints',
        icon: Play,
        className: 'md:col-span-5',
        highlight: false,
    },
    {
        key: 'automation',
        icon: Workflow,
        className: 'md:col-span-4',
        highlight: false,
    },
    {
        key: 'releases',
        icon: GitBranch,
        className: 'md:col-span-4',
        highlight: false,
    },
    {
        key: 'reports',
        icon: Users,
        className: 'md:col-span-4',
        highlight: false,
    },
] as const;

const showcaseItems = [
    { key: 'board', image: 'board' },
    { key: 'sprint', image: 'sprint-report' },
    { key: 'timeline', image: 'timeline' },
    { key: 'workload', image: 'workload' },
    { key: 'releases', image: 'releases' },
    { key: 'goals', image: 'goals' },
] as const;

const workflowSteps = [{ key: 'plan' }, { key: 'build' }, { key: 'review' }, { key: 'ship' }] as const;

const stackItems = [
    { key: 'laravel', name: 'Laravel', description: 'Backend' },
    { key: 'react', name: 'React', description: 'Frontend' },
    { key: 'inertia', name: 'Inertia', description: 'Routing' },
    { key: 'typescript', name: 'TypeScript', description: 'Types' },
    { key: 'tailwind', name: 'Tailwind CSS', description: 'Styling' },
    { key: 'mysql', name: 'MySQL', description: 'Database' },
] as const;

const trustItems = [
    {
        key: 'roles',
        icon: Shield,
        title: 'Workspace roles',
        description: 'Define who can create projects, manage tasks, and configure settings.',
    },
    {
        key: 'approvals',
        icon: Lock,
        title: 'Approval gates',
        description: 'Require sign-off before tasks move through critical stages.',
    },
    {
        key: 'activity',
        icon: CheckCircle,
        title: 'Activity trail',
        description: 'Track every status change, comment, and decision made.',
    },
] as const;

export default function Welcome() {
    const { t } = useTranslation();
    const { auth } = usePage().props;
    const isSignedIn = Boolean(auth.user);
    const primaryHref = isSignedIn ? dashboard() : login();

    return (
        <>
            <Head title={t('welcome.title')} />

            <div className="min-h-dvh bg-background text-foreground">
                <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                    <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 md:px-6">
                        <Link
                            href={home()}
                            className="flex min-w-0 items-center gap-2"
                            aria-label={t('welcome.title')}
                        >
                            <AppLogo />
                        </Link>

                        <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
                            {navItems.map((item) => (
                                <a
                                    key={item.key}
                                    href={item.href}
                                    className="rounded-lg px-3 py-2 transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    {t(`welcome.nav.${item.key}`)}
                                </a>
                            ))}
                        </nav>

                        <div className="flex shrink-0 items-center gap-3">
                            <ThemeToggle />
                            {isSignedIn ? (
                                <Link
                                    href={dashboard()}
                                    className={cn(
                                        buttonVariants({ size: 'sm' }),
                                    )}
                                >
                                    {t('sidebar.dashboard')}
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className={cn(
                                        buttonVariants({ size: 'sm' }),
                                        'whitespace-nowrap',
                                    )}
                                >
                                    {t('auth.login')}
                                </Link>
                            )}
                        </div>
                    </div>
                </header>

                <main>
                    <section className="relative overflow-hidden px-4 py-16 md:px-6 md:py-24 lg:py-32">
                        <div className="mx-auto max-w-7xl">
                            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 lg:items-center">
                                <div className="flex flex-col gap-6">
                                    <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
                                        {t('welcome.hero_title')}
                                    </h1>
                                    <p className="text-base leading-relaxed text-muted-foreground md:text-lg lg:max-w-xl">
                                        {t('welcome.hero_description')}
                                    </p>

                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                                        <Link
                                            href={primaryHref}
                                            className={cn(
                                                buttonVariants({ size: 'lg' }),
                                                'gap-2',
                                            )}
                                        >
                                            {isSignedIn
                                                ? t('sidebar.dashboard')
                                                : t('welcome.primary_cta')}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                        {!isSignedIn && (
                                            <Link
                                                href={login()}
                                                className={cn(
                                                    buttonVariants({
                                                        variant: 'ghost',
                                                        size: 'lg',
                                                    }),
                                                )}
                                            >
                                                {t('welcome.secondary_cta')}
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                                        <img
                                            src="/images/hero-board-light.png"
                                            alt={t('welcome.hero_image_alt')}
                                            className="h-auto w-full dark:hidden"
                                            loading="eager"
                                        />
                                        <img
                                            src="/images/hero-board-dark.png"
                                            alt={t('welcome.hero_image_alt')}
                                            className="hidden h-auto w-full dark:block"
                                            loading="eager"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-border/50 bg-muted/30 px-4 py-10 md:px-6">
                        <div className="mx-auto max-w-7xl">
                            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:items-center">
                                <p className="text-sm text-muted-foreground lg:max-w-xs">
                                    {t('welcome.proof_description')}
                                </p>
                                <div className="flex flex-wrap items-center gap-6 md:gap-10">
                                    {techLogos.map((logo) => (
                                        <div
                                            key={logo.name}
                                            className="flex items-center gap-2 opacity-70 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
                                        >
                                            <img
                                                src={logo.src}
                                                alt={logo.label}
                                                className="size-6"
                                            />
                                            <span className="text-sm font-medium text-foreground">
                                                {logo.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="features" className="px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-2xl">
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                                    {t('welcome.features_title')}
                                </h2>
                                <p className="mt-4 text-base text-muted-foreground">
                                    {t('welcome.features_description')}
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-12">
                                {featureCards.map((card) => {
                                    const Icon = card.icon;

                                    return (
                                        <article
                                            key={card.key}
                                            className={cn(
                                                'group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-sm',
                                                card.className,
                                            )}
                                        >
                                            <div className="flex h-full flex-col justify-between gap-6">
                                                <Icon
                                                    className={cn(
                                                        'size-8 text-primary transition-transform group-hover:-translate-y-1',
                                                        card.highlight && 'text-primary',
                                                    )}
                                                />
                                                <div className="space-y-3">
                                                    <h3 className="text-lg font-semibold tracking-tight">
                                                        {t(
                                                            `welcome.features.${card.key}.title`,
                                                        )}
                                                    </h3>
                                                    <p className="text-sm leading-relaxed text-muted-foreground">
                                                        {t(
                                                            `welcome.features.${card.key}.description`,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section id="showcase" className="px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-2xl">
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                                    {t('welcome.showcase_title')}
                                </h2>
                                <p className="mt-4 text-base text-muted-foreground">
                                    {t('welcome.showcase_description')}
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {showcaseItems.map((item) => (
                                    <figure
                                        key={item.key}
                                        className="overflow-hidden rounded-xl border border-border bg-card"
                                    >
                                        <img
                                            src={`/images/showcase/${item.image}-light.png`}
                                            alt={t(
                                                `welcome.showcase.${item.key}.title`,
                                            )}
                                            className="h-auto w-full border-b border-border dark:hidden"
                                            loading="lazy"
                                        />
                                        <img
                                            src={`/images/showcase/${item.image}-dark.png`}
                                            alt={t(
                                                `welcome.showcase.${item.key}.title`,
                                            )}
                                            className="hidden h-auto w-full border-b border-border dark:block"
                                            loading="lazy"
                                        />
                                        <figcaption className="p-5">
                                            <p className="text-base font-semibold">
                                                {t(
                                                    `welcome.showcase.${item.key}.title`,
                                                )}
                                            </p>
                                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                                {t(
                                                    `welcome.showcase.${item.key}.description`,
                                                )}
                                            </p>
                                        </figcaption>
                                    </figure>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="workflow" className="bg-muted/30 px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 text-center">
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                                    {t('welcome.workflow_title')}
                                </h2>
                                <p className="mt-4 text-base text-muted-foreground">
                                    {t('welcome.workflow_description')}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {workflowSteps.map((step, index) => (
                                    <div
                                        key={step.key}
                                        className="rounded-xl border border-border bg-card p-5"
                                    >
                                        <div className="mb-4 flex size-10 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
                                            <span className="text-base font-semibold">
                                                {index + 1}
                                            </span>
                                        </div>
                                        <p className="text-base font-semibold">
                                            {t(
                                                `welcome.workflow_steps.${step.key}.title`,
                                            )}
                                        </p>
                                        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                                            {t(
                                                `welcome.workflow_steps.${step.key}.description`,
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="stack" className="px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-2xl">
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                                    {t('welcome.stack_title')}
                                </h2>
                                <p className="mt-4 text-base text-muted-foreground">
                                    {t('welcome.stack_description')}
                                </p>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {stackItems.map((item) => (
                                    <div
                                        key={item.key}
                                        className="rounded-xl border border-border bg-card p-5"
                                    >
                                        <p className="text-base font-semibold">
                                            {item.name}
                                        </p>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {t(`welcome.stack.${item.key}`)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="border-y border-border/50 bg-muted/30 px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="mb-12 max-w-2xl">
                                <h2 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                                    {t('welcome.trust_title')}
                                </h2>
                                <p className="mt-4 text-base text-muted-foreground">
                                    {t('welcome.trust_description')}
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                {trustItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <article
                                            key={item.key}
                                            className="rounded-xl border border-border bg-card p-6"
                                        >
                                            <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                                <Icon className="size-5 text-primary" />
                                            </div>
                                            <h3 className="text-lg font-semibold">
                                                {t(`welcome.trust.${item.key}.title`)}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                                {t(`welcome.trust.${item.key}.description`)}
                                            </p>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>
                    </section>

                    <section className="px-4 py-16 md:px-6 md:py-24">
                        <div className="mx-auto max-w-7xl">
                            <div className="rounded-2xl border border-border bg-slate-900 px-8 py-12 text-white md:px-12 md:py-16">
                                <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
                                    <div>
                                        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                                            {t('welcome.final_title')}
                                        </h2>
                                        <p className="mt-4 text-base text-slate-300">
                                            {t('welcome.final_description')}
                                        </p>
                                    </div>
                                    <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                                        <Link
                                            href={primaryHref}
                                            className={cn(
                                                buttonVariants({ size: 'lg' }),
                                                'bg-white text-slate-900 hover:bg-slate-100',
                                            )}
                                        >
                                            {isSignedIn
                                                ? t('sidebar.dashboard')
                                                : t('welcome.primary_cta')}
                                            <ArrowRight className="size-4" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-border/50 px-4 py-8 md:px-6">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-muted-foreground md:flex-row">
                        <div className="flex items-center gap-2">
                            <AppLogo />
                            <span>Taska</span>
                        </div>
                        <p>{t('welcome.footer.copyright', { year: new Date().getFullYear() })}</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
