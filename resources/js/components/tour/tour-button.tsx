import { HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { resetTourState, startTour } from '@/components/tour/use-dashboard-tour';
import { Button } from '@/components/ui/button';

export function TourButton() {
    const { t } = useTranslation();

    return (
        <Button
            size="icon"
            variant="outline"
            className="fixed bottom-6 right-6 z-50 size-10 shadow-lg"
            onClick={() => {
                resetTourState();
                startTour();
            }}
            title={t('tour.show_tour')}
        >
            <HelpCircle className="h-4 w-4" />
        </Button>
    );
}
