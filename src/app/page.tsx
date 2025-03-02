'use client';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#003038] via-[#004C54] to-[#046A38] text-white -m-4 sm:-m-6 lg:-m-8 p-4 sm:p-6 lg:p-8">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
        <div className="relative">
          {/* Hero Section */}
          <section className="px-4 py-24 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white sm:text-7xl mb-8 drop-shadow-lg">
              Philly <span className="text-[#A5ACAF]">Social</span>
            </h1>
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-3xl mx-auto">
              <p className="text-xl leading-8 text-white">
                Join a vibrant community of Philadelphians sharing ideas, experiences, 
                and building meaningful connections right in the heart of the city.
              </p>
            </div>
            <div className="mt-12 flex items-center justify-center gap-x-6">
              <Link 
                href="/signup" 
                className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
              >
                Get Started
              </Link>
              <Link
                href="/about"
                className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
              >
                Learn more <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-16 drop-shadow-lg">
              Why Join Philly Social?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40">
                <h3 className="text-2xl font-bold text-white mb-4">Connect with Locals</h3>
                <p className="text-[#A5ACAF] text-lg">Meet and engage with people in your neighborhood.</p>
              </div>
              <div className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40">
                <h3 className="text-2xl font-bold text-white mb-4">Share Your Philly Story</h3>
                <p className="text-[#A5ACAF] text-lg">Post updates, photos, and experiences unique to Philadelphia.</p>
              </div>
              <div className="group bg-black/30 backdrop-blur-md rounded-xl p-8 flex flex-col items-start transform transition-all duration-300 hover:scale-105 hover:bg-black/40">
                <h3 className="text-2xl font-bold text-white mb-4">Discover Local Events</h3>
                <p className="text-[#A5ACAF] text-lg">Stay updated on events happening around the city.</p>
              </div>
            </div>
          </section>

          {/* Call-to-Action Section */}
          <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-8 shadow-xl max-w-3xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-white mb-6 drop-shadow-lg">
                Ready to connect with Philly?
              </h2>
              <p className="text-xl leading-8 text-[#A5ACAF] mb-8">
                Join our community today and start connecting with fellow Philadelphians who share your interests and passions.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6">
                <Link
                  href="/signup"
                  className="rounded-xl bg-[#A5ACAF] px-8 py-4 text-lg font-semibold text-[#003038] shadow-lg hover:bg-white hover:text-[#004C54] transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#004C54]"
                >
                  Create Account
                </Link>
                <Link
                  href="/login"
                  className="text-lg font-semibold leading-6 text-[#A5ACAF] hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  Sign In <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}
