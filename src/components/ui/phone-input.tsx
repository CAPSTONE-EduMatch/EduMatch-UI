import React, { useState, useEffect } from 'react'
import Select from 'react-select'
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js'
import {
	countries,
	Country,
	getCountryByPhoneCode,
	getCountriesWithSvgFlags,
} from '@/data/countries'

interface PhoneInputProps {
	value: string
	countryCode: string
	onValueChange: (value: string) => void
	onCountryChange: (countryCode: string) => void
	placeholder?: string
	className?: string
}

const customStyles = {
	control: (provided: any) => ({
		...provided,
		minHeight: '40px',
		border: '1px solid hsl(var(--border))',
		borderRadius: '20px',
		backgroundColor: '#f3f4f6', // gray-100
		'&:hover': {
			border: '1px solid hsl(var(--border))',
		},
	}),
	placeholder: (provided: any) => ({
		...provided,
		color: 'hsl(var(--muted-foreground))',
	}),
}

const countryCodeStyles = {
	control: (provided: any) => ({
		...provided,
		minHeight: '40px',
		height: '40px',
		border: '1px solid rgba(17, 110, 99, 0.7)',
		borderRadius: '20px',
		backgroundColor: 'rgba(17, 110, 99, 0.7)',
		padding: '0px 8px',
		fontSize: '14px',
		'&:hover': {
			border: '1px solid rgba(17, 110, 99, 0.8)',
		},
	}),
	placeholder: (provided: any) => ({
		...provided,
		color: 'hsl(var(--muted-foreground))',
	}),
	menu: (provided: any) => ({
		...provided,
		maxHeight: '200px',
		fontSize: '14px',
	}),
	option: (provided: any) => ({
		...provided,
		padding: '8px 12px',
		fontSize: '14px',
	}),
	menuList: (provided: any) => ({
		...provided,
		maxHeight: '200px',
	}),
}

const formatOptionLabel = (option: any) => (
	<div className="flex items-center space-x-1 text-xs">
		{option.svgFlag ? (
			<img
				src={option.svgFlag}
				alt={option.name}
				className="w-3 h-2 object-cover"
			/>
		) : (
			<span className="text-xs">{option.flag}</span>
		)}
		<span className="font-medium text-xs">{option.phoneCode}</span>
	</div>
)

export function PhoneInput({
	value,
	countryCode,
	onValueChange,
	onCountryChange,
	placeholder,
	className = '',
}: PhoneInputProps) {
	const [isValid, setIsValid] = useState(true)
	const [errorMessage, setErrorMessage] = useState('')

	const countriesWithFlags = getCountriesWithSvgFlags()
	const selectedCountry =
		countriesWithFlags.find((country) => country.phoneCode === countryCode) ||
		countriesWithFlags[0]

	// Generate country-specific placeholder
	const getCountryPlaceholder = () => {
		if (placeholder) return placeholder

		const countryExamples: { [key: string]: string } = {
			US: 'Enter your phone number',
			VN: 'Nhập số điện thoại của bạn',
			GB: 'Enter your phone number',
			FR: 'Entrez votre numéro de téléphone',
			DE: 'Geben Sie Ihre Telefonnummer ein',
			JP: '電話番号を入力してください',
			KR: '전화번호를 입력하세요',
			CN: '请输入您的电话号码',
		}

		return countryExamples[selectedCountry.code] || 'Enter your phone number'
	}

	const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const phoneValue = e.target.value
		onValueChange(phoneValue)

		// Validate phone number if both country and phone are provided
		if (phoneValue && countryCode) {
			try {
				const fullNumber = `${countryCode}${phoneValue}`
				const isValidNumber = isValidPhoneNumber(
					fullNumber,
					selectedCountry.code as any
				)
				setIsValid(isValidNumber)

				if (!isValidNumber) {
					// Get country-specific error message
					const countryName = selectedCountry.name
					setErrorMessage(`Please enter a valid ${countryName} phone number`)
				} else {
					setErrorMessage('')
				}
			} catch (error) {
				setIsValid(false)
				setErrorMessage('Invalid phone number format')
			}
		} else {
			setIsValid(true)
			setErrorMessage('')
		}
	}

	const handleCountryChange = (option: any) => {
		onCountryChange(option.phoneCode)

		// Re-validate existing phone number with new country
		if (value) {
			try {
				const fullNumber = `${option.phoneCode}${value}`
				const isValidNumber = isValidPhoneNumber(fullNumber, option.code)
				setIsValid(isValidNumber)

				if (!isValidNumber) {
					setErrorMessage(`Please enter a valid ${option.name} phone number`)
				} else {
					setErrorMessage('')
				}
			} catch (error) {
				setIsValid(false)
				setErrorMessage('Invalid phone number format')
			}
		}
	}

	return (
		<div className={`space-y-2 ${className}`}>
			<div className="flex space-x-2">
				<Select
					value={selectedCountry}
					onChange={handleCountryChange}
					options={countriesWithFlags}
					formatOptionLabel={formatOptionLabel}
					getOptionValue={(option) => option.phoneCode}
					styles={{
						...countryCodeStyles,
						control: (provided: any) => ({
							...countryCodeStyles.control(provided),
							width: '120px',
						}),
					}}
					isClearable={false}
					placeholder="Select country"
					isSearchable
					filterOption={(option, inputValue) => {
						const country = option.data as Country
						return (
							country.name.toLowerCase().includes(inputValue.toLowerCase()) ||
							country.phoneCode.includes(inputValue) ||
							country.code.toLowerCase().includes(inputValue.toLowerCase())
						)
					}}
				/>
				<div className="flex-1">
					<input
						type="tel"
						value={value}
						onChange={handlePhoneChange}
						placeholder={getCountryPlaceholder()}
						className={`w-full h-10 px-4 py-2.5 text-sm border rounded-full bg-[#F5F7FB] focus:outline-none transition-all duration-300 ${
							!isValid ? 'border-red-300' : 'border-gray-200'
						} focus:ring-2 focus:ring-[#126E64] focus:border-transparent`}
					/>
				</div>
			</div>
			{!isValid && errorMessage && (
				<p className="text-sm text-red-500 mt-1 flex items-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-4 w-4 mr-1"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fillRule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clipRule="evenodd"
						/>
					</svg>
					{errorMessage}
				</p>
			)}
		</div>
	)
}
