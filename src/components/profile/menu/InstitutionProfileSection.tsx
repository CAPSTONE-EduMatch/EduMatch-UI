'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PhoneInput } from '@/components/ui/phone-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { Upload, Building2, Download } from 'lucide-react'
import { getCountriesWithSvgFlags } from '@/data/countries'
import SuccessModal from '@/components/ui/SuccessModal'
import ErrorModal from '@/components/ui/ErrorModal'

interface InstitutionProfileSectionProps {
	profile: any
}

export const InstitutionProfileSection: React.FC<
	InstitutionProfileSectionProps
> = ({ profile }) => {
	const [isEditing, setIsEditing] = useState(false)
	const [editedProfile, setEditedProfile] = useState(profile)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [activeTab, setActiveTab] = useState<'overview' | 'verification'>(
		'overview'
	)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const verificationFileInputRef = useRef<HTMLInputElement>(null)
	const [verificationDocuments, setVerificationDocuments] = useState<any[]>([])
	const [isUploadingDocument, setIsUploadingDocument] = useState(false)

	// Load real data on component mount
	useEffect(() => {
		if (profile) {
			setEditedProfile(profile)
		}
		loadVerificationDocuments()
	}, [profile])

	const loadVerificationDocuments = async () => {
		try {
			// Load verification documents from the profile data
			if (profile?.verificationDocuments) {
				setVerificationDocuments(profile.verificationDocuments)
			} else {
				setVerificationDocuments([])
			}
		} catch (error) {
			console.error('Failed to load verification documents:', error)
			// Set empty array on error as well
			setVerificationDocuments([])
		}
	}

	const handleSave = async () => {
		setIsSaving(true)
		try {
			// Import ApiService dynamically
			const { ApiService } = await import('@/lib/axios-config')

			// Prepare the profile data for saving
			const profileData = {
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
				// Include verification documents
				verificationDocuments: verificationDocuments,
			}

			// Call the update profile API
			await ApiService.updateProfile(profileData)

			// Update the original profile with the edited data
			Object.assign(profile, editedProfile)

			// Also update the editedProfile state to reflect the saved data
			setEditedProfile({ ...editedProfile })

			// Show success message
			setShowSuccessModal(true)

			// Exit editing mode
			setIsEditing(false)
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
			const { ApiService } = await import('@/lib/axios-config')
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
			const { ApiService } = await import('@/lib/axios-config')
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

			// Add to existing verification documents
			const updatedVerificationDocuments = [
				...verificationDocuments,
				...newDocuments,
			]

			// Update the profile with the new verification documents
			const profileData = {
				// Include all existing profile fields
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
				institutionHotline: editedProfile?.institutionHotline || '',
				institutionHotlineCode: editedProfile?.institutionHotlineCode || '',
				institutionType: editedProfile?.institutionType || '',
				institutionWebsite: editedProfile?.institutionWebsite || '',
				institutionEmail: editedProfile?.institutionEmail || '',
				institutionCountry: editedProfile?.institutionCountry || '',
				institutionAddress: editedProfile?.institutionAddress || '',
				representativeName: editedProfile?.representativeName || '',
				representativePosition: editedProfile?.representativePosition || '',
				representativeEmail: editedProfile?.representativeEmail || '',
				representativePhone: editedProfile?.representativePhone || '',
				representativePhoneCode: editedProfile?.representativePhoneCode || '',
				// Add verification documents to the profile data
				verificationDocuments: updatedVerificationDocuments,
			}

			// Save to database
			await ApiService.updateProfile(profileData)

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

	const handlePreviewDocument = (doc: any) => {
		try {
			if (doc.url && doc.url !== '#' && doc.url !== '') {
				window.open(doc.url, '_blank')
			} else {
				setErrorMessage('Document not available for preview')
				setShowErrorModal(true)
			}
		} catch (error) {
			console.error('Preview error:', error)
			setErrorMessage('Failed to preview document. Please try again.')
			setShowErrorModal(true)
		}
	}

	const handleDownloadDocument = async (doc: any) => {
		try {
			if (doc.url && doc.url !== '#' && doc.url !== '') {
				console.log('Downloading document:', doc)

				// Try to fetch the file first to ensure it's accessible
				const response = await fetch(doc.url, {
					method: 'GET',
					mode: 'cors',
				})

				if (response.ok) {
					// Get the blob from the response
					const blob = await response.blob()

					// Create a blob URL
					const blobUrl = window.URL.createObjectURL(blob)

					// Create a temporary anchor element to trigger download
					const link = document.createElement('a')
					link.href = blobUrl
					link.download = doc.name || doc.originalName || 'document'
					link.style.display = 'none'
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)

					// Clean up the blob URL
					window.URL.revokeObjectURL(blobUrl)
				} else {
					// If fetch fails, try the direct download method
					const link = document.createElement('a')
					link.href = doc.url
					link.download = doc.name || doc.originalName || 'document'
					link.target = '_blank'
					link.style.display = 'none'
					document.body.appendChild(link)
					link.click()
					document.body.removeChild(link)
				}
			} else {
				setErrorMessage('Document URL is not available')
				setShowErrorModal(true)
			}
		} catch (error) {
			console.error('Download error:', error)
			console.log('Document object:', doc)

			// Fallback: try to open in new tab
			try {
				window.open(doc.url, '_blank')
			} catch (fallbackError) {
				setErrorMessage(
					`Failed to download document. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
				)
				setShowErrorModal(true)
			}
		}
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Panel - Institution Profile Information */}
				<Card className="bg-white shadow-sm border lg:col-span-1">
					<CardContent className="p-6">
						<div className="space-y-6">
							{/* Institution Header with Logo */}
							<div className="flex items-center gap-4">
								<div className="relative">
									<Avatar className="w-16 h-16">
										<AvatarImage
											src={editedProfile?.profilePhoto || '/profile.svg'}
										/>
										<AvatarFallback className="bg-blue-500 text-white">
											<Building2 className="w-8 h-8" />
										</AvatarFallback>
									</Avatar>
									{isEditing && (
										<div
											className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center cursor-pointer"
											onClick={handleUploadClick}
										>
											<Upload className="w-3 h-3 text-primary-foreground" />
										</div>
									)}
								</div>
								<div className="flex-1">
									{isEditing ? (
										<div className="space-y-2">
											<Input
												placeholder="Institution Name"
												value={editedProfile?.institutionName || ''}
												onChange={(e) =>
													handleFieldChange('institutionName', e.target.value)
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
									<div className="space-y-3">
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
													{profile?.institutionWebsite || 'https://example.org'}
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
													height="h-8"
												/>
											) : (
												<span className="text-sm font-medium w-full">
													{profile?.institutionHotlineCode || '+84'}{' '}
													{profile?.institutionHotline || '0123456789'}
												</span>
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
												<span className="text-sm font-medium w-full">
													{profile?.institutionCountry || 'Viet Nam'}
												</span>
											)}
										</div>
									</div>
								</div>

								{/* Representative Information */}
								<div className="border-t pt-4">
									<h3 className="font-semibold text-gray-900 mb-3">
										Representative Information:
									</h3>
									<div className="space-y-3">
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
													value={editedProfile?.representativePosition || ''}
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
													height="h-8"
												/>
											) : (
												<span className="text-sm font-medium w-full">
													{profile?.representativePhoneCode || '+84'}{' '}
													{profile?.representativePhone || '0909090909090'}
												</span>
											)}
										</div>
									</div>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex justify-end pt-4">
								{!isEditing ? (
									<Button onClick={() => setIsEditing(true)} size="sm">
										Edit Profile
									</Button>
								) : (
									<div className="flex gap-2">
										<Button variant="outline" onClick={handleCancel} size="sm">
											Cancel
										</Button>
										<Button onClick={handleSave} size="sm" disabled={isSaving}>
											{isSaving ? 'Saving...' : 'Confirm'}
										</Button>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Right Panel - Verification Documents */}
				<Card className="bg-white shadow-sm border lg:col-span-2">
					<CardContent className="p-6">
						<div className="space-y-4">
							{/* Navigation Tabs */}
							<div className="flex border-b">
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

							{/* Tab Content */}
							{activeTab === 'overview' && (
								<div className="text-center py-8">
									<p className="text-gray-500">
										Overview content will be displayed here
									</p>
								</div>
							)}

							{activeTab === 'verification' && (
								<div className="space-y-4">
									{/* Upload Button - Always visible */}
									<div className="flex justify-between items-center mb-4">
										<h3 className="font-semibold text-gray-900">
											Verification Documents
										</h3>
										<Button
											onClick={handleVerificationUploadClick}
											disabled={isUploadingDocument}
											size="sm"
											className="flex items-center gap-2"
										>
											<Upload className="w-4 h-4" />
											{isUploadingDocument
												? 'Uploading...'
												: 'Upload Documents'}
										</Button>
									</div>

									{/* Documents List */}
									{verificationDocuments.length > 0 ? (
										<div className="space-y-3">
											{verificationDocuments.map((doc) => (
												<div
													key={doc.id}
													className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
												>
													<div className="flex items-center gap-3">
														<div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
															<Building2 className="w-5 h-5 text-gray-600" />
														</div>
														<div>
															<h4 className="font-medium text-gray-900">
																{doc.name || doc.originalName || 'Document'}
															</h4>
															<div className="flex items-center gap-4 text-sm text-gray-500">
																<span>
																	{((doc.size || doc.fileSize) / 1024).toFixed(
																		1
																	)}{' '}
																	KB
																</span>
																<span>{doc.fileType || 'Unknown type'}</span>
															</div>
														</div>
													</div>
													<div className="flex items-center gap-2">
														<button
															onClick={() => handlePreviewDocument(doc)}
															className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
														>
															Preview
														</button>
														<button
															onClick={() => {
																console.log(
																	'Download button clicked for document:',
																	doc
																)
																handleDownloadDocument(doc)
															}}
															className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
															title="Download document"
														>
															<Download className="w-4 h-4 text-gray-600" />
														</button>
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
										</div>
									)}
								</div>
							)}
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

			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
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
		</div>
	)
}
