'use client'

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="text-3xl font-bold tracking-wider mb-8">STRMLY ADMIN</div>
        <div className="flex gap-4">
          <Link href="/dashboard" className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition">
            Go to Dashboard
          </Link>
          <Link href="/login" className="px-6 py-3 border border-black rounded-lg hover:bg-gray-100 transition">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
