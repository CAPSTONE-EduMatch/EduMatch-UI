'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Avatar, AvatarFallback } from '@/components/ui'
import { ProtectedAvatarImage } from '@/components/ui/ProtectedAvatarImage'
import { ProtectedImage } from '@/components/ui/ProtectedImage'
import {
	openSessionProtectedFile,
	downloadSessionProtectedFile,
} from '@/utils/files/getSessionProtectedFileUrl'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { Upload, Building2, Download, Trash2, X } from 'lucide-react'
import { getCountriesWithSvgFlags } from '@/data/countries'
import { SuccessModal } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { Modal } from '@/components/ui'
import { FileUploadManagerWithOCR } from '@/components/ui/layout/file-upload-manager-with-ocr'
import { FileValidationResult } from '@/services/ai/file-validation-service'
import { ApiService, apiClient } from '@/services/api/axios-config'
import { useAuthCheck } from '@/hooks/auth/useAuthCheck'
import { useDisciplinesContext } from '@/contexts/DisciplinesContext'

interface InstitutionProfileSectionProps {
	profile?: any
	onProfileUpdate?: () => Promise<void>
	onEditingChange?: (isEditing: boolean) => void
}

export const InstitutionProfileSection: React.FC<
	InstitutionProfileSectionProps
> = ({ profile: propProfile, onProfileUpdate, onEditingChange }) => {
	const [profile, setProfile] = useState<any>(propProfile)
	const [isEditing, setIsEditing] = useState(false)

	// Notify parent when editing state changes
	useEffect(() => {
		if (onEditingChange) {
			onEditingChange(isEditing)
		}
	}, [isEditing, onEditingChange])
	const [editedProfile, setEditedProfile] = useState(profile)
	const [isSaving, setIsSaving] = useState(false)
	const [loading, setLoading] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [showAdminReviewModal, setShowAdminReviewModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [hasPendingInfoRequests, setHasPendingInfoRequests] = useState(false)

	// Check for pending info requests on mount and when profile changes
	useEffect(() => {
		const checkPendingRequests = async () => {
			try {
				const response = await fetch('/api/institution/info-requests', {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
				})

				if (response.ok) {
					const result = await response.json()
					if (result.success && result.data) {
						setHasPendingInfoRequests(result.data.length > 0)
					}
				}
			} catch (error) {
				// Silently fail - not critical
			}
		}

		checkPendingRequests()
	}, [profile])
	const [activeTab, setActiveTab] = useState<
		'overview' | 'verification' | 'cover'
	>('overview')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const verificationFileInputRef = useRef<HTMLInputElement>(null)
	const coverImageInputRef = useRef<HTMLInputElement>(null)
	const [verificationDocuments, setVerificationDocuments] = useState<any[]>([])
	const [originalVerificationDocuments, setOriginalVerificationDocuments] =
		useState<any[]>([])
	const [deletedDocumentIds, setDeletedDocumentIds] = useState<string[]>([])
	const [isUploadingDocument, setIsUploadingDocument] = useState(false)
	const [isUploadingCoverImage, setIsUploadingCoverImage] = useState(false)

	// Use shared disciplines context (loaded once at layout level, cached by React Query)
	const {
		subdisciplines = [],
		isLoadingSubdisciplines: isLoadingDisciplines,
		refetchSubdisciplines,
	} = useDisciplinesContext()

	// Use the authentication check hook
	const { isAuthenticated } = useAuthCheck()

	const loadVerificationDocuments = useCallback(async () => {
		try {
			// Load verification documents from dedicated endpoint
			const response = await apiClient.get('/api/institution/documents')
			const documents = response.data.documents || []

			// Transform to match component format
			const transformedDocs = documents.map((doc: any) => ({
				id: doc.document_id,
				name: doc.name,
				originalName: doc.name,
				url: doc.url,
				size: doc.size,
				fileSize: doc.size,
				fileType: doc.documentType?.name || 'Unknown',
				category: 'verification',
			}))

			setVerificationDocuments(transformedDocs)
			setOriginalVerificationDocuments(transformedDocs)
		} catch (error) {
			// eslint-disable-next-line no-console
			console.error('Failed to load verification documents:', error)
			setVerificationDocuments([])
			setOriginalVerificationDocuments([])
		}
	}, [])

	// Load profile data on component mount
	useEffect(() => {
		const loadProfile = async () => {
			if (!isAuthenticated) return

			// If profile is passed as prop, use it
			if (propProfile) {
				setProfile(propProfile)
				setEditedProfile(propProfile)
				loadVerificationDocuments()
				return
			}

			// Otherwise, load from API
			setLoading(true)
			try {
				const data = await ApiService.getProfile()
				const profileData = data.profile
				setProfile(profileData)
				setEditedProfile(profileData)
				loadVerificationDocuments()
			} catch (error: any) {
				setErrorMessage('Failed to load profile. Please try again.')
				setShowErrorModal(true)
			} finally {
				setLoading(false)
			}
		}

		loadProfile()
	}, [isAuthenticated, propProfile, loadVerificationDocuments])

	const handleSave = async () => {
		// If there are pending info requests, show warning modal first
		if (hasPendingInfoRequests) {
			setShowAdminReviewModal(true)
			return
		}

		await performSave()
	}

	const handleConfirmAdminReview = async () => {
		setShowAdminReviewModal(false)
		await performSave()
	}

	const performSave = async () => {
		setIsSaving(true)
		try {
			// Validate phone numbers and country codes before saving
			const { getCountriesWithSvgFlags } = await import('@/data/countries')
			const { isValidPhoneNumber } = await import('libphonenumber-js')
			const validCountries = getCountriesWithSvgFlags()

			// Validate institution hotline
			const institutionCode = editedProfile?.institutionHotlineCode
			const institutionPhone = editedProfile?.institutionHotline

			if (institutionCode && institutionPhone) {
				const fullInstitutionNumber = `${institutionCode}${institutionPhone}`
				const selectedCountry = validCountries.find(
					(country) => country.phoneCode === institutionCode
				)

				if (selectedCountry) {
					const isValidInstitutionNumber = isValidPhoneNumber(
						fullInstitutionNumber,
						selectedCountry.code as any
					)
					if (!isValidInstitutionNumber) {
						setErrorMessage(
							`Please enter a valid phone number for ${selectedCountry.name} (${institutionCode})`
						)
						setShowErrorModal(true)
						setIsSaving(false)
						return
					}
				}
			}

			// Validate representative phone
			const representativeCode = editedProfile?.representativePhoneCode
			const representativePhone = editedProfile?.representativePhone

			if (representativeCode && representativePhone) {
				const fullRepresentativeNumber = `${representativeCode}${representativePhone}`
				const selectedCountry = validCountries.find(
					(country) => country.phoneCode === representativeCode
				)

				if (selectedCountry) {
					const isValidRepresentativeNumber = isValidPhoneNumber(
						fullRepresentativeNumber,
						selectedCountry.code as any
					)
					if (!isValidRepresentativeNumber) {
						setErrorMessage(
							`Please enter a valid phone number for ${selectedCountry.name} (${representativeCode})`
						)
						setShowErrorModal(true)
						setIsSaving(false)
						return
					}
				}
			}

			// NOTE: Documents are NOT auto-saved here
			// They will only be saved when the profile is confirmed via the Confirm button
			// This prevents duplicate documents and ensures documents are only saved when user explicitly confirms

			const { ApiService } = await import('@/services/api/axios-config')

			// Prepare the profile data for saving
			const profileData = {
				role: profile.role, // Include the role field
				firstName: editedProfile?.firstName || '',
				lastName: editedProfile?.lastName || '',
				gender: editedProfile?.gender || '',
				birthday: editedProfile?.birthday || '',
				nationality: editedProfile?.nationality || '',
				phoneNumber: editedProfile?.phoneNumber || '',
				countryCode: editedProfile?.countryCode || '',
				interests: editedProfile?.interests || [],
				favoriteCountries: editedProfile?.favoriteCountries || [],
				profilePhoto: editedProfile?.profilePhoto || '',
				// Institution fields
				institutionName: editedProfile?.institutionName || '',
				institutionAbbreviation: editedProfile?.institutionAbbreviation || '',
				institutionType: editedProfile?.institutionType || '',
				institutionWebsite: editedProfile?.institutionWebsite || '',
				institutionHotline: editedProfile?.institutionHotline || '',
				institutionHotlineCode: editedProfile?.institutionHotlineCode || '',
				institutionAddress: editedProfile?.institutionAddress || '',
				institutionCountry: editedProfile?.institutionCountry || '',
				representativeName: editedProfile?.representativeName || '',
				representativePosition: editedProfile?.representativePosition || '',
				representativeEmail: editedProfile?.representativeEmail || '',
				representativePhone: editedProfile?.representativePhone || '',
				representativePhoneCode: editedProfile?.representativePhoneCode || '',
				// Overview fields
				aboutInstitution: editedProfile?.aboutInstitution || '',
				institutionDisciplines: editedProfile?.institutionDisciplines || [],
				institutionCoverImage: editedProfile?.institutionCoverImage || '',
				// Include verification documents - they will be saved when profile is confirmed
				// The API will check for duplicates by URL before saving
				verificationDocuments: verificationDocuments.map((doc) => ({
					id: doc.id,
					name: doc.name || doc.originalName,
					originalName: doc.originalName || doc.name,
					url: doc.url,
					size: doc.size || doc.fileSize,
					fileSize: doc.fileSize || doc.size,
					fileType: doc.fileType,
					category: doc.category || 'verification',
				})),
			}

			// Delete removed documents from database before saving
			if (deletedDocumentIds.length > 0) {
				try {
					await Promise.all(
						deletedDocumentIds.map((docId) =>
							apiClient.delete(`/api/institution/documents?documentId=${docId}`)
						)
					)
				} catch (error) {
					// eslint-disable-next-line no-console
					console.error('Failed to delete some documents:', error)
					// Continue with save even if some deletions fail
				}
			}

			// Call the update profile API
			await ApiService.updateProfile(profileData)

			// Clear deleted document IDs after successful save
			setDeletedDocumentIds([])
			setOriginalVerificationDocuments(verificationDocuments)

			// Refresh profile data
			try {
				const data = await ApiService.getProfile()
				const updatedProfile = data.profile
				setProfile(updatedProfile)
				setEditedProfile(updatedProfile)
				loadVerificationDocuments()
			} catch (error) {
				setErrorMessage('Failed to refresh profile. Please try again.')
				setShowErrorModal(true)
				setIsSaving(false)
				return
			}

			// Exit editing mode first
			setIsEditing(false)

			// Show success message
			setShowSuccessModal(true)
		} catch (error: any) {
			setErrorMessage(
				error.response?.data?.error ||
					'Failed to save profile. Please try again.'
			)
			setShowErrorModal(true)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		setEditedProfile(profile)
		setIsEditing(false)
		// Restore original verification documents and clear deleted IDs
		setVerificationDocuments(originalVerificationDocuments)
		setDeletedDocumentIds([])
	}

	const handleFieldChange = (field: string, value: string) => {
		// Validation for name fields - no numbers allowed
		if (field === 'institutionName' || field === 'representativeName') {
			// Remove any numbers and special characters, keep only letters and spaces
			const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, '')
			setEditedProfile((prev: any) => ({
				...prev,
				[field]: lettersAndSpaces,
			}))
		} else {
			setEditedProfile((prev: any) => ({
				...prev,
				[field]: value,
			}))
		}
	}

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setErrorMessage('Please select an image file')
			setShowErrorModal(true)
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			setErrorMessage('File size must be less than 5MB')
			setShowErrorModal(true)
			return
		}

		try {
			// Upload to S3
			const { ApiService } = await import('@/services/api/axios-config')
			const result = await ApiService.uploadFile(file)

			// Update the profile photo with the S3 URL
			handleFieldChange('profilePhoto', result.url)
			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage('Failed to upload image. Please try again.')
			setShowErrorModal(true)
		} finally {
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	const handleDeleteLogo = async () => {
		if (!isEditing) return

		try {
			// Update the profile to remove logo
			const profileData = {
				role: profile.role,
				profilePhoto: '',
			}
			await ApiService.updateProfile(profileData)

			// Update local state
			handleFieldChange('profilePhoto', '')
			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage('Failed to delete logo. Please try again.')
			setShowErrorModal(true)
		}
	}

	const handleDeleteCoverImage = async () => {
		if (!isEditing) return

		try {
			// Update the profile to remove cover image
			const profileData = {
				role: profile.role,
				institutionCoverImage: '',
			}
			await ApiService.updateProfile(profileData)

			// Update local state
			handleFieldChange('institutionCoverImage', '')
			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage('Failed to delete cover image. Please try again.')
			setShowErrorModal(true)
		}
	}

	const handleVerificationDocumentUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const files = Array.from(event.target.files || [])
		if (files.length === 0) return

		// Validate file types (PDF, DOC, DOCX, JPG, PNG)
		const allowedTypes = [
			'application/pdf',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'image/jpeg',
			'image/png',
		]

		// Check all files for valid types
		const invalidFiles = files.filter(
			(file) => !allowedTypes.includes(file.type)
		)
		if (invalidFiles.length > 0) {
			setErrorMessage(
				`Please select valid documents (PDF, DOC, DOCX, JPG, PNG). Invalid files: ${invalidFiles.map((f) => f.name).join(', ')}`
			)
			setShowErrorModal(true)
			return
		}

		// Validate file sizes (10MB max per file)
		const oversizedFiles = files.filter((file) => file.size > 10 * 1024 * 1024)
		if (oversizedFiles.length > 0) {
			setErrorMessage(
				`File size must be less than 10MB. Oversized files: ${oversizedFiles.map((f) => f.name).join(', ')}`
			)
			setShowErrorModal(true)
			return
		}

		setIsUploadingDocument(true)

		try {
			// Upload all files to S3
			const { ApiService } = await import('@/services/api/axios-config')
			const uploadPromises = files.map((file) =>
				ApiService.uploadFile(file, 'verification')
			)
			const results = await Promise.all(uploadPromises)

			// Create new document objects for all uploaded files
			const newDocuments = results.map((result, index) => ({
				id: result.id,
				name: result.originalName || files[index].name,
				originalName: result.originalName || files[index].name,
				fileName: result.fileName,
				size: result.fileSize || files[index].size,
				fileSize: result.fileSize || files[index].size,
				url: result.url,
				fileType: result.fileType || files[index].type,
				category: 'verification',
			}))

			// Save ONLY the newly uploaded documents to database using dedicated endpoint
			await apiClient.post('/api/institution/documents', {
				documents: newDocuments,
			})

			// Add to existing verification documents for display
			const updatedVerificationDocuments = [
				...verificationDocuments,
				...newDocuments,
			]

			// Update local state
			setVerificationDocuments(updatedVerificationDocuments)
			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage('Failed to upload documents. Please try again.')
			setShowErrorModal(true)
		} finally {
			setIsUploadingDocument(false)
			// Reset file input
			if (verificationFileInputRef.current) {
				verificationFileInputRef.current.value = ''
			}
		}
	}

	const handleVerificationUploadClick = () => {
		verificationFileInputRef.current?.click()
	}

	const handleCoverImageUpload = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			setErrorMessage('Please select an image file')
			setShowErrorModal(true)
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			setErrorMessage('File size must be less than 5MB')
			setShowErrorModal(true)
			return
		}

		setIsUploadingCoverImage(true)

		try {
			// Upload to S3
			const { ApiService } = await import('@/services/api/axios-config')
			const result = await ApiService.uploadFile(file)

			// Update the cover image with the S3 URL
			handleFieldChange('institutionCoverImage', result.url)

			// Save the cover image to the profile immediately
			const profileData = {
				role: profile.role, // Required field for API
				institutionCoverImage: result.url,
			}
			await ApiService.updateProfile(profileData)

			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage('Failed to upload cover image. Please try again.')
			setShowErrorModal(true)
		} finally {
			setIsUploadingCoverImage(false)
			// Reset file input
			if (coverImageInputRef.current) {
				coverImageInputRef.current.value = ''
			}
		}
	}

	const handleCoverImageUploadClick = () => {
		coverImageInputRef.current?.click()
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const handlePreviewDocument = (doc: any) => {
		try {
			if (doc.url && doc.url !== '#' && doc.url !== '') {
				openSessionProtectedFile(doc.url)
			} else {
				setErrorMessage('Document not available for preview')
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage('Failed to preview document. Please try again.')
			setShowErrorModal(true)
		}
	}

	const handleDownloadDocument = async (doc: any) => {
		try {
			if (doc.url && doc.url !== '#' && doc.url !== '') {
				await downloadSessionProtectedFile(
					doc.url,
					doc.name || doc.originalName || 'document'
				)
			} else {
				setErrorMessage('Document URL is not available')
				setShowErrorModal(true)
			}
		} catch (error) {
			setErrorMessage(
				`Failed to download document. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
			)
			setShowErrorModal(true)
		}
	}

	const handleRemoveVerificationDocument = (index: number) => {
		const docToDelete = verificationDocuments[index]
		if (!docToDelete || !docToDelete.id) {
			return
		}

		// Remove from local state (will be saved when user clicks Confirm)
		const updatedDocs = verificationDocuments.filter((_, i) => i !== index)
		setVerificationDocuments(updatedDocs)

		// Track deleted document ID if it was originally loaded from database
		if (
			originalVerificationDocuments.some((doc) => doc.id === docToDelete.id)
		) {
			setDeletedDocumentIds((prev) => [...prev, docToDelete.id])
		}
	}

	return (
		<div className="space-y-6">
			{loading && (
				<div className="flex items-center justify-center py-8">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
						<p className="mt-2 text-sm text-muted-foreground">
							Loading profile...
						</p>
					</div>
				</div>
			)}

			{!loading && (
				<>
					<div className="flex gap-6">
						{/* Left Panel - Institution Profile Information */}
						<Card className="bg-white shadow-sm border lg:col-span-1 h-[750px] w-1/3">
							<CardContent className="p-6 h-full flex flex-col">
								<div className="space-y-6 flex-1">
									{/* Institution Header with Logo */}
									<div className="flex items-center gap-4">
										<div className="relative group">
											<Avatar className="w-16 h-16">
												<ProtectedAvatarImage
													src={editedProfile?.profilePhoto}
													alt="Institution logo"
													expiresIn={7200}
													autoRefresh={true}
												/>
												<AvatarFallback className="bg-blue-500 text-white">
													<Building2 className="w-8 h-8" />
												</AvatarFallback>
											</Avatar>
											{isEditing && (
												<>
													<div
														className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
														onClick={handleUploadClick}
														title="Upload logo"
													>
														<Upload className="w-3 h-3 text-primary-foreground" />
													</div>
													{editedProfile?.profilePhoto && (
														<button
															onClick={handleDeleteLogo}
															className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
															title="Delete logo"
														>
															<X className="w-3 h-3 text-white" />
														</button>
													)}
												</>
											)}
										</div>
										<div className="flex-1">
											{isEditing ? (
												<div className="space-y-2">
													<Input
														placeholder="Institution Name"
														value={editedProfile?.institutionName || ''}
														onChange={(e) =>
															handleFieldChange(
																'institutionName',
																e.target.value
															)
														}
														className="text-lg font-bold h-8"
														inputSize="select"
													/>
													<Input
														placeholder="Abbreviation"
														value={editedProfile?.institutionAbbreviation || ''}
														onChange={(e) =>
															handleFieldChange(
																'institutionAbbreviation',
																e.target.value
															)
														}
														className="text-sm text-gray-600 h-8"
														inputSize="select"
													/>
												</div>
											) : (
												<div>
													<h2 className="text-lg font-bold text-gray-900">
														{profile?.institutionName || 'Institution Name'}
													</h2>
													<p className="text-sm text-gray-600">
														{profile?.institutionAbbreviation || 'Abbreviation'}
													</p>
												</div>
											)}
										</div>
									</div>

									{/* Institution Details */}
									<div className="space-y-4">
										<div className="border-t pt-4">
											<h3 className="font-semibold text-gray-900 mb-3">
												Institution Details
											</h3>
											<div className={`space-y-3 ${!isEditing ? 'mb-6' : ''}`}>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Email:
													</span>
													<span className="text-sm font-medium w-full">
														{profile?.user?.email || 'Not provided'}
													</span>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Website link:
													</span>
													{isEditing ? (
														<input
															value={editedProfile?.institutionWebsite || ''}
															onChange={(e) =>
																handleFieldChange(
																	'institutionWebsite',
																	e.target.value
																)
															}
															className="w-full h-8 px-4 py-2.5 text-sm bg-[#F5F7FB] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300"
															placeholder="https://example.org"
														/>
													) : (
														<span className="text-sm font-medium w-full">
															{profile?.institutionWebsite ||
																'https://example.org'}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Hotline:
													</span>
													{isEditing ? (
														<PhoneInput
															value={editedProfile?.institutionHotline || ''}
															countryCode={
																editedProfile?.institutionHotlineCode || '+84'
															}
															onValueChange={(value) =>
																handleFieldChange('institutionHotline', value)
															}
															onCountryChange={(countryCode) =>
																handleFieldChange(
																	'institutionHotlineCode',
																	countryCode
																)
															}
															placeholder="0123456789"
															className="w-full"
															height="h-9"
														/>
													) : (
														(() => {
															const hotlineCode =
																profile?.institutionHotlineCode || '+84'
															const hotlineCountry =
																getCountriesWithSvgFlags().find(
																	(c) => c.phoneCode === hotlineCode
																)
															return (
																<div className="flex items-center gap-2">
																	{hotlineCountry?.flag && (
																		<span className="text-base">
																			{hotlineCountry.flag}
																		</span>
																	)}
																	<span className="text-sm font-medium">
																		{hotlineCode}{' '}
																		{profile?.institutionHotline ||
																			'0123456789'}
																	</span>
																</div>
															)
														})()
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Address:
													</span>
													{isEditing ? (
														<input
															value={editedProfile?.institutionAddress || ''}
															onChange={(e) =>
																handleFieldChange(
																	'institutionAddress',
																	e.target.value
																)
															}
															className="w-full h-8 px-4 py-2.5 text-sm bg-[#F5F7FB] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300"
															placeholder="111 Street D1"
														/>
													) : (
														<span className="text-sm font-medium w-full">
															{profile?.institutionAddress || '111 Street D1'}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Country:
													</span>
													{isEditing ? (
														<CustomSelect
															value={
																editedProfile?.institutionCountry
																	? getCountriesWithSvgFlags().find(
																			(c) =>
																				c.name.toLowerCase() ===
																				editedProfile.institutionCountry.toLowerCase()
																		)
																	: null
															}
															onChange={(option) =>
																handleFieldChange(
																	'institutionCountry',
																	option?.name || ''
																)
															}
															placeholder="Select country"
															options={getCountriesWithSvgFlags()}
															formatOptionLabel={(option: any) => (
																<div className="flex items-center space-x-2">
																	<span className="text-lg">{option.flag}</span>
																	<span>{option.name}</span>
																</div>
															)}
															getOptionValue={(option: any) => option.name}
															isSearchable
															className="w-full"
														/>
													) : (
														(() => {
															const countryName =
																profile?.institutionCountry || 'Viet Nam'
															const countryData =
																getCountriesWithSvgFlags().find(
																	(c) =>
																		c.name.toLowerCase() ===
																		countryName.toLowerCase()
																)
															return (
																<div className="flex items-center gap-2">
																	{countryData?.flag && (
																		<span className="text-base">
																			{countryData.flag}
																		</span>
																	)}
																	<span className="text-sm font-medium">
																		{countryName}
																	</span>
																</div>
															)
														})()
													)}
												</div>
											</div>
										</div>

										{/* Representative Information */}
										<div className="border-t pt-4">
											<h3 className="font-semibold text-gray-900 mb-3">
												Representative Information:
											</h3>
											<div className={`space-y-3 ${!isEditing ? 'mb-6' : ''}`}>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Name:
													</span>
													{isEditing ? (
														<input
															value={editedProfile?.representativeName || ''}
															onChange={(e) =>
																handleFieldChange(
																	'representativeName',
																	e.target.value
																)
															}
															className="w-full h-8 px-4 py-2.5 text-sm bg-[#F5F7FB] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300"
															placeholder="Anna Smith"
														/>
													) : (
														<span className="text-sm font-medium w-full">
															{profile?.representativeName || 'Anna Smith'}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Position:
													</span>
													{isEditing ? (
														<input
															value={
																editedProfile?.representativePosition || ''
															}
															onChange={(e) =>
																handleFieldChange(
																	'representativePosition',
																	e.target.value
																)
															}
															className="w-full h-8 px-4 py-2.5 text-sm bg-[#F5F7FB] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300"
															placeholder="CEO"
														/>
													) : (
														<span className="text-sm font-medium w-full">
															{profile?.representativePosition || 'CEO'}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Email:
													</span>
													{isEditing ? (
														<input
															value={editedProfile?.representativeEmail || ''}
															onChange={(e) =>
																handleFieldChange(
																	'representativeEmail',
																	e.target.value
																)
															}
															className="w-full h-8 px-4 py-2.5 text-sm bg-[#F5F7FB] border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300"
															placeholder="example123@gmail.com"
														/>
													) : (
														<span className="text-sm font-medium w-full">
															{profile?.representativeEmail ||
																'example123@gmail.com'}
														</span>
													)}
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Phone:
													</span>
													{isEditing ? (
														<PhoneInput
															value={editedProfile?.representativePhone || ''}
															countryCode={
																editedProfile?.representativePhoneCode || '+84'
															}
															onValueChange={(value) =>
																handleFieldChange('representativePhone', value)
															}
															onCountryChange={(countryCode) =>
																handleFieldChange(
																	'representativePhoneCode',
																	countryCode
																)
															}
															placeholder="0909090909090"
															className="w-full"
															height="h-9"
														/>
													) : (
														(() => {
															const phoneCode =
																profile?.representativePhoneCode || '+84'
															const phoneCountry =
																getCountriesWithSvgFlags().find(
																	(c) => c.phoneCode === phoneCode
																)
															return (
																<div className="flex items-center gap-2">
																	{phoneCountry?.flag && (
																		<span className="text-base">
																			{phoneCountry.flag}
																		</span>
																	)}
																	<span className="text-sm font-medium">
																		{phoneCode}{' '}
																		{profile?.representativePhone ||
																			'0909090909090'}
																	</span>
																</div>
															)
														})()
													)}
												</div>
											</div>
										</div>
									</div>
									{/* Action Buttons */}
									<div className="flex justify-end pt-4 flex-shrink-0">
										{!isEditing ? (
											// Only show edit button if profile is not approved
											profile?.verification_status !== 'APPROVED' && (
												<Button
													onClick={() => setIsEditing(true)}
													size="sm"
													data-edit-profile-button
												>
													Edit Profile
												</Button>
											)
										) : (
											<div className="flex gap-2">
												<Button
													variant="outline"
													onClick={handleCancel}
													size="sm"
													data-cancel-profile-button
												>
													Cancel
												</Button>
												<Button
													onClick={handleSave}
													size="sm"
													disabled={isSaving}
													data-save-profile-button
												>
													{isSaving ? 'Saving...' : 'Confirm'}
												</Button>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Right Panel - Verification Documents */}
						<Card className="bg-white shadow-sm border lg:col-span-1 h-[750px] w-2/3">
							<CardContent className="p-6 h-full flex flex-col">
								<div className="flex flex-col flex-1">
									{/* Navigation Tabs */}
									<div className="flex border-b flex-shrink-0">
										<button
											onClick={() => setActiveTab('overview')}
											className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
												activeTab === 'overview'
													? 'border-primary text-primary'
													: 'border-transparent text-gray-500 hover:text-gray-700'
											}`}
										>
											Overview
										</button>
										{profile?.institutionType === 'university' && (
											<button
												onClick={() => setActiveTab('cover')}
												className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
													activeTab === 'cover'
														? 'border-primary text-primary'
														: 'border-transparent text-gray-500 hover:text-gray-700'
												}`}
											>
												Cover Image
											</button>
										)}
										<button
											onClick={() => setActiveTab('verification')}
											className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
												activeTab === 'verification'
													? 'border-primary text-primary'
													: 'border-transparent text-gray-500 hover:text-gray-700'
											}`}
										>
											Verification documents
										</button>
									</div>

									{/* Tab Content - Scrollable */}
									<div className="flex-1 overflow-hidden max-h-[650px]">
										{activeTab === 'overview' && (
											<div className="p-4 space-y-6">
												{/* Institution Description */}
												<div>
													<h3 className="font-semibold text-gray-900 mb-3">
														Description
													</h3>
													{isEditing ? (
														<textarea
															value={editedProfile?.aboutInstitution || ''}
															onChange={(e) =>
																handleFieldChange(
																	'aboutInstitution',
																	e.target.value
																)
															}
															className="w-full h-32 px-4 py-3 text-sm bg-[#F5F7FB] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all duration-300 resize-none"
															placeholder="Describe your institution..."
														/>
													) : (
														<div className="bg-gray-50 rounded-lg p-4">
															{editedProfile?.aboutInstitution ? (
																<p className="text-gray-700 leading-relaxed">
																	{editedProfile.aboutInstitution}
																</p>
															) : (
																<p className="text-gray-500 italic">
																	No description provided yet
																</p>
															)}
														</div>
													)}
												</div>

												{/* Institution Disciplines - Only for Universities and Research Labs */}
												{((typeof editedProfile?.institutionType === 'string' &&
													(editedProfile.institutionType === 'university' ||
														editedProfile.institutionType ===
															'research-lab')) ||
													(typeof editedProfile?.institutionType === 'object' &&
														((editedProfile.institutionType as any)?.value ===
															'university' ||
															(editedProfile.institutionType as any)?.value ===
																'research-lab')) ||
													!editedProfile?.institutionType) && (
													<div>
														<h3 className="font-semibold text-gray-900 mb-3">
															Disciplines
														</h3>
														{isEditing ? (
															<div className="space-y-2">
																{isLoadingDisciplines ? (
																	<div className="text-sm text-gray-500">
																		Loading disciplines...
																	</div>
																) : (
																	<CustomSelect
																		options={subdisciplines}
																		value={
																			editedProfile?.institutionDisciplines?.map(
																				(discipline: string) => ({
																					value: discipline,
																					label: discipline,
																				})
																			) || []
																		}
																		onChange={(selectedOptions) => {
																			const values = selectedOptions
																				? selectedOptions.map(
																						(option: any) => option.value
																					)
																				: []
																			handleFieldChange(
																				'institutionDisciplines',
																				values
																			)
																		}}
																		placeholder="Select subdisciplines..."
																		isMulti
																		isClearable
																		className="w-full"
																		isSearchable
																		maxSelectedHeight="120px"
																	/>
																)}
															</div>
														) : (
															<>
																{editedProfile?.institutionDisciplines &&
																editedProfile.institutionDisciplines.length >
																	0 ? (
																	<div className="flex flex-wrap gap-2">
																		{editedProfile.institutionDisciplines.map(
																			(discipline: string, index: number) => (
																				<span
																					key={index}
																					className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
																				>
																					{discipline}
																				</span>
																			)
																		)}
																	</div>
																) : (
																	<div className="bg-gray-50 rounded-lg p-4">
																		<p className="text-gray-500 italic">
																			No disciplines selected yet
																		</p>
																	</div>
																)}
															</>
														)}
													</div>
												)}
											</div>
										)}

										{activeTab === 'cover' && (
											<div
												className="h-full flex flex-col"
												onDragEnter={(e) => {
													e.preventDefault()
													e.stopPropagation()
													if (isEditing) {
														e.currentTarget.classList.add(
															'border-green-500',
															'bg-green-50',
															'shadow-lg'
														)
													}
												}}
												onDragOver={(e) => {
													e.preventDefault()
													e.stopPropagation()
													if (isEditing) {
														e.currentTarget.classList.add(
															'border-green-500',
															'bg-green-50',
															'shadow-lg'
														)
													}
												}}
												onDragLeave={(e) => {
													e.preventDefault()
													e.stopPropagation()
													if (isEditing) {
														e.currentTarget.classList.remove(
															'border-green-500',
															'bg-green-50',
															'shadow-lg'
														)
													}
												}}
												onDrop={(e) => {
													e.preventDefault()
													e.stopPropagation()
													if (isEditing) {
														e.currentTarget.classList.remove(
															'border-green-500',
															'bg-green-50',
															'shadow-lg'
														)

														const files = Array.from(e.dataTransfer.files)
														const imageFiles = files.filter((file) =>
															file.type.startsWith('image/')
														)

														if (imageFiles.length > 0) {
															// Create a fake event object for the existing handler
															const fakeEvent = {
																target: { files: [imageFiles[0]] },
															} as unknown as React.ChangeEvent<HTMLInputElement>
															handleCoverImageUpload(fakeEvent)
														} else {
															// Show error for non-image files
															setErrorMessage('Please drop only image files')
															setShowErrorModal(true)
														}
													}
												}}
											>
												{/* Upload Button - Fixed at top */}
												{isEditing && (
													<div className="flex justify-between items-center mb-4 flex-shrink-0 px-4 pt-4">
														<h3 className="font-semibold text-gray-900">
															Institution Cover Image
														</h3>
														<Button
															onClick={handleCoverImageUploadClick}
															disabled={isUploadingCoverImage}
															size="sm"
															className="flex items-center gap-2"
														>
															<Upload className="w-4 h-4" />
															{isUploadingCoverImage
																? 'Uploading...'
																: 'Upload Cover Image'}
														</Button>
													</div>
												)}

												{/* Cover Image Section */}
												<div className="flex-1 flex flex-col items-center justify-center p-6">
													<div className="w-full max-w-4xl">
														{!isEditing && (
															<h3 className="font-semibold text-gray-900 mb-6 text-center text-xl">
																Institution Cover Image
															</h3>
														)}

														{/* Current Cover Image */}
														{editedProfile?.institutionCoverImage ? (
															<div className="space-y-6">
																<div className="relative group">
																	<ProtectedImage
																		src={editedProfile.institutionCoverImage}
																		alt="Institution Cover"
																		width={800}
																		height={320}
																		className="w-full h-80 object-cover rounded-xl border-2 border-gray-200 shadow-lg"
																		expiresIn={7200}
																		autoRefresh={true}
																	/>
																	{isEditing && (
																		<button
																			onClick={handleDeleteCoverImage}
																			className="absolute top-4 right-4 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center cursor-pointer hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
																			title="Delete cover image"
																		>
																			<X className="w-4 h-4" />
																		</button>
																	)}
																</div>
																{isEditing && (
																	<div className="flex justify-center">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={handleDeleteCoverImage}
																			className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
																		>
																			<Trash2 className="w-4 h-4" />
																			Remove Cover Image
																		</Button>
																	</div>
																)}
															</div>
														) : (
															<div className="text-center space-y-6">
																{/* No Image State */}
																<div className="w-full h-80 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center p-8">
																	{isEditing ? (
																		<>
																			<div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
																				<Upload className="w-8 h-8 text-gray-500" />
																			</div>
																			<h4 className="text-lg font-semibold text-gray-700 mb-2">
																				Upload Cover Image
																			</h4>
																			<p className="text-gray-500 mb-4 max-w-md">
																				Drag and drop an image file anywhere in
																				this area, or click the upload button
																				above
																			</p>
																			<div className="text-xs text-gray-400 space-y-1">
																				<p>
																					• Only image files (JPG, PNG, GIF,
																					etc.)
																				</p>
																				<p>• Maximum file size: 5MB</p>
																				<p>
																					• Recommended size: 1200x400px or
																					larger
																				</p>
																			</div>
																		</>
																	) : (
																		<>
																			<div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4">
																				<Building2 className="w-10 h-10 text-gray-400" />
																			</div>
																			<h4 className="text-lg font-semibold text-gray-700 mb-2">
																				No Cover Image
																			</h4>
																			<p className="text-gray-500">
																				No cover image has been uploaded yet
																			</p>
																		</>
																	)}
																</div>
															</div>
														)}
													</div>
												</div>
											</div>
										)}

										{activeTab === 'verification' && (
											<div className="h-full flex flex-col">
												{/* Upload Section with OCR - Only show when editing */}
												{isEditing && (
													<div className="flex-shrink-0 px-4 pt-4 mb-4">
														<h3 className="font-semibold text-gray-900 mb-4">
															Verification Documents
														</h3>
														<FileUploadManagerWithOCR
															onFilesUploaded={(files: any[]) => {
																const updatedDocs = [
																	...verificationDocuments,
																	...files,
																]
																setVerificationDocuments(updatedDocs)
															}}
															category="institution-verification"
															acceptedTypes={[
																'application/pdf',
																'application/msword',
																'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
																'image/jpeg',
																'image/png',
															]}
															maxSize={10}
															maxFiles={10}
															showPreview={false}
															enableOCR={true}
															onOCRComplete={(
																fileId: string,
																extractedText: string
															) => {
																// Auto-fill institution verification data if available
																console.log(
																	'Institution verification OCR:',
																	extractedText
																)
															}}
															onValidationComplete={(
																fileId: string,
																validation: FileValidationResult
															) => {
																// Handle validation results
																console.log(
																	'Institution verification validation:',
																	validation
																)
															}}
														/>
													</div>
												)}

												{/* Documents List - Scrollable */}
												<div
													className={`flex-1 overflow-y-auto px-4 pb-4 min-h-0 ${!isEditing ? 'pt-4' : ''}`}
												>
													{!isEditing && (
														<h3 className="font-semibold text-gray-900 mb-4">
															Verification Documents
														</h3>
													)}
													{verificationDocuments.length > 0 ? (
														<div className="space-y-3">
															{verificationDocuments.map((doc, index) => (
																<div
																	key={doc.id}
																	className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
																>
																	<div className="flex items-center gap-3">
																		<span className="text-2xl">📄</span>
																		<div>
																			<p className="font-medium text-sm">
																				{doc.name ||
																					doc.originalName ||
																					'Document'}
																			</p>
																			<p className="text-sm text-muted-foreground">
																				{formatFileSize(
																					doc.size || doc.fileSize || 0
																				)}
																				{doc.fileType
																					? ` • ${doc.fileType}`
																					: ''}
																			</p>
																		</div>
																	</div>
																	<div className="flex items-center gap-2">
																		<button
																			onClick={() => handlePreviewDocument(doc)}
																			className="text-primary hover:text-primary/80 text-sm font-medium"
																		>
																			View
																		</button>
																		<button
																			onClick={() => {
																				handleDownloadDocument(doc)
																			}}
																			className="text-gray-400 hover:text-gray-600 p-1"
																		>
																			<Download className="h-4 w-4" />
																		</button>
																		{isEditing && (
																			<button
																				onClick={() =>
																					handleRemoveVerificationDocument(
																						index
																					)
																				}
																				className="text-red-400 hover:text-red-600 p-1"
																				title="Delete document"
																			>
																				{/* <Trash2 className="h-4 w-4" /> */}
																				<X className="h-3 w-3" />
																			</button>
																		)}
																	</div>
																</div>
															))}
														</div>
													) : (
														<div className="text-center py-8">
															<Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
															<p className="text-gray-500 mb-4">
																No verification documents uploaded yet
															</p>
															{isEditing && (
																<p className="text-sm text-gray-400">
																	Use the upload section above to add
																	verification documents
																</p>
															)}
														</div>
													)}
												</div>
											</div>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Hidden file input for profile photo */}
					<input
						ref={fileInputRef}
						type="file"
						accept="image/*"
						onChange={handleFileSelect}
						className="hidden"
					/>

					{/* Hidden file input for verification documents */}
					<input
						ref={verificationFileInputRef}
						type="file"
						accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
						multiple
						onChange={handleVerificationDocumentUpload}
						className="hidden"
					/>

					{/* Hidden file input for cover image */}
					<input
						ref={coverImageInputRef}
						type="file"
						accept="image/*"
						onChange={handleCoverImageUpload}
						className="hidden"
					/>

					{/* Success Modal */}
					<SuccessModal
						isOpen={showSuccessModal}
						onClose={async () => {
							setShowSuccessModal(false)
							// Call the onProfileUpdate callback after modal is closed
							// This ensures the modal is visible before any context updates
							if (onProfileUpdate) {
								try {
									await onProfileUpdate()
								} catch (error) {
									// Silently handle callback errors to not disrupt user experience
									// eslint-disable-next-line no-console
									console.error('Error in onProfileUpdate callback:', error)
								}
							}
						}}
						title="Success!"
						message="Your profile has been updated successfully."
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

					{/* Admin Review Warning Modal */}
					<Modal
						isOpen={showAdminReviewModal}
						onClose={() => setShowAdminReviewModal(false)}
					>
						<div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 relative">
							<div className="text-center">
								<div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
									<svg
										className="h-6 w-6 text-yellow-600"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
										/>
									</svg>
								</div>

								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									Submit Changes for Review
								</h3>
								<p className="text-sm text-gray-600 mb-6">
									Your changes will be submitted to the administrator for
									review. The profile will be updated once approved.
								</p>

								<div className="flex gap-3 justify-center">
									<Button
										variant="outline"
										onClick={() => setShowAdminReviewModal(false)}
										disabled={isSaving}
										className="min-w-[120px]"
										size="sm"
									>
										Cancel
									</Button>
									<Button
										onClick={handleConfirmAdminReview}
										disabled={isSaving}
										className="min-w-[120px] bg-orange-600 hover:bg-orange-700 text-white"
										size="sm"
									>
										{isSaving ? 'Submitting...' : 'Submit'}
									</Button>
								</div>
							</div>
						</div>
					</Modal>
				</>
			)}
		</div>
	)
}
