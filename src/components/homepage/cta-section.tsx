'use client'

import Button from '@/components/ui/Button'

export function CTASection() {
	return (
		<section className="py-12 sm:py-16 lg:py-20 px-2 sm:px-4 lg:px-6">
			<div className="w-full max-w-7xl mx-auto relative">
				{/* Large orange circles - responsive positioning and sizing */}
				<div className="absolute -left-8 sm:-left-12 lg:-left-16 -top-4 sm:-top-6 lg:-top-8 w-32 h-32 sm:w-40 sm:h-40 lg:w-52 lg:h-52 bg-orange-400 rounded-full opacity-80"></div>
				<div className="absolute -right-8 sm:-right-12 lg:-right-16 -bottom-4 sm:-bottom-6 lg:-bottom-8 w-32 h-32 sm:w-40 sm:h-40 lg:w-52 lg:h-52 bg-orange-400 rounded-full opacity-80"></div>

				{/* Medium orange circles - responsive positioning */}
				<div className="absolute top-1/2 left-1/4 w-6 h-6 sm:w-8 sm:h-8 lg:w-12 lg:h-12 xl:w-16 xl:h-16 bg-orange-300 rounded-full opacity-70"></div>
				<div className="absolute top-1/3 right-1/3 w-4 h-4 sm:w-6 sm:h-6 lg:w-10 lg:h-10 xl:w-14 xl:h-14 bg-orange-500 rounded-full opacity-80"></div>

				<div className="relative bg-primary rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-12 text-center text-white overflow-hidden">
					<div className="relative z-10">
						<h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 md:mb-6 text-balance leading-tight">
							Lorem Ipsum is simply dummy text he 1500s
						</h2>
						<p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl mb-4 sm:mb-6 md:mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed">
							Lorem Ipsum is simply dummy text of the printing and typesetting
							industry. Lorem Ipsum has been the industry&apos;s
						</p>
						<Button
							className="bg-white text-primary text-black hover:bg-gray-100 px-4 sm:px-6 md:px-8 lg:px-12 py-2 sm:py-3 rounded-full text-xs sm:text-sm md:text-base lg:text-lg font-semibold shadow-md"
							animate={true}
						>
							Sign in
						</Button>
					</div>
				</div>
			</div>
		</section>
	)
}
