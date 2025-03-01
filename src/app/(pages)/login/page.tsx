'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Both fields are required.');
      return;
    }

    // Example code for login
    // const response = await fetch('/api/login', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({ email, password }),
    // });

    // Handle response (success or error)
    // const data = await response.json();
    // if (data.success) {
    //   // Redirect or show success message
    // } else {
    //   setError(data.message || 'Something went wrong.');
    // }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">Sign In</h1>
        
        {error && <p className="text-red-500 text-center">{error}</p>}

        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700" htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            placeholder="Enter your password"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-opacity-50"
        >
          Sign In
        </button>

        <p className="mt-4 text-center text-gray-600">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
}