export function PricingCards() {
	const plans = [
		{
			name: 'Free Plan',
			price: 0,
			period: 'MONTHLY',
			description: 'Ideal for applicants ready to apply and track progress.',
			features: [
				'Account registration & OTP verification',
				'Create & update personal profile (GPA, skills, research topic, etc.)',
				'Basic scholarship, program & research group search',
				'View scholarship details & requirements',
				'Receive deadline reminders for saved scholarships/programs',
				'Send messages to scholarship staff / professors',
			],
			buttonText: 'Get Started Free',
			popular: false,
		},
		{
			name: 'Standard Membership',
			price: 99,
			period: 'MONTHLY',
			description: 'Ideal for applicants ready to apply and track progress.',
			features: [
				'Account registration & OTP verification',
				'Create & update personal profile (GPA, skills, research topic, etc.)',
				'Basic scholarship, program & research group search',
				'View scholarship details & requirements',
				'Receive deadline reminders for saved scholarships/programs',
				'Send messages to scholarship staff / professors',
			],
			buttonText: 'Purchase order',
			popular: true,
		},
		{
			name: 'Premium Membership',
			price: 199,
			period: 'MONTHLY',
			description: 'Ideal for applicants ready to apply and track progress.',
			features: [
				'Account registration & OTP verification',
				'Create & update personal profile (GPA, skills, research topic, etc.)',
				'Basic scholarship, program & research group search',
				'View scholarship details & requirements',
				'Receive deadline reminders for saved scholarships/programs',
				'Send messages to scholarship staff / professors',
			],
			buttonText: 'Purchase order',
			popular: false,
		},
	]

	return (
		<section className="px-4 py-16 bg-[#FBFBFB]">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
					{plans.map((plan, index) => (
						<div
							key={index}
							className={`relative bg-white rounded-[30px] p-8 lg:p-12 transform transition-all duration-500 hover:scale-105 hover:shadow-2xl animate-fadeInUp ${
								plan.popular
									? 'ring-2 ring-[#116E63] scale-105 shadow-xl'
									: 'hover:shadow-lg'
							}`}
							style={{
								animationDelay: `${index * 200}ms`,
							}}
						>
							{/* Popular Badge */}
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
									<span className="bg-[#116E63] text-white text-sm font-semibold px-4 py-1 rounded-full">
										Most Popular
									</span>
								</div>
							)}

							{/* Plan Header */}
							<div className="mb-8">
								<h3 className="text-2xl lg:text-3xl font-bold text-black mb-4">
									{plan.name}
								</h3>
								<div className="mb-4">
									<span className="text-3xl lg:text-4xl font-bold text-black">
										${plan.price}
									</span>
									<span className="text-lg text-black ml-2">
										/ {plan.period}
									</span>
								</div>
								<p className="text-[#A2A2A2] text-base">{plan.description}</p>
							</div>

							{/* Features */}
							<div className="mb-8">
								<h4 className="text-lg font-medium text-[#232323] mb-6">
									Includes
								</h4>
								<ul className="space-y-4">
									{plan.features.map((feature, featureIndex) => (
										<li
											key={featureIndex}
											className="flex items-start gap-3 opacity-0 animate-slideInLeft"
											style={{
												animationDelay: `${index * 200 + featureIndex * 100}ms`,
											}}
										>
											<div className="w-5 h-5 rounded-full border border-black flex items-center justify-center flex-shrink-0 mt-1">
												<div className="w-2 h-2 bg-black rounded-full"></div>
											</div>
											<span className="text-sm text-[#A2A2A2] leading-relaxed">
												{feature}
											</span>
										</li>
									))}
								</ul>
							</div>

							{/* Button */}
							<button
								className={`w-full py-3 px-6 rounded-[30px] font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg opacity-0 animate-fadeInUp ${
									plan.popular
										? 'bg-[#116E63] text-white hover:bg-[#0f5c54]'
										: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
								style={{ animationDelay: `${index * 200 + 600}ms` }}
							>
								{plan.buttonText}
							</button>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
