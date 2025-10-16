import { Button } from '@/components/ui'
import { Input } from '@/components/ui'
import { Label } from '@/components/ui'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui'
import { PhoneInput } from '@/components/ui'
import { CustomSelect } from '@/components/ui'
import { DateInput } from '@/components/ui'
import { ErrorModal } from '@/components/ui'
import { Upload, User } from 'lucide-react'
import { Country, getCountriesWithSvgFlags } from '@/data/countries'
import { ProfileFormData } from '@/types/profile'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface BasicInfoStepProps {
	formData: ProfileFormData
	onInputChange: (field: keyof ProfileFormData, value: string) => void
	onInputChangeEvent: (
		field: keyof ProfileFormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof ProfileFormData) => (value: string) => void
	onMultiSelectChange: (
		field: 'interests' | 'favoriteCountries'
	) => (value: string[]) => void
	onBack: () => void
	onNext: () => void
	user?: any
}

export function BasicInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onMultiSelectChange,
	onBack,
	onNext,
	user,
}: BasicInfoStepProps) {
	const [isUploading, setIsUploading] = useState(false)
	const [showErrorModal, setShowErrorModal] = useState(false)
	const [errorMessage, setErrorMessage] = useState('')
	const [phoneValidationError, setPhoneValidationError] = useState('')
	const fileInputRef = useRef<HTMLInputElement>(null)

	// Auto-fill Google login data when component mounts
	useEffect(() => {
		if (user) {
			// Auto-fill first name from Google profile
			if (user.name && !formData.firstName) {
				const nameParts = user.name.trim().split(' ')
				if (nameParts.length > 0 && nameParts[0]) {
					onInputChange('firstName', nameParts[0])
				}
			}

			// Auto-fill last name from Google profile
			if (user.name && !formData.lastName) {
				const nameParts = user.name.trim().split(' ')
				if (nameParts.length > 1) {
					const lastName = nameParts.slice(1).join(' ').trim()
					if (lastName) {
						onInputChange('lastName', lastName)
					}
				}
			}

			// Note: Profile photo auto-fill is handled in separate useEffect below
		}
	}, [user, formData.firstName, formData.lastName, onInputChange])

	// Auto-fill Google image if available and no profile photo set
	useEffect(() => {
		// Auto-fill Google image if available and no profile photo set
		if (!formData.profilePhoto && user?.image) {
			// Clean up Google image URL to get a better size
			let imageUrl = user.image
			if (imageUrl.includes('=s96-c')) {
				// Replace s96-c with s400-c for a larger, better quality image
				imageUrl = imageUrl.replace('=s96-c', '=s400-c')
			} else if (imageUrl.includes('=s')) {
				// If it has other size parameters, replace with s400-c
				imageUrl = imageUrl.replace(/=s\d+-c/, '=s400-c')
			}
			onInputChange('profilePhoto', imageUrl)
		}
	}, [formData.profilePhoto, user?.image, onInputChange])

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
			onInputChange('profilePhoto', result.url)
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

	// Function to validate phone number
	const validatePhoneNumber = async () => {
		if (!formData.phoneNumber || !formData.countryCode) {
			setPhoneValidationError('')
			return true
		}

		try {
			const { isValidPhoneNumber } = await import('libphonenumber-js')
			const fullNumber = `${formData.countryCode}${formData.phoneNumber}`

			// Get country code from phone code
			const { getCountryByPhoneCode } = await import('@/data/countries')
			const country = getCountryByPhoneCode(formData.countryCode)

			if (!country) {
				setPhoneValidationError('Invalid country code')
				return false
			}

			const isValid = isValidPhoneNumber(fullNumber, country.code as any)

			if (!isValid) {
				setPhoneValidationError(
					`Please enter a valid ${country.name} phone number`
				)
				return false
			} else {
				setPhoneValidationError('')
				return true
			}
		} catch (error) {
			setPhoneValidationError('Invalid phone number format')
			return false
		}
	}

	// Function to handle form validation and submission
	const handleNext = async () => {
		const isPhoneValid = await validatePhoneNumber()

		if (!isPhoneValid) {
			return // Don't proceed if phone validation fails
		}

		onNext()
	}

	// Function to validate and format name input (letters and spaces only)
	const handleNameInput =
		(field: 'firstName' | 'lastName') =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			// Remove any non-letter characters except spaces (including numbers, symbols)
			const lettersAndSpaces = value.replace(/[^a-zA-Z\s]/g, '')
			onInputChange(field, lettersAndSpaces)
		}

	return (
		<div className="space-y-6">
			<div className="">
				<h2 className="text-2xl font-bold text-primary mb-2">
					Basic information
				</h2>
				<p className="text-muted-foreground">
					Please provide your basic personal information to create your profile.
				</p>
			</div>

			<div className="space-y-6">
				{/* Profile Photo Upload */}
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="w-20 h-20">
							<AvatarImage src={formData.profilePhoto} alt="Profile photo" />
							<AvatarFallback className="bg-gray-200 text-gray-600">
								<User className="w-8 h-8" />
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
							{isUploading ? 'Uploading...' : 'Upload your photo'}
						</Button>
						<p className="text-xs text-muted-foreground">
							Must be PNG, JPG, or WebP file (max 5MB)
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
						<Input
							id="firstName"
							placeholder="Enter your first name"
							value={formData.firstName}
							onChange={handleNameInput('firstName')}
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							placeholder="Enter your last name"
							value={formData.lastName}
							onChange={handleNameInput('lastName')}
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="gender">Gender</Label>
						<CustomSelect
							value={
								formData.gender
									? {
											value: formData.gender,
											label:
												formData.gender.charAt(0).toUpperCase() +
												formData.gender.slice(1),
										}
									: null
							}
							onChange={(option) =>
								onSelectChange('gender')(option?.value || '')
							}
							placeholder="Choose gender"
							options={[
								{ value: 'male', label: 'Male' },
								{ value: 'female', label: 'Female' },
							]}
							isClearable={false}
							className="w-full"
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<DateInput
						id="birthday"
						value={formData.birthday}
						onChange={(value) => onInputChange('birthday', value)}
						label="Birthday"
						placeholder="dd/mm/yyyy"
					/>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="example123@gmail.com"
							value={formData.email}
							onChange={onInputChangeEvent('email')}
							inputSize="select"
							disabled={user?.email && formData.email === user.email}
						/>
						{user?.email && formData.email === user.email && (
							<p className="text-xs text-muted-foreground">
								Email is pre-filled from your Google account and cannot be
								changed
							</p>
						)}
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="nationality">Nationality</Label>
						<CustomSelect
							value={
								formData.nationality
									? getCountriesWithSvgFlags().find(
											(c) =>
												c.name.toLowerCase() ===
												formData.nationality.toLowerCase()
										)
									: null
							}
							onChange={(option) =>
								onSelectChange('nationality')(option?.name || '')
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
					</div>
					<div className="space-y-2">
						<Label htmlFor="phone">Phone Number</Label>
						<div className="w-full">
							<PhoneInput
								value={formData.phoneNumber}
								countryCode={formData.countryCode}
								onValueChange={(value) => {
									onInputChange('phoneNumber', value)
									// Clear validation error when user starts typing
									if (phoneValidationError) {
										setPhoneValidationError('')
									}
								}}
								onCountryChange={(countryCode) => {
									onInputChange('countryCode', countryCode)
									// Clear validation error when user changes country
									if (phoneValidationError) {
										setPhoneValidationError('')
									}
								}}
								placeholder="Your phone number"
								className="w-full"
								hasError={!!phoneValidationError}
							/>
						</div>
					</div>
				</div>

				<div className="space-y-4">
					<div className="space-y-2">
						<Label>Interest</Label>
						<CustomSelect
							value={formData.interests.map((interest) => ({
								value: interest,
								label: interest,
							}))}
							onChange={(options) =>
								onMultiSelectChange('interests')(
									options ? options.map((option: any) => option.value) : []
								)
							}
							placeholder="Choose subject(s)/field(s) you interested in"
							options={[
								{ value: 'Data Science', label: 'Data Science' },
								{ value: 'Data Engineer', label: 'Data Engineer' },
								{ value: 'Information System', label: 'Information System' },
								{ value: 'Computer Science', label: 'Computer Science' },
								{ value: 'Business', label: 'Business' },
								{
									value: 'Business Administration',
									label: 'Business Administration',
								},
								{ value: 'Business Analytics', label: 'Business Analytics' },
								{
									value: 'Business Intelligence',
									label: 'Business Intelligence',
								},
								{ value: 'Business Finance', label: 'Business Finance' },
								{ value: 'Business Economics', label: 'Business Economics' },
								{ value: 'Business Law', label: 'Business Law' },
								{ value: 'Business Management', label: 'Business Management' },
							]}
							isMulti
							isSearchable
							isClearable
							maxSelectedHeight="120px"
						/>
					</div>

					<div className="space-y-2">
						<Label>Favorite country</Label>
						<CustomSelect
							value={formData.favoriteCountries.map((country) => {
								const countryData = getCountriesWithSvgFlags().find(
									(c) => c.name.toLowerCase() === country.toLowerCase()
								)
								return {
									value: country,
									label: country,
									...countryData,
								}
							})}
							onChange={(options) =>
								onMultiSelectChange('favoriteCountries')(
									options ? options.map((option: any) => option.value) : []
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
							maxSelectedHeight="120px"
						/>
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack} size="sm">
					Back
				</Button>
				<Button onClick={handleNext} size="sm">
					Next
				</Button>
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
