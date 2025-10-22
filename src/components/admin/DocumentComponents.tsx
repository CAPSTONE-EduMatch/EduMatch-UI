import { Download } from 'lucide-react'

export interface FileInfo {
	name: string
	size: string
	date: string
}

interface FileCardProps {
	file: FileInfo
	userId: string
	downloadEndpoint?: string
}

export const FileCard = ({
	file,
	userId,
	downloadEndpoint = `/api/admin/users/${userId}/documents/${file.name}`,
}: FileCardProps) => {
	const handleDownload = async () => {
		try {
			const response = await fetch(downloadEndpoint)
			if (response.ok) {
				const blob = await response.blob()
				const url = window.URL.createObjectURL(blob)
				const a = document.createElement('a')
				a.href = url
				a.download = file.name
				document.body.appendChild(a)
				a.click()
				window.URL.revokeObjectURL(url)
				document.body.removeChild(a)
			} else {
				alert('Failed to download file')
			}
		} catch (error) {
			alert('Error downloading file')
		}
	}

	return (
		<div className="bg-white border border-[#D2D2D2] rounded-[15px] p-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-6 h-6 bg-[#F5F7FB] rounded flex items-center justify-center">
						<div className="w-3 h-3 bg-[#33363F] rounded-sm"></div>
					</div>
					<span className="text-sm font-medium text-black">{file.name}</span>
				</div>
				<button
					onClick={handleDownload}
					className="w-6 h-6 bg-[#126E64] rounded flex items-center justify-center cursor-pointer hover:bg-[#0f5a52] transition-colors"
				>
					<Download className="w-3 h-3 text-white" />
				</button>
			</div>
			<div className="flex items-center gap-4 mt-3 text-xs text-[#A2A2A2]">
				<span className="text-[#8D8D8D]">{file.size}</span>
				<span>{file.date}</span>
				<span>Click to quick preview file</span>
			</div>
		</div>
	)
}

interface DocumentSectionProps {
	title: string
	files: FileInfo[]
	userId: string
	downloadButtonText?: string
	emptyStateMessage?: string
	emptyStateSubMessage?: string
	titleClassName?: string
	containerClassName?: string
	downloadEndpoint?: (fileName: string) => string
}

export const DocumentSection = ({
	title,
	files,
	userId,
	downloadButtonText = 'Download folder',
	emptyStateMessage,
	emptyStateSubMessage = 'Documents will appear here once uploaded',
	titleClassName = 'text-xl font-semibold text-[#116E63]',
	containerClassName = 'mb-6',
	downloadEndpoint,
}: DocumentSectionProps) => (
	<div className={containerClassName}>
		<div className="flex items-center justify-between mb-4">
			<h3 className={titleClassName}>{title}</h3>
			<button
				disabled={files.length === 0}
				className={`px-4 py-2 rounded-[20px] flex items-center gap-2 text-sm transition-colors ${
					files.length === 0
						? 'bg-gray-300 text-gray-500 cursor-not-allowed'
						: 'bg-[#126E64] text-white cursor-pointer hover:bg-[#0f5a52]'
				}`}
			>
				<Download className="w-3 h-3" />
				<span>{downloadButtonText}</span>
			</button>
		</div>
		<div className="space-y-3">
			{files.length > 0 ? (
				files.map((file, index) => (
					<FileCard
						key={index}
						file={file}
						userId={userId}
						downloadEndpoint={
							downloadEndpoint ? downloadEndpoint(file.name) : undefined
						}
					/>
				))
			) : (
				<div className="bg-white border border-[#D2D2D2] rounded-[15px] p-8">
					<div className="text-center">
						<div className="w-12 h-12 bg-[#F5F7FB] rounded-full flex items-center justify-center mx-auto mb-3">
							<Download className="w-6 h-6 text-[#A2A2A2]" />
						</div>
						<p className="text-sm text-black font-medium">
							{emptyStateMessage || `No ${title.toLowerCase()} uploaded yet`}
						</p>
						<p className="text-xs text-black mt-1">{emptyStateSubMessage}</p>
					</div>
				</div>
			)}
		</div>
	</div>
)
