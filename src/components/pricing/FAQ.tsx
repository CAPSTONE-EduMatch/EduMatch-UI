'use client'

import { ChevronDown } from 'lucide-react'
import { useState } from 'react'

export function FAQ() {
	const [openItems, setOpenItems] = useState<number[]>([])

	const faqs = [
		{
			question: 'What is included in the Free Plan?',
			answer:
				'The Free Plan includes basic account registration, profile creation, scholarship search, and viewing details. Perfect for getting started with EduMatch.',
		},
		{
			question: 'Can I upgrade or downgrade my plan anytime?',
			answer:
				'Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
		},
		{
			question: 'What makes the Premium Plan worth it?',
			answer:
				'The Premium Plan includes advanced AI matching, unlimited applications, natural language search, and priority customer support for serious scholarship hunters.',
		},
		{
			question: 'Do you offer refunds?',
			answer:
				'We offer a 30-day money-back guarantee for all paid plans. If you are not satisfied, contact our support team for a full refund.',
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
							Common questions
						</span>
					</div>
					<h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-6">
						Frequently asked questions
					</h2>
					<p className="text-lg text-black max-w-2xl mx-auto">
						Lorem Ipsum is simply dummy text of the printing and typesetting
						industry. Lorem Ipsum has been the industry&apos;s standard dummy
						text ever since the 1500s
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
