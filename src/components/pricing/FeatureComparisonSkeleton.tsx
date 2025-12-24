export function FeatureComparisonSkeleton() {
	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-7xl mx-auto animate-pulse">
				{/* Section Header */}
				<div className="text-center mb-12">
					<div className="h-10 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
					<div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
				</div>

				{/* Desktop Table Skeleton */}
				<div className="hidden lg:block overflow-x-auto">
					<div className="space-y-4">
						{/* Header row */}
						<div className="flex gap-4">
							<div className="flex-1 h-16 bg-gray-200 rounded"></div>
							<div className="w-48 h-16 bg-gray-200 rounded"></div>
							<div className="w-48 h-16 bg-gray-200 rounded"></div>
							<div className="w-48 h-16 bg-gray-200 rounded"></div>
						</div>
						{/* Feature rows */}
						{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
							<div key={i} className="flex gap-4">
								<div className="flex-1 h-12 bg-gray-100 rounded"></div>
								<div className="w-48 h-12 bg-gray-100 rounded"></div>
								<div className="w-48 h-12 bg-gray-100 rounded"></div>
								<div className="w-48 h-12 bg-gray-100 rounded"></div>
							</div>
						))}
					</div>
				</div>

				{/* Mobile Cards Skeleton */}
				<div className="lg:hidden space-y-6">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-gray-100 rounded-xl p-6 space-y-4">
							<div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
							<div className="h-6 bg-gray-200 rounded w-1/3 mx-auto"></div>
							<div className="space-y-3 mt-4">
								{[1, 2, 3, 4, 5].map((j) => (
									<div key={j} className="h-4 bg-gray-200 rounded"></div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	)
}

export function FeatureComparisonError({ error }: { error: string }) {
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
						Failed to Load Feature Comparison
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
