// Mock data for explore tabs

export interface Program {
	id: string;
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
	attendance: string;
	popular?: number;
}

export interface Scholarship {
	id: string;
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
	popular?: number;
}

export interface ResearchLab {
	id: string;
	title: string;
	description: string;
	professor: string;
	field: string;
	country: string;
	position: string;
	date: string;
	daysLeft: number;
	match: string;
	institution: string;
	popular?: number;
}

// Programs mock data
export const mockPrograms: Program[] = [
	{
		id: "program-1",
		title: "Master of Computer Science with Artificial Intelligence Specialization",
		description:
			"Comprehensive program covering advanced AI, machine learning, and deep learning techniques. Students will work on cutting-edge research projects and collaborate with industry partners.",
		university: "Harvard University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Harvard_University_logo.svg/1200px-Harvard_University_logo.svg.png",
		field: "Computer Science",
		country: "United States",
		date: "15 January 2026",
		daysLeft: 107,
		price: "65,000 USD / year",
		match: "95%",
		attendance: "On-campus",
		popular: 9500,
	},
	{
		id: "program-2",
		title: "PhD in Biomedical Engineering and Innovation",
		description:
			"Interdisciplinary research program focusing on medical device development, tissue engineering, and biomedical imaging technologies for next-generation healthcare solutions.",
		university: "MIT",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/MIT_logo.svg/1200px-MIT_logo.svg.png",
		field: "Biomedical Engineering",
		country: "United States",
		date: "1 March 2026",
		daysLeft: 152,
		price: "72,000 USD / year",
		match: "88%",
		attendance: "Hybrid",
		popular: 8800,
	},
	{
		id: "program-3",
		title: "Master of Business Administration - Technology Leadership",
		description:
			"Executive MBA program designed for technology professionals seeking leadership roles. Includes case studies from Fortune 500 companies and startup ecosystems.",
		university: "Stanford University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Stanford_University_seal_2003.svg/1200px-Stanford_University_seal_2003.svg.png",
		field: "Business Administration",
		country: "United States",
		date: "20 February 2026",
		daysLeft: 132,
		price: "78,500 USD / year",
		match: "92%",
		attendance: "On-campus",
		popular: 9200,
	},
	{
		id: "program-4",
		title: "Master of Data Science and Analytics",
		description:
			"Comprehensive program covering statistical analysis, machine learning, data visualization, and big data technologies. Industry partnerships provide real-world project experience.",
		university: "Oxford University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Oxford-University-Circlet.svg/1200px-Oxford-University-Circlet.svg.png",
		field: "Data Science",
		country: "United Kingdom",
		date: "10 September 2026",
		daysLeft: 345,
		price: "45,000 GBP / year",
		match: "90%",
		attendance: "Hybrid",
		popular: 9000,
	},
	{
		id: "program-5",
		title: "PhD in Sustainable Energy Engineering",
		description:
			"Research-intensive program focusing on renewable energy systems, smart grid technology, and environmental sustainability. Collaboration with leading energy companies.",
		university: "ETH Zurich",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/ETH_Zurich_Logo_black.svg/1200px-ETH_Zurich_Logo_black.svg.png",
		field: "Energy Engineering",
		country: "Switzerland",
		date: "1 October 2026",
		daysLeft: 366,
		price: "1,200 CHF / semester",
		match: "85%",
		attendance: "On-campus",
		popular: 8500,
	},
	{
		id: "program-6",
		title: "Master of International Relations and Diplomacy",
		description:
			"Comprehensive study of global politics, international law, and diplomatic practices. Includes internships at international organizations and embassies.",
		university: "Cambridge University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/University_of_Cambridge_coat_of_arms_official.svg/1200px-University_of_Cambridge_coat_of_arms_official.svg.png",
		field: "International Relations",
		country: "United Kingdom",
		date: "5 October 2026",
		daysLeft: 370,
		price: "42,000 GBP / year",
		match: "87%",
		attendance: "On-campus",
		popular: 8700,
	},
	{
		id: "program-7",
		title: "Master of Cybersecurity and Information Assurance",
		description:
			"Advanced program covering network security, cryptography, digital forensics, and risk management. Hands-on experience with industry-standard security tools.",
		university: "Carnegie Mellon",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Carnegie_Mellon_University_seal.svg/1200px-Carnegie_Mellon_University_seal.svg.png",
		field: "Cybersecurity",
		country: "United States",
		date: "25 August 2026",
		daysLeft: 329,
		price: "68,000 USD / year",
		match: "93%",
		attendance: "Hybrid",
		popular: 9300,
	},
	{
		id: "program-8",
		title: "PhD in Quantum Computing and Physics",
		description:
			"Cutting-edge research program exploring quantum algorithms, quantum cryptography, and quantum hardware development. Access to state-of-the-art quantum laboratories.",
		university: "University of Tokyo",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/University_of_Tokyo_Seal.svg/1200px-University_of_Tokyo_Seal.svg.png",
		field: "Quantum Physics",
		country: "Japan",
		date: "1 April 2026",
		daysLeft: 183,
		price: "535,800 JPY / year",
		match: "82%",
		attendance: "On-campus",
		popular: 8200,
	},
	{
		id: "program-9",
		title: "Master of Financial Technology (FinTech)",
		description:
			"Innovative program combining finance, technology, and entrepreneurship. Focus on blockchain, digital payments, and algorithmic trading with industry partnerships.",
		university: "London School of Economics",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/LSE_Logo.svg/1200px-LSE_Logo.svg.png",
		field: "Financial Technology",
		country: "United Kingdom",
		date: "15 September 2026",
		daysLeft: 350,
		price: "48,000 GBP / year",
		match: "89%",
		attendance: "Hybrid",
		popular: 8900,
	},
	{
		id: "program-10",
		title: "Master of Environmental Science and Policy",
		description:
			"Interdisciplinary program addressing climate change, environmental policy, and sustainable development. Field research opportunities in diverse ecosystems.",
		university: "University of California Berkeley",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/LSE_Logo.svg/1200px-LSE_Logo.svg.png",
		field: "Environmental Science",
		country: "United States",
		date: "20 August 2026",
		daysLeft: 324,
		price: "58,000 USD / year",
		match: "86%",
		attendance: "On-campus",
		popular: 8600,
	},
	{
		id: "program-11",
		title: "PhD in Neuroscience and Brain Technology",
		description:
			"Advanced research in neurobiology, brain-computer interfaces, and neurological disorders. Access to cutting-edge neuroimaging and electrophysiology facilities.",
		university: "University of Melbourne",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/LSE_Logo.svg/1200px-LSE_Logo.svg.png",
		field: "Neuroscience",
		country: "Australia",
		date: "1 March 2026",
		daysLeft: 152,
		price: "38,000 AUD / year",
		match: "84%",
		attendance: "On-campus",
		popular: 8400,
	},
	{
		id: "program-12",
		title: "Master of Game Design and Interactive Media",
		description:
			"Creative program combining art, technology, and storytelling. Students develop games, VR experiences, and interactive installations using industry tools.",
		university: "New York University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/LSE_Logo.svg/1200px-LSE_Logo.svg.png",
		field: "Game Design",
		country: "United States",
		date: "30 August 2026",
		daysLeft: 334,
		price: "62,000 USD / year",
		match: "91%",
		attendance: "Hybrid",
		popular: 9100,
	},
	{
		id: "program-13",
		title: "Master of Public Health - Global Health Focus",
		description:
			"Comprehensive public health education with emphasis on global health challenges, epidemiology, and health policy. International field placement opportunities.",
		university: "Johns Hopkins University",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/LSE_Logo.svg/1200px-LSE_Logo.svg.png",
		field: "Public Health",
		country: "United States",
		date: "10 September 2026",
		daysLeft: 345,
		price: "59,000 USD / year",
		match: "88%",
		attendance: "On-campus",
		popular: 8800,
	},
	{
		id: "program-14",
		title: "PhD in Aerospace Engineering and Space Technology",
		description:
			"Research program focusing on spacecraft design, propulsion systems, and space exploration technologies. Collaboration with space agencies and aerospace industry.",
		university: "Technical University of Munich",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Technical_University_of_Munich_Logo.svg/1200px-Technical_University_of_Munich_Logo.svg.png",
		field: "Aerospace Engineering",
		country: "Germany",
		date: "1 October 2026",
		daysLeft: 366,
		price: "250 EUR / semester",
		match: "83%",
		attendance: "On-campus",
		popular: 8300,
	},
	{
		id: "program-15",
		title: "Master of Architecture and Urban Design",
		description:
			"Innovative design program combining architectural theory, sustainable design, and urban planning. Studio-based learning with real-world design projects.",
		university: "Delft University of Technology",
		logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Delft_University_of_Technology_logo.svg/1200px-Delft_University_of_Technology_logo.svg.png",
		field: "Architecture",
		country: "Netherlands",
		date: "1 September 2026",
		daysLeft: 336,
		price: "14,500 EUR / year",
		match: "90%",
		attendance: "On-campus",
		popular: 9000,
	},
];

