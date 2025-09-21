import { Facebook, Twitter, Linkedin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-white py-8 sm:py-12 lg:py-16 border-t">
      <div className="w-full px-2 sm:px-4 lg:px-6">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-8 sm:mb-12">
          {/* Left side - EduMatch info */}
          <div className="lg:w-1/2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">E</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-primary">EduMatch</span>
            </div>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6 max-w-sm">
              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the
              industry's standard dummy text ever since the 1500s Lorem Ipsum has
            </p>

            <div className="flex gap-3 sm:gap-4">
              <a
                href="#"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
              >
                <Facebook className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </a>
              <a
                href="#"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-black rounded flex items-center justify-center hover:bg-gray-800 transition-colors"
              >
                <Twitter className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </a>
              <a
                href="#"
                className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-700 rounded flex items-center justify-center hover:bg-blue-800 transition-colors"
              >
                <Linkedin className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Right side - About us columns */}
          <div className="lg:w-1/2 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {[1, 2, 3].map((col) => (
              <div key={col}>
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">About us</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {[1, 2, 3, 4].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-xs sm:text-sm">
                        Term of users
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 sm:pt-8 border-t">
          <p className="text-muted-foreground text-xs sm:text-sm text-center sm:text-left">Copyright @ 2025 edumatch@gmail.com</p>
        </div>
      </div>
    </footer>
  )
}
