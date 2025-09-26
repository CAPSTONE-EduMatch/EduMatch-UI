// File type utilities and icons for file management components

export interface FileItem {
	id: string;
	name: string;
	originalName: string;
	type: string;
	size: number;
	url: string;
	category: string;
	createdAt: Date;
	base64?: string;
	extension?: string;
	mimeType?: string;
	lastModified?: Date;
}

export interface FolderItem {
	id: string;
	name: string;
	type: "file" | "folder";
	fileType?: string;
	size?: number;
	url?: string;
	base64?: string;
	extension?: string;
	mimeType?: string;
	lastModified?: Date;
}

// File type categories
export const FILE_CATEGORIES = {
	IMAGE: "image",
	DOCUMENT: "document",
	VIDEO: "video",
	AUDIO: "audio",
	ARCHIVE: "archive",
	CODE: "code",
	OTHER: "other",
} as const;

// File extensions mapping
export const FILE_EXTENSIONS = {
	// Images
	jpg: FILE_CATEGORIES.IMAGE,
	jpeg: FILE_CATEGORIES.IMAGE,
	png: FILE_CATEGORIES.IMAGE,
	gif: FILE_CATEGORIES.IMAGE,
	svg: FILE_CATEGORIES.IMAGE,
	webp: FILE_CATEGORIES.IMAGE,
	bmp: FILE_CATEGORIES.IMAGE,
	ico: FILE_CATEGORIES.IMAGE,

	// Documents
	pdf: FILE_CATEGORIES.DOCUMENT,
	doc: FILE_CATEGORIES.DOCUMENT,
	docx: FILE_CATEGORIES.DOCUMENT,
	xls: FILE_CATEGORIES.DOCUMENT,
	xlsx: FILE_CATEGORIES.DOCUMENT,
	ppt: FILE_CATEGORIES.DOCUMENT,
	pptx: FILE_CATEGORIES.DOCUMENT,
	txt: FILE_CATEGORIES.DOCUMENT,
	rtf: FILE_CATEGORIES.DOCUMENT,
	odt: FILE_CATEGORIES.DOCUMENT,
	ods: FILE_CATEGORIES.DOCUMENT,
	odp: FILE_CATEGORIES.DOCUMENT,

	// Videos
	mp4: FILE_CATEGORIES.VIDEO,
	avi: FILE_CATEGORIES.VIDEO,
	mov: FILE_CATEGORIES.VIDEO,
	wmv: FILE_CATEGORIES.VIDEO,
	flv: FILE_CATEGORIES.VIDEO,
	webm: FILE_CATEGORIES.VIDEO,
	mkv: FILE_CATEGORIES.VIDEO,

	// Audio
	mp3: FILE_CATEGORIES.AUDIO,
	wav: FILE_CATEGORIES.AUDIO,
	flac: FILE_CATEGORIES.AUDIO,
	aac: FILE_CATEGORIES.AUDIO,
	ogg: FILE_CATEGORIES.AUDIO,
	m4a: FILE_CATEGORIES.AUDIO,

	// Archives
	zip: FILE_CATEGORIES.ARCHIVE,
	rar: FILE_CATEGORIES.ARCHIVE,
	"7z": FILE_CATEGORIES.ARCHIVE,
	tar: FILE_CATEGORIES.ARCHIVE,
	gz: FILE_CATEGORIES.ARCHIVE,

	// Code
	js: FILE_CATEGORIES.CODE,
	ts: FILE_CATEGORIES.CODE,
	jsx: FILE_CATEGORIES.CODE,
	tsx: FILE_CATEGORIES.CODE,
	html: FILE_CATEGORIES.CODE,
	css: FILE_CATEGORIES.CODE,
	scss: FILE_CATEGORIES.CODE,
	sass: FILE_CATEGORIES.CODE,
	json: FILE_CATEGORIES.CODE,
	xml: FILE_CATEGORIES.CODE,
	py: FILE_CATEGORIES.CODE,
	java: FILE_CATEGORIES.CODE,
	cpp: FILE_CATEGORIES.CODE,
	c: FILE_CATEGORIES.CODE,
	php: FILE_CATEGORIES.CODE,
	rb: FILE_CATEGORIES.CODE,
	go: FILE_CATEGORIES.CODE,
	rs: FILE_CATEGORIES.CODE,
	sql: FILE_CATEGORIES.CODE,
	md: FILE_CATEGORIES.CODE,
} as const;

