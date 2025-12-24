import { Button } from '@/components/ui'
import Image from 'next/image'
import { ProfileFormData } from '@/services/profile/profile-service'
import { useTranslations } from 'next-intl'

interface RoleSelectionStepProps {
	formData: ProfileFormData
	onRoleSelect: (role: 'applicant' | 'institution') => void
	onNext: () => void
}

export function RoleSelectionStep({
	formData,
	onRoleSelect,
	onNext,
}: RoleSelectionStepProps) {
	const t = useTranslations('create_profile.role_selection')

	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-primary mb-2">{t('title')}</h2>
				<p className="text-muted-foreground max-w-md mx-auto">
					{t('subtitle')}
				</p>
			</div>

			<div className="space-y-4">
				<div
					className={`p-4 border rounded-lg cursor-pointer transition-colors ${
						formData.role === 'applicant'
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50'
					}`}
					onClick={() => onRoleSelect('applicant')}
				>
					<div className="flex items-center space-x-3">
						<div className="w-15 h-15 rounded-full bg-primary/10 flex items-center justify-center">
							<Image
								src="/image 14.svg"
								alt="Applicant"
								width={60}
								height={60}
							/>
						</div>
						<div>
							<h3 className="font-semibold">{t('applicant.title')}</h3>
							<p className="text-sm text-muted-foreground">
								{t('applicant.description')}
							</p>
						</div>
					</div>
				</div>

				<div
					className={`p-4 border rounded-lg cursor-pointer transition-colors ${
						formData.role === 'institution'
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50'
					}`}
					onClick={() => onRoleSelect('institution')}
				>
					<div className="flex items-center space-x-3">
						<div className="w-15 h-15 rounded-full bg-primary/10 flex items-center justify-center">
							<Image
								src="/image 13.svg"
								alt="Institution"
								width={60}
								height={60}
							/>
						</div>
						<div>
							<h3 className="font-semibold">{t('institution.title')}</h3>
							<p className="text-sm text-muted-foreground">
								{t('institution.description')}
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button onClick={onNext} disabled={!formData.role} size="sm">
					{t('next')}
				</Button>
			</div>
		</div>
	)
}
