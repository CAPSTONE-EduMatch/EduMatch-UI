import Button from '@/components/ui/Button'

interface CompletionStepProps {
	onGetStarted: () => void
}

export function CompletionStep({ onGetStarted }: CompletionStepProps) {
	return (
		<div className="space-y-6 text-center">
			<div>
				<h2 className="text-2xl font-bold text-primary mb-2">
					Profile Complete!
				</h2>
				<p className="text-muted-foreground">
					Your profile has been successfully created. You can now start using
					EduMatch.
				</p>
			</div>
			<Button onClick={onGetStarted} size="sm">
				Get Started
			</Button>
		</div>
	)
}