// Get file category from extension
export const getFileCategory = (extension: string): string => {
	const ext = extension.toLowerCase().replace(".", "");
	return (
		FILE_EXTENSIONS[ext as keyof typeof FILE_EXTENSIONS] ||
		FILE_CATEGORIES.OTHER
	);
};

// Get file extension from filename
export const getFileExtension = (filename: string): string => {
	return filename.split(".").pop()?.toLowerCase() || "";
};

// Format file size
export const formatFileSize = (bytes: number): string => {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Get file icon based on category
export const getFileIcon = (category: string, extension: string): string => {
	const ext = extension.toLowerCase();

	switch (category) {
		case FILE_CATEGORIES.IMAGE:
			return "🖼️";
		case FILE_CATEGORIES.DOCUMENT:
			if (ext === "pdf") return "📄";
			if (["doc", "docx"].includes(ext)) return "📝";
			if (["xls", "xlsx"].includes(ext)) return "📊";
			if (["ppt", "pptx"].includes(ext)) return "📽️";
			return "📄";
		case FILE_CATEGORIES.VIDEO:
			return "🎥";
		case FILE_CATEGORIES.AUDIO:
			return "🎵";
		case FILE_CATEGORIES.ARCHIVE:
			return "📦";
		case FILE_CATEGORIES.CODE:
			if (["js", "jsx", "ts", "tsx"].includes(ext)) return "⚛️";
			if (["html", "css"].includes(ext)) return "🌐";
			if (["py"].includes(ext)) return "🐍";
			if (["java"].includes(ext)) return "☕";
			if (["cpp", "c"].includes(ext)) return "⚙️";
			return "💻";
		default:
			return "📄";
	}
};

// Get file color based on category
export const getFileColor = (category: string): string => {
	switch (category) {
		case FILE_CATEGORIES.IMAGE:
			return "#10b981"; // green
		case FILE_CATEGORIES.DOCUMENT:
			return "#3b82f6"; // blue
		case FILE_CATEGORIES.VIDEO:
			return "#8b5cf6"; // purple
		case FILE_CATEGORIES.AUDIO:
			return "#f59e0b"; // amber
		case FILE_CATEGORIES.ARCHIVE:
			return "#6b7280"; // gray
		case FILE_CATEGORIES.CODE:
			return "#ef4444"; // red
		default:
			return "#6b7280"; // gray
	}
};

// Create file item from File object
export const createFileItem = (file: File, id?: string): FileItem => {
	const extension = getFileExtension(file.name);
	const category = getFileCategory(extension);

	return {
		id: id || crypto.randomUUID(),
		name: file.name,
		originalName: file.name,
		type: category,
		size: file.size,
		extension,
		mimeType: file.type,
		lastModified: new Date(file.lastModified),
		url: "",
		category: category,
		createdAt: new Date(),
	};
};

// Create file item from saved file data
export const createFileItemFromSaved = (savedFile: any): FileItem => {
	return {
		id: savedFile.id,
		name: savedFile.name,
		originalName: savedFile.originalName,
		type: savedFile.type,
		size: savedFile.size,
		extension: savedFile.name.split(".").pop() || "",
		mimeType: savedFile.mimeType || "application/octet-stream",
		lastModified: new Date(savedFile.createdAt),
		url: savedFile.url,
		category: savedFile.category,
		createdAt: new Date(savedFile.createdAt),
	};
};

// Create folder item
export const createFolderItem = (name: string, id?: string): FolderItem => {
	return {
		id: id || crypto.randomUUID(),
		name,
		type: "folder",
		lastModified: new Date(),
	};
};
