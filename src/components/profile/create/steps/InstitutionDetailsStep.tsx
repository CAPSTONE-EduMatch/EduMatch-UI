'use client'

import React from 'react'
import { ProfileFormData } from '@/types/profile'
import { Label } from '@/components/ui/label'
import Button from '@/components/ui/Button'
import { FileUploadManager } from '@/components/ui/file-upload-manager'
import { CustomSelect } from '@/components/ui/custom-select'

interface InstitutionDetailsStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: any) => void
	onMultiSelectChange: (
		field: keyof ProfileFormData
	) => (values: string[]) => void
	onFilesUploaded: (files: any[]) => void
	onBack: () => void
	onNext: () => void
	onShowManageModal: () => void
}

export function InstitutionDetailsStep({
	formData,
	onInputChange,
	onMultiSelectChange,
	onFilesUploaded,
	onBack,
	onNext,
	onShowManageModal,
}: InstitutionDetailsStepProps) {
	const disciplines = [
		{ value: 'Computer Science', label: 'Computer Science' },
		{ value: 'Business Administration', label: 'Business Administration' },
		{ value: 'Engineering', label: 'Engineering' },
		{ value: 'Medicine', label: 'Medicine' },
		{ value: 'Law', label: 'Law' },
		{ value: 'Arts & Humanities', label: 'Arts & Humanities' },
		{ value: 'Sciences', label: 'Sciences' },
		{ value: 'Social Sciences', label: 'Social Sciences' },
		{ value: 'Education', label: 'Education' },
		{ value: 'Architecture', label: 'Architecture' },
		{ value: 'Agriculture', label: 'Agriculture' },
		{ value: 'Veterinary Science', label: 'Veterinary Science' },
		{ value: 'Other', label: 'Other' },
	]

	const handleCategoryFilesUploaded = (category: string, files: any[]) => {
		// Add to existing files instead of replacing
		const existingFiles =
			(formData[category as keyof ProfileFormData] as any[]) || []
		const updatedFiles = [...existingFiles, ...files]
		onInputChange(category as keyof ProfileFormData, updatedFiles as any)
	}

	const handleCoverImageUpload = (files: any[]) => {
		if (files.length > 0) {
			onInputChange('institutionCoverImage', files[0].url)
		}
	}

	const getAllFiles = () => {
		return formData.institutionVerificationDocuments || []
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground mb-2">
					Institution Details
				</h2>
				<p className="text-muted-foreground">
					Select disciplines and upload verification documents
				</p>
			</div>

			{/* Disciplines Selection - For Universities and Research Labs */}
			{((typeof formData.institutionType === 'string' &&
				(formData.institutionType === 'university' ||
					formData.institutionType === 'research-lab')) ||
				(typeof formData.institutionType === 'object' &&
					((formData.institutionType as any)?.value === 'university' ||
						(formData.institutionType as any)?.value === 'research-lab')) ||
				!formData.institutionType) && (
				<div className="space-y-4">
					<Label className="text-sm font-medium text-foreground">
						Institution Sub-Disciplines <span className="text-red-500">*</span>
					</Label>
					<CustomSelect
						options={disciplines}
						value={
							formData.institutionDisciplines?.map((discipline) => ({
								value: discipline,
								label: discipline,
							})) || []
						}
						onChange={(selectedOptions) => {
							const values = selectedOptions
								? selectedOptions.map((option: any) => option.value)
								: []
							onMultiSelectChange('institutionDisciplines')(values)
						}}
						placeholder="Select sub-disciplines..."
						isMulti
						isClearable
						className="w-full"
						isSearchable
						maxSelectedHeight="120px"
					/>
				</div>
			)}

			{/* Cover Image Upload - Only for Universities */}
			{((typeof formData.institutionType === 'string' &&
				formData.institutionType === 'university') ||
				(typeof formData.institutionType === 'object' &&
					(formData.institutionType as any)?.value === 'university') ||
				!formData.institutionType) && (
				<div className="space-y-4">
					<Label className="text-sm font-medium text-foreground">
						Institution Cover Image
					</Label>

					{/* Display uploaded cover image */}
					{formData.institutionCoverImage && (
						<div className="mb-4">
							<div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
								<img
									src={formData.institutionCoverImage}
									alt="Institution Cover"
									className="w-full h-full object-cover"
								/>
								<button
									onClick={() => onInputChange('institutionCoverImage', '')}
									className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
								>
									×
								</button>
							</div>
							<div className="text-center mt-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => onInputChange('institutionCoverImage', '')}
								>
									Remove Image
								</Button>
							</div>
						</div>
					)}

					{/* Upload area - only show if no image uploaded */}
					{!formData.institutionCoverImage && (
						<FileUploadManager
							onFilesUploaded={handleCoverImageUpload}
							category="institution-cover"
							acceptedTypes={['image/*']}
							maxSize={5}
							maxFiles={1}
							showPreview={false}
							className="w-full"
						/>
					)}
				</div>
			)}

			{/* Verification Documents Upload */}
			<div className="space-y-4">
				<Label className="text-sm font-medium text-foreground">
					Verification Documents <span className="text-red-500">*</span>
				</Label>
				<FileUploadManager
					onFilesUploaded={(files) =>
						handleCategoryFilesUploaded(
							'institutionVerificationDocuments',
							files
						)
					}
					category="institution-verification"
					maxFiles={10}
					acceptedTypes={[
						'application/pdf',
						'application/msword',
						'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						'image/jpeg',
						'image/png',
						'image/jpg',
					]}
					maxSize={10}
					showPreview={false}
					className="w-full"
				/>
				{formData.institutionVerificationDocuments &&
					formData.institutionVerificationDocuments.length > 0 && (
						<div className="text-xs text-green-600">
							{formData.institutionVerificationDocuments.length} file(s)
							uploaded
						</div>
					)}
			</div>

			{/* Manage Files Button */}
			{getAllFiles().length > 0 && (
				<div className="flex justify-center pt-6">
					<Button variant="outline" onClick={onShowManageModal} size="sm">
						Manage Files ({getAllFiles().length})
					</Button>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex justify-between pt-8">
				<Button size="sm" variant="outline" onClick={onBack}>
					Back
				</Button>
				<Button size="sm" onClick={onNext}>
					Next
				</Button>
			</div>
		</div>
	)
}
