'use client'

import { Card, CardContent } from '@/components/ui'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function AdminDisciplinePage() {
	const [disciplineName, setDisciplineName] = useState('')
	const [subdisciplineName, setSubdisciplineName] = useState('')

	const handleCreateDiscipline = () => {
		// TODO: Implement discipline creation logic
		if (disciplineName.trim()) {
			// API call will go here
		}
	}

	const handleCreateSubdiscipline = () => {
		// TODO: Implement subdiscipline creation logic
		if (subdisciplineName.trim()) {
			// API call will go here
		}
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-20">
			{/* Header Section */}
			<div className="px-8 pt-[135px] pb-6 justify center items-center flex">
				<h1 className="text-4xl font-bold text-[#126E64]">Add discipline</h1>
			</div>

			{/* Main Content Card */}
			<div className="px-8">
				<Card className="bg-white rounded-[24px] shadow-xl border-0">
					<CardContent className="p-0">
						{/* Form Content */}
						<div className="px-8 py-8">
							<div className="flex items-start gap-6">
								{/* Discipline Name Field */}
								<div className="flex-1 space-y-3">
									<label className="block text-base font-semibold text-gray-800">
										Discipline name
									</label>
									<div className="bg-gray-50 border-2 border-gray-200 rounded-[20px] px-5 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
										<input
											type="text"
											value={disciplineName}
											onChange={(e) => setDisciplineName(e.target.value)}
											placeholder="Enter discipline name"
											className="w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
										/>
									</div>
								</div>

								{/* Subdiscipline Name Field */}
								<div className="flex-1 space-y-3">
									<label className="block text-base font-semibold text-gray-800">
										Subdiscipline name
									</label>
									<div className="bg-gray-50 border-2 border-gray-200 rounded-[20px] px-5 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
										<input
											type="text"
											value={subdisciplineName}
											onChange={(e) => setSubdisciplineName(e.target.value)}
											placeholder="Enter subdiscipline name"
											className="w-full text-base text-gray-900 outline-none bg-transparent placeholder:text-gray-400"
										/>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex justify-center gap-4 mt-8">
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleCreateDiscipline}
									className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[20px] px-8 py-3 text-base font-semibold transition-colors shadow-sm"
								>
									Create
								</motion.button>
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleCreateSubdiscipline}
									className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[20px] px-8 py-3 text-base font-semibold transition-colors shadow-sm"
								>
									Create subdiscipline
								</motion.button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
