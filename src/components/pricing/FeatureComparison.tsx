import { Check, X } from 'lucide-react'

export function FeatureComparison() {
	const features = [
		{
			name: 'Account registration & OTP verification',
			free: true,
			standard: true,
			premium: true,
		},
		{
			name: 'Create & update personal profile (GPA, skills, research topic, etc.)',
			free: true,
			standard: true,
			premium: true,
		},
		{
			name: 'Basic scholarship, program & research group search',
			free: true,
			standard: true,
			premium: true,
		},
		{
			name: 'View scholarship details & requirements',
			free: true,
			standard: true,
			premium: true,
		},
		{
			name: 'Receive deadline reminders for saved scholarships/programs',
			free: true,
			standard: true,
			premium: true,
		},
		{
			name: 'Send messages to scholarship staff / professors',
			free: false,
			standard: true,
			premium: true,
		},
		{
			name: 'See matching score for scholarships / research groups',
			free: false,
			standard: false,
			premium: true,
		},
		{
			name: 'Basic recommendations (rule-based)',
			free: false,
			standard: false,
			premium: true,
		},
		{
			name: 'Advanced AI Matching',
			free: false,
			standard: false,
			premium: true,
		},
		{
			name: 'Search scholarships with natural language input',
			free: false,
			standard: false,
			premium: true,
		},
		{
			name: 'Unlimited applications',
			free: false,
			standard: false,
			premium: true,
		},
		{
			name: 'Unlimited messaging',
			free: false,
			standard: false,
			premium: true,
		},
	]

	const planHeaders = [
		{ name: 'Free', price: '$0', period: 'monthly' },
		{ name: 'Standard', price: '$99', period: 'monthly' },
		{ name: 'Premium', price: '$199', period: 'monthly' },
	]

	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-7xl mx-auto">
				{/* Section Header */}
				<div className="text-center mb-12">
					<h2
						className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6 opacity-0 animate-fadeInUp"
						style={{ animationDelay: '200ms' }}
					>
						Compare Plans
					</h2>
					<p
						className="text-lg text-[#676767] max-w-3xl mx-auto opacity-0 animate-fadeInUp"
						style={{ animationDelay: '400ms' }}
					>
						Choose the plan that best fits your scholarship hunting needs and
						budget.
					</p>
				</div>

				{/* Desktop Comparison Table */}
				<div
					className="hidden md:block bg-[#FBFBFB] rounded-3xl p-8 lg:p-12 opacity-0 animate-fadeInUp"
					style={{ animationDelay: '600ms' }}
				>
					{/* Plan Headers */}
					<div className="grid grid-cols-4 gap-4 mb-8 border-b border-gray-200 pb-6">
						<div className="flex items-end">
							<span className="text-lg font-semibold text-black">Features</span>
						</div>
						{planHeaders.map((plan, index) => (
							<div
								key={index}
								className="text-center opacity-0 animate-slideInLeft"
								style={{ animationDelay: `${800 + index * 100}ms` }}
							>
								<h3 className="text-xl font-bold text-black mb-2">
									{plan.name}
								</h3>
								<div className="text-2xl font-bold text-black">
									{plan.price}
								</div>
								<div className="text-sm text-[#A2A2A2]">/{plan.period}</div>
							</div>
						))}
					</div>

					{/* Feature Rows */}
					<div className="space-y-4">
						{features.map((feature, index) => (
							<div
								key={index}
								className="grid grid-cols-4 gap-4 py-4 border-b border-gray-100 last:border-b-0 opacity-0 animate-fadeInUp hover:bg-white transition-colors duration-200"
								style={{ animationDelay: `${1200 + index * 50}ms` }}
							>
								<div className="flex items-center">
									<span className="text-sm text-black font-medium">
										{feature.name}
									</span>
								</div>
								<div className="flex justify-center">
									{feature.free ? (
										<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
											<Check className="w-4 h-4 text-green-600" />
										</div>
									) : (
										<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
											<X className="w-4 h-4 text-gray-400" />
										</div>
									)}
								</div>
								<div className="flex justify-center">
									{feature.standard ? (
										<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
											<Check className="w-4 h-4 text-green-600" />
										</div>
									) : (
										<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
											<X className="w-4 h-4 text-gray-400" />
										</div>
									)}
								</div>
								<div className="flex justify-center">
									{feature.premium ? (
										<div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
											<Check className="w-4 h-4 text-green-600" />
										</div>
									) : (
										<div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
											<X className="w-4 h-4 text-gray-400" />
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Mobile Layout */}
				<div className="md:hidden space-y-6">
					{planHeaders.map((plan, planIndex) => (
						<div key={planIndex} className="bg-[#FBFBFB] rounded-3xl p-6">
							<div className="text-center mb-6 pb-6 border-b border-gray-200">
								<h3 className="text-xl font-bold text-black mb-2">
									{plan.name}
								</h3>
								<div className="text-2xl font-bold text-black">
									{plan.price}
								</div>
								<div className="text-sm text-[#A2A2A2]">/{plan.period}</div>
							</div>
							<div className="space-y-4">
								{features.map((feature, featureIndex) => {
									const included =
										planIndex === 0
											? feature.free
											: planIndex === 1
												? feature.standard
												: feature.premium
									return (
										<div
											key={featureIndex}
											className="flex items-center justify-between"
										>
											<span className="text-sm text-black font-medium flex-1 pr-4">
												{feature.name}
											</span>
											{included ? (
												<div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
													<Check className="w-3 h-3 text-green-600" />
												</div>
											) : (
												<div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
													<X className="w-3 h-3 text-gray-400" />
												</div>
											)}
										</div>
									)
								})}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
