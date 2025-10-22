'use client'

import type { InstitutionDetails } from '@/types/institution-details'
import { Building2 } from 'lucide-react'
import Image from 'next/image'

interface InstitutionOverviewTabProps {
	institutionData: InstitutionDetails
	onContactInstitution: () => void
	onDeactivateInstitution: () => void
	actionLoading: boolean
}

export function InstitutionOverviewTab({
	institutionData,
}: InstitutionOverviewTabProps) {
	return (
		<div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
			<div className="space-y-6">
				{/* Description Section */}
				<div>
					<div className="font-semibold text-black text-base mb-3">
						Description:
					</div>
					<div className="text-black text-base leading-relaxed">
						{institutionData.about ||
							"This is description of institution. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s Lorem Ipsum has been the industry's standard dummy text ever since the 1500s"}
					</div>
				</div>

				{/* Discipline Section */}
				<div>
					<div className="font-semibold text-black text-base mb-3">
						Discipline
					</div>
					<div className="space-y-1">
						{institutionData.subdisciplines &&
						institutionData.subdisciplines.length > 0 ? (
							institutionData.subdisciplines.map((subdiscipline, index) => (
								<div
									key={index}
									className="flex items-center text-black text-base"
								>
									<span className="mr-2">•</span>
									{subdiscipline.name}
								</div>
							))
						) : (
							<div className="space-y-1">
								<div className="flex items-center text-black text-base">
									<span className="mr-2">•</span>
									AI
								</div>
								<div className="flex items-center text-black text-base">
									<span className="mr-2">•</span>
									Information system
								</div>
								<div className="flex items-center text-black text-base">
									<span className="mr-2">•</span>
									Data engineering
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Campus Section */}
				<div>
					<div className="font-semibold text-black text-base mb-3">
						Campus 1:
					</div>
					<div className="space-y-1">
						<div className="flex text-black text-base">
							<span className="mr-2">•</span>
							<span className="font-semibold">Country:</span>
							<span className="ml-1">{institutionData.country}</span>
						</div>
						<div className="flex text-black text-base">
							<span className="mr-2">•</span>
							<span className="font-semibold">Address detail:</span>
							<span className="ml-1">{institutionData.address}</span>
						</div>
					</div>
				</div>

				{/* Cover Image Section */}
				<div>
					<div className="font-semibold text-black text-base mb-3">
						Cover Image:
					</div>
					<div className="border border-gray-300 rounded-[12px] p-4 bg-white">
						{institutionData.coverImage ? (
							<div className="w-full h-48 relative rounded-lg overflow-hidden">
								<Image
									src={institutionData.coverImage}
									alt="Institution Cover"
									fill
									className="object-cover"
								/>
							</div>
						) : (
							<div className="w-full h-48 bg-[#F2F2F2] rounded-lg flex items-center justify-center">
								<div className="text-center text-[#B3B3B3]">
									<Building2 className="w-12 h-12 mx-auto mb-2" />
									<div className="text-sm">No cover image uploaded</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
