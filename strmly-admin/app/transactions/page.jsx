'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filters (client-side)
  const [typeFilter, setTypeFilter] = useState(''); // credit | debit | ''
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState(''); // yyyy-mm-dd

  const router = useRouter();
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    
    // Clear cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    router.push('/login');
  }

  // Initial fetch (no query params; all filtering is client-side)
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/transactions`, {
          method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        if (!response.ok) {
          setError('Failed to fetch transactions');
        } else {
          const data = await response.json();
          if (data.success) {
            setTransactions(data.transactions || []);
          } else {
            setError(data.message || 'Failed to fetch transactions');
          }
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchTransactions();
  }, []);

  // Derived filtered list
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (typeFilter && tx.transaction_type !== typeFilter) return false;
      if (nameFilter && !tx.user_id?.username?.toLowerCase().includes(nameFilter.toLowerCase())) return false;
      if (dateFilter) {
        const d = new Date(tx.createdAt);
        const iso = d.toISOString().slice(0,10);
        if (iso !== dateFilter) return false;
      }
      return true;
    });
  }, [transactions, typeFilter, nameFilter, dateFilter]);

  // Stats
  const stats = useMemo(() => {
    const credits = filtered.filter(t => t.transaction_type === 'credit');
    const debits = filtered.filter(t => t.transaction_type === 'debit');
    const creditTotal = credits.reduce((a,c)=>a + (c.amount||0),0);
    const debitTotal = debits.reduce((a,c)=>a + (c.amount||0),0);
    const net = creditTotal - debitTotal;
    return { creditTotal, debitTotal, net, count: filtered.length };
  }, [filtered]);

  const resetFilters = () => {
    setTypeFilter('');
    setNameFilter('');
    setDateFilter('');
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center px-6 z-50">
        <span onClick={()=>router.push('/dashboard')} className="font-bold tracking-wider cursor-pointer">STRMLY ADMIN</span>
        <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
          <button onClick={()=>router.push('/dashboard')} className="hover:underline">Dashboard</button>
          <button onClick={()=>router.push('/users')} className="hover:underline">Users</button>
          <button onClick={()=>router.push('/payments')} className="hover:underline">Payments</button>
          <button onClick={()=>router.push('/transactions')} className="hover:underline underline">Transactions</button>
          <button onClick={()=>router.push('/withdrawals')} className="hover:underline">Withdrawals</button>
          <button onClick={()=>router.push('/video_copy')} className="hover:underline underline">Copyright Violations</button>
          <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>
      <div className="pt-20 flex flex-col items-center px-4 py-8">
        <h1 className="text-3xl font-bold tracking-wide mb-8">Transactions</h1>

        {/* Filters */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            <input
              type="text"
              placeholder="Username"
              value={nameFilter}
              onChange={e => setNameFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            />
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetFilters}
              className="px-4 py-2 border border-black rounded bg-white hover:bg-black hover:text-white transition font-semibold"
            >
              Reset
            </button>
          </div>
          <div className="flex-1 flex flex-wrap gap-3 justify-start lg:justify-end">
            <div className="border border-black rounded px-4 py-2 text-sm font-mono">
              Credits: <span className="font-semibold">{stats.creditTotal}</span>
            </div>
            <div className="border border-black rounded px-4 py-2 text-sm font-mono">
              Debits: <span className="font-semibold">{stats.debitTotal}</span>
            </div>
              <div className="border border-black rounded px-4 py-2 text-sm font-mono">
              Net: <span className="font-semibold">{stats.net}</span>
            </div>
            <div className="border border-black rounded px-4 py-2 text-sm font-mono">
              Rows: <span className="font-semibold">{stats.count}</span>
            </div>
          </div>
        </div>

        {loading && <p className="mb-4">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Table */}
        <div className="w-full max-w-6xl overflow-auto border border-black rounded-lg bg-white shadow">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="sticky top-0 bg-black text-white">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">User</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Currency</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(tx => {
                const shortId = tx._id?.slice(-6);
                return (
                  <tr
                    key={tx._id}
                    className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => tx.transaction_category!=='withdrawal_request' && router.push(`/transactions/${tx._id}`)}
                    title={tx._id}
                  >
                    <td className="px-4 py-2 font-mono">{shortId}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold border border-black ${tx.transaction_type === 'credit' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-4 py-2">{tx.transaction_category}</td>
                    <td className="px-4 py-2">{tx.user_id?.username}</td>
                    <td className="px-4 py-2 font-mono">{tx.amount}</td>
                    <td className="px-4 py-2">{tx.currency}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded text-xs border border-black">
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(tx.createdAt).toLocaleString()}</td>
                  </tr>
                )
              })}
              {filtered.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No transactions match filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}

export default page