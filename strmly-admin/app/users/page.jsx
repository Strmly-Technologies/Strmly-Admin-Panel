'use client'
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export const page = () => {
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [pageNum, setPageNum] = useState(1);
    const [limit] = useState(10);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(false);
    const [date, setDate] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // 'all' or 'date'
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    }

    // Fetch stats
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/stats`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );
                if (!response.ok) return;
                const data = await response.json();
                if (data.success) setStats(data.stats);
            } catch {}
        };
        fetchStats();
    }, []);

    // Fetch users
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            let url = '';
            if (filterMode === 'date' && date) {
                url = `${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/users-by-date?page=${pageNum}&limit=${limit}&date=${date}`;
            } else {
                url = `${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/users?page=${pageNum}&limit=${limit}&search=${encodeURIComponent(search)}`;
            }
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) {
                    setError('Failed to fetch users');
                    setLoading(false);
                    return;
                }
                const data = await response.json();
                if (data.success) {
                    setUsers(data.users);
                    setPagination(data.pagination);
                } else {
                    setError(data.message || 'Failed to fetch users');
                }
            } catch (err) {
                setError('Network error');
            }
            setLoading(false);
        };
        fetchUsers();
    }, [pageNum, search, limit, date, filterMode]);

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
                    <button onClick={()=>router.push('/video_copy')} className="hover:underline">Copyright Violations</button>
                    <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>

                    <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
                </div>
            </nav>
            <div className="pt-20 flex flex-col items-center px-4 py-8">
                {/* Stats summary */}
                {stats && (
                    <div className="w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-black text-white rounded-lg p-4 flex flex-col items-center">
                            <span className="text-lg font-bold">Users</span>
                            <span className="text-2xl">{stats.totalUsers}</span>
                        </div>
                        <div className="bg-black text-white rounded-lg p-4 flex flex-col items-center">
                            <span className="text-lg font-bold">Videos</span>
                            <span className="text-2xl">{stats.totalVideos}</span>
                        </div>
                        <div className="bg-black text-white rounded-lg p-4 flex flex-col items-center">
                            <span className="text-lg font-bold">Communities</span>
                            <span className="text-2xl">{stats.totalCommunities}</span>
                        </div>
                        <div className="bg-black text-white rounded-lg p-4 flex flex-col items-center">
                            <span className="text-lg font-bold">Revenue</span>
                            <span className="text-2xl">{stats.totalRevenue}</span>
                        </div>
                    </div>
                )}

                {/* Filter controls */}
                <div className="w-full max-w-4xl flex flex-col md:flex-row items-center gap-4 mb-6">
                    <div className="flex gap-2">
                        <button
                            className={`px-4 py-2 rounded font-semibold transition ${filterMode === 'all' ? 'bg-black text-white' : 'bg-white text-black border border-black hover:bg-black hover:text-white'}`}
                            onClick={() => { setFilterMode('all'); setDate(''); }}
                        >
                            All Users
                        </button>
                        <button
                            className={`px-4 py-2 rounded font-semibold transition ${filterMode === 'date' ? 'bg-black text-white' : 'bg-white text-black border border-black hover:bg-black hover:text-white'}`}
                            onClick={() => setFilterMode('date')}
                        >
                            By Date
                        </button>
                    </div>
                    {filterMode === 'all' && (
                        <div className="flex flex-1">
                            <input
                                type="text"
                                placeholder="Search by username or email"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 p-3 border border-black rounded-l bg-white text-black focus:outline-none"
                            />
                            <button
                                className="px-4 bg-black text-white rounded-r"
                                onClick={() => setPageNum(1)}
                            >
                                Search
                            </button>
                        </div>
                    )}
                    {filterMode === 'date' && (
                        <div className="flex flex-1 items-center gap-2">
                            <input
                                type="date"
                                value={date}
                                onChange={e => { setDate(e.target.value); setPageNum(1); }}
                                className="p-3 border border-black rounded bg-white text-black focus:outline-none"
                            />
                        </div>
                    )}
                </div>

                {/* Table */}
                <h1 className="font-bold text-2xl mb-4">Users</h1>
                {error && <div className="text-red-500 mb-4">{error}</div>}
                {loading ? (
                    <div className="text-center py-8">Loading...</div>
                ) : (
                    <div className="w-full max-w-6xl overflow-x-auto">
                        <table className="min-w-full border border-black rounded-lg bg-white shadow">
                            <thead>
                                <tr className="bg-black text-white">
                                    <th className="px-4 py-2 text-left">Username</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Created</th>
                                    <th className="px-4 py-2 text-left">Followers</th>
                                    <th className="px-4 py-2 text-left">Communities</th>
                                    <th className="px-4 py-2 text-left">Videos</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className="px-4 py-2 text-left">Email Verified</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr
                                      key={user._id}
                                      className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                                      onClick={() => router.push(`/users/${user._id}/transactions`)}
                                      title="View transactions"
                                    >
                                        <td className="px-4 py-2 font-semibold">{user.username}</td>
                                        <td className="px-4 py-2">{user.email}</td>
                                        <td className="px-4 py-2">{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{user.followers?.length || 0}</td>
                                        <td className="px-4 py-2">{user.my_communities?.length || 0}</td>
                                        <td className="px-4 py-2">{user.videoCount ?? '-'}</td>
                                        <td className="px-4 py-2">
                                            {user.account_status?.is_deactivated
                                                ? <span className="bg-red-100 text-red-700 px-2 py-1 rounded">Deactivated</span>
                                                : <span className="bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                                            }
                                        </td>
                                        <td className="px-4 py-2">
                                            {user.email_verification?.is_verified
                                                ? <span className="bg-black text-white px-2 py-1 rounded">Yes</span>
                                                : <span className="bg-gray-200 text-black px-2 py-1 rounded">No</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && (
                            <div className="text-gray-500 text-center py-8">No users found.</div>
                        )}
                    </div>
                )}

                {/* Pagination controls */}
                {pagination && (
                    <div className="flex items-center gap-2 mt-8">
                        <button
                            className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
                            disabled={pagination.page <= 1}
                            onClick={() => setPageNum(pageNum - 1)}
                        >
                            Prev
                        </button>
                        <span>
                            Page {pagination.page} of {pagination.pages}
                        </span>
                        <button
                            className="px-3 py-1 bg-black text-white rounded disabled:opacity-50"
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => setPageNum(pageNum + 1)}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default page;