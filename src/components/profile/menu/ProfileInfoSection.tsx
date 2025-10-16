'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { DateInput } from '@/components/ui'
import { Upload, User, Building2, Edit3, Save, X } from 'lucide-react'
import { Country, getCountriesWithSvgFlags } from '@/data/countries'
import { formatDateForDisplay } from '@/lib/date-utils'
import { SuccessModal } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { WarningModal } from '@/components/ui'
import { useSimpleWarning } from '@/hooks/useSimpleWarning'
import { InstitutionProfileSection } from '../institution/menu/InstitutionProfileSection'

interface ProfileInfoSectionProps {
	profile: any
	onNavigationAttempt?: (targetSection: string) => boolean
}

export const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
	profile,
	onNavigationAttempt,
}) => {
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

	// Initialize edited profile when profile changes
	useEffect(() => {
		console.log('ProfileInfoSection - Profile received:', profile)
		console.log('ProfileInfoSection - Interests:', profile?.interests)
		console.log(
			'ProfileInfoSection - Favorite countries:',
			profile?.favoriteCountries
		)
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
				institutionEmail: editedProfile?.institutionEmail || '',
				institutionCountry: editedProfile?.institutionCountry || '',
				representativeName: editedProfile?.representativeName || '',
				representativePosition: editedProfile?.representativePosition || '',
			}

			console.log('ProfileInfoSection - Sending profile data:', profileData)
			console.log(
				'ProfileInfoSection - Interests being sent:',
				profileData.interests
			)
			console.log(
				'ProfileInfoSection - Favorite countries being sent:',
				profileData.favoriteCountries
			)

			// Call the update profile API
			await ApiService.updateProfile(profileData)

			// Update the original profile with the edited data
			Object.assign(profile, editedProfile)

			// Show success message
			setShowSuccessModal(true)

			// Exit editing mode
			setIsEditing(false)
			setHasUnsavedChanges(false)
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
		console.log(
			'ProfileInfoSection - Navigation handler exposed:',
			handleNavigationAttempt
		)
		console.log('ProfileInfoSection - Has unsaved changes:', hasUnsavedChanges)
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

	// Function to get certificate options based on selected language
	const getCertificateOptions = (language: string) => {
		switch (language) {
			case 'English':
				return [
					{ value: 'IELTS', label: 'IELTS' },
					{ value: 'TOEFL', label: 'TOEFL' },
					{ value: 'TOEIC', label: 'TOEIC' },
					{ value: 'Cambridge', label: 'Cambridge' },
					{ value: 'PTE', label: 'PTE Academic' },
					{ value: 'Duolingo', label: 'Duolingo English Test' },
				]
			case 'Spanish':
				return [
					{ value: 'DELE', label: 'DELE' },
					{ value: 'SIELE', label: 'SIELE' },
					{ value: 'CELU', label: 'CELU' },
				]
			case 'French':
				return [
					{ value: 'DELF', label: 'DELF' },
					{ value: 'DALF', label: 'DALF' },
					{ value: 'TCF', label: 'TCF' },
					{ value: 'TEF', label: 'TEF' },
				]
			case 'German':
				return [
					{ value: 'Goethe', label: 'Goethe-Zertifikat' },
					{ value: 'TestDaF', label: 'TestDaF' },
					{ value: 'DSH', label: 'DSH' },
				]
			case 'Chinese':
				return [
					{ value: 'HSK', label: 'HSK' },
					{ value: 'TOCFL', label: 'TOCFL' },
					{ value: 'BCT', label: 'BCT' },
				]
			case 'Japanese':
				return [
					{ value: 'JLPT', label: 'JLPT' },
					{ value: 'J-Test', label: 'J-Test' },
					{ value: 'NAT-TEST', label: 'NAT-TEST' },
				]
			case 'Korean':
				return [
					{ value: 'TOPIK', label: 'TOPIK' },
					{ value: 'KLAT', label: 'KLAT' },
				]
			case 'Vietnamese':
				return [
					{ value: 'VSTEP', label: 'VSTEP' },
					{ value: 'Other', label: 'Other Vietnamese Certificate' },
				]
			default:
				return [{ value: 'Other', label: 'Other Certificate' }]
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

		setIsUploading(true)

		try {
			// Create FormData for upload
			const formData = new FormData()
			formData.append('file', file)

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

	// Check if this is an institution profile
	const isInstitution = profile?.role === 'institution'

	// If it's an institution, use the specialized component
	if (isInstitution) {
		return <InstitutionProfileSection profile={profile} />
	}

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-2xl font-bold mb-2">Basic Information</h2>
					<p className="text-muted-foreground">
						Manage your personal information and preferences
					</p>
				</div>
				{!isEditing ? (
					<Button
						variant="outline"
						size="sm"
						onClick={() => setIsEditing(true)}
						className="flex items-center gap-2"
					>
						<Edit3 className="h-4 w-4" />
						Edit
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
							Cancel
						</Button>
						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="flex items-center gap-2"
						>
							<Save className="h-4 w-4" />
							{isSaving ? 'Saving...' : 'Save'}
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
									<AvatarImage src={editedProfile?.profilePhoto} />
									<AvatarFallback
										className={
											isInstitution
												? 'bg-blue-500 text-white'
												: 'bg-orange-500 text-white'
										}
									>
										{isInstitution ? (
											<Building2 className="w-8 h-8" />
										) : (
											<User className="w-8 h-8" />
										)}
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
										{isUploading ? 'Uploading...' : 'Upload your photo'}
									</Button>
								)}
								{isEditing && (
									<p className="text-xs text-muted-foreground">
										Must be PNG or JPG file (max 5MB)
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
								<Label htmlFor="firstName">First Name</Label>
								{isEditing ? (
									<Input
										id="firstName"
										placeholder="Enter your first name"
										value={editedProfile?.firstName || ''}
										onChange={(e) =>
											handleFieldChange('firstName', e.target.value)
										}
										inputSize="select"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.firstName || 'Not provided'}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								{isEditing ? (
									<Input
										id="lastName"
										placeholder="Enter your last name"
										value={editedProfile?.lastName || ''}
										onChange={(e) =>
											handleFieldChange('lastName', e.target.value)
										}
										inputSize="select"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.lastName || 'Not provided'}
										</p>
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="gender">Gender</Label>
								{isEditing ? (
									<CustomSelect
										value={
											editedProfile?.gender
												? {
														value: editedProfile.gender,
														label:
															editedProfile.gender.charAt(0).toUpperCase() +
															editedProfile.gender.slice(1),
													}
												: null
										}
										onChange={(option) =>
											handleFieldChange('gender', option?.value || '')
										}
										placeholder="Choose gender"
										options={[
											{ value: 'male', label: 'Male' },
											{ value: 'female', label: 'Female' },
										]}
										isClearable={false}
										className="w-full"
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{profile?.gender || 'Not provided'}
										</p>
									</div>
								)}
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{isEditing ? (
								<DateInput
									id="birthday"
									value={editedProfile?.birthday || ''}
									onChange={(value) => handleFieldChange('birthday', value)}
									label="Birthday"
									placeholder="dd/mm/yyyy"
								/>
							) : (
								<div className="space-y-2">
									<Label htmlFor="birthday">Birthday</Label>
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										<p className="text-sm font-medium text-gray-900">
											{formatDateForDisplay(profile?.birthday)}
										</p>
									</div>
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<div className="px-3 py-2 bg-gray-50 rounded-md">
									<p className="text-sm font-medium text-gray-900">
										{profile?.user?.email || 'Not provided'}
									</p>
								</div>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="nationality">Nationality</Label>
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
										placeholder="Choose your nationality"
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
											<p className="text-sm text-gray-500">Not provided</p>
										)}
									</div>
								)}
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
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
										placeholder="Enter your phone number"
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
											<p className="text-sm text-gray-500">Not provided</p>
										)}
									</div>
								)}
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-4">
								<div className="space-y-2">
									<Label>Interest</Label>
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
											placeholder="Choose subject(s)/field(s) you interested in"
											options={[
												{ value: 'Data Science', label: 'Data Science' },
												{ value: 'Data Engineer', label: 'Data Engineer' },
												{
													value: 'Information System',
													label: 'Information System',
												},
												{
													value: 'Computer Science',
													label: 'Computer Science',
												},
												{ value: 'Business', label: 'Business' },
											]}
											isMulti
											isSearchable
											isClearable
										/>
									) : (
										<div className="px-3 py-2 bg-gray-50 rounded-md">
											{(() => {
												console.log(
													'Displaying interests:',
													profile?.interests,
													'Type:',
													typeof profile?.interests,
													'Length:',
													profile?.interests?.length
												)
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
														No interests specified
													</p>
												)
											})()}
										</div>
									)}
								</div>

								<div className="space-y-2">
									<Label>Favorite country</Label>
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
											placeholder="Choose your favorite countries"
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
												console.log(
													'Displaying favorite countries:',
													profile?.favoriteCountries,
													'Type:',
													typeof profile?.favoriteCountries,
													'Length:',
													profile?.favoriteCountries?.length
												)
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
														No favorite countries specified
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
