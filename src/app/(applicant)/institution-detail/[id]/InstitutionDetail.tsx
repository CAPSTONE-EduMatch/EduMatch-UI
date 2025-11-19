'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui'
import { Button } from '@/components/ui'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui'
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProgramCard } from '@/components/ui/cards/ProgramCard'
import { ScholarshipCard } from '@/components/ui/cards/ScholarshipCard'
import { ResearchLabCard } from '@/components/ui/cards/ResearchLabCard'

interface InstitutionDetailProps {
	institutionId: string
}

export const InstitutionDetail: React.FC<InstitutionDetailProps> = ({
	institutionId,
}) => {
	const router = useRouter()
	const [institution, setInstitution] = useState<any>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [activeTab, setActiveTab] = useState<'overview' | 'posts'>('overview')

	// Posts state for the Posts tab
	const [posts, setPosts] = useState<any[]>([])
	const [postsLoading, setPostsLoading] = useState(false)
	const [postsError, setPostsError] = useState<string | null>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [activePostType, setActivePostType] = useState<
		'Program' | 'Scholarship' | 'Job'
	>('Program')

	// Load institution data
	useEffect(() => {
		const loadInstitution = async () => {
			try {
				setLoading(true)
				const response = await fetch(`/api/institution/${institutionId}`)
				const data = await response.json()

				if (data.success && data.institution) {
					setInstitution(data.institution)
				} else {
					setError('Institution not found')
				}
			} catch (error: any) {
				setError('Failed to load institution details')
			} finally {
				setLoading(false)
			}
		}

		if (institutionId) {
			loadInstitution()
		}
	}, [institutionId])

	// Load posts when posts tab is active
	useEffect(() => {
		if (activeTab === 'posts' && institutionId) {
			loadPosts()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeTab, institutionId, activePostType, currentPage])

	const loadPosts = async () => {
		try {
			setPostsLoading(true)
			setPostsError(null)

			const params = new URLSearchParams({
				institutionId: institutionId,
				page: currentPage.toString(),
				limit: '20',
				type: activePostType,
			})

			const response = await fetch(
				`/api/institution/${institutionId}/posts?${params}`
			)
			const data = await response.json()

			if (data.success) {
				setPosts(data.data || [])
				setTotalPages(data.pagination?.totalPages || 1)
			} else {
				setPostsError('Failed to load posts')
				setPosts([])
			}
		} catch (error) {
			setPostsError('Failed to load posts')
			setPosts([])
		} finally {
			setPostsLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-sm text-muted-foreground">
						Loading institution...
					</p>
				</div>
			</div>
		)
	}

	if (error || !institution) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<div className="text-6xl mb-4">🏛️</div>
					<h3 className="text-xl font-semibold text-gray-900 mb-2">
						Institution Not Found
					</h3>
					<p className="text-gray-600 mb-6">
						{error || 'The institution you are looking for does not exist.'}
					</p>
					<Button onClick={() => router.back()}>Go Back</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-background">
			<div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Header */}
				<div className="mb-6">
					<Button
						variant="outline"
						onClick={() => router.back()}
						className="mb-4"
					>
						← Back
					</Button>
					<h1 className="text-3xl font-bold text-gray-900">
						{institution.name}
					</h1>
					<p className="text-gray-600 mt-2">
						{institution.country && `${institution.country} • `}
						{institution.institutionType || 'Institution'}
					</p>
				</div>

				<div className="flex gap-6">
					{/* Left Panel - Institution Information */}
					<Card className="bg-white shadow-sm border lg:col-span-1 h-[750px] w-1/3">
						<CardContent className="p-6 h-full flex flex-col">
							<div className="space-y-6 flex-1">
								{/* Institution Header with Logo */}
								<div className="flex items-center gap-4">
									<div className="relative">
										<Avatar className="w-16 h-16">
											<AvatarImage src={institution.logo} />
											<AvatarFallback className="bg-blue-500 text-white">
												<Building2 className="w-8 h-8" />
											</AvatarFallback>
										</Avatar>
									</div>
									<div className="flex-1">
										<div>
											<h2 className="text-lg font-bold text-gray-900">
												{institution.name}
											</h2>
											<p className="text-sm text-gray-600">
												{institution.abbreviation}
											</p>
										</div>
									</div>
								</div>

								{/* Institution Details */}
								<div className="space-y-4">
									<div className="border-t pt-4">
										<h3 className="font-semibold text-gray-900 mb-3">
											Institution Details
										</h3>
										<div className="space-y-3">
											{institution.email && (
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Email:
													</span>
													<span className="text-sm font-medium w-full">
														{institution.email}
													</span>
												</div>
											)}
											{institution.website && (
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Website:
													</span>
													<a
														href={institution.website}
														target="_blank"
														rel="noopener noreferrer"
														className="text-sm text-blue-600 hover:text-blue-800 underline"
													>
														{institution.website}
													</a>
												</div>
											)}
											{institution.hotline && (
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Hotline:
													</span>
													<span className="text-sm font-medium">
														{institution.hotlineCode} {institution.hotline}
													</span>
												</div>
											)}
											{institution.address && (
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Address:
													</span>
													<span className="text-sm font-medium">
														{institution.address}
													</span>
												</div>
											)}
											{institution.country && (
												<div className="flex items-center gap-4">
													<span className="text-sm text-gray-600 w-24 flex-shrink-0">
														Country:
													</span>
													<span className="text-sm font-medium">
														{institution.country}
													</span>
												</div>
											)}
										</div>
									</div>

									{/* Representative Information */}
									{(institution.representativeName ||
										institution.representativeEmail ||
										institution.representativePhone) && (
										<div className="border-t pt-4">
											<h3 className="font-semibold text-gray-900 mb-3">
												Representative Information
											</h3>
											<div className="space-y-3">
												{institution.representativeName && (
													<div className="flex items-center gap-4">
														<span className="text-sm text-gray-600 w-24 flex-shrink-0">
															Name:
														</span>
														<span className="text-sm font-medium">
															{institution.representativeName}
														</span>
													</div>
												)}
												{institution.representativePosition && (
													<div className="flex items-center gap-4">
														<span className="text-sm text-gray-600 w-24 flex-shrink-0">
															Position:
														</span>
														<span className="text-sm font-medium">
															{institution.representativePosition}
														</span>
													</div>
												)}
												{institution.representativeEmail && (
													<div className="flex items-center gap-4">
														<span className="text-sm text-gray-600 w-24 flex-shrink-0">
															Email:
														</span>
														<span className="text-sm font-medium">
															{institution.representativeEmail}
														</span>
													</div>
												)}
												{institution.representativePhone && (
													<div className="flex items-center gap-4">
														<span className="text-sm text-gray-600 w-24 flex-shrink-0">
															Phone:
														</span>
														<span className="text-sm font-medium">
															{institution.representativePhoneCode}{' '}
															{institution.representativePhone}
														</span>
													</div>
												)}
											</div>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Right Panel - Tabs Content */}
					<Card className="bg-white shadow-sm border lg:col-span-1 h-[750px] w-2/3">
						<CardContent className="p-6 h-full flex flex-col">
							<div className="flex flex-col flex-1">
								{/* Navigation Tabs */}
								<div className="flex border-b flex-shrink-0">
									<button
										onClick={() => setActiveTab('overview')}
										className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
											activeTab === 'overview'
												? 'border-primary text-primary'
												: 'border-transparent text-gray-500 hover:text-gray-700'
										}`}
									>
										Overview
									</button>
									<button
										onClick={() => setActiveTab('posts')}
										className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
											activeTab === 'posts'
												? 'border-primary text-primary'
												: 'border-transparent text-gray-500 hover:text-gray-700'
										}`}
									>
										Posts
									</button>
								</div>

								{/* Tab Content */}
								<div className="flex-1 overflow-hidden max-h-[650px]">
									<AnimatePresence mode="wait">
										<motion.div
											key={activeTab}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											exit={{ opacity: 0, y: -10 }}
											transition={{ duration: 0.2 }}
											className="h-full"
										>
											{activeTab === 'overview' && (
												<div className="p-6 space-y-8 overflow-y-auto h-full">
													{/* Institution Description */}
													<div>
														<h3 className="text-xl font-bold text-gray-900 mb-4">
															Description
														</h3>
														{institution.about ? (
															<div
																className="text-gray-700 prose prose-content max-w-none leading-relaxed"
																dangerouslySetInnerHTML={{
																	__html: institution.about,
																}}
															/>
														) : (
															<p className="text-gray-400 italic text-lg">
																No description provided yet
															</p>
														)}
													</div>

													{/* Institution Disciplines */}
													<div>
														<h3 className="text-xl font-bold text-gray-900 mb-4">
															Disciplines
														</h3>
														{institution.disciplines &&
														institution.disciplines.length > 0 ? (
															<div className="flex flex-wrap gap-3">
																{/* Get unique disciplines */}
																{Array.from(
																	new Set(
																		institution.disciplines.map(
																			(item: any) => item.disciplineName
																		)
																	)
																).map((disciplineName: any, index: number) => (
																	<span
																		key={index}
																		className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
																	>
																		{disciplineName}
																	</span>
																))}
															</div>
														) : (
															<p className="text-gray-400 italic text-lg">
																No disciplines selected yet
															</p>
														)}
													</div>
												</div>
											)}

											{activeTab === 'posts' && (
												<div className="h-full flex flex-col">
													<div className="flex-1 overflow-y-auto p-4">
														{/* Post Type Filter */}
														<div className="flex gap-2 mb-6 border-b pb-3">
															{['Program', 'Scholarship', 'Job'].map((type) => (
																<button
																	key={type}
																	onClick={() =>
																		setActivePostType(
																			type as 'Program' | 'Scholarship' | 'Job'
																		)
																	}
																	className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
																		activePostType === type
																			? 'bg-primary text-white'
																			: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
																	}`}
																>
																	{type === 'Job'
																		? 'Research Labs'
																		: `${type}s`}
																</button>
															))}
														</div>

														{/* Posts Content */}
														{postsLoading ? (
															<div className="flex items-center justify-center py-8">
																<div className="text-center">
																	<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
																	<p className="mt-2 text-sm text-muted-foreground">
																		Loading posts...
																	</p>
																</div>
															</div>
														) : postsError ? (
															<div className="text-center py-12">
																<div className="text-6xl mb-4">⚠️</div>
																<h3 className="text-xl font-semibold text-gray-900 mb-2">
																	Failed to Load Posts
																</h3>
																<p className="text-gray-600 mb-4">
																	{postsError}
																</p>
																<Button
																	onClick={() => loadPosts()}
																	variant="outline"
																	className="mx-auto"
																>
																	Try Again
																</Button>
															</div>
														) : posts.length > 0 ? (
															<div className="space-y-6">
																{/* Posts Grid - Dynamic layout based on post type */}
																<div
																	className={`grid gap-6 ${
																		activePostType === 'Program'
																			? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
																			: 'grid-cols-1'
																	}`}
																>
																	{posts.map((post, index) => {
																		const handlePostClick = (
																			postId: string
																		) => {
																			const postType = post.type.toLowerCase()
																			if (postType === 'program') {
																				router.push(
																					`/explore/programmes/${postId}`
																				)
																			} else if (postType === 'scholarship') {
																				router.push(
																					`/explore/scholarships/${postId}`
																				)
																			} else if (postType === 'research lab') {
																				router.push(
																					`/explore/research/${postId}`
																				)
																			}
																		}

																		if (post.type === 'Program') {
																			return (
																				<ProgramCard
																					key={post.id}
																					program={post}
																					index={index}
																					isWishlisted={false}
																					onWishlistToggle={() => {}}
																					onClick={handlePostClick}
																				/>
																			)
																		} else if (post.type === 'Scholarship') {
																			return (
																				<ScholarshipCard
																					key={post.id}
																					scholarship={post}
																					index={index}
																					isWishlisted={false}
																					onWishlistToggle={() => {}}
																					onClick={handlePostClick}
																				/>
																			)
																		} else if (post.type === 'Research Lab') {
																			return (
																				<ResearchLabCard
																					key={post.id}
																					lab={post}
																					index={index}
																					isWishlisted={false}
																					onWishlistToggle={() => {}}
																					onClick={handlePostClick}
																				/>
																			)
																		}
																		return null
																	})}
																</div>

																{/* Pagination Controls */}
																{totalPages > 1 && (
																	<div className="flex items-center justify-center gap-2 mt-6">
																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() =>
																				setCurrentPage(
																					Math.max(1, currentPage - 1)
																				)
																			}
																			disabled={currentPage === 1}
																		>
																			<ChevronLeft className="h-4 w-4" />
																		</Button>

																		<span className="text-sm text-gray-600">
																			Page {currentPage} of {totalPages}
																		</span>

																		<Button
																			variant="outline"
																			size="sm"
																			onClick={() =>
																				setCurrentPage(
																					Math.min(totalPages, currentPage + 1)
																				)
																			}
																			disabled={currentPage === totalPages}
																		>
																			<ChevronRight className="h-4 w-4" />
																		</Button>
																	</div>
																)}
															</div>
														) : (
															<div className="text-center py-12">
																<div className="text-6xl mb-4">📝</div>
																<h3 className="text-xl font-semibold text-gray-900 mb-2">
																	No Posts Available
																</h3>
																<p className="text-gray-600">
																	This institution hasn&apos;t published any{' '}
																	{activePostType === 'Job'
																		? 'research lab opportunities'
																		: `${activePostType.toLowerCase()}s`}{' '}
																	yet.
																</p>
															</div>
														)}
													</div>
												</div>
											)}
										</motion.div>
									</AnimatePresence>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
