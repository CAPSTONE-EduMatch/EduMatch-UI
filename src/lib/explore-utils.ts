import { prismaClient } from "../../prisma";

// Shared interfaces
export interface Program {
	id: number;
	title: string;
	description: string;
	university: string;
	logo: string;
	field: string;
	country: string;
	date: string;
	daysLeft: number;
	price: string;
	match: string;
	funding: string;
	attendance: string;
	applicationCount?: number;
	isInWishlist?: boolean;
}

export interface Scholarship {
	id: number;
	title: string;
	description: string;
	provider: string;
	university: string;
	essayRequired: string;
	country: string;
	date: string;
	daysLeft: number;
	amount: string;
	match: string;
	applicationCount?: number;
	isInWishlist?: boolean;
}

export interface ResearchLab {
	id: number;
	title: string;
	description: string;
	professor: string;
	field: string;
	country: string;
	position: string;
	date: string;
	daysLeft: number;
	match: string;
	applicationCount?: number;
	isInWishlist?: boolean;
}

// Helper functions
export function calculateDaysLeft(dateString: string): number {
	const targetDate = new Date(dateString);
	const today = new Date();
	const diffTime = targetDate.getTime() - today.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	return Math.max(0, diffDays);
}

export function calculateMatchPercentage(): string {
	return `${Math.floor(Math.random() * 30) + 70}%`;
}

export function generateHashId(str: string): number {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash; // Convert to 32bit integer
	}
	return Math.abs(hash);
}

// Data fetching functions
export async function fetchExploreData(postIds: string[]) {
	const [
		postPrograms,
		postScholarships,
		postJobs,
		applicationCounts,
		institutions,
		disciplines,
	] = await Promise.all([
		prismaClient.postProgram.findMany({
			where: { PostId: { in: postIds } },
		}),
		prismaClient.postScholarship.findMany({
			where: { PostId: { in: postIds } },
		}),
		prismaClient.postJob.findMany({
			where: { PostId: { in: postIds } },
		}),
		prismaClient.application.groupBy({
			by: ["postId"],
			where: { postId: { in: postIds } },
			_count: { id: true },
		}),
		prismaClient.institution_profile.findMany(),
		prismaClient.discipline.findMany({
			where: { status: true },
			include: {
				Sub_Discipline: {
					where: { status: true },
				},
			},
		}),
	]);

	// Create maps for quick lookups
	const postProgramMap = new Map(postPrograms.map((pp) => [pp.PostId, pp]));
	const postScholarshipMap = new Map(
		postScholarships.map((ps) => [ps.PostId, ps])
	);
	const postJobMap = new Map(postJobs.map((pj) => [pj.PostId, pj]));
	const applicationCountMap = new Map(
		applicationCounts.map((ac) => [ac.postId, ac._count.id])
	);
	const institutionMap = new Map(
		institutions.map((inst) => [inst.profile_id, inst])
	);

	// Create subdiscipline map for discipline lookup
	const subdisciplineMap = new Map<
		number,
		{ name: string; disciplineName: string }
	>();
	const disciplineMap = new Map<number, string>();
	disciplines.forEach((discipline) => {
		disciplineMap.set(discipline.id, discipline.name);
		discipline.Sub_Discipline.forEach((sub) => {
			subdisciplineMap.set(sub.id, {
				name: sub.name,
				disciplineName: discipline.name,
			});
		});
	});

	return {
		postProgramMap,
		postScholarshipMap,
		postJobMap,
		applicationCountMap,
		institutionMap,
		subdisciplineMap,
		disciplineMap,
		institutions,
		disciplines,
	};
}

// Transform functions
export function transformToProgram(
	post: any,
	postProgram: any,
	applicationCount: number,
	institution: any,
	subdisciplineMap: Map<any, any>,
	disciplineMap: Map<any, any>,
	isInWishlist: boolean = false
): Program {
	// Map degree level to proper discipline name
	let fieldName = postProgram.degreeLevel || "General Studies";

	// Try to find a matching discipline/subdiscipline
	for (const [, subInfo] of Array.from(subdisciplineMap)) {
		if (fieldName.toLowerCase().includes(subInfo.name.toLowerCase())) {
			fieldName = `${subInfo.disciplineName} - ${subInfo.name}`;
			break;
		}
	}

	// If no subdiscipline match, try main disciplines
	if (
		fieldName === postProgram.degreeLevel ||
		fieldName === "General Studies"
	) {
		for (const [, discName] of Array.from(disciplineMap)) {
			if (fieldName.toLowerCase().includes(discName.toLowerCase())) {
				fieldName = discName;
				break;
			}
		}
	}

	return {
		id: generateHashId(post.id),
		title: post.title,
		description: post.content || "No description available",
		university: institution.name,
		logo: institution.logo || "/logos/default.png",
		field: fieldName,
		country: institution.country || "Unknown",
		date: post.createdAt.toISOString().split("T")[0],
		daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
		price: postProgram.tuition_fee
			? `${postProgram.tuition_fee} USD`
			: "Contact for pricing",
		match: calculateMatchPercentage(),
		funding: postProgram.scholarship_info || "Contact for details",
		attendance: "On-campus", // Default value
		applicationCount,
		isInWishlist,
	};
}

