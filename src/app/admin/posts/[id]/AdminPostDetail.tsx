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
				// TODO: Replace with actual API call to get post type
				// const response = await fetch(`/api/admin/posts/${params.id}/type`)
				// const data = await response.json()
				// setPostType(data.type)

				// Mock data for now - you can test different types by changing this
				setPostType('Program') // Change to 'Scholarship' or 'Job' to test other types
			} catch (error) {
				console.error('Error fetching post type:', error)
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
		case 'Job':
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
