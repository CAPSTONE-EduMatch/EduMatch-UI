'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import {
	DateInput,
	CustomSelect,
	RichTextEditor,
	SuccessModal,
	ErrorModal,
} from '@/components/ui'
import { getCountriesWithSvgFlags, Country } from '@/data/countries'
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'

interface CreateScholarshipPageProps {
	onBack?: () => void
	onSubmit?: () => void
	initialData?: any
	editId?: string
}

export const CreateScholarshipPage: React.FC<CreateScholarshipPageProps> = ({
	onBack,
	onSubmit,
	initialData,
	editId,
}) => {
	const isEditMode = !!editId && !!initialData
	const router = useRouter()
	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const { subdisciplines = [] } = useDisciplinesContext()

	// Populate form with initialData when in edit mode
	useEffect(() => {
		if (initialData && isEditMode) {
			// Helper to format date from API format to dd/mm/yyyy
			const formatDateForInput = (dateString: string | Date | null) => {
				if (!dateString) return ''
				const date = new Date(dateString)
				const day = date.getDate().toString().padStart(2, '0')
				const month = (date.getMonth() + 1).toString().padStart(2, '0')
				const year = date.getFullYear()
				return `${day}/${month}/${year}`
			}

			// Get subdisciplines from initialData
			const subdisciplineNames =
				initialData.subdisciplines?.map((sd: any) => sd.name) || []

			setFormData({
				scholarshipName: initialData.title || '',
				startDate: formatDateForInput(initialData.startDate),
				applicationDeadline: formatDateForInput(
					initialData.date || initialData.applicationDeadline
				),
				subdisciplines: subdisciplineNames,
				country: initialData.country || initialData.location || '',
				scholarshipDescription: initialData.description || '',
				scholarshipType: initialData.type
					? Array.isArray(initialData.type)
						? initialData.type
						: [initialData.type]
					: [],
				numberOfScholarships: initialData.number?.toString() || '1',
				grant: initialData.amount || initialData.scholarshipCoverage || '',
				scholarshipCoverage: initialData.scholarshipCoverage || '',
				eligibilityRequirements: initialData.eligibility || '',
				fileRequirements: {
					fileName:
						initialData.requiredDocuments?.[0]?.name || 'Required Documents',
					fileDescription:
						initialData.requiredDocuments?.[0]?.description || '',
				},
				additionalInformation: {
					content: initialData.otherInfo || '',
				},
			})
		}
	}, [initialData, isEditMode])

	const [formData, setFormData] = useState({
		// Overview Section
		scholarshipName: '',
		startDate: '',
		applicationDeadline: '',
		subdisciplines: [],
		country: '',

		// Detail Section
		scholarshipDescription: '',
		scholarshipType: [],
		numberOfScholarships: '',
		grant: '',
		scholarshipCoverage: '',

		// Eligibility Requirements
		eligibilityRequirements: '',

		// File Requirements
		fileRequirements: {
			fileName: '',
			fileDescription: '',
		},

		// Additional Information
		additionalInformation: {
			content: '',
		},
	})

	// Modal states
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [createdResult, setCreatedResult] = useState<any>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleFileRequirementChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			fileRequirements: {
				...prev.fileRequirements,
				[field]: value,
			},
		}))
	}

	const handleAdditionalChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			additionalInformation: {
				...prev.additionalInformation,
				[field]: value,
			},
		}))
	}

	const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
		setIsSubmitting(true)
		try {
			// Convert dates from dd/mm/yyyy to yyyy-mm-dd format
			const convertDateFormat = (dateString: string) => {
				if (!dateString) return ''
				const [day, month, year] = dateString.split('/')
				return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
			}

			const requestBody = {
				...formData,
				startDate: convertDateFormat(formData.startDate),
				applicationDeadline: convertDateFormat(formData.applicationDeadline),
				status: status,
				...(isEditMode && editId && { postId: editId }),
			}

			const response = await fetch('/api/posts/scholarships', {
				method: isEditMode ? 'PUT' : 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(requestBody),
			})

			if (!response.ok) {
				const errorData = await response.json()
				throw new Error(
					errorData.error ||
						(isEditMode
							? 'Failed to update scholarship post'
							: 'Failed to create scholarship post')
				)
			}

			const result = await response.json()
			// eslint-disable-next-line no-console
			console.log(
				isEditMode ? 'Scholarship post updated:' : 'Scholarship post created:',
				result
			)

			// Defer navigation until modal is closed
			setCreatedResult(result)
			setShowSuccessModal(true)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Error creating scholarship post:', error)
			const errorMsg =
				error instanceof Error
					? error.message
					: 'Failed to create scholarship post. Please try again.'
			setErrorMessage(errorMsg)
			setShowErrorModal(true)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-primary mb-2">
						{isEditMode ? 'Edit Scholarship' : 'Create Scholarship'}
					</h1>
				</div>
				{onBack && (
					<Button
						variant="outline"
						onClick={onBack}
						className="text-gray-600 hover:text-gray-800"
					>
						Back to Posts
					</Button>
				)}
			</div>

			{/* Overview Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">Overview</h2>
					<p className="text-muted-foreground">
						Please provide the basic information about your scholarship.
					</p>
				</div>

				<div className="space-y-6">
					{/* Scholarship Name */}
					<div className="space-y-2">
						<Label htmlFor="scholarshipName">Scholarship name</Label>
						<Input
							id="scholarshipName"
							placeholder="Enter scholarship name"
							value={formData.scholarshipName}
							onChange={(e) =>
								handleInputChange('scholarshipName', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Date Fields */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div className="relative">
							<DateInput
								id="startDate"
								value={formData.startDate}
								onChange={(value) => handleInputChange('startDate', value)}
								label="Start date"
								placeholder="dd/mm/yyyy"
								minDate={new Date().toISOString().split('T')[0]}
								maxDate="2030-12-31"
							/>
							{formData.startDate &&
								formData.applicationDeadline &&
								(() => {
									const [startDay, startMonth, startYear] =
										formData.startDate.split('/')
									const [deadlineDay, deadlineMonth, deadlineYear] =
										formData.applicationDeadline.split('/')
									const startDate = new Date(
										`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`
									)
									const deadlineDate = new Date(
										`${deadlineYear}-${deadlineMonth.padStart(2, '0')}-${deadlineDay.padStart(2, '0')}`
									)
									return startDate >= deadlineDate ? (
										<p className="text-xs text-red-500 mt-1">
											Start date must be before application deadline
										</p>
									) : null
								})()}
						</div>

						<div className="relative">
							<DateInput
								id="applicationDeadline"
								value={formData.applicationDeadline}
								onChange={(value) =>
									handleInputChange('applicationDeadline', value)
								}
								label="Application deadline"
								placeholder="dd/mm/yyyy"
								minDate={new Date().toISOString().split('T')[0]}
								maxDate="2030-12-31"
							/>
							{formData.startDate &&
								formData.applicationDeadline &&
								(() => {
									const [startDay, startMonth, startYear] =
										formData.startDate.split('/')
									const [deadlineDay, deadlineMonth, deadlineYear] =
										formData.applicationDeadline.split('/')
									const startDate = new Date(
										`${startYear}-${startMonth.padStart(2, '0')}-${startDay.padStart(2, '0')}`
									)
									const deadlineDate = new Date(
										`${deadlineYear}-${deadlineMonth.padStart(2, '0')}-${deadlineDay.padStart(2, '0')}`
									)
									return startDate >= deadlineDate ? (
										<p className="text-xs text-red-500 mt-1">
											Application deadline must be after start date
										</p>
									) : null
								})()}
						</div>
						<div className="space-y-2">
							<Label htmlFor="country">Country</Label>
							<CustomSelect
								value={
									formData.country
										? getCountriesWithSvgFlags().find(
												(c) =>
													c.name.toLowerCase() ===
													formData.country.toLowerCase()
											)
										: null
								}
								onChange={(option) =>
									handleInputChange('country', option?.name || '')
								}
								placeholder="Choose country"
								options={getCountriesWithSvgFlags()}
								formatOptionLabel={(option: any) => (
									<div className="flex items-center space-x-2">
										<span className="text-lg">{option.flag}</span>
										<span>{option.name}</span>
									</div>
								)}
								getOptionValue={(option: any) => option.name}
								isSearchable
								filterOption={(option, inputValue) => {
									const country = option.data as Country
									return country.name
										.toLowerCase()
										.includes(inputValue.toLowerCase())
								}}
								variant="default"
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>

					{/* Selection Fields */}
					<div className="grid grid-cols-1 md:grid-cols-1 gap-4">
						<div className="space-y-2">
							<Label htmlFor="subdisciplines">Subdisciplines</Label>
							<CustomSelect
								value={(formData.subdisciplines || []).map((v: string) => ({
									value: v,
									label: v,
								}))}
								onChange={(options) =>
									handleInputChange(
										'subdisciplines',
										Array.isArray(options)
											? options.map((o: any) => o?.value ?? o?.label)
											: []
									)
								}
								placeholder="Choose subdisciplines"
								options={subdisciplines}
								variant="default"
								isMulti
								isClearable={false}
								className="w-full"
							/>
						</div>
					</div>
				</div>
			</div>

			{/* Detail Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">Detail</h2>
					<p className="text-muted-foreground">
						Provide detailed information about the scholarship.
					</p>
				</div>

				<div className="space-y-6">
					{/* Description */}
					<RichTextEditor
						value={formData.scholarshipDescription}
						onChange={(value) =>
							handleInputChange('scholarshipDescription', value)
						}
						label="Description"
						placeholder="Enter description for this scholarship"
					/>

					{/* Scholarship Type */}
					<div className="space-y-2">
						<Label htmlFor="scholarshipType">Scholarship type</Label>
						<CustomSelect
							value={(formData.scholarshipType || []).map((type: string) => ({
								value: type,
								label: type,
							}))}
							onChange={(options) =>
								handleInputChange(
									'scholarshipType',
									Array.isArray(options)
										? options.map((o: any) => o?.value ?? o?.label)
										: []
								)
							}
							placeholder="Choose type of scholarship"
							options={[
								{ value: 'Merit-based', label: 'Merit-based' },
								{ value: 'Need-based', label: 'Need-based' },
								{ value: 'Athletic', label: 'Athletic' },
								{ value: 'Academic', label: 'Academic' },
								{ value: 'Research', label: 'Research' },
								{ value: 'International', label: 'International' },
							]}
							variant="default"
							isMulti
							isSearchable
							isClearable={true}
							className="w-full"
						/>
					</div>

					{/* Number of Scholarships */}
					<div className="space-y-2">
						<Label htmlFor="numberOfScholarships">
							Number of scholarships to award*
						</Label>
						<Input
							id="numberOfScholarships"
							placeholder="Enter number of scholarships"
							value={formData.numberOfScholarships}
							onChange={(e) =>
								handleInputChange('numberOfScholarships', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Grant */}
					<div className="space-y-2">
						<Label htmlFor="grant">Grant*</Label>
						<RichTextEditor
							value={formData.grant}
							onChange={(value) => handleInputChange('grant', value)}
							placeholder="Enter grant of this scholarship (example: tuition fee and other costs)"
						/>
					</div>

					{/* Scholarship Coverage */}
					<div className="space-y-2">
						<Label htmlFor="scholarshipCoverage">Scholarship coverage</Label>
						<RichTextEditor
							value={formData.scholarshipCoverage}
							onChange={(value) =>
								handleInputChange('scholarshipCoverage', value)
							}
							placeholder="Enter body of content (example: Tuition fee reduction, Living expenses, Travel expenses)"
						/>
					</div>
				</div>
			</div>

			{/* Eligibility Requirements Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Eligibility Requirements
					</h2>
					<p className="text-muted-foreground">
						Specify the requirements for scholarship eligibility.
					</p>
				</div>

				<div className="space-y-6">
					{/* Eligibility Requirements */}
					<RichTextEditor
						value={formData.eligibilityRequirements}
						onChange={(value) =>
							handleInputChange('eligibilityRequirements', value)
						}
						label="Eligibility Requirements"
						placeholder="Enter eligibility requirements (e.g., academic merit, financial need, and other criteria)"
					/>
				</div>
			</div>

			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<div className="flex items-center gap-2 mb-2">
						<h2 className="text-2xl font-bold text-primary">
							File requirements
						</h2>
					</div>
					<p className="text-muted-foreground">
						Specify the required documents for this program.
					</p>
				</div>

				<div className="space-y-6">
					{/* File Description */}
					<div className="space-y-2">
						<Label htmlFor="fileDescription">File description</Label>
						<Input
							id="fileDescription"
							placeholder="Enter file description"
							value={formData.fileRequirements?.fileDescription || ''}
							onChange={(e) =>
								handleFileRequirementChange('fileDescription', e.target.value)
							}
							inputSize="select"
						/>
					</div>
				</div>
			</div>

			{/* Additional Information Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Additional Information
					</h2>
					<p className="text-muted-foreground">
						Provide any additional information about this scholarship.
					</p>
				</div>

				<div className="space-y-6">
					{/* Content */}
					<div className="space-y-2">
						<Label className="text-lg font-semibold text-foreground">
							Content
						</Label>
						<RichTextEditor
							value={formData.additionalInformation.content}
							onChange={(value) => handleAdditionalChange('content', value)}
							placeholder="Enter additional information..."
						/>
					</div>
				</div>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-center gap-4">
				<Button
					onClick={() => handleSubmit('DRAFT')}
					variant="outline"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Processing...' : 'Save as Draft'}
				</Button>
				<Button
					onClick={() => handleSubmit('SUBMITTED')}
					variant="primary"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Processing...' : 'Submit'}
				</Button>
			</div>
			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => {
					setShowSuccessModal(false)
					// If onSubmit callback is provided, use it (stays on programs page)
					// Otherwise, redirect to explore (for backward compatibility)
					if (onSubmit) {
						onSubmit()
					} else {
						router.replace('/explore?tab=programmes')
					}
				}}
				title="Success!"
				message={
					isEditMode
						? 'Your scholarship post has been updated successfully.'
						: 'Your scholarship post has been created successfully.'
				}
				buttonText="Continue"
			/>

			{/* Error Modal */}
			<ErrorModal
				isOpen={showErrorModal}
				onClose={() => setShowErrorModal(false)}
				title="Error"
				message={errorMessage}
				buttonText="Try Again"
			/>
		</div>
	)
}