// Scholarships mock data
export const mockScholarships: Scholarship[] = [
	{
		id: "scholarship-1",
		title: "Global Excellence Scholarship for STEM Fields",
		description:
			"Full tuition scholarship for outstanding international students pursuing degrees in Science, Technology, Engineering, and Mathematics. Includes living stipend and research funding.",
		provider: "Provided by university",
		university: "Harvard University",
		essayRequired: "Yes",
		country: "United States",
		date: "15 December 2025",
		daysLeft: 76,
		amount: "85,000 USD",
		match: "94%",
		popular: 9400,
	},
	{
		id: "scholarship-2",
		title: "Future Leaders in Technology Scholarship",
		description:
			"Merit-based scholarship supporting women and underrepresented minorities in computer science and engineering programs. Mentorship and networking opportunities included.",
		provider: "Provided by foundation",
		university: "Stanford University",
		essayRequired: "Yes",
		country: "United States",
		date: "31 January 2026",
		daysLeft: 123,
		amount: "50,000 USD",
		match: "89%",
		popular: 8900,
	},
	{
		id: "scholarship-3",
		title: "Rhodes Scholarship for Graduate Study",
		description:
			"Prestigious scholarship covering all expenses for graduate study. Selection based on academic excellence, leadership potential, and commitment to service.",
		provider: "Provided by foundation",
		university: "Oxford University",
		essayRequired: "Yes",
		country: "United Kingdom",
		date: "1 October 2025",
		daysLeft: 1,
		amount: "75,000 GBP",
		match: "96%",
		popular: 9600,
	},
	{
		id: "scholarship-4",
		title: "Erasmus+ Joint Master's Scholarship",
		description:
			"European Union scholarship for students pursuing joint master's degrees across multiple European universities. Cultural exchange and language learning opportunities.",
		provider: "Provided by EU",
		university: "Multiple European Universities",
		essayRequired: "No",
		country: "European Union",
		date: "15 February 2026",
		daysLeft: 138,
		amount: "25,000 EUR",
		match: "87%",
		popular: 8700,
	},
	{
		id: "scholarship-5",
		title: "Chevening Scholarship for Leadership Development",
		description:
			"UK government scholarship for emerging leaders worldwide. Covers tuition, living costs, and return airfare. Strong alumni network and career support.",
		provider: "Provided by government",
		university: "UK Universities",
		essayRequired: "Yes",
		country: "United Kingdom",
		date: "2 November 2025",
		daysLeft: 33,
		amount: "60,000 GBP",
		match: "91%",
		popular: 9100,
	},
	{
		id: "scholarship-6",
		title: "MEXT Scholarship for Japanese Studies",
		description:
			"Japanese government scholarship for international students. Covers tuition, living allowance, and airfare. Includes Japanese language training program.",
		provider: "Provided by government",
		university: "Japanese Universities",
		essayRequired: "Yes",
		country: "Japan",
		date: "20 May 2026",
		daysLeft: 232,
		amount: "1,800,000 JPY",
		match: "85%",
		popular: 8500,
	},
	{
		id: "scholarship-7",
		title: "Gates Cambridge Scholarship",
		description:
			"Full scholarship for outstanding students from outside the UK to pursue graduate study at Cambridge. Focus on academic excellence and leadership potential.",
		provider: "Provided by foundation",
		university: "Cambridge University",
		essayRequired: "Yes",
		country: "United Kingdom",
		date: "5 December 2025",
		daysLeft: 66,
		amount: "70,000 GBP",
		match: "93%",
		popular: 9300,
	},
	{
		id: "scholarship-8",
		title: "Fulbright Foreign Student Program",
		description:
			"US government scholarship for international graduate students. Promotes mutual understanding through educational and cultural exchange.",
		provider: "Provided by government",
		university: "US Universities",
		essayRequired: "Yes",
		country: "United States",
		date: "15 October 2025",
		daysLeft: 15,
		amount: "55,000 USD",
		match: "88%",
		popular: 8800,
	},
	{
		id: "scholarship-9",
		title: "Commonwealth Scholarship and Fellowship",
		description:
			"Scholarship for students from Commonwealth countries. Supports master's and PhD studies with focus on development impact and knowledge sharing.",
		provider: "Provided by commonwealth",
		university: "UK Universities",
		essayRequired: "Yes",
		country: "United Kingdom",
		date: "16 December 2025",
		daysLeft: 77,
		amount: "45,000 GBP",
		match: "86%",
		popular: 8600,
	},
	{
		id: "scholarship-10",
		title: "DAAD Scholarship for German Excellence",
		description:
			"German academic exchange scholarship supporting international students in all academic fields. Cultural integration and language support programs included.",
		provider: "Provided by government",
		university: "German Universities",
		essayRequired: "No",
		country: "Germany",
		date: "31 March 2026",
		daysLeft: 182,
		amount: "30,000 EUR",
		match: "84%",
		popular: 8400,
	},
	{
		id: "scholarship-11",
		title: "Australia Awards Scholarship",
		description:
			"Australian government scholarship for students from developing countries. Covers tuition, living expenses, and health insurance with leadership development.",
		provider: "Provided by government",
		university: "Australian Universities",
		essayRequired: "Yes",
		country: "Australia",
		date: "30 April 2026",
		daysLeft: 212,
		amount: "65,000 AUD",
		match: "82%",
		popular: 8200,
	},
	{
		id: "scholarship-12",
		title: "Swiss Excellence Scholarship",
		description:
			"Swiss government scholarship for foreign scholars and artists. Supports research and artistic work at Swiss higher education institutions.",
		provider: "Provided by government",
		university: "Swiss Universities",
		essayRequired: "Yes",
		country: "Switzerland",
		date: "15 January 2026",
		daysLeft: 107,
		amount: "40,000 CHF",
		match: "90%",
		popular: 9000,
	},
	{
		id: "scholarship-13",
		title: "Korean Government Scholarship Program",
		description:
			"Comprehensive scholarship for international students studying in Korea. Includes Korean language training, cultural programs, and research opportunities.",
		provider: "Provided by government",
		university: "Korean Universities",
		essayRequired: "No",
		country: "South Korea",
		date: "28 February 2026",
		daysLeft: 151,
		amount: "20,000 USD",
		match: "81%",
		popular: 8100,
	},
	{
		id: "scholarship-14",
		title: "Chinese Government Scholarship",
		description:
			"Scholarship program supporting international students in China. Covers tuition, accommodation, and living stipend with Chinese language and culture courses.",
		provider: "Provided by government",
		university: "Chinese Universities",
		essayRequired: "No",
		country: "China",
		date: "31 January 2026",
		daysLeft: 123,
		amount: "35,000 CNY",
		match: "79%",
		popular: 7900,
	},
	{
		id: "scholarship-15",
		title: "Canada Graduate Scholarships",
		description:
			"Canadian government scholarship for domestic and international students pursuing graduate studies. Focus on research excellence and innovation potential.",
		provider: "Provided by government",
		university: "Canadian Universities",
		essayRequired: "Yes",
		country: "Canada",
		date: "1 December 2025",
		daysLeft: 62,
		amount: "42,000 CAD",
		match: "87%",
		popular: 8700,
	},
];

