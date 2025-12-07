'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Avatar, AvatarFallback } from '@/components/ui'
import { ProtectedAvatarImage } from '@/components/ui/ProtectedAvatarImage'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { DateInput } from '@/components/ui'
import { Upload, User, Edit3, Save, X } from 'lucide-react'
import { Country, getCountriesWithSvgFlags } from '@/data/countries'
import { formatDateForDisplay } from '@/utils/date/date-utils'
import { useTranslations } from 'next-intl'

// Helper function to convert YYYY-MM-DD to DD/MM/YYYY for DateInput
const convertDateForInput = (dateString: string | undefined | null): string => {
	if (!dateString) return ''

	// If already in DD/MM/YYYY format, return as is
	if (dateString.includes('/')) {
		return dateString
	}

	// If in YYYY-MM-DD format, convert to DD/MM/YYYY
	if (dateString.includes('-') && !dateString.includes('/')) {
		const parts = dateString.split('-')
		if (parts.length === 3) {
			const [year, month, day] = parts
			return `${day}/${month}/${year}`
		}
	}

	// Try to parse as ISO date and convert
	try {
		const date = new Date(dateString)
		if (!isNaN(date.getTime())) {
			const day = date.getDate().toString().padStart(2, '0')
			const month = (date.getMonth() + 1).toString().padStart(2, '0')
			const year = date.getFullYear()
			return `${day}/${month}/${year}`
		}
	} catch (error) {
		// If parsing fails, return empty string
	}

	return ''
}
import { SuccessModal } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { WarningModal } from '@/components/ui'
import { useSimpleWarning } from '@/hooks/ui/useSimpleWarning'

interface ProfileInfoSectionProps {
	profile: any
	subdisciplines: Array<{ value: string; label: string; discipline: string }>
}

