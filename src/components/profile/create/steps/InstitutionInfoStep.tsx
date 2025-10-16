'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ProfileFormData } from '@/types/profile'
import { Label } from '@/components/ui'
import { Input } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { PhoneInput } from '@/components/ui'
import { Button } from '@/components/ui'
import { getCountriesWithSvgFlags } from '@/data/countries'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { Upload, Building2, Info } from 'lucide-react'
import { Tooltip } from '@/components/ui'
import { ErrorModal } from '@/components/ui'

interface InstitutionInfoStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: any) => void
	onInputChangeEvent: (
		field: keyof ProfileFormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof ProfileFormData) => (value: string) => void
	onBack: () => void
	onNext: () => void
	onShowManageModal: () => void
	user?: any
}

export function InstitutionInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onBack,
	onNext,
	onShowManageModal,
	user,
}: InstitutionInfoStepProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [validationErrors, setValidationErrors] = useState<
		Record<string, boolean>
	>({})
	const [emailErrors, setEmailErrors] = useState<Record<string, string>>({})
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Pre-fill institution email with user's email
	useEffect(() => {
		if (user?.email && !formData.institutionEmail) {
			onInputChange('institutionEmail', user.email)
		}
	}, [user?.email, formData.institutionEmail, onInputChange])

	// Auto-fill Google image as institution logo if available and no logo set
	useEffect(() => {
		if (!formData.institutionCoverImage && user?.image) {
			// Clean up Google image URL to get a better size
			let imageUrl = user.image
			if (imageUrl.includes('=s96-c')) {
				// Replace s96-c with s400-c for a larger, better quality image
				imageUrl = imageUrl.replace('=s96-c', '=s400-c')
			} else if (imageUrl.includes('=s')) {
				// If it has other size parameters, replace with s400-c
				imageUrl = imageUrl.replace(/=s\d+-c/, '=s400-c')
			}
			onInputChange('institutionCoverImage', imageUrl)
		}
	}, [formData.institutionCoverImage, user?.image, onInputChange])

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		return emailRegex.test(email)
	}

	const handleEmailChange =
		(field: keyof ProfileFormData) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			onInputChangeEvent(field)(e)

			// Real-time email validation
			if (value && !validateEmail(value)) {
				setEmailErrors((prev) => ({
					...prev,
					[field]: 'Please enter a valid email address',
				}))
			} else {
				setEmailErrors((prev) => {
					const newErrors = { ...prev }
					delete newErrors[field]
					return newErrors
				})
			}
		}

	const handleNameInput =
		(field: keyof ProfileFormData) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			// Remove any non-letter characters (including numbers, symbols) but allow spaces
			const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, '')
			onInputChange(field, lettersAndSpaces)
		}

	const handleInstitutionNameInput = (
		e: React.ChangeEvent<HTMLInputElement>
	) => {
		const value = e.target.value
		// Remove special characters and numbers but allow letters, spaces, and common punctuation
		const cleanValue = value.replace(/[^a-zA-Z\s\-\.&]/g, '')
		onInputChange('institutionName', cleanValue)
	}

	const validateRequiredFields = async () => {
		const errors: Record<string, boolean> = {}

		// Email validation regex
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

		// Get valid country codes for validation
		const validCountries = getCountriesWithSvgFlags()
		const validCountryCodes = validCountries.map((country) => country.phoneCode)

		// Required fields validation (all fields except abbreviation and appellation)
		if (!formData.institutionName?.trim()) errors.institutionName = true
		if (!formData.institutionType) errors.institutionType = true
		if (!formData.institutionHotline?.trim()) errors.institutionHotline = true
		if (!formData.institutionWebsite?.trim()) errors.institutionWebsite = true
		if (!formData.institutionEmail?.trim()) {
			errors.institutionEmail = true
		} else if (!emailRegex.test(formData.institutionEmail)) {
			errors.institutionEmail = true
		}
		if (!formData.institutionCountry) errors.institutionCountry = true
		if (!formData.institutionAddress?.trim()) errors.institutionAddress = true
		if (!formData.representativeName?.trim()) errors.representativeName = true
		if (!formData.representativePosition?.trim())
			errors.representativePosition = true
		if (!formData.representativeEmail?.trim()) {
			errors.representativeEmail = true
		} else if (!emailRegex.test(formData.representativeEmail)) {
			errors.representativeEmail = true
		}
		if (!formData.representativePhone?.trim()) errors.representativePhone = true
		if (!formData.aboutInstitution?.trim()) errors.aboutInstitution = true

		// Validate phone number formats with country codes
		if (formData.institutionHotlineCode && formData.institutionHotline) {
			const fullNumber = `${formData.institutionHotlineCode}${formData.institutionHotline}`
			const selectedCountry = validCountries.find(
				(country) => country.phoneCode === formData.institutionHotlineCode
			)

			if (selectedCountry) {
				try {
					const { isValidPhoneNumber } = await import('libphonenumber-js')
					const isValidNumber = isValidPhoneNumber(
						fullNumber,
						selectedCountry.code as any
					)
					if (!isValidNumber) {
						errors.institutionHotline = true
					}
				} catch (error) {
					errors.institutionHotline = true
				}
			}
		}

		if (formData.representativePhoneCode && formData.representativePhone) {
			const fullNumber = `${formData.representativePhoneCode}${formData.representativePhone}`
			const selectedCountry = validCountries.find(
				(country) => country.phoneCode === formData.representativePhoneCode
			)

			if (selectedCountry) {
				try {
					const { isValidPhoneNumber } = await import('libphonenumber-js')
					const isValidNumber = isValidPhoneNumber(
						fullNumber,
						selectedCountry.code as any
					)
					if (!isValidNumber) {
						errors.representativePhone = true
					}
				} catch (error) {
					errors.representativePhone = true
				}
			}
		}

		setValidationErrors(errors)
		return Object.keys(errors).length === 0
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
			// Upload to S3
			const { ApiService } = await import('@/lib/axios-config')
			const result = await ApiService.uploadFile(file)

			// Update the institution logo with the S3 URL
			onInputChange('institutionCoverImage', result.url)
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

	const handleNext = async () => {
		if (
			(await validateRequiredFields()) &&
			Object.keys(emailErrors).length === 0
		) {
			onNext()
		}
		// Just validate and show red highlighting, no popup
	}

	const getAllFiles = () => {
		return []
	}

	return (
		<div className="space-y-8">
			{/* Header */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-foreground mb-2">
					Institution Information
				</h2>
				<p className="text-muted-foreground">
					Please provide your institution details
				</p>
			</div>

			{/* Profile Photo Upload */}
			<div className="flex items-center gap-4">
				<div className="relative">
					<Avatar className="w-20 h-20">
						<AvatarImage
							src={formData.institutionCoverImage}
							alt="Institution logo"
						/>
						<AvatarFallback className="bg-gray-200 text-gray-600">
							<Building2 className="w-8 h-8" />
						</AvatarFallback>
					</Avatar>
					<div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
						<Upload className="w-3 h-3 text-primary-foreground" />
					</div>
				</div>
				<div className="flex flex-col space-y-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleUploadClick}
						disabled={isUploading}
					>
						{isUploading ? 'Uploading...' : 'Upload institution logo'}
					</Button>
					<p className="text-xs text-muted-foreground">
						Must be PNG, JPG, or WebP file (max 5MB)
					</p>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileSelect}
					className="hidden"
				/>
			</div>

			{/* First Row: Institution Name and Abbreviation */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Institution Name <span className="text-red-500">*</span>
					</Label>
					<Input
						id="institutionName"
						value={formData.institutionName}
						onChange={handleInstitutionNameInput}
						placeholder="Enter institution name"
						inputSize="select"
						className={
							validationErrors.institutionName
								? 'border-red-500 focus:border-red-500'
								: ''
						}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Abbreviation
					</Label>
					<Input
						id="institutionAbbreviation"
						value={formData.institutionAbbreviation}
						onChange={onInputChangeEvent('institutionAbbreviation')}
						placeholder="e.g., MIT, Harvard"
						inputSize="select"
					/>
				</div>
			</div>

			{/* Second Row: Hotline and Type */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Hotline <span className="text-red-500">*</span>
					</Label>
					<PhoneInput
						value={formData.institutionHotline}
						countryCode={formData.institutionHotlineCode}
						onValueChange={(phone) =>
							onInputChange('institutionHotline', phone)
						}
						onCountryChange={(code) =>
							onInputChange('institutionHotlineCode', code)
						}
						placeholder="Enter hotline number"
						hasError={
							validationErrors.institutionHotline ||
							validationErrors.institutionHotlineCode
						}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Institution Type <span className="text-red-500">*</span>
					</Label>
					<CustomSelect
						value={formData.institutionType}
						onChange={onSelectChange('institutionType')}
						placeholder="Select institution type"
						styles={
							validationErrors.institutionType
								? {
										control: (provided: any, state: any) => ({
											...provided,
											border: '1px solid #ef4444',
											backgroundColor: '#F5F7FB',
											color: '#374151',
											minHeight: '40px',
											height: state.isMulti ? 'auto' : '40px',
											borderRadius: '20px',
											fontSize: '14px',
											padding: state.isMulti ? '8px 16px' : '0 16px',
											display: 'flex',
											alignItems:
												state.isMulti &&
												Array.isArray(state.getValue()) &&
												state.getValue().length > 0
													? 'flex-start'
													: 'center',
											flexWrap: 'wrap',
											'&:hover': {
												border: '1px solid #ef4444',
											},
											'&:focus-within': {
												border: '1px solid #ef4444',
												boxShadow: '0 0 0 1px #ef4444',
											},
										}),
										menu: (provided: any) => ({
											...provided,
											fontSize: '14px',
										}),
										option: (provided: any) => ({
											...provided,
											fontSize: '14px',
											padding: '8px 16px',
										}),
									}
								: undefined
						}
						options={[
							{ value: 'university', label: 'University' },
							{ value: 'scholarship-provider', label: 'Scholarship Provider' },
							{ value: 'research-lab', label: 'Research Lab' },
						]}
					/>
				</div>
			</div>

			{/* Third Row: Website and Email */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Website <span className="text-red-500">*</span>
					</Label>
					<Input
						id="institutionWebsite"
						value={formData.institutionWebsite}
						onChange={onInputChangeEvent('institutionWebsite')}
						placeholder="https://www.institution.edu"
						inputSize="select"
						className={
							validationErrors.institutionWebsite
								? 'border-red-500 focus:border-red-500'
								: ''
						}
					/>
				</div>
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-medium text-foreground">
							Institution Email <span className="text-red-500">*</span>
						</Label>
						{user?.email && formData.institutionEmail === user.email && (
							<Tooltip content="Institution email is pre-filled from your Google account and cannot be changed">
								<Info className="w-3 h-3" />
							</Tooltip>
						)}
					</div>
					<Input
						id="institutionEmail"
						type="email"
						value={formData.institutionEmail}
						onChange={handleEmailChange('institutionEmail')}
						placeholder="contact@institution.edu"
						inputSize="select"
						disabled={user?.email && formData.institutionEmail === user.email}
						className={`
							${
								validationErrors.institutionEmail ||
								emailErrors.institutionEmail
									? 'border-red-500 focus:border-red-500'
									: ''
							}
							${
								user?.email && formData.institutionEmail === user.email
									? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60'
									: ''
							}
						`}
					/>
					{emailErrors.institutionEmail && (
						<p className="text-xs text-red-500 mt-1">
							{emailErrors.institutionEmail}
						</p>
					)}
				</div>
			</div>

			{/* Fourth Row: Country and Address */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Country <span className="text-red-500">*</span>
					</Label>
					<CustomSelect
						value={
							formData.institutionCountry
								? getCountriesWithSvgFlags().find(
										(c) =>
											c.name.toLowerCase() ===
											formData.institutionCountry.toLowerCase()
									)
								: null
						}
						onChange={(option) =>
							onSelectChange('institutionCountry')(option?.name || '')
						}
						placeholder="Select country"
						styles={
							validationErrors.institutionCountry
								? {
										control: (provided: any, state: any) => ({
											...provided,
											border: '1px solid #ef4444',
											backgroundColor: '#F5F7FB',
											color: '#374151',
											minHeight: '40px',
											height: state.isMulti ? 'auto' : '40px',
											borderRadius: '20px',
											fontSize: '14px',
											padding: state.isMulti ? '8px 16px' : '0 16px',
											display: 'flex',
											alignItems:
												state.isMulti &&
												Array.isArray(state.getValue()) &&
												state.getValue().length > 0
													? 'flex-start'
													: 'center',
											flexWrap: 'wrap',
											'&:hover': {
												border: '1px solid #ef4444',
											},
											'&:focus-within': {
												border: '1px solid #ef4444',
												boxShadow: '0 0 0 1px #ef4444',
											},
										}),
										menu: (provided: any) => ({
											...provided,
											fontSize: '14px',
										}),
										option: (provided: any) => ({
											...provided,
											fontSize: '14px',
											padding: '8px 16px',
										}),
									}
								: undefined
						}
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
							const country = option.data
							return country.name
								.toLowerCase()
								.includes(inputValue.toLowerCase())
						}}
					/>
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Detailed Address <span className="text-red-500">*</span>
					</Label>
					<Input
						id="institutionAddress"
						value={formData.institutionAddress}
						onChange={onInputChangeEvent('institutionAddress')}
						placeholder="Enter detailed address"
						inputSize="select"
						className={
							validationErrors.institutionAddress
								? 'border-red-500 focus:border-red-500'
								: ''
						}
					/>
				</div>
			</div>

			{/* Fifth Row: Representative Information */}
			<div className="space-y-4">
				<h3 className="text-lg font-semibold text-foreground">
					Representative Information
				</h3>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Representative Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="representativeName"
							value={formData.representativeName}
							onChange={handleNameInput('representativeName')}
							placeholder="Enter representative name"
							inputSize="select"
							className={
								validationErrors.representativeName
									? 'border-red-500 focus:border-red-500'
									: ''
							}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Appellation
						</Label>
						<CustomSelect
							value={formData.representativeAppellation}
							onChange={onSelectChange('representativeAppellation')}
							placeholder="Select appellation"
							options={[
								{ value: 'mr', label: 'Mr.' },
								{ value: 'mrs', label: 'Mrs.' },
								{ value: 'ms', label: 'Ms.' },
								{ value: 'dr', label: 'Dr.' },
								{ value: 'prof', label: 'Prof.' },
								{ value: 'other', label: 'Other' },
							]}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-foreground">
							Position <span className="text-red-500">*</span>
						</Label>
						<Input
							id="representativePosition"
							value={formData.representativePosition}
							onChange={onInputChangeEvent('representativePosition')}
							placeholder="e.g., Admissions Director"
							inputSize="select"
							className={
								validationErrors.representativePosition
									? 'border-red-500 focus:border-red-500'
									: ''
							}
						/>
					</div>
				</div>
			</div>

			{/* Sixth Row: Representative Contact */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Representative Email <span className="text-red-500">*</span>
					</Label>
					<Input
						id="representativeEmail"
						type="email"
						value={formData.representativeEmail}
						onChange={handleEmailChange('representativeEmail')}
						placeholder="representative@institution.edu"
						inputSize="select"
						className={
							validationErrors.representativeEmail ||
							emailErrors.representativeEmail
								? 'border-red-500 focus:border-red-500'
								: ''
						}
					/>
					{emailErrors.representativeEmail && (
						<p className="text-xs text-red-500 mt-1">
							{emailErrors.representativeEmail}
						</p>
					)}
				</div>
				<div className="space-y-2">
					<Label className="text-sm font-medium text-foreground">
						Representative Phone <span className="text-red-500">*</span>
					</Label>
					<PhoneInput
						value={formData.representativePhone}
						countryCode={formData.representativePhoneCode}
						onValueChange={(phone) =>
							onInputChange('representativePhone', phone)
						}
						onCountryChange={(code) =>
							onInputChange('representativePhoneCode', code)
						}
						placeholder="Enter phone number"
						hasError={
							validationErrors.representativePhone ||
							validationErrors.representativePhoneCode
						}
					/>
				</div>
			</div>

			{/* About Institution */}
			<div className="space-y-2">
				<Label className="text-sm font-medium text-foreground">
					About Institution <span className="text-red-500">*</span>
				</Label>
				<textarea
					value={formData.aboutInstitution}
					onChange={(e) => onInputChange('aboutInstitution', e.target.value)}
					placeholder="Describe your institution, its mission, programs, and what makes it unique..."
					className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none bg-[#F5F7FB] text-sm border ${
						validationErrors.aboutInstitution
							? 'border-red-500 focus:border-red-500'
							: 'border-gray-200'
					}`}
					rows={5}
				/>
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
				<div className="flex items-center gap-2">
					{Object.keys(validationErrors).length > 0 && (
						<div className="flex items-center gap-1 text-red-500 text-sm">
							<div className="w-1 h-4 bg-red-500"></div>
							<span>Required fields missing</span>
						</div>
					)}
					<Button size="sm" onClick={handleNext}>
						Next
					</Button>
				</div>
			</div>

			{/* Error Modal - Rendered via Portal to blur entire page */}
			{showErrorModal &&
				createPortal(
					<ErrorModal
						isOpen={showErrorModal}
						onClose={() => setShowErrorModal(false)}
						title="Upload Failed"
						message={errorMessage}
						buttonText="Try Again"
					/>,
					document.body
				)}
		</div>
	)
}