// Research Labs mock data
export const mockResearchLabs: ResearchLab[] = [
	{
		id: "research-1",
		title: "Artificial Intelligence and Machine Learning Research Laboratory",
		description:
			"Cutting-edge research in deep learning, natural language processing, and computer vision. Current projects include autonomous systems, medical AI, and ethical AI frameworks.",
		professor: "Prof. Sarah Chen",
		institution: "Stanford University",
		field: "Computer Science",
		country: "United States",
		position: "PhD Position",
		date: "15 November 2025",
		daysLeft: 46,
		match: "95%",
		popular: 9500,
	},
	{
		id: "research-2",
		title: "Quantum Computing and Information Systems Lab",
		description:
			"Advanced research in quantum algorithms, quantum cryptography, and quantum error correction. Collaboration with industry partners and access to quantum hardware.",
		professor: "Prof. Michael Rodriguez",
		institution: "University of Cambridge",
		field: "Quantum Physics",
		country: "United Kingdom",
		position: "Postdoc Position",
		date: "1 December 2025",
		daysLeft: 62,
		match: "92%",
		popular: 9200,
	},
	{
		id: "research-3",
		title: "Biomedical Engineering and Regenerative Medicine Lab",
		description:
			"Interdisciplinary research combining engineering and biology to develop novel therapeutic approaches. Focus on tissue engineering, drug delivery, and biomedical devices.",
		professor: "Prof. Emily Watson",
		institution: "Technical University of Munich",
		field: "Biomedical Engineering",
		country: "Germany",
		position: "Research Assistant",
		date: "20 January 2026",
		daysLeft: 112,
		match: "89%",
		popular: 8900,
	},
	{
		id: "research-4",
		title: "Climate Change and Sustainability Research Center",
		description:
			"Global climate research addressing environmental challenges through innovative technologies. Projects include renewable energy, carbon capture, and climate modeling.",
		professor: "Prof. David Kim",
		institution: "University of Toronto",
		field: "Environmental Science",
		country: "Canada",
		position: "PhD Position",
		date: "1 March 2026",
		daysLeft: 152,
		match: "87%",
		popular: 8700,
	},
	{
		id: "research-5",
		title: "Neuroscience and Brain-Computer Interface Laboratory",
		description:
			"Pioneering research in neurotechnology, brain stimulation, and neural prosthetics. Development of therapeutic interventions for neurological disorders.",
		professor: "Prof. Anna Nakamura",
		institution: "University of Tokyo",
		field: "Neuroscience",
		country: "Japan",
		position: "Research Fellow",
		date: "15 February 2026",
		daysLeft: 138,
		match: "90%",
		popular: 9000,
	},
	{
		id: "research-6",
		title: "Space Technology and Astrophysics Research Group",
		description:
			"Space exploration research including satellite technology, planetary science, and space propulsion systems. Collaboration with space agencies and aerospace industry.",
		professor: "Prof. James Thompson",
		institution: "Sorbonne University",
		field: "Aerospace Engineering",
		country: "France",
		position: "PhD Position",
		date: "1 September 2026",
		daysLeft: 336,
		match: "85%",
		popular: 8500,
	},
];

