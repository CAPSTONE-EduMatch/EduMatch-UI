import { Button } from '@/components/ui'
import { useTranslations } from 'next-intl'

interface CompletionStepProps {
	onGetStarted: () => void
	role?: 'applicant' | 'institution'
}

export function CompletionStep({ onGetStarted, role }: CompletionStepProps) {
	const t = useTranslations('create_profile.completion')

	// Force English for institution profiles
	const isInstitution = role === 'institution'

	return (
		<div className="space-y-6 text-center">
			<div>
				<h2 className="text-2xl font-bold text-primary mb-2">
					{isInstitution ? 'Profile Complete!' : t('title')}
				</h2>
				<p className="text-muted-foreground">
					{isInstitution
						? 'Your profile has been successfully created. You can now start using EduMatch.'
						: t('subtitle')}
				</p>
			</div>
			<Button onClick={onGetStarted} size="sm">
				{isInstitution ? 'Get Started' : t('button')}
			</Button>
		</div>
	)
}
