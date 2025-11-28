'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import Button from '@/components/ui/forms/Button'
import { Label } from '@/components/ui/forms/label'
import Input from '@/components/ui/inputs/Input'
import { PLAN_TYPE, useAdminPlans, type Plan } from '@/hooks/admin'
import { motion } from 'framer-motion'
import {
	Building2,
	DollarSign,
	Edit,
	Package,
	Save,
	User,
	X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface EditingPlan {
	plan_id: string
	month_price: number // in dollars for display
	year_price: number | null // in dollars for display
	priceId: string
}

const PlanCard = ({
	plan,
	isEditing,
	editData,
	onEdit,
	onSave,
	onCancel,
	onChange,
	isSaving,
	centsToDollars,
}: {
	plan: Plan
	isEditing: boolean
	editData: EditingPlan | null
	onEdit: (_plan: Plan) => void
	onSave: (_planId: string) => void
	onCancel: () => void
	onChange: (_field: keyof EditingPlan, _value: string | number) => void
	isSaving: boolean
	centsToDollars: (cents: number) => number
}) => {
	const planTypeLabel =
		plan.type === PLAN_TYPE.APPLICANT ? 'Applicant' : 'Institution'
	const statusLabel = plan.status ? 'Active' : 'Inactive'
	const isInstitutionPlan = plan.type === PLAN_TYPE.INSTITUTION

	// Convert cents to dollars for display
	const monthPriceDisplay = centsToDollars(plan.month_price)
	const yearPriceDisplay = plan.year_price
		? centsToDollars(plan.year_price)
		: null

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3 }}
		>
			<Card className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 bg-white rounded-xl overflow-hidden">
				<CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-gradient-to-br from-[#126E64] to-[#0E5B52] rounded-xl shadow-sm">
								<Package className="w-6 h-6 text-white" />
							</div>
							<div className="space-y-1">
								<CardTitle className="text-xl font-bold text-gray-900">
									{plan.name}
								</CardTitle>
								<div className="flex items-center gap-2">
									<span
										className={`px-2 py-1 text-xs font-medium rounded-full ${
											plan.type === PLAN_TYPE.APPLICANT
												? 'bg-blue-50 text-blue-700 border border-blue-200'
												: 'bg-purple-50 text-purple-700 border border-purple-200'
										}`}
									>
										{planTypeLabel}
									</span>
									<span
										className={`px-2 py-1 text-xs font-medium rounded-full ${
											plan.status
												? 'bg-green-50 text-green-700 border border-green-200'
												: 'bg-red-50 text-red-700 border border-red-200'
										}`}
									>
										{statusLabel}
									</span>
								</div>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{isEditing ? (
								<>
									<Button
										onClick={() => onSave(plan.plan_id)}
										size="sm"
										disabled={isSaving}
										className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm border-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md disabled:opacity-50"
									>
										<Save className="w-4 h-4 mr-2" />
										{isSaving ? 'Saving...' : 'Save Changes'}
									</Button>
									<Button
										onClick={onCancel}
										variant="outline"
										size="sm"
										disabled={isSaving}
										className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 rounded-lg font-medium transition-all duration-200"
									>
										<X className="w-4 h-4 mr-2" />
										Cancel
									</Button>
								</>
							) : (
								<Button
									onClick={() => onEdit(plan)}
									variant="outline"
									size="sm"
									className="border-[#126E64] text-[#126E64] bg-white hover:bg-[#126E64] hover:text-[#126E64] hover:border-[#126E64] px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
								>
									<Edit className="w-4 h-4 mr-2" />
									Edit Pricing
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="p-6">
					<div className="space-y-6">
						{/* Description */}
						{plan.description && (
							<div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
								<p className="text-sm text-gray-700 leading-relaxed">
									{plan.description}
								</p>
							</div>
						)}

						{/* Pricing Section */}
						<div
							className={`grid grid-cols-1 ${isInstitutionPlan ? 'md:grid-cols-2' : ''} gap-6`}
						>
							<div className="space-y-3">
								<Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
									<DollarSign className="w-4 h-4 text-[#126E64]" />
									Monthly Price
								</Label>
								{isEditing ? (
									<Input
										type="number"
										step="0.01"
										min="0"
										value={editData?.month_price ?? ''}
										onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
											onChange('month_price', Number(e.target.value))
										}
										placeholder="Enter monthly price (in dollars)"
										className="w-full border-gray-300 focus:border-[#126E64] focus:ring-[#126E64] rounded-lg"
									/>
								) : (
									<div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
										<span className="text-2xl font-bold text-green-700">
											${monthPriceDisplay.toFixed(2)}
										</span>
										<span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-1 rounded-full">
											/month
										</span>
									</div>
								)}
							</div>

							{/* Yearly Price - Only for Institution Plans */}
							{isInstitutionPlan && (
								<div className="space-y-3">
									<Label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
										<DollarSign className="w-4 h-4 text-[#126E64]" />
										Yearly Price
									</Label>
									{isEditing ? (
										<Input
											type="number"
											step="0.01"
											min="0"
											value={editData?.year_price ?? ''}
											onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
												onChange('year_price', Number(e.target.value))
											}
											placeholder="Enter yearly price (in dollars)"
											className="w-full border-gray-300 focus:border-[#126E64] focus:ring-[#126E64] rounded-lg"
										/>
									) : (
										<div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
											<span className="text-2xl font-bold text-blue-700">
												${yearPriceDisplay?.toFixed(2) ?? 'N/A'}
											</span>
											<span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded-full">
												/year
											</span>
										</div>
									)}
								</div>
							)}
						</div>

						{/* Price ID Section */}
						<div className="space-y-3">
							<Label className="text-sm font-semibold text-gray-800">
								Stripe Price ID
							</Label>
							{isEditing ? (
								<Input
									type="text"
									value={editData?.priceId ?? ''}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
										onChange('priceId', e.target.value)
									}
									placeholder="Enter Stripe Price ID"
									className="w-full font-mono text-sm border-gray-300 focus:border-[#126E64] focus:ring-[#126E64] rounded-lg"
								/>
							) : (
								<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
									<code className="text-sm text-gray-800 font-medium bg-white px-2 py-1 rounded border">
										{plan.priceId || 'Not set'}
									</code>
								</div>
							)}
						</div>

						{/* Features */}
						<div className="space-y-3">
							<Label className="text-sm font-semibold text-gray-800">
								Plan Features
							</Label>
							<div className="grid gap-2">
								{plan.features.map((feature, index) => (
									<div
										key={index}
										className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
									>
										<div className="flex-shrink-0 w-2 h-2 bg-gradient-to-r from-[#126E64] to-[#0E5B52] rounded-full shadow-sm"></div>
										<span className="text-sm text-gray-700 leading-relaxed">
											{feature}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	)
}

export default function PlansPage() {
	const {
		applicantPlans,
		institutionPlans,
		isLoading,
		error,
		isUpdating,
		updatePlan,
		refetch,
		centsToDollars,
		dollarsToCents,
	} = useAdminPlans()

	const [editingPlan, setEditingPlan] = useState<string | null>(null)
	const [editData, setEditData] = useState<EditingPlan | null>(null)

	const handleEdit = (plan: Plan) => {
		setEditingPlan(plan.plan_id)
		setEditData({
			plan_id: plan.plan_id,
			month_price: centsToDollars(plan.month_price),
			year_price: plan.year_price ? centsToDollars(plan.year_price) : null,
			priceId: plan.priceId || '',
		})
	}

	const handleSave = async (planId: string) => {
		if (!editData) return

		try {
			// Convert dollars to cents for storage
			await updatePlan({
				plan_id: planId,
				month_price: dollarsToCents(editData.month_price),
				year_price: editData.year_price
					? dollarsToCents(editData.year_price)
					: undefined,
				priceId: editData.priceId || undefined,
			})

			toast.success('Plan updated successfully')
			setEditingPlan(null)
			setEditData(null)
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : 'Failed to update plan'
			toast.error(errorMessage)
		}
	}

	const handleCancel = () => {
		setEditingPlan(null)
		setEditData(null)
	}

	const handleChange = (field: keyof EditingPlan, value: string | number) => {
		if (!editData) return

		setEditData({
			...editData,
			[field]: value,
		})
	}

	if (isLoading) {
		return (
			<div className="p-8">
				<div className="flex items-center justify-center h-64">
					<div className="animate-pulse flex flex-col items-center gap-4">
						<div className="h-8 w-8 border-4 border-[#126E64] border-t-transparent rounded-full animate-spin"></div>
						<div className="text-gray-600">Loading plans...</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="p-8">
			{/* Header */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="mb-8"
			>
				<div className="flex items-center gap-4 mb-4">
					<div className="p-3 bg-[#126E64] rounded-lg">
						<Building2 className="w-6 h-6 text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900">
							Plan Management
						</h1>
						<p className="text-gray-600">
							Manage subscription plan pricing and Stripe price IDs
						</p>
					</div>
				</div>
			</motion.div>

			{/* Error Message */}
			{error && (
				<motion.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
				>
					<p className="text-red-600 text-sm mb-3">{error.message}</p>
					<Button
						onClick={() => refetch()}
						className="text-sm bg-red-600 hover:bg-red-700"
					>
						Retry
					</Button>
				</motion.div>
			)}

			{/* Applicant Plans Section */}
			{applicantPlans.length > 0 && (
				<section className="mb-12">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex items-center gap-3 mb-6"
					>
						<User className="w-5 h-5 text-blue-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							Applicant Plans
						</h2>
						<span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
							{applicantPlans.length} plans
						</span>
					</motion.div>
					<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
						{applicantPlans.map((plan) => (
							<PlanCard
								key={plan.plan_id}
								plan={plan}
								isEditing={editingPlan === plan.plan_id}
								editData={editData}
								onEdit={handleEdit}
								onSave={handleSave}
								onCancel={handleCancel}
								onChange={handleChange}
								isSaving={isUpdating}
								centsToDollars={centsToDollars}
							/>
						))}
					</div>
				</section>
			)}

			{/* Institution Plans Section */}
			{institutionPlans.length > 0 && (
				<section className="mb-8">
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="flex items-center gap-3 mb-6"
					>
						<Building2 className="w-5 h-5 text-purple-600" />
						<h2 className="text-xl font-semibold text-gray-900">
							Institution Plans
						</h2>
						<span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
							{institutionPlans.length} plans
						</span>
					</motion.div>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{institutionPlans.map((plan) => (
							<PlanCard
								key={plan.plan_id}
								plan={plan}
								isEditing={editingPlan === plan.plan_id}
								editData={editData}
								onEdit={handleEdit}
								onSave={handleSave}
								onCancel={handleCancel}
								onChange={handleChange}
								isSaving={isUpdating}
								centsToDollars={centsToDollars}
							/>
						))}
					</div>
				</section>
			)}

			{applicantPlans.length === 0 &&
				institutionPlans.length === 0 &&
				!isLoading && (
					<div className="text-center py-12">
						<div className="max-w-md mx-auto">
							<Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<h3 className="text-lg font-medium text-gray-900 mb-2">
								No plans found
							</h3>
							<p className="text-gray-500">
								No subscription plans are configured yet.
							</p>
						</div>
					</div>
				)}
		</div>
	)
}
