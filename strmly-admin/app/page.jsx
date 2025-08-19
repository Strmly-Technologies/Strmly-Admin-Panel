'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [error, setError] = useState(null);
  
  useEffect(() => {
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      
      // Redirect based on authentication status
      if (token) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err) {
      console.error("Redirection error:", err);
      setError("Failed to redirect. Please try navigating manually.");
    }
  }, [router]);

  // Show loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tracking-wider mb-4">STRMLY ADMIN</div>
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <div className="text-gray-500">Redirecting...</div>
        )}
        {error && (
          <div className="mt-4 flex gap-4">
            <a href="/dashboard" className="px-4 py-2 bg-black text-white rounded">Go to Dashboard</a>
            <a href="/login" className="px-4 py-2 border border-black rounded">Go to Login</a>
          </div>
        )}
      </div>
    </div>
  );
}