export const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
	profile,
	subdisciplines,
}) => {
	const t = useTranslations('profile_info_section')
	const [isEditing, setIsEditing] = useState(false)
	const [editedProfile, setEditedProfile] = useState(profile)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Track if there are unsaved changes
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

	// Subdisciplines will be loaded by parent component and passed down

	// Initialize edited profile when profile changes
	useEffect(() => {
		setEditedProfile(profile)
		setHasUnsavedChanges(false)
	}, [profile])

	// Track changes to detect unsaved modifications
	useEffect(() => {
		if (isEditing && editedProfile) {
			const hasChanges =
				JSON.stringify(editedProfile) !== JSON.stringify(profile)
			setHasUnsavedChanges(hasChanges)
		} else {
			setHasUnsavedChanges(false)
		}
	}, [editedProfile, profile, isEditing])

	const handleSave = async () => {
		setIsSaving(true)
		try {
			// Only send basic profile data
			const basicData = {
				role: profile.role,
				firstName: editedProfile?.firstName || '',
				lastName: editedProfile?.lastName || '',
				gender: editedProfile?.gender || '',
				birthday: editedProfile?.birthday || '',
				email: editedProfile?.user?.email || profile?.user?.email || '',
				nationality: editedProfile?.nationality || '',
				phoneNumber: editedProfile?.phoneNumber || '',
				countryCode: editedProfile?.countryCode || '',
				interests: editedProfile?.interests || [],
				favoriteCountries: editedProfile?.favoriteCountries || [],
				profilePhoto: editedProfile?.profilePhoto || '',
			}

			// Call the main profile update API
			const response = await fetch('/api/profile', {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...profile, // Include all existing profile data
					...basicData, // Override with basic changes
				}),
			})

			const result = await response.json()
			if (!result.success) {
				throw new Error(result.error || 'Failed to update basic profile')
			}

			// Update local state with the saved data
			const updatedProfile = {
				...profile,
				...basicData,
			}
			setEditedProfile(updatedProfile)
			Object.assign(profile, updatedProfile)

			// Show success message
			setShowSuccessModal(true)

			// Dispatch event to update header
			console.log('Dispatching profileUpdated event...')
			window.dispatchEvent(new CustomEvent('profileUpdated'))

			// Exit editing mode
			setIsEditing(false)
			setHasUnsavedChanges(false)
		} catch (error: any) {
			setErrorMessage(error.response?.data?.error || t('errors.save_failed'))
			setShowErrorModal(true)
		} finally {
			setIsSaving(false)
		}
	}

	const handleCancel = () => {
		// Check if there are unsaved changes
		if (hasUnsavedChanges) {
			// Show warning modal instead of directly canceling
			showWarning()
			return
		}
		// No changes, proceed with cancel
		setEditedProfile(profile)
		setIsEditing(false)
		setHasUnsavedChanges(false)
	}

	// Simple warning system
	const {
		showWarningModal,
		handleNavigationAttempt,
		handleSaveAndContinue,
		handleDiscardChanges,
		handleCancelNavigation,
		showWarning,
		isSaving: isWarningSaving,
	} = useSimpleWarning({
		hasUnsavedChanges,
		onSave: handleSave,
		onCancel: () => {
			// Reset form and exit edit mode
			setEditedProfile(profile)
			setIsEditing(false)
			setHasUnsavedChanges(false)
		},
	})

	// Custom handler for canceling the warning modal (stays in edit mode)
	const handleCancelWarning = () => {
		// Just close the modal, stay in edit mode
		handleCancelNavigation()
	}

	// Expose navigation handler to parent
	useEffect(() => {
		// Always expose the handler regardless of onNavigationAttempt prop
		// Use 'profile' as the key to match the section ID
		;(window as any).profileNavigationHandler = handleNavigationAttempt
		return () => {
			delete (window as any).profileNavigationHandler
		}
	}, [handleNavigationAttempt, hasUnsavedChanges])

	const handleFieldChange = (field: string, value: string) => {
		// Validation for name fields - no numbers allowed
		if (field === 'firstName' || field === 'lastName') {
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
			setErrorMessage(t('errors.invalid_image'))
			setShowErrorModal(true)
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			setErrorMessage(t('errors.file_too_large'))
			setShowErrorModal(true)
			return
		}

		setIsUploading(true)

		try {
			// Create FormData for upload
			const formData = new FormData()
			formData.append('file', file)

			// Upload to S3
			const { ApiService } = await import('@/services/api/axios-config')
			const result = await ApiService.uploadFile(file)

			// Update the profile photo with the S3 URL
			handleFieldChange('profilePhoto', result.url)
			setShowSuccessModal(true)
		} catch (error) {
			setErrorMessage(t('errors.upload_failed'))
			setShowErrorModal(true)
		} finally {
			setIsUploading(false)
			// Reset file input
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
		}
	}

	const handleUploadClick = () => {
		fileInputRef.current?.click()
	}

	// Only handle applicant profiles
	if (profile?.role !== 'applicant') {
		return (
			<div className="text-center py-12">
				<div className="text-6xl mb-4">👤</div>
				<h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
				<p className="text-muted-foreground">{t('not_available')}</p>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold mb-2">{t('title')}</h2>
					<p className="text-muted-foreground">{t('description')}</p>
				</div>
				{!isEditing ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
						className="flex items-center gap-2"
					>
						<Edit3 className="h-4 w-4" />
						{t('buttons.edit')}
					</Button>
				) : (
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleCancel}
							className="flex items-center gap-2"
						>
							<X className="h-4 w-4" />
							{t('buttons.cancel')}
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="flex items-center gap-2"
						>
							<Save className="h-4 w-4" />
							{isSaving ? t('buttons.saving') : t('buttons.save')}
						</Button>
					</div>
				)}
			</div>

			{/* Single White Box Container */}
			<Card className="bg-white shadow-sm border">
				<CardContent className="p-6">
					<div className="space-y-6">
						{/* Profile Photo Upload */}
						<div className="flex items-center gap-4">
							<div className="relative">
								<Avatar className="w-20 h-20">
									<ProtectedAvatarImage
										src={editedProfile?.profilePhoto}
										alt="Profile photo"
										expiresIn={7200}
										autoRefresh={true}
									/>
									<AvatarFallback className="bg-orange-500 text-white">
										<User className="w-8 h-8" />
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
							<div className="flex flex-col space-y-2">
								{isEditing && (
									<Button
										variant="outline"
										size="sm"
										onClick={handleUploadClick}
										disabled={isUploading}
									>
										{isUploading
											? t('buttons.uploading')
											: t('buttons.upload_photo')}
									</Button>
								)}
								{isEditing && (
									<p className="text-xs text-muted-foreground">
										{t('photo.instructions')}
									</p>
								)}
							</div>
							{/* Hidden file input */}
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="hidden"
							/>
						</div>

						{/* Form Fields - Applicant only */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">
									{t('fields.first_name.label')}
								</Label>
								{isEditing ? (
									<Input
										id="firstName"
										placeholder={t('fields.first_name.placeholder')}
										value={editedProfile?.firstName || ''}
										onChange={(e) =>
											handleFieldChange('firstName', e.target.value)
										}
										inputSize="select"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.firstName ||
												t('fields.first_name.not_provided')}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">{t('fields.last_name.label')}</Label>
								{isEditing ? (
									<Input
										id="lastName"
										placeholder={t('fields.last_name.placeholder')}
										value={editedProfile?.lastName || ''}
										onChange={(e) =>
											handleFieldChange('lastName', e.target.value)
										}
										inputSize="select"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.lastName || t('fields.last_name.not_provided')}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="gender">{t('fields.gender.label')}</Label>
								{isEditing ? (
									<CustomSelect
										value={
											editedProfile?.gender
												? {
														value: editedProfile.gender,
														label:
															editedProfile.gender === 'male'
																? t('fields.gender.options.male')
																: editedProfile.gender === 'female'
																	? t('fields.gender.options.female')
																	: editedProfile.gender
																			.charAt(0)
																			.toUpperCase() +
																		editedProfile.gender.slice(1),
													}
												: null
										}
										onChange={(option) =>
											handleFieldChange('gender', option?.value || '')
										}
										placeholder={t('fields.gender.placeholder')}
										options={[
											{ value: 'male', label: t('fields.gender.options.male') },
											{
												value: 'female',
												label: t('fields.gender.options.female'),
											},
										]}
										isClearable={false}
										className="w-full"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.gender
												? profile.gender === 'male'
													? t('fields.gender.options.male')
													: profile.gender === 'female'
														? t('fields.gender.options.female')
														: profile.gender
												: t('fields.gender.not_provided')}
										</p>
									</div>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="birthday">{t('fields.birthday.label')}</Label>
								{isEditing ? (
									<DateInput
										id="birthday"
										value={convertDateForInput(editedProfile?.birthday)}
										onChange={(value) => handleFieldChange('birthday', value)}
										placeholder={t('fields.birthday.placeholder')}
										minDate="1900-01-01"
										maxDate={new Date().toISOString().split('T')[0]}
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{formatDateForDisplay(profile?.birthday)}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">{t('fields.email.label')}</Label>
								<div className="px-3 py-2 bg-gray-50 rounded-md">
									<p className="text-sm font-medium text-gray-900">
										{profile?.user?.email || t('fields.email.not_provided')}
									</p>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="nationality">
									{t('fields.nationality.label')}
								</Label>
								{isEditing ? (
									<CustomSelect
										value={
											editedProfile?.nationality
												? getCountriesWithSvgFlags().find(
														(c) =>
															c.name.toLowerCase() ===
															editedProfile.nationality.toLowerCase()
													)
												: null
										}
										onChange={(option) =>
											handleFieldChange('nationality', option?.name || '')
										}
										placeholder={t('fields.nationality.placeholder')}
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
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										{profile?.nationality ? (
											<div className="flex items-center space-x-2">
												{(() => {
													const countryData = getCountriesWithSvgFlags().find(
														(c) =>
															c.name.toLowerCase() ===
															profile.nationality.toLowerCase()
													)
													return (
														<>
															<span className="text-lg">
																{countryData?.flag || '🌐'}
															</span>
															<span className="text-sm font-medium text-gray-900">
																{profile.nationality}
															</span>
														</>
													)
												})()}
											</div>
										) : (
											<p className="text-sm text-gray-500">
												{t('fields.nationality.not_provided')}
											</p>
										)}
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">{t('fields.phone.label')}</Label>
								{isEditing ? (
									<PhoneInput
										value={editedProfile?.phoneNumber || ''}
										countryCode={editedProfile?.countryCode || ''}
										onValueChange={(value) =>
											handleFieldChange('phoneNumber', value)
										}
										onCountryChange={(countryCode) =>
											handleFieldChange('countryCode', countryCode)
										}
										placeholder={t('fields.phone.placeholder')}
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										{profile?.countryCode && profile?.phoneNumber ? (
											<div className="flex items-center space-x-2">
												{(() => {
													const countryData = getCountriesWithSvgFlags().find(
														(c) => c.phoneCode === profile.countryCode
													)
													return (
														<>
															<span className="text-lg">
																{countryData?.flag || '🌐'}
															</span>
															<span className="text-sm font-medium text-gray-900">
																{profile.countryCode} {profile.phoneNumber}
															</span>
														</>
													)
												})()}
											</div>
										) : (
											<p className="text-sm text-gray-500">
												{t('fields.phone.not_provided')}
											</p>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>{t('fields.interests.label')}</Label>
									{isEditing ? (
										<CustomSelect
											value={(editedProfile?.interests || []).map(
												(interest: string) => ({
													value: interest,
													label: interest,
												})
											)}
											onChange={(options) =>
												handleFieldChange(
													'interests',
													options
														? options.map((option: any) => option.value)
														: []
												)
											}
											placeholder={t('fields.interests.placeholder')}
											options={subdisciplines}
											isMulti
											isSearchable
											isClearable
										/>
									) : (
										<div className="px-3 py-2 bg-gray-50 rounded-md">
											{(() => {
												return profile?.interests &&
													profile.interests.length > 0 ? (
													<div className="flex flex-wrap gap-2">
														{profile.interests.map(
															(interest: string, index: number) => (
																<span
																	key={index}
																	className="bg-primary/10 text-primary px-2 py-1 rounded text-xs"
																>
																	{interest}
																</span>
															)
														)}
													</div>
												) : (
													<p className="text-sm text-gray-500">
														{t('fields.interests.not_provided')}
													</p>
												)
											})()}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label>{t('fields.favorite_countries.label')}</Label>
									{isEditing ? (
										<CustomSelect
											value={(editedProfile?.favoriteCountries || []).map(
												(country: string) => {
													const countryData = getCountriesWithSvgFlags().find(
														(c) =>
															c.name.toLowerCase() === country.toLowerCase()
													)
													return {
														value: country,
														label: country,
														...countryData,
													}
												}
											)}
											onChange={(options) =>
												handleFieldChange(
													'favoriteCountries',
													options
														? options.map((option: any) => option.value)
														: []
												)
											}
											placeholder={t('fields.favorite_countries.placeholder')}
											options={getCountriesWithSvgFlags().map((country) => ({
												value: country.name,
												label: country.name,
												...country,
											}))}
											formatOptionLabel={(option: any) => (
												<div className="flex items-center space-x-2">
													<span className="text-lg">{option.flag}</span>
													<span>{option.name}</span>
												</div>
											)}
											isMulti
											isClearable
											isSearchable
											filterOption={(option, inputValue) => {
												const country = option.data
												return country.name
													.toLowerCase()
													.includes(inputValue.toLowerCase())
											}}
										/>
									) : (
										<div className="px-3 py-2 bg-gray-50 rounded-md">
											{(() => {
												return profile?.favoriteCountries &&
													profile.favoriteCountries.length > 0 ? (
													<div className="flex flex-wrap gap-2">
														{profile.favoriteCountries.map(
															(country: string, index: number) => {
																const countryData =
																	getCountriesWithSvgFlags().find(
																		(c) =>
																			c.name.toLowerCase() ===
																			country.toLowerCase()
																	)
																return (
																	<span
																		key={index}
																		className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center space-x-1"
																	>
																		<span className="text-sm">
																			{countryData?.flag || '🌐'}
																		</span>
																		<span>{country}</span>
																	</span>
																)
															}
														)}
													</div>
												) : (
													<p className="text-sm text-gray-500">
														{t('fields.favorite_countries.not_provided')}
													</p>
												)
											})()}
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={() => setShowSuccessModal(false)}
				title={t('success.title')}
				message={t('success.message')}
				buttonText={t('success.button')}
			/>

			{/* Error Modal */}
			<ErrorModal
				isOpen={showErrorModal}
				onClose={() => setShowErrorModal(false)}
				title={t('error.title')}
				message={errorMessage}
				buttonText={t('error.button')}
			/>

			{/* Simple Warning Modal */}
			<WarningModal
				isOpen={showWarningModal}
				onSaveAndContinue={handleSaveAndContinue}
				onDiscardChanges={handleDiscardChanges}
				onCancel={handleCancelWarning}
				isSaving={isWarningSaving}
			/>
		</div>
	)
}
