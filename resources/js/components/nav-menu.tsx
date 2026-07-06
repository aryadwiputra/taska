import { useHasPermission } from '@/lib/permissions';
import type { NavItem } from '@/types';

export function useFilteredNavItems(items: NavItem[]): NavItem[] {
    const hasPermission = useHasPermission();

    return items.filter((item) => {
        if (!item.permission) {
            return true;
        }

        return hasPermission(item.permission);
    });
}
