import React, { useEffect, useRef, useState } from 'react'

type Option = { value: string; label: string }

export default function Select({
	options,
	value,
	onChange,
	placeholder = 'Select…',
	disabled = false,
}: {
	options: Option[]
	value?: string
	onChange: (v: string) => void
	placeholder?: string
	disabled?: boolean
}) {
	const [open, setOpen] = useState(false)
	const [highlight, setHighlight] = useState<number>(-1)
	const rootRef = useRef<HTMLDivElement | null>(null)

	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
		}
		document.addEventListener('mousedown', onDoc)
		return () => document.removeEventListener('mousedown', onDoc)
	}, [])

	useEffect(() => {
		if (open) setHighlight(options.findIndex((o) => o.value === value))
	}, [open, options, value])

	function onKeyDown(e: React.KeyboardEvent) {
		if (disabled) return
		if (e.key === 'ArrowDown') {
			e.preventDefault()
			setOpen(true)
			setHighlight((h) => Math.min(options.length - 1, h + 1 || 0))
		} else if (e.key === 'ArrowUp') {
			e.preventDefault()
			setHighlight((h) => Math.max(0, h - 1 || 0))
		} else if (e.key === 'Enter' && open && highlight >= 0) {
			onChange(options[highlight].value)
			setOpen(false)
		} else if (e.key === 'Escape') {
			setOpen(false)
		}
	}

	const selected = options.find((o) => o.value === value)

	return (
		<div className="relative inline-block w-full" ref={rootRef}>
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen((s) => !s)}
				onKeyDown={onKeyDown}
				disabled={disabled}
				className={`w-full text-left px-3 py-2 border rounded-md focus:outline-none focus:ring ${
					disabled
						? 'bg-gray-100 text-gray-400 border-gray-200'
						: 'bg-white border-gray-300'
				}`}
			>
				{selected?.label ?? (
					<span className="text-gray-400">{placeholder}</span>
				)}
			</button>

			{open && (
				<ul
					role="listbox"
					tabIndex={-1}
					className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-48 overflow-auto rounded-md ring-1 ring-black ring-opacity-5"
				>
					{options.length === 0 && (
						<li className="px-3 py-2 text-sm text-gray-500">No options</li>
					)}
					{options.map((opt, i) => {
						const isHighlighted = i === highlight
						return (
							<li
								key={opt.value}
								role="option"
								aria-selected={opt.value === value}
								onMouseEnter={() => setHighlight(i)}
								onMouseDown={(e) => {
									e.preventDefault()
									onChange(opt.value)
									setOpen(false)
								}}
								className={`px-3 py-2 cursor-pointer ${isHighlighted ? 'bg-emerald-700 text-white' : 'text-gray-800'}`}
							>
								{opt.label}
							</li>
						)
					})}
				</ul>
			)}
		</div>
	)
}
