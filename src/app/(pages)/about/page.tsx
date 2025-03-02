'use client';
import Link from "next/link"
import Image from "next/image"
import MainLayout from '@/layouts/MainLayout';

export default function About() {
  const founders = [
    {
      name: "Mohomed Souare",
      role: "Co-Founder, and Key Developer",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZWRSjr6oGkhZc0HqtLiKVx6UwNY9rFfzj8DgC",
      github: "https://github.com/MO-fr",
      linkedin: "https://www.linkedin.com/in/mohamed-souare-8a61a2259/",
    },
    {
      name: "Antonio Archer",
      role: "Co-Founder, and Lead Developer",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZgXkiO09rgqXvswhp7V9inAWSNjdFcTPU04Co",
      github: "https://github.com/ad-archer",
      linkedin: "https://www.linkedin.com/in/antonio-archer/",
    },
    {
      name: "Sianni Strickland",
      role: "Co-Founder, and Managering Lead",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZRu9boXVrI1y2gHJMVozdtwNDuO6Ev3qPksnc",
      github: "https://github.com/SunnySianni",
      linkedin: "https://www.linkedin.com/in/sianni-strickland-934059284//",
    },
    {
      name: "Bryan Gunawan",
      role: "Co-Founder, and Overseeing Developer",
      image: "https://2ad5tl9u0f.ufs.sh/f/mVlrptEB35zZjuXP5PB6AkuVRtqlLTQdpOHJ5GXICY9z3M2n",
      github: "https://github.com/ManINeedToSleep",
      linkedin: "https://www.linkedin.com/in/bryan-gunawan-a537132b9/",
    },
  ]

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="relative">
          <section className="px-4 py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-8 drop-shadow-lg">
              About <span className="text-[#A5ACAF]">Philly Social</span>
            </h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
              <p className="text-xl leading-8 text-white mb-6">
                Philly Social is a community-driven platform designed to bring everyone in Philadelphia—both locals and those
                with Philly roots—into a single, accessible space for real-time discussions and collaboration.
              </p>
              <p className="text-xl leading-8 text-white">
                Our app allows users to host and join community meetings anytime, making it easier than ever to connect, share
                ideas, and organize around the issues that matter most. Whether it&apos;s neighborhood improvements, cultural
                events, or city-wide initiatives, we&apos;re providing a space where the Philly community can come
                together—anytime, anywhere.
              </p>
            </div>
            <div className="mt-12 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
              >
                Join Us
              </Link>
              <Link 
                href="/" 
                className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
              >
                Back to Home <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </section>

          <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16 drop-shadow-lg">Our Founders</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {founders.map((founder, index) => (
                <div
                  key={index}
                  className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105 hover:bg-black/40"
                >
                  <div className="relative w-48 h-48 mb-6 rounded-full overflow-hidden border-4 border-[#A5ACAF] shadow-xl group-hover:border-white transition-colors duration-300">
                    {founder.image && founder.image.startsWith('http') ? (
                      <img 
                        src={founder.image} 
                        alt={founder.name} 
                        className="absolute inset-0 w-full h-full object-cover" 
                      />
                    ) : (
                      <Image 
                        src={founder.image || "/placeholder.svg"} 
                        alt={founder.name} 
                        fill 
                        className="object-cover" 
                      />
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">{founder.name}</h3>
                  <p className="text-[#A5ACAF] text-lg mb-4">{founder.role}</p>
                  <div className="flex space-x-6">
                    <a 
                      href={founder.github} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#A5ACAF] hover:text-white transition-colors duration-300 font-medium"
                    >
                      GitHub
                    </a>
                    <a 
                      href={founder.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#A5ACAF] hover:text-white transition-colors duration-300 font-medium"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  )
}