export function PricingCardsSkeleton() {
	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-7xl mx-auto">
				<div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 animate-pulse">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="bg-gray-100 rounded-[30px] p-8 lg:p-12 h-[600px]"
						>
							<div className="space-y-4">
								<div className="h-8 bg-gray-200 rounded w-3/4"></div>
								<div className="h-6 bg-gray-200 rounded w-1/2"></div>
								<div className="h-4 bg-gray-200 rounded w-full"></div>
								<div className="h-4 bg-gray-200 rounded w-5/6"></div>
								<div className="space-y-3 mt-8">
									{[1, 2, 3, 4, 5].map((j) => (
										<div key={j} className="h-4 bg-gray-200 rounded"></div>
									))}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export function PricingCardsError({ error }: { error: string }) {
	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-7xl mx-auto">
				<div className="text-center py-12 bg-red-50 rounded-2xl border-2 border-red-200">
					<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<svg
							className="h-6 w-6 text-red-600"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Failed to Load Pricing Plans
					</h3>
					<p className="text-sm text-gray-600 mb-4">{error}</p>
					<button
						onClick={() => window.location.reload()}
						className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
					>
						Retry
					</button>
				</div>
			</div>
		</section>
	)
}
