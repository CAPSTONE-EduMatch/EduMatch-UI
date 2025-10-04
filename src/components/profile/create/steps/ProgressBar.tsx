interface ProgressBarProps {
	currentStep: number
	totalSteps?: number
	onStepClick?: (step: number) => void
}

export function ProgressBar({
	currentStep,
	totalSteps = 4,
	onStepClick,
}: ProgressBarProps) {
	const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

	return (
		<div className="flex items-center justify-center mb-8">
			<div className="flex items-center">
				{steps.map((step) => (
					<div key={step} className="flex items-center">
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium cursor-pointer transition-all duration-200 hover:scale-105 ${
								step <= currentStep
									? 'bg-primary text-primary-foreground hover:bg-primary/90'
									: 'bg-white text-muted-foreground border-2 border-gray-300 hover:border-primary hover:text-primary'
							}`}
							onClick={() => onStepClick?.(step)}
						>
							{step}
						</div>
						{step < totalSteps && (
							<div
								className={`w-16 h-0.5 ${step < currentStep ? 'bg-primary' : 'bg-gray-300'}`}
							/>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
