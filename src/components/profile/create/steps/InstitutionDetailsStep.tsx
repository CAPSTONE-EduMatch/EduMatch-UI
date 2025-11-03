'use client'

import React, { useState, useEffect } from 'react'
import { ProfileFormData } from '@/services/profile/profile-service'
import { Label } from '@/components/ui'
import { Button } from '@/components/ui'
import { FileUploadManager } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { ApiService } from '@/services/api/axios-config'

interface InstitutionDetailsStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: any) => void
	onMultiSelectChange: (
		field: keyof ProfileFormData
	) => (values: string[]) => void
	onBack: () => void
	onNext: () => void
	onShowManageModal: () => void
}

export function InstitutionDetailsStep({
	formData,
	onInputChange,
	onMultiSelectChange,
	onBack,
	onNext,
	onShowManageModal,
}: InstitutionDetailsStepProps) {
	// State for disciplines loaded from database
	const [disciplines, setDisciplines] = useState<
		Array<{ value: string; label: string; discipline: string }>
	>([])
	const [isLoadingDisciplines, setIsLoadingDisciplines] = useState(true)
	const [disciplinesError, setDisciplinesError] = useState<string | null>(null)

	// Load disciplines from database
	useEffect(() => {
		const loadDisciplines = async () => {
			try {
				setIsLoadingDisciplines(true)
				setDisciplinesError(null)
				const response = await ApiService.getSubdisciplines()
				if (response.success) {
					setDisciplines(response.subdisciplines)
				} else {
					setDisciplinesError('Failed to load disciplines')
				}
			} catch (error) {
				setDisciplinesError('Failed to load disciplines from database')
			} finally {
				setIsLoadingDisciplines(false)
			}
		}
		loadDisciplines()
	}, [])

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

					{isLoadingDisciplines ? (
						<div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
							<span className="text-sm text-muted-foreground">
								Loading disciplines...
							</span>
						</div>
					) : disciplinesError ? (
						<div className="p-4 border border-red-200 rounded-lg bg-red-50">
							<p className="text-sm text-red-600">{disciplinesError}</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									setDisciplinesError(null)
									setIsLoadingDisciplines(true)
									// Retry loading
									const loadDisciplines = async () => {
										try {
											const response = await ApiService.getSubdisciplines()
											if (response.success) {
												setDisciplines(response.subdisciplines)
											} else {
												setDisciplinesError('Failed to load disciplines')
											}
										} catch (error) {
											setDisciplinesError(
												'Failed to load disciplines from database'
											)
										} finally {
											setIsLoadingDisciplines(false)
										}
									}
									loadDisciplines()
								}}
								className="mt-2"
							>
								Retry
							</Button>
						</div>
					) : (
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
					)}
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
