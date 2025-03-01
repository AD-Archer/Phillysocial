import Link from "next/link"
import Image from "next/image"

export default function About() {
  const founders = [
    {
      name: "Antonio Archer",
      role: "Co-Founder",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Sianni Strickland",
      role: "Co-Founder",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Bryan Gunawan",
      role: "Co-Founder",
      image: "/placeholder.svg?height=300&width=300",
    },
    {
      name: "Mohomed Souare",
      role: "Co-Founder",
      image: "/placeholder.svg?height=300&width=300",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#004C54] via-[#046A38] to-[#A5ACAF] text-white">
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">About Philly Social</h1>
        <p className="mt-6 text-lg leading-8 text-gray-100 max-w-2xl mx-auto">
          Philly Social is a community-driven platform designed to bring everyone in Philadelphia—both locals and those
          with Philly roots—into a single, accessible space for real-time discussions and collaboration.
        </p>
        <p className="mt-4 text-lg leading-8 text-gray-100 max-w-2xl mx-auto">
          Our app allows users to host and join community meetings anytime, making it easier than ever to connect, share
          ideas, and organize around the issues that matter most. Whether it&apos;s neighborhood improvements, cultural
          events, or city-wide initiatives, we&apos;re providing a space where the Philly community can come
          together—anytime, anywhere.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/signup"
            className="rounded-md bg-[#000000] px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-[#A5ACAF] hover:text-[#004C54] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004C54]"
          >
            Join Us
          </Link>
          <Link href="/" className="text-lg font-semibold leading-6 text-white hover:text-[#A5ACAF]">
            Back to Home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Our Founders</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {founders.map((founder, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-lg p-6 flex flex-col items-center text-center"
            >
              <div className="relative w-48 h-48 mb-4 rounded-full overflow-hidden border-4 border-[#A5ACAF]">
                <Image src={founder.image || "/placeholder.svg"} alt={founder.name} fill className="object-cover" />
              </div>
              <h3 className="text-xl font-bold text-white">{founder.name}</h3>
              <p className="text-[#A5ACAF]">{founder.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

