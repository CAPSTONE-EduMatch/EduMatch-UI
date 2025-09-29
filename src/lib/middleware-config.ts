export const routeConfig = {
	// Routes that are accessible to everyone
	publicRoutes: ["/", "/about", "/api/health"],

	// Routes that are only accessible to unauthenticated users
	authRoutes: ["/signin", "/signup", "/forgot-password"],

	// Routes that require authentication
	protectedRoutes: ["/dashboard", "/profile", "/files"],

	// Routes that require completed profile
	profileRequiredRoutes: ["/dashboard", "/files"],

	// Default redirect paths
	defaultRedirects: {
		afterLogin: "/dashboard",
		afterLogout: "/signin",
		createProfile: "/profile/create-profile",
	},
};
