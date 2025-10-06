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
	variant?: 'default' | 'green' | 'outline'
	maxSelectedHeight?: string
}

const getVariantStyles = (
	variant: 'default' | 'green' | 'outline',
	maxSelectedHeight?: string
) => {
	const baseStyles = {
		control: (provided: any, state: any) => ({
			...provided,
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
			position: 'relative',
			overflow: 'hidden',
			'&::-webkit-scrollbar': {
				width: '6px',
				position: 'absolute',
				right: '0',
				top: '0',
				bottom: '0',
			},
			'&::-webkit-scrollbar-track': {
				background: '#f1f5f9',
				borderRadius: '3px',
			},
			'&::-webkit-scrollbar-thumb': {
				background: '#cbd5e1',
				borderRadius: '3px',
				'&:hover': {
					background: '#94a3b8',
				},
			},
		}),
		placeholder: (provided: any) => ({
			...provided,
			fontWeight: 'normal',
			fontSize: '14px',
		}),
		singleValue: (provided: any) => ({
			...provided,
			fontWeight: 'normal',
			fontSize: '14px',
		}),
		multiValue: (provided: any) => ({
			...provided,
			backgroundColor: 'hsl(var(--secondary))',
			color: 'hsl(var(--secondary-foreground))',
			borderRadius: '12px',
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
		valueContainer: (provided: any) => ({
			...provided,
			flexWrap: 'wrap',
			gap: '4px',
			padding: '0',
			...(maxSelectedHeight && {
				maxHeight: maxSelectedHeight,
			}),
			overflowY: 'auto',
			overflowX: 'hidden',
			scrollbarWidth: 'thin',
			scrollbarColor: '#cbd5e1 #f1f5f9',
			// Remove padding to allow scrollbar to reach the edge
			paddingRight: '0',
			// Ensure content doesn't overlap with scrollbar
			marginRight: '6px',
		}),
		input: (provided: any) => ({
			...provided,
			margin: '0',
			padding: '0',
		}),
		indicatorsContainer: (provided: any) => ({
			...provided,
			display: 'flex',
			alignItems: 'center',
			gap: '4px',
		}),
		clearIndicator: (provided: any) => ({
			...provided,
			color: '#6b7280',
			'&:hover': {
				color: '#374151',
			},
		}),
		dropdownIndicator: (provided: any) => ({
			...provided,
			color: '#6b7280',
			'&:hover': {
				color: '#374151',
			},
		}),
	}

	switch (variant) {
		case 'green':
			return {
				...baseStyles,
				control: (provided: any, state: any) => ({
					...baseStyles.control(provided, state),
					border: '1px solid rgba(17, 110, 99, 0.7)',
					backgroundColor: 'rgba(17, 110, 99, 0.7)',
					color: 'white',
					'&:hover': {
						border: '1px solid rgba(17, 110, 99, 0.7)',
					},
					'&:focus-within': {
						border: '1px solid transparent',
						boxShadow: '0 0 0 2px #126E64',
					},
				}),
				placeholder: (provided: any) => ({
					...baseStyles.placeholder(provided),
					color: '#ffffff',
				}),
				singleValue: (provided: any) => ({
					...baseStyles.singleValue(provided),
					color: '#ffffff',
				}),
			}
		case 'outline':
			return {
				...baseStyles,
				control: (provided: any, state: any) => ({
					...baseStyles.control(provided, state),
					border: '1px solid #e5e7eb',
					backgroundColor: 'transparent',
					color: '#374151',
					'&:hover': {
						border: '1px solid #e5e7eb',
					},
					'&:focus-within': {
						border: '1px solid transparent',
						boxShadow: '0 0 0 2px #126E64',
					},
				}),
				placeholder: (provided: any) => ({
					...baseStyles.placeholder(provided),
					color: '#9ca3af',
				}),
				singleValue: (provided: any) => ({
					...baseStyles.singleValue(provided),
					color: '#374151',
				}),
			}
		default:
			return {
				...baseStyles,
				control: (provided: any, state: any) => ({
					...baseStyles.control(provided, state),
					border: '1px solid #e5e7eb',
					backgroundColor: '#F5F7FB',
					color: '#374151',
					'&:hover': {
						border: '1px solid #e5e7eb',
					},
					'&:focus-within': {
						border: '1px solid transparent',
						boxShadow: '0 0 0 2px #126E64',
					},
				}),
				placeholder: (provided: any) => ({
					...baseStyles.placeholder(provided),
					color: '#9ca3af',
				}),
				singleValue: (provided: any) => ({
					...baseStyles.singleValue(provided),
					color: '#374151',
				}),
			}
	}
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
	variant = 'default',
	maxSelectedHeight,
}: CustomSelectProps) {
	return (
		<Select
			value={value}
			onChange={onChange}
			placeholder={placeholder}
			options={options}
			styles={styles || getVariantStyles(variant, maxSelectedHeight)}
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
