'use client'

import React, { useEffect, useState } from 'react';
import {useRouter} from 'next/navigation'
import Link from 'next/link';
const DashboardPage = () => {
  const router = useRouter();
  const [overview, setOverview] = useState(null);
  const [ovLoading, setOvLoading] = useState(false);
  const [ovError, setOvError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      setOvLoading(true);
      setOvError('');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/overview`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) {
          setOvError('Failed to load financial overview');
        } else {
          const data = await res.json();
          if (data.success) {
            setOverview(data.financialData);
          } else {
            setOvError(data.message || 'Failed to load financial overview');
          }
        }
      } catch {
        setOvError('Network error');
      }
      setOvLoading(false);
    };
    fetchOverview();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center px-6 z-50">
        <span onClick={()=>router.push('/dashboard')} className="font-bold tracking-wider cursor-pointer">STRMLY ADMIN</span>
        <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
          <button onClick={()=>router.push('/dashboard')} className="hover:underline underline">Dashboard</button>
          <button onClick={()=>router.push('/users')} className="hover:underline">Users</button>
          <button onClick={()=>router.push('/payments')} className="hover:underline">Payments</button>
          <button onClick={()=>router.push('/transactions')} className="hover:underline">Transactions</button>
          <button onClick={()=>router.push('/withdrawals')} className="hover:underline">Withdrawals</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>
      <div className="px-6 py-10 pt-24 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-wide mb-10">Dashboard</h1>

        {/* Financial Overview */}
        <div className="w-full max-w-6xl flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-wide">Financial Overview</h2>
            {ovLoading && <span className="text-sm font-mono">Loading...</span>}
          </div>
          {ovError && (
            <div className="border border-red-500 text-red-600 rounded p-4 text-sm bg-red-50">
              {ovError}
            </div>
          )}
          {overview && (
            <div className="flex flex-col gap-10">
              {/* Gifting */}
              <section>
                <h3 className="text-sm uppercase tracking-wider font-semibold mb-3">Gifting</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card title="Creator Gifting" amount={overview.gifting.creatorGifting.amount} count={overview.gifting.creatorGifting.count} />
                  <Card title="Comment Gifting" amount={overview.gifting.commentGifting.amount} count={overview.gifting.commentGifting.count} />
                  <Card title="Total Gifting" amount={overview.gifting.totalGifting} emphasis />
                </div>
              </section>

              {/* Monetization */}
              <section>
                <h3 className="text-sm uppercase tracking-wider font-semibold mb-3">Monetization</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card title="Content Sales" amount={overview.monetization.contentSales.amount} count={overview.monetization.contentSales.count} />
                  <Card title="Creator Passes" amount={overview.monetization.creatorPasses.amount} count={overview.monetization.creatorPasses.count} />
                  <Card title="Community Fees" amount={overview.monetization.communityFees.amount} count={overview.monetization.communityFees.count} />
                  <Card title="Total Monetization" amount={overview.monetization.totalMonetization} emphasis className="md:col-span-2" />
                </div>
              </section>

              {/* Withdrawals */}
              <section>
                <h3 className="text-sm uppercase tracking-wider font-semibold mb-3">Withdrawals</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card title="Pending Requests" amount={overview.withdrawals.pendingRequests.amount} count={overview.withdrawals.pendingRequests.count} />
                  <Card title="Completed" amount={overview.withdrawals.completedWithdrawals.amount} count={overview.withdrawals.completedWithdrawals.count} />
                </div>
              </section>

             
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable card components
const Card = ({ title, amount, count, emphasis, className = '' }) => (
  <div className={`border border-black rounded-lg p-4 flex flex-col gap-2 bg-white shadow-sm ${className}`}>
    <span className={`text-xs uppercase tracking-wide ${emphasis ? 'font-bold' : 'font-medium'}`}>{title}</span>
    <span className={`text-2xl font-mono ${emphasis ? 'font-bold' : 'font-semibold'}`}>{amount}</span>
    {typeof count !== 'undefined' && (
      <span className="text-xs text-gray-600">{count} {count === 1 ? 'tx' : 'txs'}</span>
    )}
  </div>
);

const MetricCard = ({ label, value }) => (
  <div className="border border-black rounded-lg p-4 flex flex-col gap-2 bg-black text-white shadow-sm">
    <span className="text-xs uppercase tracking-wide">{label}</span>
    <span className="text-2xl font-mono">{value}</span>
  </div>
);


export default DashboardPage;
