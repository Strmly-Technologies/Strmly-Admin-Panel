'use client'
import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const TransactionDetail = () => {
  const { id } = useParams();
  const router = useRouter();
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  }

  useEffect(() => {
    if (!id) return;
    const fetchTransaction = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (!res.ok) {
          setError('Failed to fetch transaction');
        } else {
          const data = await res.json();
            if (data.success) setTransaction(data.transaction);
            else setError(data.message || 'Failed to fetch transaction');
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    fetchTransaction();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  if (!transaction) return null;

  const t = transaction;

  return (
    <div className="min-h-screen bg-white text-black">
      <nav className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center px-6 z-50">
        <span onClick={()=>router.push('/dashboard')} className="font-bold tracking-wider cursor-pointer">STRMLY ADMIN</span>
        <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
          <button onClick={()=>router.push('/dashboard')} className="hover:underline">Dashboard</button>
          <button onClick={()=>router.push('/users')} className="hover:underline">Users</button>
          <button onClick={()=>router.push('/payments')} className="hover:underline">Payments</button>
          <button onClick={()=>router.push('/transactions')} className="hover:underline">Transactions</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>
      <div className="px-4 py-10 pt-24 flex flex-col items-center">
        <div className="w-full max-w-5xl flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-wide">Transaction Detail</h1>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-black rounded bg-white hover:bg-black hover:text-white transition font-semibold"
            >
              Back
            </button>
          </div>

          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border border-black rounded p-4 flex flex-col">
              <span className="text-xs uppercase tracking-wide">Type</span>
              <span className="mt-1 font-semibold">{t.transaction_type}</span>
            </div>
            <div className="border border-black rounded p-4 flex flex-col">
              <span className="text-xs uppercase tracking-wide">Amount</span>
              <span className="mt-1 font-mono">{t.amount} {t.currency}</span>
            </div>
              <div className="border border-black rounded p-4 flex flex-col">
              <span className="text-xs uppercase tracking-wide">Status</span>
              <span className="mt-1 font-semibold">{t.status}</span>
            </div>
            <div className="border border-black rounded p-4 flex flex-col">
              <span className="text-xs uppercase tracking-wide">Category</span>
              <span className="mt-1 font-semibold">{t.transaction_category}</span>
            </div>
          </div>

          {/* Core Info */}
          <div className="border border-black rounded-lg p-6 bg-white shadow-sm">
            <h2 className="font-bold text-lg mb-4">Core</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide">Transaction ID</div>
                <div className="font-mono break-all">{t._id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Wallet ID</div>
                <div className="font-mono break-all">{t.wallet_id}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Created</div>
                <div>{new Date(t.createdAt).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Updated</div>
                <div>{new Date(t.updatedAt).toLocaleString()}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs uppercase tracking-wide">Description</div>
                <div className="mt-1 leading-relaxed">{t.description}</div>
              </div>
            </div>
          </div>

          {/* Amount & Balance */}
          <div className="border border-black rounded-lg p-6 bg-white shadow-sm">
            <h2 className="font-bold text-lg mb-4">Amount & Balance</h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide">Amount</div>
                <div className="font-mono">{t.amount} {t.currency}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Balance Before</div>
                <div className="font-mono">{t.balance_before}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Balance After</div>
                <div className="font-mono">{t.balance_after}</div>
              </div>
            </div>
          </div>

          {/* Associations */}
          <div className="border border-black rounded-lg p-6 bg-white shadow-sm">
            <h2 className="font-bold text-lg mb-4">Associations</h2>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-wide">User</div>
                <div>{t.user_id?.username} ({t.user_id?.email})</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Content Type</div>
                <div>{t.content_type || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide">Content ID</div>
                <div className="font-mono break-all">{t.content_id || '-'}</div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          {t.metadata && Object.keys(t.metadata).length > 0 && (
            <div className="border border-black rounded-lg p-6 bg-white shadow-sm">
              <h2 className="font-bold text-lg mb-4">Metadata</h2>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                {Object.entries(t.metadata).map(([k,v]) => (
                  <div key={k}>
                    <div className="text-xs uppercase tracking-wide">{k.replace(/_/g,' ')}</div>
                    <div className="font-mono break-all">{String(v)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

export default TransactionDetail
