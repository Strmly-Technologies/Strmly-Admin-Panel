'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const UserTransactionsPage = () => {
  const { id } = useParams()
  const router = useRouter()
  const [txs, setTxs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState(null)

  // client-side filters
  const [typeFilter, setTypeFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('') // yyyy-mm-dd
  const [search, setSearch] = useState('') // description search

  const backend = process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL

  const authHeaders = () => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('token')
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  }

  useEffect(() => {
    if (!id) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    if (!token) {
      router.push('/login')
      return
    }
    const fetchData = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(`${backend}/user/transactions/${id}`, { headers: authHeaders() })
        const data = await res.json()
        if (res.ok && data.success) {
          setTxs(data.transactions || [])
          if (data.transactions?.[0]?.user_id) {
            setUserInfo(data.transactions[0].user_id)
          }
        } else {
          setError(data.message || 'Failed to fetch user transactions')
        }
      } catch {
        setError('Network error')
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  const filtered = useMemo(() => {
    return txs.filter(t => {
      if (typeFilter && t.transaction_type !== typeFilter) return false
      if (categoryFilter && t.transaction_category !== categoryFilter) return false
      if (dateFilter) {
        const iso = new Date(t.createdAt).toISOString().slice(0,10)
        if (iso !== dateFilter) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (!(t.description?.toLowerCase().includes(q) || t.metadata?.creator_name?.toLowerCase().includes(q))) return false
      }
      return true
    })
  }, [txs, typeFilter, categoryFilter, dateFilter, search])

  const stats = useMemo(() => {
    const credits = filtered.filter(t => t.transaction_type === 'credit')
    const debits = filtered.filter(t => t.transaction_type === 'debit')
    const creditTotal = credits.reduce((a,c)=>a + (c.amount||0),0)
    const debitTotal = debits.reduce((a,c)=>a + (c.amount||0),0)
    return { creditTotal, debitTotal, net: creditTotal - debitTotal, count: filtered.length }
  }, [filtered])

  const catOptions = useMemo(
    () => Array.from(new Set(txs.map(t => t.transaction_category))).sort(),
    [txs]
  )

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center px-6 z-50">
        <span onClick={()=>router.push('/dashboard')} className="font-bold tracking-wider cursor-pointer">STRMLY ADMIN</span>
        <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
          <button onClick={()=>router.push('/dashboard')} className="hover:underline">Dashboard</button>
          <button onClick={()=>router.push('/users')} className="hover:underline underline">Users</button>
          <button onClick={()=>router.push('/payments')} className="hover:underline">Payments</button>
            <button onClick={()=>router.push('/transactions')} className="hover:underline">Transactions</button>
          <button onClick={()=>router.push('/withdrawals')} className="hover:underline">Withdrawals</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>

      <div className="pt-20 px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-6xl flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-wide mb-2">User Transactions</h1>
            {userInfo && (
              <p className="text-sm text-gray-600">
                {userInfo.username} &lt;{userInfo.email}&gt; (User ID: <span className="font-mono">{userInfo._id}</span>)
              </p>
            )}
          </div>
          <button
            onClick={()=>router.back()}
            className="px-4 py-2 border border-black rounded hover:bg-black hover:text-white transition font-semibold"
          >Back</button>
        </div>

        {/* Filters */}
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex gap-2 flex-wrap">
            <select
              value={typeFilter}
              onChange={e=>setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            >
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            <select
              value={categoryFilter}
              onChange={e=>setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            >
              <option value="">All Categories</option>
              {catOptions.map(c=> <option key={c} value={c}>{c}</option>)}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e=>setDateFilter(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            />
            <input
              type="text"
              placeholder="Search description / creator"
              value={search}
              onChange={e=>setSearch(e.target.value)}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            />
            <button
              onClick={() => { setTypeFilter(''); setCategoryFilter(''); setDateFilter(''); setSearch('') }}
              className="px-4 py-2 border border-black rounded bg-white hover:bg-black hover:text-white font-semibold transition"
            >Reset</button>
          </div>
          {/* Stats */}
          <div className="flex-1 flex flex-wrap gap-3 justify-start lg:justify-end">
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Credits: {stats.creditTotal}
            </div>
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Debits: {stats.debitTotal}
            </div>
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Net: {stats.net}
            </div>
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Rows: {stats.count}
            </div>
          </div>
        </div>

        {loading && <p className="mb-4">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="w-full max-w-6xl overflow-auto border border-black rounded-lg bg-white shadow">
          <table className="min-w-[1000px] w-full text-sm">
            <thead className="bg-black text-white">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Type</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Currency</th>
                <th className="px-4 py-2 text-left">Balance Before</th>
                <th className="px-4 py-2 text-left">Balance After</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono" title={t._id}>{t._id.slice(-6)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs border border-black rounded font-semibold ${t.transaction_type === 'credit' ? 'bg-black text-white' : 'bg-white text-black'}`}>
                      {t.transaction_type}
                    </span>
                  </td>
                  <td className="px-4 py-2">{t.transaction_category}</td>
                  <td className="px-4 py-2 font-mono">{t.amount}</td>
                  <td className="px-4 py-2">{t.currency}</td>
                  <td className="px-4 py-2 font-mono">{t.balance_before}</td>
                  <td className="px-4 py-2 font-mono">{t.balance_after}</td>
                  <td className="px-4 py-2">
                    <span className="px-2 py-1 text-xs border border-black rounded">{t.status}</span>
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && !loading && !error && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    No transactions found.
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

export default UserTransactionsPage
