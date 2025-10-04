'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import Button from '@/components/ui/Button'

interface ApplicationSectionProps {
	profile: any
}

export const ApplicationSection: React.FC<ApplicationSectionProps> = ({
	profile,
}) => {
	// Mock data for applications - replace with actual API calls
	const applications = [
		{
			id: 1,
			university: 'Harvard University',
			program: 'Computer Science',
			degree: 'Master of Science',
			status: 'submitted',
			submittedDate: '2024-01-15',
			deadline: '2024-12-15',
			progress: 100,
		},
		{
			id: 2,
			university: 'Stanford University',
			program: 'Data Science',
			degree: 'Master of Science',
			status: 'in_progress',
			submittedDate: null,
			deadline: '2024-11-30',
			progress: 75,
		},
		{
			id: 3,
			university: 'University of Cambridge',
			program: 'Artificial Intelligence',
			degree: 'Master of Philosophy',
			status: 'draft',
			submittedDate: null,
			deadline: '2024-10-15',
			progress: 45,
		},
	]

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'bg-green-100 text-green-800'
			case 'in_progress':
				return 'bg-yellow-100 text-yellow-800'
			case 'draft':
				return 'bg-gray-100 text-gray-800'
			default:
				return 'bg-gray-100 text-gray-800'
		}
	}

	const getStatusText = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'Submitted'
			case 'in_progress':
				return 'In Progress'
			case 'draft':
				return 'Draft'
			default:
				return 'Unknown'
		}
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-2xl font-bold mb-2">My Applications</h2>
				<p className="text-muted-foreground">
					Track your university application progress
				</p>
			</div>

			{/* Application Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-primary">
							{applications.length}
						</div>
						<div className="text-sm text-muted-foreground">
							Total Applications
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-green-600">
							{applications.filter((app) => app.status === 'submitted').length}
						</div>
						<div className="text-sm text-muted-foreground">Submitted</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-yellow-600">
							{
								applications.filter((app) => app.status === 'in_progress')
									.length
							}
						</div>
						<div className="text-sm text-muted-foreground">In Progress</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-4 text-center">
						<div className="text-2xl font-bold text-gray-600">
							{applications.filter((app) => app.status === 'draft').length}
						</div>
						<div className="text-sm text-muted-foreground">Drafts</div>
					</CardContent>
				</Card>
			</div>

			{/* Applications List */}
			<div className="space-y-4">
				{applications.map((application) => (
					<Card key={application.id}>
						<CardContent className="p-6">
							<div className="flex justify-between items-start mb-4">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="text-lg font-semibold">
											{application.university}
										</h3>
										<span
											className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}
										>
											{getStatusText(application.status)}
										</span>
									</div>
									<p className="text-primary font-medium mb-1">
										{application.program}
									</p>
									<p className="text-sm text-muted-foreground">
										{application.degree}
									</p>
								</div>
								<div className="flex gap-2">
									<Button variant="outline" size="sm">
										View Details
									</Button>
									{application.status !== 'submitted' && (
										<Button size="sm">
											{application.status === 'draft' ? 'Continue' : 'Edit'}
										</Button>
									)}
								</div>
							</div>

							{/* Progress Bar */}
							<div className="mb-4">
								<div className="flex justify-between items-center mb-2">
									<span className="text-sm font-medium">
										Application Progress
									</span>
									<span className="text-sm text-muted-foreground">
										{application.progress}%
									</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-primary h-2 rounded-full transition-all duration-300"
										style={{ width: `${application.progress}%` }}
									></div>
								</div>
							</div>

							{/* Application Details */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
								<div>
									<span className="text-muted-foreground">Deadline: </span>
									<span className="font-medium">
										{new Date(application.deadline).toLocaleDateString()}
									</span>
								</div>
								{application.submittedDate && (
									<div>
										<span className="text-muted-foreground">Submitted: </span>
										<span className="font-medium">
											{new Date(application.submittedDate).toLocaleDateString()}
										</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Start New Application */}
			<Card>
				<CardContent className="p-6 text-center">
					<div className="text-4xl mb-4">📝</div>
					<h3 className="text-lg font-semibold mb-2">Start New Application</h3>
					<p className="text-muted-foreground mb-4">
						Begin your journey to your dream university
					</p>
					<Button>Start Application</Button>
				</CardContent>
			</Card>
		</div>
	)
}
