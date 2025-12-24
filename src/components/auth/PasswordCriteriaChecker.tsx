import React from 'react'

export type PasswordCriteriaType = {
	length: boolean
	uppercase: boolean
	lowercase: boolean
	number: boolean
	special: boolean
}

interface PasswordCriteriaCheckerProps {
	criteria: PasswordCriteriaType
	hasInput?: boolean
}

const PasswordCriteriaChecker: React.FC<PasswordCriteriaCheckerProps> = ({
	criteria,
	hasInput = true,
}) => {
	const getIconColor = (isFulfilled: boolean) => {
		if (isFulfilled) return 'text-green-500'
		return hasInput ? 'text-red-500' : 'text-gray-400'
	}

	const getTextColor = (isFulfilled: boolean) => {
		if (isFulfilled) return 'text-green-600'
		return hasInput ? 'text-red-500' : 'text-gray-500'
	}

	return (
		<div className="p-4 space-y-2">
			<p className="text-sm text-gray-700 mb-2">Password must contain:</p>

			<div className="flex items-center">
				{criteria.length ? (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.length)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				) : (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.length)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)}
				<span className={`text-sm ${getTextColor(criteria.length)}`}>
					at least 12 characters
				</span>
			</div>

			<div className="flex items-center">
				{criteria.uppercase ? (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.uppercase)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				) : (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.uppercase)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)}
				<span className={`text-sm ${getTextColor(criteria.uppercase)}`}>
					at least 1 uppercase letter
				</span>
			</div>

			<div className="flex items-center">
				{criteria.lowercase ? (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.lowercase)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				) : (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.lowercase)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)}
				<span className={`text-sm ${getTextColor(criteria.lowercase)}`}>
					at least 1 lowercase letter
				</span>
			</div>

			<div className="flex items-center">
				{criteria.number ? (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.number)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				) : (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.number)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)}
				<span className={`text-sm ${getTextColor(criteria.number)}`}>
					at least 1 number
				</span>
			</div>

			<div className="flex items-center">
				{criteria.special ? (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.special)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M5 13l4 4L19 7"
						/>
					</svg>
				) : (
					<svg
						className={`h-4 w-4 ${getIconColor(criteria.special)} mr-2`}
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						strokeWidth={2}
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				)}
				<span className={`text-sm ${getTextColor(criteria.special)}`}>
					at least 1 special character
				</span>
			</div>
		</div>
	)
}

export default PasswordCriteriaChecker
