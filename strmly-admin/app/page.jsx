'use client'

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    
    // Redirect based on authentication status
    if (token) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  // Show loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="text-2xl font-bold tracking-wider mb-4">STRMLY ADMIN</div>
        <div className="text-gray-500">Redirecting...</div>
      </div>
    </div>
  );
}
