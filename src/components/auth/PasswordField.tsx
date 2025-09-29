import React, { useEffect, useState } from 'react'
import PasswordCriteriaChecker, {
	PasswordCriteriaType,
} from './PasswordCriteriaChecker'
import { Input } from '../ui'

export interface PasswordFieldProps {
	value: string
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
	onValidChange?: (isValid: boolean) => void
	label?: string
	name?: string
	placeholder?: string
	error?: string
	required?: boolean
	showCriteria?: boolean
	helpText?: string
}

const PasswordField: React.FC<PasswordFieldProps> = ({
	value,
	onChange,
	onValidChange,
	label = 'Password',
	name = 'password',
	placeholder = 'Enter your password',
	error,
	required = false,
	showCriteria = true,
	helpText,
}) => {
	const [showPassword, setShowPassword] = useState(false)
	const [hasInput, setHasInput] = useState(false)
	const [passwordCriteria, setPasswordCriteria] =
		useState<PasswordCriteriaType>({
			length: false,
			uppercase: false,
			lowercase: false,
			number: false,
			special: false,
		})

	useEffect(() => {
		const checkPasswordCriteria = (pass: string) => {
			const criteria = {
				length: pass.length >= 12,
				uppercase: /[A-Z]/.test(pass),
				lowercase: /[a-z]/.test(pass),
				number: /[0-9]/.test(pass),
				special: /[^A-Za-z0-9]/.test(pass),
			}

			setPasswordCriteria(criteria)

			// If onValidChange callback is provided, call it with the validation result
			if (onValidChange) {
				const isValid = Object.values(criteria).every(Boolean)
				onValidChange(isValid)
			}
		}

		// Check if the user has entered any input
		setHasInput(value.length > 0)

		if (showCriteria) {
			checkPasswordCriteria(value)
		}
	}, [value, showCriteria, onValidChange])

	return (
		<div className="grid grid-cols-12 gap-2 md:gap-4">
			<label className="col-span-4 md:col-span-3 text-sm font-medium text-gray-800 self-start mt-3">
				{label} {required && <span className="text-red-500">*</span>}
			</label>
			<div className="col-span-8 md:col-span-9">
				{showCriteria ? (
					<div className="  mb-2">
						<div className="relative">
							<Input
								type={showPassword ? 'text' : 'password'}
								name={name}
								value={value}
								onChange={onChange}
								placeholder={placeholder}
								aria-label={label}
								// className="w-full border px-4 pr-10 py-3 bg-white border-b border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all"
							/>
							<button
								type="button"
								className="absolute right-3 top-0 bottom-0 h-full px-1 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
								onClick={() => setShowPassword(!showPassword)}
								aria-label={showPassword ? 'Hide password' : 'Show password'}
							>
								{showPassword ? (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 transition-opacity duration-200 m-auto"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path
											fillRule="evenodd"
											d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
											clipRule="evenodd"
										/>
										<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
									</svg>
								) : (
									<svg
										xmlns="http://www.w3.org/2000/svg"
										className="h-5 w-5 transition-opacity duration-200 m-auto"
										viewBox="0 0 20 20"
										fill="currentColor"
									>
										<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
										<path
											fillRule="evenodd"
											d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
											clipRule="evenodd"
										/>
									</svg>
								)}
							</button>
						</div>
						<PasswordCriteriaChecker
							criteria={passwordCriteria}
							hasInput={hasInput}
						/>
					</div>
				) : (
					<div className="relative">
						<Input
							type={showPassword ? 'text' : 'password'}
							name={name}
							value={value}
							onChange={onChange}
							placeholder={placeholder}
							aria-label={label}
							// className={`w-full px-6 py-3 pr-12 rounded-lg border ${
							// error ? "border-red-300" : "border-gray-300"
							// } focus:outline-none focus:ring-2 focus:ring-[#126E64] focus:border-transparent transition-all`}
						/>
						<button
							type="button"
							className="absolute right-3 top-0 bottom-0 h-full px-1 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors duration-200"
							onClick={() => setShowPassword(!showPassword)}
							aria-label={showPassword ? 'Hide password' : 'Show password'}
						>
							{showPassword ? (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 transition-opacity duration-200 m-auto"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
										clipRule="evenodd"
									/>
									<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
								</svg>
							) : (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5 transition-opacity duration-200 m-auto"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
									<path
										fillRule="evenodd"
										d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
										clipRule="evenodd"
									/>
								</svg>
							)}
						</button>
					</div>
				)}

				{error && (
					<p className="text-sm text-red-500 mt-1 flex items-center">{error}</p>
				)}

				{helpText && !error && (
					<p className="text-xs text-gray-500 mt-1 ml-3">{helpText}</p>
				)}
			</div>
		</div>
	)
}

export default PasswordField
