'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';



const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('token', data.token);
        router.push('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar (brand only on login) */}
      <nav className="w-full bg-black text-white px-6 h-14 flex items-center justify-between">
        <span className="font-bold tracking-wider">STRMLY ADMIN</span>
      </nav>
      <div className="flex items-center justify-center pt-10">
        <form
          onSubmit={handleSubmit}
          className="bg-black mt-44 text-white p-8 rounded-lg shadow-lg min-w-[320px] flex flex-col gap-4"
        >
          <h2 className="text-center mb-4 tracking-widest text-2xl font-bold">STRMLY Admin Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            className="p-3 border border-white rounded bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="p-3 border border-white rounded bg-[#111] text-white focus:outline-none focus:ring-2 focus:ring-white"
            required
          />
          {error && (
            <div className="text-red-500 text-center">{error}</div>
          )}
          <button
            type="submit"
            className="p-3 bg-white text-black rounded font-bold cursor-pointer tracking-wide hover:bg-gray-200 transition"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
