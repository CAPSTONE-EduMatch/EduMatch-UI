import { Facebook, Twitter, Linkedin, Mail } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '../../../public/edumatch_logo.svg'

export function Footer() {
	return (
		<footer className="bg-white py-8 sm:py-12 lg:py-16 border-t">
			<div className="w-full px-2 sm:px-4 lg:px-6">
				<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8 sm:mb-12">
					{/* Left side - EduMatch info */}
					<div className="lg:w-1/2">
						<div className="flex items-center gap-2 mb-4">
							<Image src={Logo} alt="EduMatch Logo" width={32} height={32} />
							<span className="text-xl sm:text-2xl font-bold text-primary">
								EduMatch
							</span>
						</div>
						<p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 max-w-sm">
							Connect international students with their dream institutions.
							EduMatch bridges the gap between talented students and prestigious
							universities worldwide, making higher education accessible to
							everyone.
						</p>

						<div className="space-y-2 mb-4 sm:mb-6">
							<div className="flex items-center gap-2 text-muted-foreground text-xs sm:text-sm">
								<Mail className="w-4 h-4" />
								<a
									href="mailto:edumatch@gmail.com"
									className="hover:text-primary transition-colors"
								>
									edumatch@gmail.com
								</a>
							</div>
						</div>

						<div className="flex gap-3 sm:gap-4">
							<a
								href="#"
								className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
								aria-label="Facebook"
							>
								<Facebook className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
							</a>
							<a
								href="#"
								className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded flex items-center justify-center hover:bg-gray-800 transition-colors"
								aria-label="Twitter"
							>
								<Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
							</a>
							<a
								href="#"
								className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-700 rounded flex items-center justify-center hover:bg-blue-800 transition-colors"
								aria-label="LinkedIn"
							>
								<Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
							</a>
						</div>
					</div>

					{/* Right side - Quick Links */}
					<div className="lg:w-1/2 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
						<div>
							<h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
								Company
							</h3>
							<ul className="space-y-2 sm:space-y-3">
								<li>
									<Link
										href="/about"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										About Us
									</Link>
								</li>
								<li>
									<Link
										href="/contact"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Contact
									</Link>
								</li>
								<li>
									<Link
										href="/careers"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Careers
									</Link>
								</li>
								<li>
									<Link
										href="/blog"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Blog
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
								Resources
							</h3>
							<ul className="space-y-2 sm:space-y-3">
								<li>
									<Link
										href="/support"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Help Center
									</Link>
								</li>
								<li>
									<Link
										href="/faq"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										FAQ
									</Link>
								</li>
								<li>
									<Link
										href="/guides"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Guides
									</Link>
								</li>
								<li>
									<Link
										href="/community"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Community
									</Link>
								</li>
							</ul>
						</div>

						<div>
							<h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
								Legal
							</h3>
							<ul className="space-y-2 sm:space-y-3">
								<li>
									<Link
										href="/terms"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Terms of Service
									</Link>
								</li>
								<li>
									<Link
										href="/privacy"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Privacy Policy
									</Link>
								</li>
								<li>
									<Link
										href="/cookies"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Cookie Policy
									</Link>
								</li>
								<li>
									<Link
										href="/sitemap"
										prefetch={false}
										className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm"
									>
										Sitemap
									</Link>
								</li>
							</ul>
						</div>
					</div>
				</div>

				<div className="pt-6 sm:pt-8 border-t">
					<p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">
						Copyright @ 2025 edumatch@gmail.com
					</p>
				</div>
			</div>
		</footer>
	)
}
