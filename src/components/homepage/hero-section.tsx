import { useTranslations } from 'next-intl'

export function HeroSection() {
	const t = useTranslations()
	return (
		<section className="relative w-full min-h-[100svh] grid place-items-center text-center overflow-hidden">
			{/* Background image */}
			<div
				className="absolute inset-0 bg-center bg-no-repeat"
				style={{
					backgroundImage: "url('/hero1.png')",
					backgroundSize: 'auto 100%',
					imageRendering: 'auto',
				}}
			>
				<div className="absolute inset-0 bg-black/40" />
			</div>

			{/* Content (centered) */}
			<div className="relative z-10 text-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
				<p className="text-6xl font-bold mb-4 leading-tight">
					{t('homepage.hero_section.title')}
				</p>
				<p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl opacity-90">
					{t('homepage.hero_section.subtitle')}
				</p>
			</div>
		</section>
	)
}
