import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import React from 'react'
import ReactDOM from 'react-dom'
import { cn } from '@/lib/utils'
import {
	FileItem,
	getFileIcon,
	getFileColor,
	getFileCategory,
	getFileExtension,
	formatFileSize,
} from '@/lib/file-utils'

interface ImageItem {
	id: string
	base64: string
	name?: string
	type: string
}

interface LogoItem {
	base64: string
	name?: string
}

interface TabConfig {
	id: string
	label: string
}

interface ImageManagerProps {
	className?: string
	images?: ImageItem[]
	files?: FileItem[]
	logo?: LogoItem | null
	onDeleteImage?: (id: string) => void
	onDeleteFile?: (id: string) => void
	onDeleteLogo?: () => void
	title?: string
	buttonText?: string
	emptyText?: string
	showLogoTab?: boolean
	tabs?: TabConfig[] // Custom tabs configuration
	defaultTab?: string // Default active tab
	showFileIcons?: boolean
	showFileSizes?: boolean
}

const ImageManager: React.FC<ImageManagerProps> = ({
	className = '',
	images = [],
	files = [],
	logo = null,
	onDeleteImage,
	onDeleteFile,
	onDeleteLogo,
	title = 'Manage Files',
	buttonText = 'Manage Files',
	emptyText = 'No files uploaded yet',
	showLogoTab = false,
	tabs = [], // Default to empty array if no tabs provided
	defaultTab = 'project', // Default to 'project' if no default tab provided
	showFileIcons = true,
	showFileSizes = true,
}) => {
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [activeTab, setActiveTab] = useState<string>(defaultTab)
	const modalRef = useRef<HTMLDivElement>(null)
	const [modalAnimation, setModalAnimation] = useState('')

	// Close modal when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				modalRef.current &&
				!modalRef.current.contains(event.target as Node)
			) {
				closeModalWithAnimation()
			}
		}

		if (isModalOpen) {
			document.addEventListener('mousedown', handleClickOutside)
		}
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isModalOpen])

	// Open modal with zoom-in animation
	const openModalWithAnimation = () => {
		setModalAnimation('scale-0')
		setIsModalOpen(true)
		setTimeout(() => {
			setModalAnimation('scale-100 transition-transform duration-300 ease-out')
		}, 10)
	}

	// Close modal with zoom-out animation
	const closeModalWithAnimation = () => {
		setModalAnimation('scale-0 transition-transform duration-300 ease-in')
		setTimeout(() => {
			setIsModalOpen(false)
		}, 300)
	}

	// Handle image deletion
	const handleImageDelete = (id: string) => {
		if (onDeleteImage) {
			onDeleteImage(id)
		}
	}

	// Handle file deletion
	const handleFileDelete = (id: string) => {
		if (onDeleteFile) {
			onDeleteFile(id)
		}
	}

	// Handle logo deletion
	const handleLogoDelete = () => {
		if (onDeleteLogo) {
			onDeleteLogo()
		}
	}

	// Filter images by type
	const getImagesByType = (type: string) => {
		return images.filter((img) => img.type === type)
	}

	// Filter files by type
	const getFilesByType = (type: string) => {
		return files.filter((file) => file.type === type)
	}

	// Get total count for button text
	const getTotalCount = () => {
		return images.length + files.length + (logo ? 1 : 0)
	}

	return (
		<div className={cn('relative', className)}>
			{/* Trigger Button */}
			<button
				className="w-full px-4 py-2 text-center border rounded-xl focus:outline-none flex items-center justify-center space-x-2 text-foreground hover:bg-accent transition-colors bg-card border-border"
				onClick={openModalWithAnimation}
				type="button"
				aria-haspopup="dialog"
				aria-expanded={isModalOpen}
			>
				<span>
					{buttonText} ({getTotalCount()})
				</span>
			</button>

			{/* Modal Overlay */}
			{isModalOpen &&
				ReactDOM.createPortal(
					<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
						<div
							ref={modalRef}
							className={cn(
								'bg-card border border-border text-foreground rounded-3xl max-w-4xl w-full p-6 transform z-10',
								modalAnimation
							)}
							style={{ maxHeight: '85vh' }}
						>
							<div className="absolute top-[-50px] left-[200px] h-[600px] w-[600px] rounded-full opacity-20 blur-[5000px] z-0 bg-primary"></div>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold">{title}</h2>
								<button
									onClick={closeModalWithAnimation}
									className="text-muted-foreground hover:text-foreground focus:outline-none"
								>
									✕
								</button>
							</div>

							{/* Tabs */}
							<div className="flex justify-center border-b border-border mb-8 sticky top-0 bg-card z-10 pb-0 overflow-x-auto">
								{tabs.map((tab) => (
									<button
										key={tab.id}
										className={cn(
											'px-8 py-4 text-base transition-all duration-200 relative whitespace-nowrap',
											activeTab === tab.id
												? 'text-primary font-medium'
												: 'text-muted-foreground hover:text-foreground'
										)}
										onClick={() => setActiveTab(tab.id)}
										style={{
											zIndex: 20,
											outline: 'none',
										}}
									>
										{tab.label}
										{activeTab === tab.id && (
											<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
										)}
									</button>
								))}
								{showLogoTab && (
									<button
										className={cn(
											'px-8 py-4 text-base transition-all duration-200 relative',
											activeTab === 'logo'
												? 'text-primary font-medium'
												: 'text-muted-foreground hover:text-foreground'
										)}
										onClick={() => setActiveTab('logo')}
										style={{
											zIndex: 20,
											outline: 'none',
										}}
									>
										Project Logo
										{activeTab === 'logo' && (
											<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"></div>
										)}
									</button>
								)}
							</div>

							<div
								className="overflow-y-auto"
								style={{ maxHeight: 'calc(85vh - 150px)' }}
							>
								{activeTab !== 'logo' && (
									<>
										{/* Images Section */}
										{getImagesByType(activeTab).length > 0 && (
											<div className="mb-6">
												<h3 className="text-lg font-medium mb-4">Images</h3>
												<div
													className={cn(
														'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4',
														getImagesByType(activeTab).length <= 4
															? ''
															: 'pr-2 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-muted/50 [&::-webkit-scrollbar-track]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-primary/50 [&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb:hover]:bg-primary/70'
													)}
												>
													{getImagesByType(activeTab).map((image) => (
														<div
															key={image.id}
															className="group bg-card border border-border rounded-xl p-2 flex flex-col items-center relative"
														>
															<div className="w-full aspect-square overflow-hidden rounded-lg mb-2 relative">
																<Image
																	src={image.base64}
																	alt={image.name || `Image ${image.id}`}
																	width={800}
																	height={800}
																	className="w-full h-full object-cover"
																/>
																<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
																	<button
																		onClick={() => handleImageDelete(image.id)}
																		className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-2 rounded-full transition-all duration-200 transform scale-90 hover:scale-100"
																		aria-label="Delete image"
																	>
																		<svg
																			xmlns="http://www.w3.org/2000/svg"
																			className="h-5 w-5"
																			fill="none"
																			viewBox="0 0 24 24"
																			stroke="currentColor"
																		>
																			<path
																				strokeLinecap="round"
																				strokeLinejoin="round"
																				strokeWidth={2}
																				d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																			/>
																		</svg>
																	</button>
																</div>
															</div>
															<span className="text-xs text-muted-foreground truncate w-full text-center">
																{image.name || `Image ${image.id}`}
															</span>
														</div>
													))}
												</div>
											</div>
										)}

										{/* Files Section */}
										{getFilesByType(activeTab).length > 0 && (
											<div className="mb-6">
												<h3 className="text-lg font-medium mb-4">Files</h3>
												<div className="space-y-2">
													{getFilesByType(activeTab).map((file) => {
														const extension = getFileExtension(file.name)
														const category = getFileCategory(extension)
														const icon = getFileIcon(category, extension)
														const fileColor = getFileColor(category)

														return (
															<div
																key={file.id}
																className="group bg-card border border-border rounded-lg p-3 flex items-center space-x-3 hover:bg-accent/50 transition-colors relative"
															>
																{showFileIcons && (
																	<span
																		className="text-2xl flex-shrink-0"
																		style={{ color: fileColor }}
																	>
																		{icon}
																	</span>
																)}
																<div className="flex-1 min-w-0">
																	<p className="text-sm font-medium text-foreground truncate">
																		{file.name}
																	</p>
																	<div className="flex items-center space-x-2 text-xs text-muted-foreground">
																		<span className="capitalize">
																			{category}
																		</span>
																		{showFileSizes && file.size && (
																			<>
																				<span>•</span>
																				<span>{formatFileSize(file.size)}</span>
																			</>
																		)}
																		{file.extension && (
																			<>
																				<span>•</span>
																				<span className="uppercase">
																					{file.extension}
																				</span>
																			</>
																		)}
																	</div>
																</div>
																<button
																	onClick={() => handleFileDelete(file.id)}
																	className="opacity-0 group-hover:opacity-100 bg-destructive hover:bg-destructive/90 text-destructive-foreground p-1.5 rounded-full transition-all duration-200"
																	aria-label="Delete file"
																>
																	<svg
																		xmlns="http://www.w3.org/2000/svg"
																		className="h-4 w-4"
																		fill="none"
																		viewBox="0 0 24 24"
																		stroke="currentColor"
																	>
																		<path
																			strokeLinecap="round"
																			strokeLinejoin="round"
																			strokeWidth={2}
																			d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																		/>
																	</svg>
																</button>
															</div>
														)
													})}
												</div>
											</div>
										)}

										{/* Empty State */}
										{getImagesByType(activeTab).length === 0 &&
											getFilesByType(activeTab).length === 0 && (
												<div className="text-center p-10 text-muted-foreground">
													{emptyText}
												</div>
											)}
									</>
								)}

								{activeTab === 'logo' && (
									<>
										{logo ? (
											<div className="flex flex-col items-center">
												<div className="w-48 h-48 bg-card border border-border rounded-xl p-2 mb-4 relative group">
													<Image
														src={logo.base64}
														alt="Project Logo"
														width={800}
														height={800}
														className="w-full h-full object-contain rounded-lg"
													/>
													<div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-lg">
														<button
															onClick={handleLogoDelete}
															className="bg-destructive hover:bg-destructive/90 text-destructive-foreground p-2 rounded-full transition-all duration-200 transform scale-90 hover:scale-100"
															aria-label="Delete logo"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																className="h-5 w-5"
																fill="none"
																viewBox="0 0 24 24"
																stroke="currentColor"
															>
																<path
																	strokeLinecap="round"
																	strokeLinejoin="round"
																	strokeWidth={2}
																	d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
																/>
															</svg>
														</button>
													</div>
												</div>
												<span className="text-sm text-foreground mb-2">
													{logo.name || 'Project Logo'}
												</span>
												<p className="text-xs text-muted-foreground text-center">
													Your project logo should be 512×512px, PNG format
													(transparent background recommended)
												</p>
											</div>
										) : (
											<div className="text-center p-10 text-muted-foreground">
												No logo uploaded yet. Click the logo upload area to add
												your project logo.
											</div>
										)}
									</>
								)}
							</div>
						</div>
					</div>,
					document.body
				)}
		</div>
	)
}

export { ImageManager }
export default ImageManager
