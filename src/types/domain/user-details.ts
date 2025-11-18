export interface Document {
	name: string;
	size: string;
	date: string;
}

export interface UserDocuments {
	researchPapers: Document[];
	transcripts: Document[];
	degrees: Document[];
	languageCertificates: Document[];
	cvResume: Document[];
}

export interface UserDetails {
	id: string;
	name: string;
	email: string;
	phone: string;
	nationality: string;
	birthDate: string;
	gender: string;
	profileImage: string;
	program: string;
	gpa: string;
	status: string;
	university: string;
	role?: string;
	documents: UserDocuments;
	banned?: boolean;
	banReason?: string | null;
	banExpires?: string | null; // ISO date string
}

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}
