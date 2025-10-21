'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { DateInput, CustomSelect, RichTextEditor } from '@/components/ui'
import { getCountriesWithSvgFlags, Country } from '@/data/countries'

interface CreateScholarshipPageProps {
	onBack?: () => void
	onSubmit?: (data: any) => void
}

export const CreateScholarshipPage: React.FC<CreateScholarshipPageProps> = ({
	onBack,
	onSubmit,
}) => {
	const [formData, setFormData] = useState({
		// Overview Section
		scholarshipName: 'Merit Scholarship for International Students',
		startDate: '01/01/2001',
		applicationDeadline: '01/01/2001',
		subdisciplines: [],
		country: 'Vietnam',

		// Detail Section
		scholarshipDescription: `<p>This scholarship is designed to support outstanding international students pursuing their academic goals.</p>
<p>Key features include:</p>
<ul>
<li>Full tuition coverage</li>
<li>Living allowance</li>
<li>Research funding opportunities</li>
<li>Mentorship program</li>
</ul>`,
		scholarshipType: 'Merit-based',
		numberOfScholarships: '10',
		grant: `<p>Full tuition coverage for the entire program duration.</p>
<ul>
<li>Tuition fees</li>
<li>Registration fees</li>
<li>Laboratory fees</li>
</ul>`,
		scholarshipCoverage: `<p>Comprehensive financial support including:</p>
<ul>
<li>Tuition fee reduction (100%)</li>
<li>Living expenses allowance</li>
<li>Travel expenses for international students</li>
<li>Health insurance coverage</li>
</ul>`,

		// Eligibility Requirements
		eligibilityRequirements: {
			academicMerit: '',
			financialNeed: '',
			otherCriteria: '',
		},

		// File Requirements
		fileRequirements: {
			fileName: '',
			fileDescription: '',
		},

		// Award Details
		awardDetails: {
			amount: '',
			duration: '',
			renewable: '',
		},

		// Additional Information
		additionalInformation: {
			content: '',
		},
	})

	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}))
	}

	const handleEligibilityChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			eligibilityRequirements: {
				...prev.eligibilityRequirements,
				[field]: value,
			},
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

	const handleAwardChange = (field: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			awardDetails: {
				...prev.awardDetails,
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

	const handleSubmit = () => {
		onSubmit?.(formData)
	}

	return (
		<div className="space-y-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-primary mb-2">
						Create Scholarship
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
							/>
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
							/>
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
								value={formData.subdisciplines}
								onChange={(options) =>
									handleInputChange('subdisciplines', options || [])
								}
								placeholder="Choose subdisciplines"
								options={[
									{ value: 'Information system', label: 'Information system' },
									{ value: 'Computer Science', label: 'Computer Science' },
									{ value: 'Data Science', label: 'Data Science' },
									{
										value: 'Software Engineering',
										label: 'Software Engineering',
									},
									{
										value: 'Business Administration',
										label: 'Business Administration',
									},
									{ value: 'Economics', label: 'Economics' },
									{ value: 'Medicine', label: 'Medicine' },
									{ value: 'Engineering', label: 'Engineering' },
								]}
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

					{/* Scholarship Type and Number */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="scholarshipType">Scholarship type</Label>
							<CustomSelect
								value={
									formData.scholarshipType
										? {
												value: formData.scholarshipType,
												label: formData.scholarshipType,
											}
										: null
								}
								onChange={(option) =>
									handleInputChange('scholarshipType', option?.value || '')
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
								isClearable={false}
								className="w-full"
							/>
						</div>

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
					{/* Academic Merit */}
					<div className="space-y-2">
						<Label htmlFor="academicMerit">Academic merit</Label>
						<Input
							id="academicMerit"
							placeholder="Enter academic requirements (e.g., minimum GPA 3.5)"
							value={formData.eligibilityRequirements.academicMerit}
							onChange={(e) =>
								handleEligibilityChange('academicMerit', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Financial Need */}
					<div className="space-y-2">
						<Label htmlFor="financialNeed">Financial need</Label>
						<Input
							id="financialNeed"
							placeholder="Enter financial need requirements"
							value={formData.eligibilityRequirements.financialNeed}
							onChange={(e) =>
								handleEligibilityChange('financialNeed', e.target.value)
							}
							inputSize="select"
						/>
					</div>

					{/* Other Criteria */}
					<div className="space-y-2">
						<Label htmlFor="otherCriteria">Other criteria</Label>
						<Input
							id="otherCriteria"
							placeholder="Enter any other eligibility criteria"
							value={formData.eligibilityRequirements.otherCriteria}
							onChange={(e) =>
								handleEligibilityChange('otherCriteria', e.target.value)
							}
							inputSize="select"
						/>
					</div>
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
					{/* File Name */}
					<div className="space-y-2">
						<Label htmlFor="fileName">File name</Label>
						<Input
							id="fileName"
							placeholder="Enter file name"
							value={formData.fileRequirements?.fileName || ''}
							onChange={(e) =>
								handleFileRequirementChange('fileName', e.target.value)
							}
							inputSize="select"
						/>
					</div>

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

					{/* Add File Button */}
					<div className="flex justify-end">
						<Button
							onClick={() => {
								// TODO: Implement add file functionality
								// eslint-disable-next-line no-console
								console.log('Add new required file')
							}}
							className="bg-primary hover:bg-primary/90 text-white px-6 py-2"
						>
							Add new required file
						</Button>
					</div>
				</div>
			</div>

			{/* Award Details Section */}
			<div className="border bg-white border-gray-200 rounded-xl p-6 space-y-6">
				<div className="">
					<h2 className="text-2xl font-bold text-primary mb-2">
						Award Details
					</h2>
					<p className="text-muted-foreground">
						Specify the scholarship award information.
					</p>
				</div>

				<div className="space-y-6">
					{/* Award Amount */}
					<div className="space-y-2">
						<Label htmlFor="amount">Award amount</Label>
						<div className="flex items-center gap-2">
							<span className="text-gray-700 font-medium">$</span>
							<Input
								id="amount"
								placeholder="Enter award amount"
								value={formData.awardDetails.amount}
								onChange={(e) => handleAwardChange('amount', e.target.value)}
								inputSize="select"
								className="flex-1"
							/>
							<span className="text-gray-700 font-medium">USD</span>
						</div>
					</div>

					{/* Duration */}
					<div className="space-y-2">
						<Label htmlFor="duration">Duration</Label>
						<CustomSelect
							value={
								formData.awardDetails.duration
									? {
											value: formData.awardDetails.duration,
											label: formData.awardDetails.duration,
										}
									: null
							}
							onChange={(option) =>
								handleAwardChange('duration', option?.value || '')
							}
							placeholder="Choose duration"
							options={[
								{ value: '1 year', label: '1 year' },
								{ value: '2 years', label: '2 years' },
								{ value: '3 years', label: '3 years' },
								{ value: '4 years', label: '4 years' },
								{ value: 'Full program', label: 'Full program' },
							]}
							variant="default"
							isClearable={false}
							className="w-full"
						/>
					</div>

					{/* Renewable */}
					<div className="space-y-2">
						<Label htmlFor="renewable">Renewable</Label>
						<CustomSelect
							value={
								formData.awardDetails.renewable
									? {
											value: formData.awardDetails.renewable,
											label: formData.awardDetails.renewable,
										}
									: null
							}
							onChange={(option) =>
								handleAwardChange('renewable', option?.value || '')
							}
							placeholder="Choose renewal option"
							options={[
								{ value: 'Yes', label: 'Yes' },
								{ value: 'No', label: 'No' },
								{ value: 'Conditional', label: 'Conditional' },
							]}
							variant="default"
							isClearable={false}
							className="w-full"
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
				<Button onClick={onBack} variant="outline">
					Save to draft
				</Button>
				<Button onClick={handleSubmit} variant="primary">
					Submit
				</Button>
			</div>
		</div>
	)
}