// Utility functions
export const getRandomDaysLeft = () => Math.floor(Math.random() * 365) + 1;
export const getRandomAmount = () =>
	`${Math.floor(Math.random() * 50000) + 10000} USD`;

// Dashboard Statistics Data
export interface DashboardStats {
	total: number;
	new: number;
	underReview: number;
	accepted: number;
}

export interface ChartDataPoint {
	name: string;
	data: number[];
}

export interface DashboardData {
	stats: DashboardStats;
	chartSeries: ChartDataPoint[];
	categories: string[];
}

// Mock dashboard data for different time periods
export const mockDashboardData: Record<string, DashboardData> = {
	today: {
		stats: {
			total: 12,
			new: 8,
			underReview: 3,
			accepted: 1,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [2, 3, 5, 4, 6, 8, 12],
			},
			{
				name: "Reviews",
				data: [1, 1, 2, 2, 3, 3, 3],
			},
		],
		categories: [
			"2024-10-19T00:00:00.000Z",
			"2024-10-19T04:00:00.000Z",
			"2024-10-19T08:00:00.000Z",
			"2024-10-19T12:00:00.000Z",
			"2024-10-19T16:00:00.000Z",
			"2024-10-19T20:00:00.000Z",
			"2024-10-19T23:59:00.000Z",
		],
	},
	yesterday: {
		stats: {
			total: 15,
			new: 10,
			underReview: 4,
			accepted: 1,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [3, 5, 7, 9, 11, 13, 15],
			},
			{
				name: "Reviews",
				data: [1, 2, 2, 3, 3, 4, 4],
			},
		],
		categories: [
			"2024-10-18T00:00:00.000Z",
			"2024-10-18T04:00:00.000Z",
			"2024-10-18T08:00:00.000Z",
			"2024-10-18T12:00:00.000Z",
			"2024-10-18T16:00:00.000Z",
			"2024-10-18T20:00:00.000Z",
			"2024-10-18T23:59:00.000Z",
		],
	},
	"this-week": {
		stats: {
			total: 89,
			new: 62,
			underReview: 20,
			accepted: 7,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [45, 52, 58, 67, 73, 82, 89],
			},
			{
				name: "Reviews",
				data: [15, 18, 22, 25, 28, 31, 35],
			},
		],
		categories: [
			"2024-10-13T00:00:00.000Z",
			"2024-10-14T00:00:00.000Z",
			"2024-10-15T00:00:00.000Z",
			"2024-10-16T00:00:00.000Z",
			"2024-10-17T00:00:00.000Z",
			"2024-10-18T00:00:00.000Z",
			"2024-10-19T00:00:00.000Z",
		],
	},
	"last-week": {
		stats: {
			total: 95,
			new: 68,
			underReview: 19,
			accepted: 8,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [42, 50, 61, 70, 78, 87, 95],
			},
			{
				name: "Reviews",
				data: [12, 16, 20, 24, 28, 32, 36],
			},
		],
		categories: [
			"2024-10-06T00:00:00.000Z",
			"2024-10-07T00:00:00.000Z",
			"2024-10-08T00:00:00.000Z",
			"2024-10-09T00:00:00.000Z",
			"2024-10-10T00:00:00.000Z",
			"2024-10-11T00:00:00.000Z",
			"2024-10-12T00:00:00.000Z",
		],
	},
	"this-month": {
		stats: {
			total: 342,
			new: 245,
			underReview: 72,
			accepted: 25,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [58, 89, 125, 167, 203, 251, 289, 312, 342],
			},
			{
				name: "Reviews",
				data: [18, 28, 38, 50, 62, 75, 88, 102, 115],
			},
		],
		categories: [
			"2024-10-01T00:00:00.000Z",
			"2024-10-04T00:00:00.000Z",
			"2024-10-07T00:00:00.000Z",
			"2024-10-10T00:00:00.000Z",
			"2024-10-13T00:00:00.000Z",
			"2024-10-16T00:00:00.000Z",
			"2024-10-19T00:00:00.000Z",
			"2024-10-22T00:00:00.000Z",
			"2024-10-25T00:00:00.000Z",
		],
	},
	"last-month": {
		stats: {
			total: 378,
			new: 271,
			underReview: 79,
			accepted: 28,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [62, 98, 138, 182, 223, 267, 310, 345, 378],
			},
			{
				name: "Reviews",
				data: [20, 32, 45, 58, 72, 87, 103, 118, 132],
			},
		],
		categories: [
			"2024-09-01T00:00:00.000Z",
			"2024-09-04T00:00:00.000Z",
			"2024-09-07T00:00:00.000Z",
			"2024-09-10T00:00:00.000Z",
			"2024-09-13T00:00:00.000Z",
			"2024-09-16T00:00:00.000Z",
			"2024-09-19T00:00:00.000Z",
			"2024-09-22T00:00:00.000Z",
			"2024-09-25T00:00:00.000Z",
		],
	},
	"this-year": {
		stats: {
			total: 3842,
			new: 2756,
			underReview: 812,
			accepted: 274,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [
					245, 523, 856, 1203, 1589, 1967, 2345, 2712, 3089, 3456,
					3689, 3842,
				],
			},
			{
				name: "Reviews",
				data: [
					78, 165, 267, 378, 495, 612, 729, 846, 963, 1080, 1197,
					1314,
				],
			},
		],
		categories: [
			"2024-01-01T00:00:00.000Z",
			"2024-02-01T00:00:00.000Z",
			"2024-03-01T00:00:00.000Z",
			"2024-04-01T00:00:00.000Z",
			"2024-05-01T00:00:00.000Z",
			"2024-06-01T00:00:00.000Z",
			"2024-07-01T00:00:00.000Z",
			"2024-08-01T00:00:00.000Z",
			"2024-09-01T00:00:00.000Z",
			"2024-10-01T00:00:00.000Z",
			"2024-11-01T00:00:00.000Z",
			"2024-12-01T00:00:00.000Z",
		],
	},
	"last-year": {
		stats: {
			total: 4156,
			new: 2989,
			underReview: 878,
			accepted: 289,
		},
		chartSeries: [
			{
				name: "Applications",
				data: [
					278, 567, 923, 1289, 1678, 2089, 2478, 2867, 3256, 3645,
					3912, 4156,
				],
			},
			{
				name: "Reviews",
				data: [
					89, 178, 289, 412, 534, 656, 778, 900, 1022, 1144, 1266,
					1388,
				],
			},
		],
		categories: [
			"2023-01-01T00:00:00.000Z",
			"2023-02-01T00:00:00.000Z",
			"2023-03-01T00:00:00.000Z",
			"2023-04-01T00:00:00.000Z",
			"2023-05-01T00:00:00.000Z",
			"2023-06-01T00:00:00.000Z",
			"2023-07-01T00:00:00.000Z",
			"2023-08-01T00:00:00.000Z",
			"2023-09-01T00:00:00.000Z",
			"2023-10-01T00:00:00.000Z",
			"2023-11-01T00:00:00.000Z",
			"2023-12-01T00:00:00.000Z",
		],
	},
};

