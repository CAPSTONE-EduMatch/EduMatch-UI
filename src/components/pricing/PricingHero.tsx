export function PricingHero() {
	return (
		<section className="px-4 py-16 sm:py-20 lg:py-24">
			<div className="max-w-6xl mx-auto text-center">
				{/* Badge */}
				<div
					className="inline-block mb-6 opacity-0 animate-fadeInUp"
					style={{ animationDelay: '200ms' }}
				>
					<span className="text-sm font-medium text-[#116E63] bg-[#116E63]/10 px-3 py-1 rounded-full transform transition-all duration-300 hover:scale-110">
						Pricing plan
					</span>
				</div>

				{/* Main Heading */}
				<h1
					className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black mb-6 max-w-4xl mx-auto leading-tight opacity-0 animate-fadeInUp"
					style={{ animationDelay: '400ms' }}
				>
					Choose Your Perfect Plan
					<br />
					Make Scholarship Hunting Easier!
				</h1>

				{/* Description */}
				<p
					className="text-lg sm:text-xl text-[#676767] max-w-4xl mx-auto leading-relaxed opacity-0 animate-fadeInUp"
					style={{ animationDelay: '600ms' }}
				>
					From essential features to advanced AI Matching, take full control of
					your scholarship journey.
				</p>
			</div>
		</section>
	)
}
