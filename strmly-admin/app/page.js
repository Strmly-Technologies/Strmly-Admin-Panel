'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  
  useEffect(() => {
    // Check if we're on the client side
    if (typeof window !== 'undefined') {
      // Check if user is authenticated
      const token = localStorage.getItem('token')
      
      if (token) {
        // If authenticated, redirect to dashboard
        router.push('/dashboard')
      } else {
        // If not authenticated, redirect to login
        router.push('/login')
      }
    }
  }, [router])

  // Return minimal loading state while redirect happens
  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">STRMLY ADMIN</h1>
        <p>Redirecting...</p>
      </div>
    </div>
  )
}
