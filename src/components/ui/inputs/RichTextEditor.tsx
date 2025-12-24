'use client'

import React, { useMemo, useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Label } from '@/components/ui'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), {
	ssr: false,
	loading: () => (
		<div className="h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
			Loading editor...
		</div>
	),
})

interface RichTextEditorProps {
	value: string
	onChange: (value: string) => void
	label?: string
	placeholder?: string
	className?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
	value,
	onChange,
	label,
	placeholder = 'Enter your content...',
	className = '',
}) => {
	const [isMounted, setIsMounted] = useState(false)

	useEffect(() => {
		setIsMounted(true)
	}, [])

	const modules = useMemo(
		() => ({
			toolbar: [
				[{ header: [1, 2, 3, false] }],
				['bold', 'italic', 'underline', 'strike'],
				[{ list: 'ordered' }, { list: 'bullet' }],
				[{ indent: '-1' }, { indent: '+1' }],
				['link'],
				[{ align: [] }],
				['clean'],
			],
		}),
		[]
	)

	const formats = [
		'header',
		'bold',
		'italic',
		'underline',
		'strike',
		'list',
		'bullet',
		'indent',
		'link',
		'align',
	]

	if (!isMounted) {
		return (
			<div className={`space-y-2 ${className}`}>
				{label && <Label htmlFor="rich-text-editor">{label}</Label>}
				<div className="h-[200px] border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-center justify-center">
					Loading editor...
				</div>
			</div>
		)
	}

	return (
		<div className={`space-y-2 ${className}`}>
			{label && <Label htmlFor="rich-text-editor">{label}</Label>}
			<div className="border border-gray-200 rounded-lg overflow-visible relative rich-text-editor-container">
				<ReactQuill
					theme="snow"
					value={value}
					onChange={onChange}
					modules={modules}
					formats={formats}
					placeholder={placeholder}
					style={{
						height: 'auto',
						minHeight: '200px',
					}}
				/>
			</div>
			<style jsx global>{`
				.rich-text-editor-container .ql-toolbar {
					position: relative !important;
					background: white !important;
					border-bottom: 1px solid #e5e7eb !important;
					border-radius: 0.5rem 0.5rem 0 0 !important;
				}
				.rich-text-editor-container .ql-container {
					height: auto !important;
					min-height: 150px !important;
					border-radius: 0 0 0.5rem 0.5rem !important;
				}
				.rich-text-editor-container .ql-editor {
					min-height: 150px !important;
				}
			`}</style>
		</div>
	)
}

export default RichTextEditor
