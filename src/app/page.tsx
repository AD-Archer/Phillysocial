'use client';
import Link from 'next/link';
import MainLayout from '@/layouts/MainLayout';

export default function Home() {
  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="min-h-[60vh] flex items-center justify-center w-full px-4 py-12 sm:py-20 sm:px-6 lg:px-8">
        <div className="w-full max-w-7xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#004C54] px-2">
            Philly Social.
          </h1>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-[#1a3437] max-w-2xl mx-auto px-2">
            Join a vibrant community of Philadelphians sharing ideas, experiences, 
            and building meaningful connections right in the heart of the city.
          </p>
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
            <Link 
              href="/signup" 
              className="w-full sm:w-auto rounded-md bg-[#004C54] px-6 py-3 text-base sm:text-lg font-semibold text-white shadow-sm hover:bg-[#003940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004C54] transition-colors text-center"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto text-center text-base sm:text-lg font-semibold leading-6 text-[#004C54] hover:text-[#003940] transition-colors"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 sm:py-24 bg-[#f0f5f5]">
        <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#004C54] text-center mb-8 sm:mb-12">
            Why Join Philly Social?
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature cards */}
            <div className="w-full p-6 sm:p-8 bg-[#e6f0f0] border border-[#A5ACAF] rounded-lg shadow-md hover:border-[#004C54] hover:bg-[#d9ebeb] transition-all">
              <h3 className="text-xl font-semibold text-[#004C54] text-left">Connect with Locals</h3>
              <p className="mt-3 text-base text-[#1a3437] text-left">Meet and engage with people in your neighborhood.</p>
            </div>
            <div className="w-full p-6 sm:p-8 bg-[#e6f0f0] border border-[#A5ACAF] rounded-lg shadow-md hover:border-[#004C54] hover:bg-[#d9ebeb] transition-all">
              <h3 className="text-xl font-semibold text-[#004C54] text-left">Share Your Philly Story</h3>
              <p className="mt-3 text-base text-[#1a3437] text-left">Post updates, photos, and experiences unique to Philadelphia.</p>
            </div>
            <div className="w-full p-6 sm:p-8 bg-[#e6f0f0] border border-[#A5ACAF] rounded-lg shadow-md hover:border-[#004C54] hover:bg-[#d9ebeb] transition-all">
              <h3 className="text-xl font-semibold text-[#004C54] text-left">Discover Local Events</h3>
              <p className="mt-3 text-base text-[#1a3437] text-left">Stay updated on events happening around the city.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="w-full py-16 sm:py-24 bg-[#e6f0f0]">
        <div className="w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="w-full mx-auto max-w-2xl text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-[#004C54] px-2">
              Ready to connect with Philly?
            </h2>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-[#1a3437] px-2">
              Join our community today and start connecting with fellow Philadelphians who share your interests and passions.
            </p>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4 sm:px-0">
              <Link
                href="/signup"
                className="w-full sm:w-auto rounded-md bg-[#004C54] px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#003940] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004C54] transition-colors text-center min-w-[200px]"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto text-center text-base font-semibold leading-6 text-[#004C54] hover:text-[#003940] transition-colors min-w-[200px] py-3"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
