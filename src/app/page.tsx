import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Philly Social.
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Join a vibrant community of Philadelphians sharing ideas, experiences, 
            and building meaningful connections right in the heart of the city.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link 
              href="/signup" 
              className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Get Started
            </Link>
            <Link
              href="/about"
              className="text-lg font-semibold leading-6 text-gray-900 hover:text-indigo-600"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="p-6 border rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Connect with Locals</h3>
              <p className="mt-2 text-gray-600">Meet and engage with people in your neighborhood.</p>
            </div>
            {/* Feature 2 */}
            <div className="p-6 border rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Share Your Philly Story</h3>
              <p className="mt-2 text-gray-600">Post updates, photos, and experiences unique to Philadelphia.</p>
            </div>
            {/* Feature 3 */}
            <div className="p-6 border rounded-lg shadow-md">
              <h3 className="text-lg font-semibold">Discover Local Events</h3>
              <p className="mt-2 text-gray-600">Stay updated on events happening around the city.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Call-to-Action Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to connect with Philly?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join our community today and start connecting with fellow Philadelphians who share your interests and passions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/signup"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-indigo-600"
              >
                Sign In <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
