import React from 'react'
import Select from 'react-select'

interface CustomSelectProps {
	value?: any
	onChange?: (option: any) => void
	placeholder?: string
	options?: any[]
	isMulti?: boolean
	isClearable?: boolean
	isSearchable?: boolean
	formatOptionLabel?: (option: any) => React.ReactNode
	getOptionValue?: (option: any) => string
	filterOption?: (option: any, inputValue: string) => boolean
	menuPortalTarget?: HTMLElement | null
	className?: string
	styles?: any
}

const customStyles = {
	control: (provided: any) => ({
		...provided,
		minHeight: '40px',
		height: '40px',
		border: '1px solid #e5e7eb', // border-gray-200
		borderRadius: '20px',
		backgroundColor: '#F5F7FB', // match Input component background
		fontSize: '14px',
		padding: '0 16px', // only horizontal padding, no vertical padding
		display: 'flex',
		alignItems: 'center',
		'&:hover': {
			border: '1px solid #e5e7eb',
		},
		'&:focus-within': {
			border: '1px solid transparent',
			boxShadow: '0 0 0 2px #126E64', // focus ring color
		},
	}),
	placeholder: (provided: any) => ({
		...provided,
		color: '#9ca3af', // gray-400 - match Input placeholder
		fontWeight: 'normal',
		fontSize: '14px',
	}),
	singleValue: (provided: any) => ({
		...provided,
		color: '#374151', // gray-700 - match Input text color
		fontWeight: 'normal',
		fontSize: '14px',
	}),
	multiValue: (provided: any) => ({
		...provided,
		backgroundColor: 'hsl(var(--secondary))',
		color: 'hsl(var(--secondary-foreground))',
		borderRadius: '16px',
		fontSize: '14px',
	}),
	multiValueLabel: (provided: any) => ({
		...provided,
		color: 'hsl(var(--secondary-foreground))',
		fontWeight: 'normal',
		fontSize: '14px',
	}),
	multiValueRemove: (provided: any) => ({
		...provided,
		color: 'hsl(var(--muted-foreground))',
		fontSize: '14px',
		'&:hover': {
			backgroundColor: 'hsl(var(--destructive))',
			color: 'hsl(var(--destructive-foreground))',
		},
	}),
	menu: (provided: any) => ({
		...provided,
		fontSize: '14px',
		position: 'fixed',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: '400px',
		maxHeight: '400px',
		zIndex: 9999,
		boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
		border: '1px solid #e5e7eb',
		borderRadius: '12px',
		backgroundColor: 'white',
	}),
	option: (provided: any, state: any) => ({
		...provided,
		fontSize: '14px',
		padding: '12px 16px',
		backgroundColor: state.isSelected
			? '#f3f4f6'
			: state.isFocused
				? '#f9fafb'
				: 'white',
		color: state.isSelected ? '#1f2937' : '#374151',
		cursor: 'pointer',
		'&:hover': {
			backgroundColor: '#f3f4f6',
		},
	}),
	menuList: (provided: any) => ({
		...provided,
		fontSize: '14px',
		maxHeight: '350px',
		overflowY: 'auto',
	}),
	menuPortal: (provided: any) => ({
		...provided,
		zIndex: 9999,
	}),
}

export function CustomSelect({
	value,
	onChange,
	placeholder,
	options = [],
	isMulti = false,
	isClearable = false,
	isSearchable = false,
	formatOptionLabel,
	getOptionValue,
	filterOption,
	menuPortalTarget,
	className = '',
	styles,
}: CustomSelectProps) {
	return (
		<Select
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			options={options}
			styles={styles || customStyles}
			isMulti={isMulti}
			isClearable={isClearable}
			isSearchable={isSearchable}
			formatOptionLabel={formatOptionLabel}
			getOptionValue={getOptionValue}
			filterOption={filterOption}
			menuPortalTarget={menuPortalTarget}
			className={className}
		/>
	)
}

export default CustomSelect
