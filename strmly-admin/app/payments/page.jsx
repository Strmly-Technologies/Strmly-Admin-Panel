'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

const page = () => {
    const [display, setDisplay] = useState('wallet-load');
    const [displayContent, setDisplayContent] = useState([]);
    const [amount, setAmount] = useState(0);           // wallet load total
    const [passesTotal, setPassesTotal] = useState(0); // creator passes total
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const displayOptions = ['wallet-load','creator-pass','comment-gifting'];
    const router = useRouter();

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    });

    const fetchWalletLoad = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/wallet/load`, {
                method: 'GET',
                headers: authHeaders()
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setDisplayContent(data.transactions || []);
                setAmount(data.totalMoney || 0);
            } else {
                setError(data.message || 'Failed to fetch wallet load transactions');
            }
        } catch {
            setError('Network error');
        }
        setLoading(false);
    };

    const fetchCreatorPasses = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/creator-passes`, {
                method: 'GET',
                headers: authHeaders()
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const passes = data.creatorPasses || [];
                setDisplayContent(passes);
                setPassesTotal(passes.reduce((sum,p)=> sum + (p.amount_paid || 0), 0));
            } else {
                setError(data.message || 'Failed to fetch creator passes');
            }
        } catch {
            setError('Network error');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (display === 'wallet-load') fetchWalletLoad();
        else if (display === 'creator-pass') fetchCreatorPasses();
        else {
            // comment-gifting placeholder
            setDisplayContent([]);
            setAmount(0);
            setPassesTotal(0);
            setError('');
        }
    }, [display]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    const isWallet = display === 'wallet-load';
    const isCreatorPass = display === 'creator-pass';
    const isCommentGifting = display === 'comment-gifting';
    const dynamicTotal = isWallet ? amount : isCreatorPass ? passesTotal : 0;
    const totalLabel = isWallet ? 'Wallet Load Total' : isCreatorPass ? 'Creator Pass Total' : 'Total';

    return (
        <div className="min-h-screen bg-white text-black">
            {/* Navbar (unchanged) */}
            <nav className="fixed top-0 left-0 right-0 h-14 bg-black text-white flex items-center px-6 z-50">
                <span onClick={()=>router.push('/dashboard')} className="font-bold tracking-wider cursor-pointer">STRMLY ADMIN</span>
                <div className="ml-auto flex items-center gap-6 text-sm font-semibold">
                    <button onClick={()=>router.push('/dashboard')} className="hover:underline">Dashboard</button>
                    <button onClick={()=>router.push('/users')} className="hover:underline">Users</button>
                    <button onClick={()=>router.push('/payments')} className="hover:underline underline">Payments</button>
                    <button onClick={()=>router.push('/transactions')} className="hover:underline">Transactions</button>
                    <button onClick={()=>router.push('/withdrawals')} className="hover:underline">Withdrawals</button>
                    <button onClick={()=>router.push('/video_copy')} className="hover:underline underline">Copyright Violations</button>
                    <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>
                    <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
                </div>
            </nav>

            <div className="pt-20 flex flex-col items-center px-4 py-8 w-full">
                <h1 className="text-3xl font-bold mb-8">Payments</h1>

                {/* Tabs */}
                <div className="flex flex-wrap gap-4 mb-8">
                    {displayOptions.map(option => (
                        <button
                            key={option}
                            onClick={() => setDisplay(option)}
                            className={`px-6 py-2 rounded font-semibold transition ${
                                display === option
                                    ? 'bg-black text-white shadow'
                                    : 'bg-white text-black border border-black hover:bg-black hover:text-white'
                            }`}
                        >
                            {option.replace('-', ' ').toUpperCase()}
                        </button>
                    ))}
                </div>

                {/* Status */}
                {loading && <p className="text-black mb-4">Loading...</p>}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                {!loading && !error && isCommentGifting && (
                    <p className="text-gray-500 mb-4 italic">Comment gifting data will appear here once the API is available.</p>
                )}

                {/* Total */}
                <div className="w-full max-w-4xl mb-8">
                    <div className="bg-black text-white rounded-lg p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-bold tracking-wide">{totalLabel}</span>
                        <span className="text-2xl font-mono">{dynamicTotal}</span>
                        <span className="text-xs opacity-70">
                            {isWallet && `${displayContent.length} transaction${displayContent.length!==1?'s':''}`}
                            {isCreatorPass && `${displayContent.length} pass${displayContent.length!==1?'es':''}`}
                            {isCommentGifting && '0 records'}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="w-full max-w-6xl">
                    {/* Wallet Load Transactions */}
                    {!loading && !error && isWallet && displayContent.length > 0 && (
                        <div className="overflow-x-auto border border-black rounded-lg bg-white shadow">
                            <table className="min-w-[900px] w-full text-sm">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">ID</th>
                                        <th className='px-4 py-2 text-left'>Username</th>
                                        <th className="px-4 py-2 text-left">Type</th>
                                        <th className="px-4 py-2 text-left">Amount</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayContent.map(tx => (
                                        <tr key={tx._id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono">{tx._id}</td>
                                            <td className='px-4 py-2 font-mono'>{tx.user_id.username}</td>
                                            <td className="px-4 py-2">{tx.type || tx.transaction_type || '-'}</td>
                                            <td className="px-4 py-2 font-mono">{tx.amount}</td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-1 text-xs border border-black rounded">{tx.status}</span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                {new Date(tx.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Creator Passes */}
                    {!loading && !error && isCreatorPass && displayContent.length > 0 && (
                        <div className="overflow-x-auto border border-black rounded-lg bg-white shadow">
                            <table className="min-w-[1000px] w-full text-sm">
                                <thead className="bg-black text-white">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Pass ID</th>
                                        <th className="px-4 py-2 text-left">User</th>
                                        <th className="px-4 py-2 text-left">Creator</th>
                                        <th className="px-4 py-2 text-left">Amount Paid</th>
                                        <th className="px-4 py-2 text-left">Status</th>
                                        <th className="px-4 py-2 text-left">Start</th>
                                        <th className="px-4 py-2 text-left">End</th>
                                        <th className="px-4 py-2 text-left">Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayContent.map(pass => (
                                        <tr key={pass._id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="px-4 py-2 font-mono">{pass._id.slice(-6)}</td>
                                            <td className="px-4 py-2">{pass.user_id?.username}</td>
                                            <td className="px-4 py-2">{pass.creator_id?.username}</td>
                                            <td className="px-4 py-2 font-mono">{pass.amount_paid}</td>
                                            <td className="px-4 py-2">
                                                <span className="px-2 py-1 text-xs border border-black rounded">{pass.status}</span>
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                {new Date(pass.start_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap">
                                                {new Date(pass.end_date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2">{pass.purchase_method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Empty states (non-loading, non-error) */}
                    {!loading && !error && displayContent.length === 0 && !isCommentGifting && (
                        <div className="text-center text-gray-500 py-10 border border-dashed border-gray-300 rounded">
                            No records found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default page;