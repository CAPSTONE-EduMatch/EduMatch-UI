"use client"

import { TreePine, MessageCircle, Bell, Star, User, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"

export function EduMatchHeader() {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

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

  return (
    <header className={`w-full bg-[#ffffff] border-b border-gray-100 py-3 fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="w-full px-2 sm:px-4 md:px-8 py-3 overflow-hidden">
        <div className="flex items-center justify-between w-full">
          {/* Logo Section - positioned at most left */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#126e64] rounded-full flex items-center justify-center">
              <TreePine className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xl sm:text-2xl font-bold text-[#126e64]">EduMatch</span>
          </div>

          {/* Desktop Navigation Menu - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-16">
            <a href="#" className="text-[#222222] hover:text-[#126e64] font-medium transition-colors">
              About us
            </a>
            <a href="#" className="text-[#222222] hover:text-[#126e64] font-medium transition-colors">
              Explore
            </a>
            <a href="#" className="text-[#222222] hover:text-[#126e64] font-medium transition-colors">
              Program
            </a>
          </nav>

          {/* Desktop Profile Icons - hidden on mobile */}
          <div className="hidden md:flex items-center gap-3">
            {/* Teal Chat Icon */}
            <div className="w-10 h-10 bg-[#126e64] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>

            {/* Orange Bell Icon */}
            <div className="w-10 h-10 bg-[#f0a227] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <Bell className="w-5 h-5 text-white" />
            </div>

            {/* Red Star Icon */}
            <div className="w-10 h-10 bg-[#d80027] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <Star className="w-5 h-5 text-white" />
            </div>

            {/* Dark Blue User Icon */}
            <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <User className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-[#126e64] hover:text-[#0d5a52] transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu - collapsible */}
        <div className={`md:hidden transition-all duration-300 ease-in-out overflow-hidden ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-4 space-y-4 border-t border-gray-100 mt-3">
            {/* Mobile Navigation Links */}
            <nav className="space-y-3">
              <a 
                href="#" 
                className="block text-[#222222] hover:text-[#126e64] font-medium transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About us
              </a>
              <a 
                href="#" 
                className="block text-[#222222] hover:text-[#126e64] font-medium transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Explore
              </a>
            </nav>

            {/* Mobile Profile Icons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 bg-[#126e64] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-[#f0a227] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-[#d80027] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 bg-[#1e3a8a] rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <User className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
