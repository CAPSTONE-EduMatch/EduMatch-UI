'use client'

import {
	Button,
	CustomSelect,
	FileUploadManager,
	FileUploadManagerWithOCR,
	Label,
} from '@/components/ui'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'
import { ProfileFormData } from '@/services/profile/profile-service'
import { useState } from 'react'
// import { FileValidationResult } from '@/services/ai/file-validation-service'
import { ProtectedImg } from '@/components/ui/ProtectedImage'
import { FileValidationNotification } from '@/components/validation/FileValidationNotification'
import { FileValidationResult } from '@/services/ai/ollama-file-validation-service'
import { Info } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
	const t = useTranslations('create_profile.institution_details')
	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const {
		subdisciplines: disciplines = [],
		isLoadingSubdisciplines: isLoadingDisciplines,
		subdisciplinesError: disciplinesError,
		refetchSubdisciplines,
	} = useDisciplinesContext()

	// Note: OCR results are no longer displayed to user

	// Validation notifications state
	interface ValidationNotification {
		id: string
		validation: FileValidationResult
		fileName: string
		expectedFileType: string
	}
	const [validationNotifications, setValidationNotifications] = useState<
		ValidationNotification[]
	>([])
	const [isAnyFileUploading, setIsAnyFileUploading] = useState(false)

	const handleCategoryFilesUploaded = (category: string, files: any[]) => {
		// Add to existing files instead of replacing
		const existingFiles =
			(formData[category as keyof ProfileFormData] as any[]) || []
		const updatedFiles = [...existingFiles, ...files]
		onInputChange(category as keyof ProfileFormData, updatedFiles as any)

		// Clear verification error if verification documents are uploaded
		if (
			category === 'institutionVerificationDocuments' &&
			updatedFiles.length > 0
		) {
			setVerificationError(null)
		}
	}

	const handleCoverImageUpload = (files: any[]) => {
		if (files && files.length > 0) {
			const uploadedFile = files[0]
			// The file object should have a url property after upload
			const imageUrl = uploadedFile.url

			if (imageUrl) {
				// Update the form data with the image URL
				onInputChange('institutionCoverImage', imageUrl)
			} else {
				// eslint-disable-next-line no-console
				console.error(
					'Cover image uploaded but URL not found in file object:',
					uploadedFile
				)
			}
		}
	}

	const getAllFiles = () => {
		return formData.institutionVerificationDocuments || []
	}

	// State for validation error
	const [verificationError, setVerificationError] = useState<string | null>(
		null
	)

	// Handle next button with validation
	const handleNext = () => {
		// Check if verification documents are uploaded
		if (
			!formData.institutionVerificationDocuments ||
			formData.institutionVerificationDocuments.length === 0
		) {
			setVerificationError(
				'Please upload at least one verification document to continue.'
			)
			return
		}

		// Clear error if validation passes
		setVerificationError(null)
		onNext()
	}

	// Function to handle OCR completion for institution verification
	const handleOCRComplete = async (fileId: string, extractedText: string) => {
		// OCR completed - extracted text saved internally
		// No UI display needed
		// Validation will be handled by `handleValidationComplete` callback
	}

	// Function to dismiss validation notification
	const dismissValidationNotification = (notificationId: string) => {
		setValidationNotifications((prev) =>
			prev.filter((n) => n.id !== notificationId)
		)
	}

	// Function to handle validation completion from FileUploadManagerWithOCR
	const handleValidationComplete = (
		fileId: string,
		validation: FileValidationResult
	) => {
		// Show validation notification if file is invalid or needs reupload
		if (
			!validation.isValid ||
			validation.action === 'reupload' ||
			validation.confidence < 0.7
		) {
			const notification: ValidationNotification = {
				id: `${fileId}-${Date.now()}`,
				validation,
				fileName:
					(formData.institutionVerificationDocuments || []).find(
						(f: any) => f.id === fileId
					)?.name || `File ${fileId.slice(-8)}`,
				expectedFileType: 'institution-verification',
			}

			setValidationNotifications((prev) => {
				const filtered = prev.filter((n) => !n.id.startsWith(fileId))
				return [...filtered, notification]
			})

			if (validation.isValid && validation.confidence < 0.7) {
				setTimeout(() => {
					setValidationNotifications((prev) =>
						prev.filter((n) => n.id !== notification.id)
					)
				}, 10000)
			}
		}
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground mb-2">
					{t('title')}
				</h2>
				<p className="text-muted-foreground">{t('subtitle')}</p>
			</div>

			{/* Validation Notifications */}
			{validationNotifications.length > 0 && (
				<div className="space-y-3">
					{validationNotifications.map((notification) => (
						<FileValidationNotification
							key={notification.id}
							validation={notification.validation}
							fileName={notification.fileName}
							expectedFileType={notification.expectedFileType}
							onDismiss={() => dismissValidationNotification(notification.id)}
						/>
					))}
				</div>
			)}

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
						{t('subdisciplines.label')} <span className="text-red-500">*</span>
					</Label>

					{isLoadingDisciplines ? (
						<div className="flex items-center justify-center p-4 border border-gray-200 rounded-lg">
							<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
							<span className="text-sm text-muted-foreground">
								{t('subdisciplines.loading')}
							</span>
						</div>
					) : disciplinesError ? (
						<div className="p-4 border border-red-200 rounded-lg bg-red-50">
							<p className="text-sm text-red-600">
								{disciplinesError?.message || t('subdisciplines.error')}
							</p>
							<Button
								variant="outline"
								size="sm"
								onClick={() => {
									refetchSubdisciplines()
								}}
								className="mt-2"
							>
								{t('subdisciplines.retry')}
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
							placeholder={t('subdisciplines.placeholder')}
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
						{t('cover_image.label')}
					</Label>

					{/* Display uploaded cover image */}
					{formData.institutionCoverImage && (
						<div className="mb-4">
							<div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
								<ProtectedImg
									src={formData.institutionCoverImage}
									alt="Institution Cover"
									className="w-full h-full object-cover"
									expiresIn={7200}
									autoRefresh={true}
									fallback={
										<div className="w-full h-full bg-gray-200 flex items-center justify-center">
											<div className="text-gray-400 text-sm">
												{t('cover_image.failed_to_load')}
											</div>
										</div>
									}
								/>
								<button
									onClick={() => onInputChange('institutionCoverImage', '')}
									className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 z-10"
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
									{t('cover_image.remove')}
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
				<div className="flex items-center gap-1">
					<Label className="text-sm font-medium text-foreground">
						{t('verification_documents.label')}{' '}
						<span className="text-red-500">*</span>
					</Label>
					<Tooltip
						content={t('verification_documents.tooltip')}
						maxWidth={350}
						align="left"
					>
						<Info className="h-4 w-4" />
					</Tooltip>
				</div>
				<FileUploadManagerWithOCR
					onFilesUploaded={(files) => {
						handleCategoryFilesUploaded(
							'institutionVerificationDocuments',
							files
						)
						setIsAnyFileUploading(false)
					}}
					onFileSelectionStart={() => setIsAnyFileUploading(true)}
					onProcessingComplete={() => setIsAnyFileUploading(false)}
					isGloballyDisabled={isAnyFileUploading}
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
					enableOCR={true}
					onOCRComplete={handleOCRComplete}
					onValidationComplete={handleValidationComplete}
				/>
				{formData.institutionVerificationDocuments &&
					formData.institutionVerificationDocuments.length > 0 && (
						<div className="text-xs text-green-600">
							{t('verification_documents.uploaded', {
								count: formData.institutionVerificationDocuments.length,
							})}
						</div>
					)}
				{verificationError && (
					<div className="text-xs text-red-600 mt-2">{verificationError}</div>
				)}
			</div>

			{/* Manage Files Button */}
			{getAllFiles().length > 0 && (
				<div className="flex justify-center pt-6">
					<Button variant="outline" onClick={onShowManageModal} size="sm">
						{t('manage_files', { count: getAllFiles().length })}
					</Button>
				</div>
			)}

			{/* Navigation Buttons */}
			<div className="flex justify-between pt-8">
				<Button size="sm" variant="outline" onClick={onBack}>
					{t('back')}
				</Button>
				<Button size="sm" onClick={handleNext}>
					{t('next')}
				</Button>
			</div>
		</div>
	)
}
