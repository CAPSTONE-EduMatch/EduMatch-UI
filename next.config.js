/** @type {import('next').NextConfig} */
const nextConfig = {
	// Amplify supports Next.js with API routes
	images: {
		unoptimized: true,
	},
	// webpack: (config, { isServer }) => {
	// 	// Exclude Prisma and other server-only packages from client bundles
	// 	if (!isServer) {
	// 		config.resolve.fallback = {
	// 			...config.resolve.fallback,
	// 			fs: false,
	// 			net: false,
	// 			tls: false,
	// 		};
	// 	}
	// 	return config;
	// },
	// experimental: {
	// 	serverComponentsExternalPackages: ["@prisma/client", "prisma"],
	// },
};

module.exports = nextConfig;
