import React, { useState, useRef, useEffect } from 'react'
import { Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker } from 'react-day-picker'
import { format, parse, isValid, subYears, addYears } from 'date-fns'
import 'react-day-picker/dist/style.css'

interface DateInputProps {
	id: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
	className?: string
	error?: string
	label?: string
	minDate?: string
	maxDate?: string
}

export const DateInput: React.FC<DateInputProps> = ({
	id,
	value,
	onChange,
	placeholder = 'dd/mm/yyyy',
	disabled = false,
	className = '',
	error,
	label,
	minDate,
	maxDate,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [birthdayError, setBirthdayError] = useState<string>('')
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const parseDDMMYYYYToDate = (dateString: string) => {
		if (!dateString) return null

		// If already in YYYY-MM-DD format, parse it directly
		if (dateString.includes('-') && !dateString.includes('/')) {
			const date = new Date(dateString)
			return isValid(date) ? date : null
		}

		// Try to parse dd/mm/yyyy format
		const parsed = parse(dateString, 'dd/MM/yyyy', new Date())
		return isValid(parsed) ? parsed : null
	}

	const [currentMonth, setCurrentMonth] = useState<Date>(() => {
		// If there's a value, use that year, otherwise use current year
		const parsedDate = parseDDMMYYYYToDate(value)
		return parsedDate || new Date()
	})

	// Update current month when value changes
	useEffect(() => {
		const parsedDate = parseDDMMYYYYToDate(value)
		if (parsedDate) {
			setCurrentMonth(parsedDate)
		}
	}, [value])

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const formatDateToDDMMYYYY = (date: Date) => {
		return format(date, 'dd/MM/yyyy')
	}

	const validateDate = (dateString: string) => {
		if (!dateString) {
			setBirthdayError('')
			return true
		}

		// Check if the format is dd/mm/yyyy
		const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/
		const match = dateString.match(dateRegex)

		if (!match) {
			setBirthdayError('Please enter date in dd/mm/yyyy format')
			return false
		}

		const day = parseInt(match[1], 10)
		const month = parseInt(match[2], 10)
		const year = parseInt(match[3], 10)

		// Validate day and month ranges
		if (day < 1 || day > 31 || month < 1 || month > 12) {
			setBirthdayError('Please enter a valid date')
			return false
		}

		// Create date object (month is 0-indexed in JavaScript Date)
		const selectedDate = new Date(year, month - 1, day)

		// Check if the date is valid (handles invalid dates like 31/02/2023)
		if (
			selectedDate.getDate() !== day ||
			selectedDate.getMonth() !== month - 1 ||
			selectedDate.getFullYear() !== year
		) {
			setBirthdayError('Please enter a valid date')
			return false
		}

		// Check min date constraint
		if (minDate) {
			const minDateObj = new Date(minDate)
			if (selectedDate < minDateObj) {
				setBirthdayError(
					`Date must be ${minDateObj.toLocaleDateString()} or later`
				)
				return false
			}
		}

		// Check max date constraint
		if (maxDate) {
			const maxDateObj = new Date(maxDate)
			if (selectedDate > maxDateObj) {
				setBirthdayError(
					`Date must be ${maxDateObj.toLocaleDateString()} or earlier`
				)
				return false
			}
		}

		setBirthdayError('')
		return true
	}

	const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value
		validateDate(value)
		onChange(value)
	}

	const handleInputClick = () => {
		if (!disabled) {
			setIsOpen(!isOpen)
		}
	}

	const handleDateSelect = (date: Date | undefined) => {
		if (date) {
			const formattedDate = formatDateToDDMMYYYY(date)
			onChange(formattedDate)
			validateDate(formattedDate)
		}
		setIsOpen(false)
	}

	const handlePreviousMonth = () => {
		setCurrentMonth((prev) => subYears(prev, 1))
	}

	const handleNextMonth = () => {
		setCurrentMonth((prev) => addYears(prev, 1))
	}

	const handleYearSelect = (year: number) => {
		const newDate = new Date(year, currentMonth.getMonth(), 1)
		setCurrentMonth(newDate)
	}

	// Generate year options based on min/max dates
	const getYearOptions = () => {
		if (minDate && maxDate) {
			const minYear = new Date(minDate).getFullYear()
			const maxYear = new Date(maxDate).getFullYear()
			return Array.from(
				{ length: maxYear - minYear + 1 },
				(_, i) => minYear + i
			)
		}
		// Default: current year to 2030 for future dates
		const currentYear = new Date().getFullYear()
		return Array.from(
			{ length: 2030 - currentYear + 1 },
			(_, i) => currentYear + i
		)
	}
	const yearOptions = getYearOptions()

	const handleClearDate = (e: React.MouseEvent) => {
		e.stopPropagation()
		onChange('')
		setBirthdayError('')
	}

	// Convert YYYY-MM-DD format to DD/MM/YYYY for display
	const getDisplayValue = (dateString: string): string => {
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

		return dateString
	}

	const selectedDate = parseDDMMYYYYToDate(value)
	const displayError = error || birthdayError
	const displayValue = getDisplayValue(value)

	return (
		<div className="space-y-2">
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-gray-700">
					{label}
				</label>
			)}
			<div className="relative" ref={containerRef}>
				<input
					ref={inputRef}
					id={id}
					type="text"
					placeholder={placeholder}
					value={displayValue}
					onChange={handleTextInputChange}
					onClick={handleInputClick}
					disabled={disabled}
					className={`w-full h-10 px-4 pr-20 py-2 border border-gray-200 rounded-full bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
						displayError ? 'border-red-500 focus:border-red-500' : ''
					} ${
						disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
					} ${className}`}
					style={{
						fontSize: '14px',
					}}
				/>

				{/* Icons */}
				<div className="absolute inset-y-0 right-0 flex items-center pr-3">
					{value && !disabled && (
						<button
							type="button"
							onClick={handleClearDate}
							className="mr-2 p-1 hover:bg-gray-200 rounded-full transition-colors"
						>
							<X className="h-3 w-3 text-gray-400 hover:text-gray-600" />
						</button>
					)}
					<Calendar className="h-4 w-4 text-gray-400" />
				</div>

				{/* Date Picker Dropdown - Auto Width */}
				{isOpen && !disabled && (
					<div className="absolute top-full left-0 z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-fit">
						<div className="flex">
							{/* Year Selection - Left Side */}
							<div className="w-36 p-3 border-r border-gray-200">
								<div className="flex items-center justify-between mb-2">
									<span className="text-xs font-medium text-gray-600">
										Year
									</span>
									<div className="flex space-x-1">
										<button
											type="button"
											onClick={handlePreviousMonth}
											className="p-0.5 hover:bg-gray-100 rounded transition-colors"
											title="Previous year"
										>
											<ChevronLeft className="h-3 w-3" />
										</button>
										<button
											type="button"
											onClick={handleNextMonth}
											className="p-0.5 hover:bg-gray-100 rounded transition-colors"
											title="Next year"
										>
											<ChevronRight className="h-3 w-3" />
										</button>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
									{yearOptions.map((year) => (
										<button
											key={year}
											type="button"
											onClick={() => handleYearSelect(year)}
											className={`px-2 py-1 text-xs rounded hover:bg-primary/10 transition-colors ${
												currentMonth.getFullYear() === year
													? 'bg-primary text-white hover:bg-primary'
													: 'text-gray-700'
											}`}
										>
											{year}
										</button>
									))}
								</div>
							</div>

							{/* Calendar - Right Side */}
							<div className="p-3">
								<DayPicker
									mode="single"
									selected={selectedDate || undefined}
									onSelect={handleDateSelect}
									month={currentMonth}
									onMonthChange={setCurrentMonth}
									disabled={(date) => {
										if (minDate && date < new Date(minDate)) return true
										if (maxDate && date > new Date(maxDate)) return true
										return false
									}}
									classNames={{
										day: 'hover:bg-primary/10 rounded text-sm h-6 w-6',
										day_selected: 'bg-primary text-white hover:bg-primary',
										day_today: 'font-bold',
										head_cell: 'text-gray-600 font-medium text-sm',
										month: 'p-0',
										caption: 'flex justify-center pt-1 relative items-center',
										caption_label: 'text-sm font-medium',
										nav: 'flex items-center',
										nav_button:
											'h-5 w-5 bg-transparent hover:bg-gray-100 rounded',
										nav_button_previous: 'absolute left-1',
										nav_button_next: 'absolute right-1',
										table: 'text-sm',
										cell: 'p-0',
										weekday: 'text-sm',
										weekdays: 'text-sm',
									}}
								/>
							</div>
						</div>
					</div>
				)}
			</div>
			{displayError && (
				<p className="text-sm text-red-500 mt-1">{displayError}</p>
			)}
		</div>
	)
}

export default DateInput
