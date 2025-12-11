import { Button } from '@/components/ui'
import { useTranslations } from 'next-intl'

interface CompletionStepProps {
	onGetStarted: () => void
}

export function CompletionStep({ onGetStarted }: CompletionStepProps) {
	const t = useTranslations('create_profile.completion')

	return (
		<div className="space-y-6 text-center">
			<div>
				<h2 className="text-2xl font-bold text-primary mb-2">{t('title')}</h2>
				<p className="text-muted-foreground">{t('subtitle')}</p>
			</div>
			<Button onClick={onGetStarted} size="sm">
				{t('button')}
			</Button>
		</div>
	)
}
