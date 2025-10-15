'use client'

import {
	MessageCircle,
	Bell,
	User,
	Menu,
	X,
	LogOut,
	Check,
	Heart,
	Settings,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Logo from '../../../public/edumatch_logo.svg'
import { useRouter } from 'next/navigation'
// import { useTranslate } from '@/hooks/useTranslate'
import { useTranslations, useLocale } from 'next-intl'
import { authClient } from '@/app/lib/auth-client'
import { useAuthCheck } from '@/hooks/useAuthCheck'
import { useNotifications } from '@/hooks/useNotifications'

export function EduMatchHeader() {
	const router = useRouter()
	const t = useTranslations()
	const currentLocale = useLocale()

	// Get authentication state
	const { isAuthenticated, refreshAuth } = useAuthCheck()

	// Get notifications
	const { notifications, unreadCount, markAsRead } = useNotifications()

	const [isVisible, setIsVisible] = useState(true)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [currentLanguage, setCurrentLanguage] = useState('EN')
	const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
	const [isNotificationOpen, setIsNotificationOpen] = useState(false)
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
	const [wishlistCount, setWishlistCount] = useState(0)

	// Initialize language from localStorage or current locale
	useEffect(() => {
		const savedLocale = localStorage.getItem('preferredLocale')
		if (savedLocale) {
			const languageDisplay = savedLocale === 'en' ? 'EN' : 'VI'
			setCurrentLanguage(languageDisplay)
		} else {
			const languageDisplay = currentLocale === 'en' ? 'EN' : 'VI'
			setCurrentLanguage(languageDisplay)
		}
	}, [currentLocale])

	// Initialize wishlist count (replace with actual wishlist logic)
	useEffect(() => {
		// TODO: Replace with actual wishlist count from API or context
		// For now, setting a sample count
		setWishlistCount(3)
	}, [])

	useEffect(() => {
		const controlNavbar = () => {
			const currentScrollY = window.scrollY

			if (currentScrollY < 10) {
				// Always show header at the very top
				setIsVisible(true)
			} else if (currentScrollY > lastScrollY) {
				// Scrolling down - hide header
				setIsVisible(false)
			} else {
				// Scrolling up - show header
				setIsVisible(true)
			}

			setLastScrollY(currentScrollY)
		}

		window.addEventListener('scroll', controlNavbar)
		return () => window.removeEventListener('scroll', controlNavbar)
	}, [lastScrollY])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isLanguageMenuOpen &&
				!(event.target as Element).closest('.language-selector')
			) {
				setIsLanguageMenuOpen(false)
			}
			if (
				isNotificationOpen &&
				!(event.target as Element).closest('.notification-dropdown')
			) {
				setIsNotificationOpen(false)
			}
			if (
				isUserMenuOpen &&
				!(event.target as Element).closest('.user-menu-dropdown')
			) {
				setIsUserMenuOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [isLanguageMenuOpen, isNotificationOpen, isUserMenuOpen])

	const handleLogoClick = () => {
		router.push('/')
	}

	const handleChangeLanguage = (locale: string) => {
		// Store the selected locale in cookies for server-side access
		document.cookie = `preferredLocale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 year

		// Also store in localStorage for client-side access
		localStorage.setItem('preferredLocale', locale)

		// Update the current language display
		setCurrentLanguage(locale === 'en' ? 'EN' : 'VI')

		// Refresh the page to apply the new locale
		window.location.reload()
	}

	const handleLogout = async () => {
		try {
			await authClient.signOut()

			// Clear any cached data
			localStorage.clear()
			sessionStorage.clear()

			// Refresh auth state to update header
			await refreshAuth()

			// Redirect to home page
			router.push('/')
		} catch (error) {
			// Handle logout error silently or show user-friendly message
		}
	}

	const handleNotificationClick = async (
		notificationId: string,
		url: string
	) => {
		// Mark notification as read
		await markAsRead([notificationId])

		// Navigate to the notification URL
		router.push(url)

		// Close notification dropdown
		setIsNotificationOpen(false)
	}

	const handleMarkAllAsRead = async () => {
		await markAsRead(undefined, true)
	}

	const formatNotificationTime = (dateString: string) => {
		const date = new Date(dateString)
		const now = new Date()
		const diffInMinutes = Math.floor(
			(now.getTime() - date.getTime()) / (1000 * 60)
		)

		if (diffInMinutes < 1) return 'Just now'
		if (diffInMinutes < 60) return `${diffInMinutes}m ago`
		if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
		if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`

		return date.toLocaleDateString()
	}

	return (
		<header
			className={`w-full bg-[#ffffff] border-b border-gray-100 py-3 fixed top-0 left-0 right-0 z-50  transition-transform duration-300 ease-in-out ${
				isVisible ? 'translate-y-0' : '-translate-y-full'
			}`}
		>
			<div className="w-full px-2 sm:px-4 md:px-8 py-3">
				<div className="flex items-center justify-between w-full">
					{/* Logo Section - positioned at most left */}
					<div className="flex items-center gap-8">
						<div
							onClick={handleLogoClick}
							className="flex items-center gap-3 cursor-pointer hover:scale-105 transition-transform duration-300"
						>
							<div className="w-8 h-8 sm:w-10 sm:h-10  rounded-full flex items-center justify-center">
								{/* <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-white" /> */}
								<Image src={Logo} alt="Logo" width={60} height={60} />
							</div>
							<span className="text-xl sm:text-2xl font-bold text-[#126e64]">
								EduMatch
							</span>
						</div>

						{/* Desktop Navigation Menu - hidden on mobile */}
						<nav className="hidden md:flex items-center gap-16">
							{[
								{ label: t('about-us'), href: '#' },
								{ label: t('explore'), href: '/explore' },
								{ label: 'Pricing', href: '/pricing' },
								// Uncomment if needed: { label: t('program'), href: '#' },
							].map((nav, idx) => (
								<Link
									key={nav.label + idx}
									href={nav.href}
									className="text-[#222222] hover:text-[#126e64]  transition-colors"
								>
									{nav.label}
								</Link>
							))}
						</nav>
					</div>

					{/* Desktop Profile Icons - hidden on mobile */}
					<div className="hidden md:flex items-center gap-3">
						{/* Teal Chat Icon */}
						<div
							className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
							onClick={() => router.push('/messages')}
						>
							<MessageCircle className="w-5 h-5 text-[#126e64]" />
						</div>

						{/* Wishlist Icon */}
						<div className="relative">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => router.push('/profile/view?tab=wishlist')}
							>
								<Heart className="w-5 h-5 text-[#e91e63]" />
								{/* Badge số wishlist */}
								{wishlistCount > 0 && (
									<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
										{wishlistCount > 99 ? '99+' : wishlistCount}
									</div>
								)}
							</div>
						</div>

						{/* Orange Bell Icon */}
						<div className="relative notification-dropdown">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => setIsNotificationOpen(!isNotificationOpen)}
							>
								<Bell className="w-5 h-5 text-[#f0a227]" />
								{/* Badge số thông báo */}
								{unreadCount > 0 && (
									<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
										{unreadCount > 99 ? '99+' : unreadCount}
									</div>
								)}
							</div>

							{/* Notification Dropdown */}
							{isNotificationOpen && (
								<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-[99999]">
									{/* Header */}
									<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
										<h3 className="text-sm font-semibold text-gray-700">
											Notifications
										</h3>
										{unreadCount > 0 && (
											<button
												onClick={handleMarkAllAsRead}
												className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
											>
												<Check className="w-3 h-3" />
												Mark all read
											</button>
										)}
									</div>

									{/* Notifications List */}
									<div className="max-h-96 overflow-y-auto">
										{notifications.length === 0 ? (
											<div className="px-4 py-8 text-center text-gray-500">
												<Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
												<p className="text-sm">No notifications yet</p>
											</div>
										) : (
											notifications.map((notification) => (
												<div
													key={notification.id}
													className={`px-4 py-3 hover:bg-gray-50 border-b border-gray-100 cursor-pointer ${
														!notification.read_at ? 'bg-blue-50' : ''
													}`}
													onClick={() =>
														handleNotificationClick(
															notification.id,
															notification.url
														)
													}
												>
													<div className="flex items-start gap-3">
														<div
															className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
																!notification.read_at
																	? 'bg-[#126e64]'
																	: 'bg-gray-300'
															}`}
														></div>
														<div className="flex-1">
															<h4 className="text-sm font-medium text-gray-800 mb-1">
																{notification.title}
															</h4>
															<p className="text-xs text-gray-500 mb-2">
																{notification.bodyText}
															</p>
														</div>
														<span className="text-xs text-gray-400">
															{formatNotificationTime(notification.createAt)}
														</span>
													</div>
												</div>
											))
										)}
									</div>
								</div>
							)}
						</div>

						{/* Language Selector */}
						<div className="relative language-selector">
							<div
								className="w-10 h-10  rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
								title="Select Language"
							>
								<span className="text-lg">
									{currentLanguage === 'EN' ? '🇺🇸' : '🇻🇳'}
								</span>
							</div>

							{/* Language Dropdown */}
							{isLanguageMenuOpen && (
								<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[140px] z-[99999]">
									<div
										className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
										onClick={() => {
											handleChangeLanguage('en')
											setIsLanguageMenuOpen(false)
										}}
									>
										<span className="text-lg">🇺🇸</span>
										<span className="text-sm text-gray-700">English</span>
									</div>
									<div
										className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer"
										onClick={() => {
											handleChangeLanguage('vn')
											setIsLanguageMenuOpen(false)
										}}
									>
										<span className="text-lg">🇻🇳</span>
										<span className="text-sm text-gray-700">Vietnamese</span>
									</div>
								</div>
							)}
						</div>

						{/* User Menu Dropdown */}
						<div className="relative user-menu-dropdown">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
								title={isAuthenticated ? 'User Menu' : 'Login'}
							>
								<User className="w-5 h-5 text-[#1e3a8a]" />
							</div>

							{/* User Dropdown Menu */}
							{isUserMenuOpen && (
								<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[180px] z-[99999]">
									{isAuthenticated ? (
										// Logged in - show profile options and logout
										<>
											<div
												className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
												onClick={() => {
													router.push('/profile/view')
													setIsUserMenuOpen(false)
												}}
											>
												<Settings className="w-4 h-4" />
												<span className="text-sm">Manage Profile</span>
											</div>
											<div className="border-t border-gray-100 my-1"></div>
											<div
												className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer text-red-600"
												onClick={() => {
													handleLogout()
													setIsUserMenuOpen(false)
												}}
											>
												<LogOut className="w-4 h-4" />
												<span className="text-sm">Logout</span>
											</div>
										</>
									) : (
										// Not logged in - show login/signup options
										<>
											<div
												className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer text-blue-600"
												onClick={() => {
													router.push('/signin')
													setIsUserMenuOpen(false)
												}}
											>
												<User className="w-4 h-4" />
												<span className="text-sm">Sign In</span>
											</div>
											<div
												className="flex items-center gap-3 px-3 py-2 hover:bg-gray-100 cursor-pointer text-green-600"
												onClick={() => {
													router.push('/signup')
													setIsUserMenuOpen(false)
												}}
											>
												<User className="w-4 h-4" />
												<span className="text-sm">Sign Up</span>
											</div>
										</>
									)}
								</div>
							)}
						</div>
					</div>

					{/* Mobile Menu Button */}
					<button
						className="md:hidden p-2 text-[#126e64] hover:text-[#0d5a52] transition-colors"
						onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
					>
						{isMobileMenuOpen ? (
							<X className="w-6 h-6" />
						) : (
							<Menu className="w-6 h-6" />
						)}
					</button>
				</div>

				{/* Mobile Menu - collapsible */}
				<div
					className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
						isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
					}`}
				>
					<div className="py-4 space-y-4 border-t border-gray-100 mt-3">
						{/* Mobile Navigation Links */}
						<nav className="space-y-3">
							<Link
								href="#"
								className="block text-[#222222] hover:text-[#126e64]  transition-colors py-2"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								About us
							</Link>
							<Link
								href="/explore"
								className="block text-[#222222] hover:text-[#126e64]  transition-colors py-2"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								{/* {t('explore')} */}
								Explore
							</Link>
							<Link
								href="#"
								className="block text-[#222222] hover:text-[#126e64]  transition-colors py-2"
							>
								Program
							</Link>
						</nav>

						{/* Mobile Profile Icons */}
						<div className="flex items-center gap-3 pt-4 border-t border-gray-100">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => {
									router.push('/messages')
									setIsMobileMenuOpen(false)
								}}
							>
								<MessageCircle className="w-5 h-5 text-[#126e64]" />
							</div>

							{/* Wishlist Icon */}
							<div className="relative">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
									onClick={() => {
										router.push('/profile/view?tab=wishlist')
										setIsMobileMenuOpen(false)
									}}
								>
									<Heart className="w-5 h-5 text-[#e91e63]" />
									{/* Badge số wishlist */}
									{wishlistCount > 0 && (
										<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{wishlistCount > 99 ? '99+' : wishlistCount}
										</div>
									)}
								</div>
							</div>

							{/* Orange Bell Icon */}
							<div className="relative notification-dropdown">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
									onClick={() => setIsNotificationOpen(!isNotificationOpen)}
								>
									<Bell className="w-5 h-5 text-[#f0a227]" />
									{/* Badge số thông báo */}
									{unreadCount > 0 && (
										<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
											{unreadCount > 99 ? '99+' : unreadCount}
										</div>
									)}
								</div>
							</div>
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => {
									const newLocale = currentLanguage === 'EN' ? 'vn' : 'en'
									handleChangeLanguage(newLocale)
								}}
								title={`Switch to ${currentLanguage === 'EN' ? 'Vietnamese' : 'English'}`}
							>
								<span className="text-lg">
									{currentLanguage === 'EN' ? '🇺🇸' : '🇻🇳'}
								</span>
							</div>
							{isAuthenticated ? (
								// Logged in - show logout
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
									onClick={handleLogout}
									title="Logout"
								>
									<LogOut className="w-5 h-5 text-red-600" />
								</div>
							) : (
								// Not logged in - show login
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
									onClick={() => router.push('/signin')}
									title="Sign In"
								>
									<User className="w-5 h-5 text-blue-600" />
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}