export function transformToScholarship(
	post: any,
	postScholarship: any,
	applicationCount: number,
	institution: any,
	isInWishlist: boolean = false
): Scholarship {
	return {
		id: generateHashId(post.id),
		title: post.title,
		description: post.content || "No description available",
		provider: institution.name,
		university: institution.name,
		essayRequired: postScholarship.essay_required ? "Yes" : "No",
		country: institution.country || "Unknown",
		date: post.createdAt.toISOString().split("T")[0],
		daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
		amount: postScholarship.grant || "Contact for details",
		match: calculateMatchPercentage(),
		applicationCount,
		isInWishlist,
	};
}

export function transformToResearchLab(
	post: any,
	postJob: any,
	applicationCount: number,
	institution: any,
	isInWishlist: boolean = false
): ResearchLab {
	return {
		id: generateHashId(post.id),
		title: post.title,
		description: post.content || "No description available",
		professor: "Dr. Professor", // Default value
		field: "Research", // Default value
		country: institution.country || "Unknown",
		position: postJob.job_type || "Research Position",
		date: post.createdAt.toISOString().split("T")[0],
		daysLeft: calculateDaysLeft(post.createdAt.toISOString()),
		match: calculateMatchPercentage(),
		applicationCount,
		isInWishlist,
	};
}

// Filter and sort functions
export function applyFilters(
	items: (Program | Scholarship | ResearchLab)[],
	filters: {
		discipline?: string[];
		country?: string[];
		attendance?: string[];
		degreeLevel?: string[];
	}
) {
	let filteredItems = [...items];

	if (filters.discipline && filters.discipline.length > 0) {
		filteredItems = filteredItems.filter((item) =>
			filters.discipline!.some((d) => {
				const fieldValue =
					"field" in item
						? item.field
						: "position" in item
							? item.position
							: "";
				return (fieldValue as string)
					.toLowerCase()
					.includes(d.toLowerCase());
			})
		);
	}

	if (filters.country && filters.country.length > 0) {
		filteredItems = filteredItems.filter((item) =>
			filters.country!.includes(item.country)
		);
	}

	if (filters.attendance && filters.attendance.length > 0) {
		filteredItems = filteredItems.filter(
			(item) =>
				"attendance" in item &&
				filters.attendance!.includes(item.attendance)
		);
	}

	if (filters.degreeLevel && filters.degreeLevel.length > 0) {
		filteredItems = filteredItems.filter(
			(item) =>
				"field" in item &&
				filters.degreeLevel!.some((level) =>
					item.field.toLowerCase().includes(level.toLowerCase())
				)
		);
	}

	return filteredItems;
}

export function applySorting(
	items: (Program | Scholarship | ResearchLab)[],
	sortBy: string
) {
	const sortedItems = [...items];

	switch (sortBy) {
		case "most-popular":
			sortedItems.sort(
				(a, b) => (b.applicationCount || 0) - (a.applicationCount || 0)
			);
			break;
		case "match-score":
			sortedItems.sort(
				(a, b) => parseFloat(b.match) - parseFloat(a.match)
			);
			break;
		case "deadline":
			sortedItems.sort((a, b) => a.daysLeft - b.daysLeft);
			break;
		case "price-low":
			sortedItems.sort((a, b) => {
				const priceA =
					"price" in a
						? parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0
						: 0;
				const priceB =
					"price" in b
						? parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0
						: 0;
				return priceA - priceB;
			});
			break;
		case "price-high":
			sortedItems.sort((a, b) => {
				const priceA =
					"price" in a
						? parseFloat(a.price.replace(/[^0-9.]/g, "")) || 0
						: 0;
				const priceB =
					"price" in b
						? parseFloat(b.price.replace(/[^0-9.]/g, "")) || 0
						: 0;
				return priceB - priceA;
			});
			break;
		// newest and oldest are handled by DB orderBy
	}

	return sortedItems;
}

export function extractAvailableFilters(
	items: (Program | Scholarship | ResearchLab)[],
	disciplines: any[]
) {
	const availableCountries = Array.from(
		new Set(items.map((item) => item.country).filter(Boolean))
	).sort();

	const availableDisciplines = Array.from(
		new Set(
			items
				.map((item) =>
					"field" in item
						? item.field
						: "position" in item
							? item.position
							: ""
				)
				.filter(Boolean)
		)
	).sort();

	const availableDegreeLevels = Array.from(
		new Set(
			items
				.map((item) => {
					if ("field" in item) {
						const field = item.field.toLowerCase();
						if (
							field.includes("master") ||
							field.includes("msc") ||
							field.includes("ma")
						)
							return "Master";
						if (
							field.includes("phd") ||
							field.includes("doctorate")
						)
							return "PhD";
						if (
							field.includes("bachelor") ||
							field.includes("bsc") ||
							field.includes("ba")
						)
							return "Bachelor";
					}
					return "Other";
				})
				.filter(Boolean)
		)
	).sort();

	const availableAttendanceTypes = Array.from(
		new Set(
			items
				.map((item) => ("attendance" in item ? item.attendance : ""))
				.filter(Boolean)
		)
	).sort();

	return {
		countries: availableCountries,
		disciplines: availableDisciplines,
		degreeLevels: availableDegreeLevels,
		attendanceTypes: availableAttendanceTypes,
		subdisciplines: disciplines.reduce(
			(acc, discipline) => {
				acc[discipline.name] = discipline.Sub_Discipline.map(
					(sub: any) => sub.name
				);
				return acc;
			},
			{} as Record<string, string[]>
		),
	};
}
