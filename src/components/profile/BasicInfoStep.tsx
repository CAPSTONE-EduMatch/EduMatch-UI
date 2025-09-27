import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { PhoneInput } from '@/components/ui/phone-input'
import { CustomSelect } from '@/components/ui/custom-select'
import { Upload, User } from 'lucide-react'
import { countries, Country, getCountriesWithSvgFlags } from '@/data/countries'
import { useState, useRef } from 'react'

interface FormData {
	role: 'applicant' | 'institution' | ''
	firstName: string
	lastName: string
	gender: string
	birthday: string
	email: string
	nationality: string
	phoneNumber: string
	countryCode: string
	interests: string[]
	favoriteCountries: string[]
	profilePhoto: string
}

interface BasicInfoStepProps {
	formData: FormData
	onInputChange: (field: keyof FormData, value: string) => void
	onInputChangeEvent: (
		field: keyof FormData
	) => (e: React.ChangeEvent<HTMLInputElement>) => void
	onSelectChange: (field: keyof FormData) => (value: string) => void
	onMultiSelectChange: (
		field: 'interests' | 'favoriteCountries'
	) => (value: string[]) => void
	onBack: () => void
	onNext: () => void
}

export function BasicInfoStep({
	formData,
	onInputChange,
	onInputChangeEvent,
	onSelectChange,
	onMultiSelectChange,
	onBack,
	onNext,
}: BasicInfoStepProps) {
	const [isUploading, setIsUploading] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleFileSelect = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		// Validate file type
		if (!file.type.startsWith('image/')) {
			alert('Please select an image file')
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			alert('File size must be less than 5MB')
			return
		}

		setIsUploading(true)

		try {
			// Create FormData for upload
			const formData = new FormData()
			formData.append('file', file)

			// Upload to S3
			const response = await fetch('/api/files/direct-upload', {
				method: 'POST',
				body: formData,
			})

			if (!response.ok) {
				throw new Error('Upload failed')
			}

			const result = await response.json()

			// Update the profile photo with the S3 URL
			onInputChange('profilePhoto', result.url)
		} catch (error) {
			console.error('Upload error:', error)
			alert('Failed to upload image. Please try again.')
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

			<div className="space-y-6">
				{/* Profile Photo Upload */}
				<div className="flex items-center gap-4">
					<div className="relative">
						<Avatar className="w-20 h-20">
							<AvatarImage src={formData.profilePhoto || '/placeholder.svg'} />
							<AvatarFallback className="bg-orange-500 text-white">
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
						<Input
							id="firstName"
							placeholder="Anna"
							value={formData.firstName}
							onChange={onInputChangeEvent('firstName')}
							inputSize="select"
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="lastName">Last Name</Label>
						<Input
							id="lastName"
							placeholder="Smith"
							value={formData.lastName}
							onChange={onInputChangeEvent('lastName')}
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
								{ value: 'other', label: 'Other' },
							]}
							isClearable
						/>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="birthday">Birthday</Label>
						<div className="relative">
							<Input
								id="birthday"
								type="date"
								value={formData.birthday}
								onChange={onInputChangeEvent('birthday')}
								inputSize="select"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="example123@gmail.com"
							value={formData.email}
							onChange={onInputChangeEvent('email')}
							inputSize="select"
						/>
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
									{option.svgFlag ? (
										<img
											src={option.svgFlag}
											alt={option.name}
											className="w-5 h-4 object-cover"
										/>
									) : (
										<span className="text-lg">{option.flag}</span>
									)}
									<span>{option.name}</span>
								</div>
							)}
							getOptionValue={(option: any) => option.name}
							isClearable
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
						<PhoneInput
							value={formData.phoneNumber}
							countryCode={formData.countryCode}
							onValueChange={(value) => onInputChange('phoneNumber', value)}
							onCountryChange={(countryCode) =>
								onInputChange('countryCode', countryCode)
							}
							placeholder="Enter your phone number"
						/>
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
							]}
							menuPortalTarget={document.body}
							isMulti
							isClearable
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
									{option.svgFlag ? (
										<img
											src={option.svgFlag}
											alt={option.name}
											className="w-5 h-4 object-cover"
										/>
									) : (
										<span className="text-lg">{option.flag}</span>
									)}
									<span>{option.name}</span>
								</div>
							)}
							menuPortalTarget={document.body}
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
					</div>
				</div>
			</div>

			<div className="flex justify-between">
				<Button variant="outline" onClick={onBack} size="sm">
					Back
				</Button>
				<div className="space-x-2">
					<Button variant="outline" size="sm">
						Create later
					</Button>
					<Button onClick={onNext} size="sm">
						Next
					</Button>
				</div>
			</div>
		</div>
	)
}
