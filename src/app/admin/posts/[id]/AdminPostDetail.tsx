'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminProgramDetail from './AdminProgramDetail'
import AdminResearchLabDetail from './AdminResearchLabDetail'
import AdminScholarshipDetail from './AdminScholarshipDetail'

const AdminPostDetail = () => {
	const params = useParams()
	const [postType, setPostType] = useState<string | null>(null)
	const [isLoading, setIsLoading] = useState(true)

	// Fetch post type to determine which detail page to show
	useEffect(() => {
		const fetchPostType = async () => {
			if (!params?.id) return

			setIsLoading(true)
			try {
				const response = await fetch(`/api/admin/posts/${params.id}`)
				const data = await response.json()

				if (data.success && data.data?.type) {
					// Map API response type to component type
					const apiType = data.data.type
					if (apiType === 'Program') {
						setPostType('Program')
					} else if (apiType === 'Scholarship') {
						setPostType('Scholarship')
					} else if (apiType === 'Research Lab') {
						setPostType('Research Lab')
					} else {
						setPostType('Program') // Default fallback
					}
				} else {
					setPostType('Program') // Default to Program on error
				}
			} catch (error) {
				setPostType('Program') // Default to Program on error
			} finally {
				setIsLoading(false)
			}
		}

		fetchPostType()
	}, [params?.id])

	if (isLoading) {
		return (
			<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
				<div className="text-lg text-gray-600">Loading post details...</div>
			</div>
		)
	}

	// Route to the appropriate detail page based on post type
	switch (postType) {
		case 'Program':
			return <AdminProgramDetail />
		case 'Scholarship':
			return <AdminScholarshipDetail />
		case 'Research Lab':
			return <AdminResearchLabDetail />
		default:
			return (
				<div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
					<div className="text-lg text-red-600">Unknown post type</div>
				</div>
			)
	}
}

export default AdminPostDetail
