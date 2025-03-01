import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <section className="px-4 py-20 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          About Connect with Philly
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Connect with Philly is a social media platform designed to bring together 
          the vibrant community of Philadelphia. Our mission is to foster connections, 
          share experiences, and celebrate the unique culture of our city.
        </p>
        <p className="mt-4 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Whether you're looking to meet new friends, share your story, or discover 
          local events, Connect with Philly is here to help you engage with your 
          community like never before.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link 
            href="/signup" 
            className="rounded-md bg-indigo-600 px-6 py-3 text-lg font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Join Us
          </Link>
          <Link
            href="/"
            className="text-lg font-semibold leading-6 text-gray-900 hover:text-indigo-600"
          >
            Back to Home <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </div>
  );
} 