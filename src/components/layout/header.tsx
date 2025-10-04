'use client'

import { MessageCircle, Bell, User, Menu, X, LogOut } from 'lucide-react'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import Logo from '../../../public/edumatch_logo.svg'
import { useRouter } from 'next/navigation'
// import { useTranslate } from '@/hooks/useTranslate'
import { useTranslations, useLocale } from 'next-intl'
import { authClient } from '@/app/lib/auth-client'
import { useAuthCheck } from '@/hooks/useAuthCheck'

export function EduMatchHeader() {
	const router = useRouter()
	const t = useTranslations()
	const currentLocale = useLocale()

	// Get authentication state
	const { isAuthenticated, refreshAuth } = useAuthCheck()

	const [isVisible, setIsVisible] = useState(true)
	const [lastScrollY, setLastScrollY] = useState(0)
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
	const [currentLanguage, setCurrentLanguage] = useState('EN')
	const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
	const [isNotificationOpen, setIsNotificationOpen] = useState(false)
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

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
							<a
								href="#"
								className="text-[#222222] hover:text-[#126e64]  transition-colors"
							>
								{t('about-us')}
							</a>
							<a
								href="#"
								className="text-[#222222] hover:text-[#126e64]  transition-colors"
							>
								{t('explore')}
								{/* Explore */}
							</a>
							<a
								href="#"
								className="text-[#222222] hover:text-[#126e64]  transition-colors"
							>
								{t('program')}
							</a>
						</nav>
					</div>

					{/* Desktop Profile Icons - hidden on mobile */}
					<div className="hidden md:flex items-center gap-3">
						{/* Teal Chat Icon */}
						<div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
							<MessageCircle className="w-5 h-5 text-[#126e64]" />
						</div>

						{/* Orange Bell Icon */}
						<div className="relative notification-dropdown">
							<div
								className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
								onClick={() => setIsNotificationOpen(!isNotificationOpen)}
							>
								<Bell className="w-5 h-5 text-[#f0a227]" />
								{/* Badge số thông báo */}
								<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
									3
								</div>
							</div>

							{/* Notification Dropdown */}
							{isNotificationOpen && (
								<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg w-80 z-[99999]">
									{/* Header */}
									<div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
										<h3 className="text-sm font-semibold text-gray-700">
											All messages
										</h3>
										{/* <button className="text-gray-400 hover:text-gray-600">
											<svg
												className="w-4 h-4"
												fill="none"
												stroke="currentColor"
												viewBox="0 0 24 24"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M19 9l-7 7-7-7"
												/>
											</svg>
										</button> */}
									</div>

									{/* Notifications List */}
									<div className="max-h-96 overflow-y-auto">
										{/* Contract amendment */}
										<div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
											<div className="flex items-start gap-3">
												<div className="w-2 h-2 bg-[#126e64] rounded-full mt-2 flex-shrink-0"></div>
												<div className="flex-1">
													<h4 className="text-sm font-medium text-gray-800 mb-1">
														Contract amendment
													</h4>
													<p className="text-xs text-gray-500 mb-2">
														Ruhrallee 17, 1. OG, rechts
														<br />
														Nadine Müller
													</p>
												</div>
												<span className="text-xs text-gray-400">2:32pm</span>
											</div>
										</div>

										{/* Cancellation */}
										<div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
											<div className="flex items-start gap-3">
												<div className="w-2 h-2 bg-[#126e64] rounded-full mt-2 flex-shrink-0"></div>
												<div className="flex-1">
													<h4 className="text-sm font-medium text-gray-800 mb-1">
														Cancellation
													</h4>
													<p className="text-xs text-gray-500 mb-2">
														Ruhrallee 17, 1. OG, rechts
														<br />
														Nadine Müller
													</p>
												</div>
												<span className="text-xs text-gray-400">Yesterday</span>
											</div>
										</div>

										{/* Water damage */}
										<div className="px-4 py-3 hover:bg-gray-50">
											<div className="flex items-start gap-3">
												<div className="w-2 h-2 bg-[#126e64] rounded-full mt-2 flex-shrink-0"></div>
												<div className="flex-1">
													<h4 className="text-sm font-medium text-gray-800 mb-1">
														Water damage
													</h4>
													<p className="text-xs text-gray-500 mb-2">
														Ruhrallee 17, 1. OG, rechts
														<br />
														Nadine Müller
													</p>
												</div>
												<span className="text-xs text-gray-400">
													3 days ago
												</span>
											</div>
										</div>
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
								<div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] z-[99999]">
									{isAuthenticated ? (
										// Logged in - show logout option
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
							<a
								href="#"
								className="block text-[#222222] hover:text-[#126e64]  transition-colors py-2"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								About us
							</a>
							<a
								href="#"
								className="block text-[#222222] hover:text-[#126e64]  transition-colors py-2"
								onClick={() => setIsMobileMenuOpen(false)}
							>
								{/* {t('explore')} */}
								Explore
							</a>
							<a
								href="#"
								className="text-[#222222] hover:text-[#126e64]  transition-colors"
							>
								Program
							</a>
						</nav>

						{/* Mobile Profile Icons */}
						<div className="flex items-center gap-3 pt-4 border-t border-gray-100">
							<div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
								<MessageCircle className="w-5 h-5 text-[#126e64]" />
							</div>

							{/* Orange Bell Icon */}
							<div className="relative notification-dropdown">
								<div
									className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
									onClick={() => setIsNotificationOpen(!isNotificationOpen)}
								>
									<Bell className="w-5 h-5 text-[#f0a227]" />
									{/* Badge số thông báo */}
									<div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
										3
									</div>
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
