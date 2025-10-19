import { Button } from '@/components/ui'
import Image from 'next/image'
import { ProfileFormData } from '@/lib/profile-service'

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
	return (
		<div className="space-y-6">
			<div className="text-center">
				<h2 className="text-2xl font-bold text-primary mb-2">
					Choose your role
				</h2>
				<p className="text-muted-foreground max-w-md mx-auto">
					Select whether you&apos;re looking for educational opportunities or
					representing an educational institution.
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
							<h3 className="font-semibold">Applicant</h3>
							<p className="text-sm text-muted-foreground">
								I&apos;m a student or professional looking for educational
								opportunities, courses, or programs.
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
							<h3 className="font-semibold">Institution</h3>
							<p className="text-sm text-muted-foreground">
								I represent a school, university, or educational organization
								offering programs and courses.
							</p>
						</div>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<Button onClick={onNext} disabled={!formData.role} size="sm">
					Next
				</Button>
			</div>
		</div>
	)
}
