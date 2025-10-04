'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PhoneInput } from '@/components/ui/phone-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { DateInput } from '@/components/ui/DateInput'
import { Upload, User } from 'lucide-react'
import { Country, getCountriesWithSvgFlags } from '@/data/countries'
import { formatDateForDisplay } from '@/lib/date-utils'
import SuccessModal from '@/components/ui/SuccessModal'
import ErrorModal from '@/components/ui/ErrorModal'

interface ProfileInfoSectionProps {
	profile: any
}

export const ProfileInfoSection: React.FC<ProfileInfoSectionProps> = ({
	profile,
}) => {
	const [isEditing, setIsEditing] = useState(false)
	const [editedProfile, setEditedProfile] = useState(profile)
	const [isUploading, setIsUploading] = useState(false)
	const [isSaving, setIsSaving] = useState(false)
	const [showSuccessModal, setShowSuccessModal] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

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
			}

			// Call the update profile API
			await ApiService.updateProfile(profileData)

			// Update the original profile with the edited data
			Object.assign(profile, editedProfile)

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
		setEditedProfile((prev: any) => ({
			...prev,
			[field]: value,
		}))
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

	return (
		<div className="space-y-6">
			<div className="">
				<h2 className="text-2xl font-bold text-primary mb-2">
					Basic information
				</h2>
				<p className="text-muted-foreground">
					Lorem Ipsum is simply dummy text of the printing and typesetting
					industry. Lorem Ipsum is simply dummy text
				</p>
			</div>

			{/* Single White Box Container */}
			<Card className="bg-white shadow-sm border">
				<CardContent className="p-6">
					<div className="space-y-6">
						{/* Profile Photo Upload */}
						<div className="flex items-center gap-4">
							<div className="relative">
								<Avatar className="w-20 h-20">
									<AvatarImage
										src={editedProfile?.profilePhoto || '/profile.svg'}
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
								{isEditing ? (
									<Button
										variant="outline"
										size="sm"
										onClick={handleUploadClick}
										disabled={isUploading}
									>
										{isUploading ? 'Uploading...' : 'Upload your photo'}
									</Button>
								) : (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setIsEditing(true)}
									>
										Change photo
									</Button>
								)}
								<p className="text-xs text-muted-foreground">
									Must be PNG or JPG file (max 5MB)
								</p>
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

						{/* Form Fields */}
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
											{ value: 'Computer Science', label: 'Computer Science' },
											{ value: 'Business', label: 'Business' },
										]}
										isMulti
										isSearchable
										isClearable
									/>
								) : (
									<div className="px-3 py-2 bg-gray-50 rounded-md">
										{profile?.interests && profile.interests.length > 0 ? (
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
										)}
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
													(c) => c.name.toLowerCase() === country.toLowerCase()
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
										{profile?.favoriteCountries &&
										profile.favoriteCountries.length > 0 ? (
											<div className="flex flex-wrap gap-2">
												{profile.favoriteCountries.map(
													(country: string, index: number) => {
														const countryData = getCountriesWithSvgFlags().find(
															(c) =>
																c.name.toLowerCase() === country.toLowerCase()
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
										)}
									</div>
								)}
							</div>

							<div className="flex justify-between">
								<Button variant="outline" onClick={handleCancel} size="sm">
									Cancel
								</Button>
								<div className="space-x-2">
									{!isEditing ? (
										<Button onClick={() => setIsEditing(true)} size="sm">
											Edit Profile
										</Button>
									) : (
										<Button onClick={handleSave} size="sm" disabled={isSaving}>
											{isSaving ? 'Saving...' : 'Save Changes'}
										</Button>
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
		</div>
	)
}
