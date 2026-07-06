import { Filter, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface Props {
    search: string;
    onSearchChange: (value: string) => void;
    filterProject: string;
    onFilterChange: (value: string) => void;
    viewMode: 'matrix' | 'list';
    onViewModeChange: (mode: 'matrix' | 'list') => void;
    projects: Array<{ id: number; name: string; key: string }>;
}

export function UserAssignmentHeader({
    search,
    onSearchChange,
    filterProject,
    onFilterChange,
    viewMode,
    onViewModeChange,
    projects,
}: Props) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={t('members.search_users')}
                        className="pl-9"
                    />
                </div>
                <Select value={filterProject} onValueChange={onFilterChange}>
                    <SelectTrigger className="w-[140px]">
                        <Filter className="size-3.5" />
                        <SelectValue placeholder={t('common.filter')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">
                            {t('common.all')}
                        </SelectItem>
                        {projects.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                                {p.name}
                            </SelectItem>
                        ))}
                        <SelectItem value="unassigned">
                            {t('assignments.unassigned')}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <ToggleGroup
                type="single"
                value={viewMode}
                onValueChange={(v) => v && onViewModeChange(v as 'matrix' | 'list')}
                className="self-start"
            >
                <ToggleGroupItem value="matrix" className="h-8 text-xs">
                    Matrix
                </ToggleGroupItem>
                <ToggleGroupItem value="list" className="h-8 text-xs">
                    List
                </ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}