// FAQ Data Interface
export interface FaqItem {
	question: string;
	answer: string;
}

export interface FaqData {
	account: FaqItem[];
	application: FaqItem[];
	subscription: FaqItem[];
	other: FaqItem[];
}

// FAQ mock data
export const mockFaqData: FaqData = {
	account: [
		{
			question: "How do I create an EduMatch account?",
			answer: 'Click the "Sign Up" button on the homepage, fill in your details including email, password, and basic profile information. You will receive a verification email to activate your account.',
		},
		{
			question: "I forgot my password. How can I reset it?",
			answer: 'Click "Forgot Password" on the login page, enter your email address, and we will send you a password reset link. Follow the instructions in the email to create a new password.',
		},
		{
			question: "How do I update my profile information?",
			answer: "Go to your Profile section after logging in. You can edit your personal information, academic background, research interests, and upload documents.",
		},
		{
			question: "Can I delete my account?",
			answer: 'Yes, you can delete your account by going to Account Settings and clicking "Delete Account". Please note that this action is irreversible and all your data will be permanently removed.',
		},
	],
	application: [
		{
			question:
				"How do I apply for scholarships and research opportunities?",
			answer: "Navigate to the Explore section, filter by your preferences, and click on any opportunity that interests you. Each listing has detailed application instructions and required documents.",
		},
		{
			question: "Can I apply to multiple opportunities simultaneously?",
			answer: "Yes, you can apply to as many opportunities as you qualify for. We recommend tailoring each application to the specific requirements.",
		},
		{
			question: "How can I track my application status?",
			answer: "Visit your profile dashboard where you can view all submitted applications, their current status, and any updates from institutions.",
		},
		{
			question: "What documents do I need for applications?",
			answer: "Common documents include CV/Resume, transcripts, letters of recommendation, personal statements, and research proposals. Each opportunity specifies its exact requirements.",
		},
	],
	subscription: [
		{
			question: "What subscription plans are available?",
			answer: "We offer Basic (free), Premium, and Pro subscription plans. Each plan provides different levels of access to opportunities, application tracking, and premium features.",
		},
		{
			question: "How do I upgrade my subscription?",
			answer: 'Go to Account Settings and click on "Subscription". Choose your desired plan and complete the payment process. Your upgrade will be activated immediately.',
		},
		{
			question: "Can I cancel my subscription anytime?",
			answer: "Yes, you can cancel your subscription at any time from your Account Settings. Your premium features will remain active until the end of your current billing period.",
		},
		{
			question: "Do you offer refunds?",
			answer: "We offer a 30-day money-back guarantee for new subscriptions. Contact our support team within 30 days of purchase for a full refund.",
		},
	],
	other: [
		{
			question: "How does the matching algorithm work?",
			answer: "Our algorithm analyzes your academic background, research interests, location preferences, and career goals to match you with the most relevant opportunities.",
		},
		{
			question: "Is my personal information secure?",
			answer: "Yes, we use industry-standard encryption and security measures to protect your data. We never share your personal information with third parties without your consent.",
		},
		{
			question: "How can I contact support?",
			answer: "You can reach our support team through email, phone, or live chat. We also have an extensive help center with articles and tutorials.",
		},
		{
			question: "Do you have a mobile app?",
			answer: "Currently, EduMatch is available as a web application optimized for mobile devices. We are working on native mobile apps that will be available soon.",
		},
	],
};
