import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative w-full h-screen flex items-center justify-center text-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/hero1.png')",
          backgroundSize: "auto 100%",
          imageRendering: "auto"
        }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-white max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 whitespace-nowrap leading-tight">
          Match. Apply. Succeed.
        </h1>
        <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl mb-8 whitespace-nowrap opacity-90 pt-12">
          Find your perfect university match with our intelligent matching system
        </p>
      </div>
    </section>
  )
}
