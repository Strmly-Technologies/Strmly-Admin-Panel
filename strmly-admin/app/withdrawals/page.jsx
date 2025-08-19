'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'

const WithdrawalsPage = () => {
  const router = useRouter()
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(null) // id while acting
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [pagination, setPagination] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('') // search by creator username or referenceId (client side)

  const backend = process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL

  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    if (!token) router.push('/login')
  }, [router])

  const fetchWithdrawals = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${backend}/withdrawals?page=${page}&limit=${limit}`, {
        headers: getAuthHeaders()
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setWithdrawals(data.withdrawals || [])
        setPagination(data.pagination)
      } else {
        setError(data.message || 'Failed to fetch withdrawals')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  useEffect(() => { fetchWithdrawals() }, [page, limit])

  const filtered = useMemo(() => {
    return withdrawals.filter(w => {
      if (statusFilter && w.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!(
          w.referenceId?.toLowerCase().includes(q) ||
          w.creator?.username?.toLowerCase().includes(q)
        )) return false
      }
      return true
    })
  }, [withdrawals, statusFilter, search])

  const stats = useMemo(() => {
    const agg = { pending: { amt:0, cnt:0 }, processed:{ amt:0, cnt:0 }, failed:{ amt:0, cnt:0 } }
    withdrawals.forEach(w => {
      const bucket = agg[w.status] || null
      if (bucket) { bucket.amt += w.finalAmount ?? w.amount; bucket.cnt++ }
    })
    return agg
  }, [withdrawals])

  const mutateStatusLocal = (id, updater) => {
    setWithdrawals(ws => ws.map(w => w.id === id ? { ...w, ...updater } : w))
  }

  const doAction = async ({ id, action }) => {
    const confirmMsg = action === 'process' ? 'Mark as processed?' : 'Mark as failed and refund?'
    if (!confirm(confirmMsg)) return
    const utr = action === 'process' ? prompt('Enter UTR (optional)') || undefined : undefined
    const adminNotes = prompt('Admin notes (optional)') || undefined
    setActionLoading(id)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/withdrawals/${id}/process`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action, utr, adminNotes })
      })
      const data = await res.json()
      if (res.ok && data.success) {
        if (action === 'process') {
          mutateStatusLocal(id, { status: 'processed', utr: data.withdrawal?.utr, processedAt: data.withdrawal?.processedAt })
        } else {
          mutateStatusLocal(id, { status: 'failed', failureReason: data.withdrawal?.failureReason })
        }
      } else {
        alert(data.message || 'Action failed')
      }
    } catch {
      alert('Network error')
    }
    setActionLoading(null)
  }

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
          <button onClick={()=>router.push('/users')} className="hover:underline">Users</button>
          <button onClick={()=>router.push('/payments')} className="hover:underline">Payments</button>
          <button onClick={()=>router.push('/transactions')} className="hover:underline">Transactions</button>
          <button onClick={()=>router.push('/withdrawals')} className="hover:underline underline">Withdrawals</button>
          <button onClick={()=>router.push('/video_copy')} className="hover:underline">Copyright Violations</button>
          <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>

          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>

      <div className="pt-20 px-4 py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold tracking-wide mb-8">Withdrawal Requests</h1>

        {/* Filters */}
        <div className="w-full max-w-6xl flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={e=>{ setStatusFilter(e.target.value); }}
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="processed">Processed</option>
              <option value="failed">Failed</option>
            </select>
            <input
              value={search}
              onChange={e=>{ setSearch(e.target.value); }}
              placeholder="Search ref / creator"
              className="px-4 py-2 border border-black rounded bg-white focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setStatusFilter(''); setSearch(''); }}
              className="px-4 py-2 border border-black rounded bg-white hover:bg-black hover:text-white transition font-semibold"
            >Reset</button>
          </div>
          {/* Stats */}
          <div className="flex-1 flex flex-wrap gap-3 justify-start md:justify-end">
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Pending: {stats.pending.cnt} 
            </div>
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Processed: {stats.processed.cnt} 
            </div>
            <div className="border border-black rounded px-3 py-2 text-xs font-mono">
              Failed: {stats.failed.cnt} 
            </div>
          </div>
        </div>

        {loading && <p className="mb-4">Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Table */}
        <div className="w-full max-w-6xl overflow-auto border border-black rounded-lg bg-white shadow">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 text-left">Reference</th>
                  <th className="px-4 py-2 text-left">Creator</th>
                  <th className="px-4 py-2 text-left">Amount</th>
                  <th className="px-4 py-2 text-left">Final</th>
                  <th className="px-4 py-2 text-left">Fee</th>
                  <th className="px-4 py-2 text-left">Method</th>
                  <th className="px-4 py-2 text-left">UPI / Bank</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Requested</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => (
                  <tr key={w.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 font-mono">{w.referenceId}</td>
                    <td className="px-4 py-2">
                      <div className="font-semibold">{w.creator?.username}</div>
                      <div className="text-xs text-gray-600">{w.creator?.email}</div>
                    </td>
                    <td className="px-4 py-2 font-mono">{w.amount}</td>
                    <td className="px-4 py-2 font-mono">{w.finalAmount}</td>
                    <td className="px-4 py-2 font-mono">{w.platformFee}</td>
                    <td className="px-4 py-2">{w.payoutMethod}</td>
                    <td className="px-4 py-2 text-xs break-all">
                      {w.upiId || (w.bankDetails?.accountNumber ? 'Bank' : '-')}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 text-xs border border-black rounded">{w.status}</span>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {new Date(w.requestedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {(w.status === 'pending' || w.status === 'processing') ? (
                        <div className="flex flex-col gap-2">
                          <button
                            disabled={actionLoading === w.id}
                            onClick={()=>doAction({ id: w.id, action:'process' })}
                            className="px-3 py-1 text-xs border border-black rounded hover:bg-black hover:text-white disabled:opacity-50"
                          >{actionLoading === w.id ? '...' : 'Process'}</button>
                          <button
                            disabled={actionLoading === w.id}
                            onClick={()=>doAction({ id: w.id, action:'fail' })}
                            className="px-3 py-1 text-xs border border-black rounded hover:bg-black hover:text-white disabled:opacity-50"
                          >{actionLoading === w.id ? '...' : 'Fail'}</button>
                        </div>
                      ) : (
                        <span className="text-xs italic text-gray-500">No actions</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={10} className="px-4 py-10 text-center text-gray-500">
                      No withdrawal requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center gap-3 mt-8">
            <button
              className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
              disabled={pagination.page <= 1}
              onClick={()=>setPage(p=>p-1)}
            >Prev</button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button
              className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
              disabled={pagination.page >= pagination.pages}
              onClick={()=>setPage(p=>p+1)}
            >Next</button>
          </div>
        )}

      </div>
    </div>
  )
}

export default WithdrawalsPage
