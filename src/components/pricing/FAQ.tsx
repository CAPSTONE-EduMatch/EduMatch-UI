'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function FAQ() {
	const t = useTranslations('pricing.faq')
	const [openItems, setOpenItems] = useState<number[]>([])

	const faqs = [
		{
			question: t('questions.0.question'),
			answer: t('questions.0.answer'),
		},
		{
			question: t('questions.1.question'),
			answer: t('questions.1.answer'),
		},
		{
			question: t('questions.2.question'),
			answer: t('questions.2.answer'),
		},
		{
			question: t('questions.3.question'),
			answer: t('questions.3.answer'),
		},
	]

	const toggleItem = (index: number) => {
		setOpenItems((prev) =>
			prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
		)
	}

	return (
		<section className="px-4 py-16 bg-white">
			<div className="max-w-4xl mx-auto">
				{/* Section Header */}
				<div className="text-center mb-12">
					<div className="inline-block mb-4">
						<span className="text-sm font-medium text-[#116E63] bg-[#116E63]/10 px-3 py-1 rounded-full">
							{t('badge')}
						</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6">
						{t('title')}
					</h2>
					<p className="text-lg text-black max-w-2xl mx-auto">
						{t('description')}
					</p>
				</div>

				{/* FAQ Items */}
				<div className="space-y-4">
					{faqs.map((faq, index) => (
						<div
							key={index}
							className="bg-[#FBFBFB] rounded-2xl p-6 transition-all duration-300 hover:shadow-lg hover:bg-white opacity-0 animate-fadeInUp transform hover:scale-102"
							style={{ animationDelay: `${index * 100 + 800}ms` }}
						>
							<button
								onClick={() => toggleItem(index)}
								className="flex items-center justify-between w-full text-left"
							>
								<h3 className="text-lg font-medium text-black pr-4 transition-colors duration-200 hover:text-[#116E63]">
									{faq.question}
								</h3>
								<ChevronDown
									className={`w-5 h-5 text-black transition-all duration-300 flex-shrink-0 hover:text-[#116E63] ${
										openItems.includes(index) ? 'rotate-180' : ''
									}`}
								/>
							</button>
							{openItems.includes(index) && (
								<div className="mt-4 pt-4 border-t border-gray-200 animate-slideDown">
									<p className="text-black leading-relaxed">{faq.answer}</p>
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	)
}
