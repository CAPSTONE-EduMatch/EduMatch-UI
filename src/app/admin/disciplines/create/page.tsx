'use client'

import { Card, CardContent } from '@/components/ui'
import { useAdminDisciplines } from '@/hooks/admin/useAdminDisciplines'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminDisciplinePage() {
	const router = useRouter()
	const {
		disciplines,
		isLoading,
		createDiscipline,
		createSubdiscipline,
		isCreating,
	} = useAdminDisciplines()

	const [disciplineName, setDisciplineName] = useState('')
	const [subdisciplineName, setSubdisciplineName] = useState('')
	const [selectedDisciplineId, setSelectedDisciplineId] = useState('')

	const handleCreateDiscipline = async () => {
		if (!disciplineName.trim()) return

		try {
			await createDiscipline(disciplineName.trim())
			setDisciplineName('')
			router.push('/admin/disciplines')
		} catch {
			// Error is handled by the hook with toast
		}
	}

	const handleCreateSubdiscipline = async () => {
		if (!subdisciplineName.trim() || !selectedDisciplineId) return

		try {
			await createSubdiscipline(subdisciplineName.trim(), selectedDisciplineId)
			setSubdisciplineName('')
			setSelectedDisciplineId('')
			router.push('/admin/disciplines')
		} catch {
			// Error is handled by the hook with toast
		}
	}

	return (
		<div className="min-h-screen bg-[#F5F7FB] pb-20">
			{/* Header Section */}
			<div className="px-8 pt-[135px] pb-6 flex items-center gap-6">
				<button
					onClick={() => router.push('/admin/disciplines')}
					className="bg-white/10 text-[#126E64] px-3 py-2 rounded-full hover:bg-white/20 transition"
				>
					Back
				</button>
				<h1 className="text-4xl font-bold text-[#126E64]">Add discipline</h1>
			</div>

			{/* Main Content Card */}
			<div className="px-8">
				{/* Create Discipline Section */}
				<Card className="bg-white rounded-[24px] shadow-xl border-0 mb-6">
					<CardContent className="p-0">
						<div className="px-8 py-8">
							<h2 className="text-xl font-bold text-gray-800 mb-6">
								Create New Discipline
							</h2>
							<div className="flex items-end gap-6">
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
								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleCreateDiscipline}
									disabled={isCreating || !disciplineName.trim()}
									className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[20px] px-8 py-3 text-base font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
									Create Discipline
								</motion.button>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Create Subdiscipline Section */}
				<Card className="bg-white rounded-[24px] shadow-xl border-0">
					<CardContent className="p-0">
						<div className="px-8 py-8">
							<h2 className="text-xl font-bold text-gray-800 mb-6">
								Create New Subdiscipline
							</h2>
							<div className="flex items-end gap-6">
								{/* Parent Discipline Dropdown */}
								<div className="flex-1 space-y-3">
									<label className="block text-base font-semibold text-gray-800">
										Parent Discipline
									</label>
									<div className="bg-gray-50 border-2 border-gray-200 rounded-[20px] px-5 py-3 focus-within:border-[#126E64] focus-within:bg-white transition-all">
										{isLoading ? (
											<div className="flex items-center gap-2 text-gray-400">
												<Loader2 className="w-4 h-4 animate-spin" />
												Loading disciplines...
											</div>
										) : (
											<select
												value={selectedDisciplineId}
												onChange={(e) =>
													setSelectedDisciplineId(e.target.value)
												}
												className="w-full text-base text-gray-900 outline-none bg-transparent"
											>
												<option value="">Select a discipline</option>
												{disciplines.map((d) => (
													<option key={d.id} value={d.id}>
														{d.name}
													</option>
												))}
											</select>
										)}
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

								<motion.button
									whileHover={{ scale: 1.02 }}
									whileTap={{ scale: 0.98 }}
									onClick={handleCreateSubdiscipline}
									disabled={
										isCreating ||
										!subdisciplineName.trim() ||
										!selectedDisciplineId
									}
									className="bg-[#126E64] hover:bg-[#0f5850] text-white rounded-[20px] px-8 py-3 text-base font-semibold transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
								>
									{isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
									Create Subdiscipline
								</motion.button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
