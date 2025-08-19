

'use client'
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';

export default function VideoCopyrightViolations() {
  const [violations, setViolations] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [page, setPage] = useState(1);
  const router = useRouter();

  const handleLogout = () => {
    if (typeof window !== 'undefined') localStorage.removeItem('token');
    router.push('/login');
  };

  const fetchViolations = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      // Use the actual API endpoint with pagination
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/auto-copyright-violations?page=${page}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setViolations(data.violations || []);
        setStats(data.statistics || null);
        setPagination(data.pagination || null);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch copyright violations');
      }
    } catch (err) {
      console.error('Error fetching violations:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check authentication
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
    }

    fetchViolations();
  }, [page, router]);

  const handleDeleteVideo = async (videoId, violationId) => {
    if (!videoId) {
      console.error('Cannot delete: Video ID is undefined');
      setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 3000);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [violationId]: 'deleting' }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/video/${videoId}?type=copy`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log(`Successfully deleted video ${videoId}`);
        // Fetch updated violations instead of manipulating the state
        fetchViolations();
      } else {
        console.error('Error deleting video:', data.message);
        setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
        setTimeout(() => {
          setActionLoading(prev => ({ ...prev, [violationId]: null }));
        }, 3000);
      }
    } catch (err) {
      console.error('Error deleting video:', err);
      setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 3000);
    } finally {
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 1000);
    }
  };

  const handleIgnoreViolation = async (videoId, violationId) => {
    if (!videoId) {
      console.error('Cannot ignore: Video ID is undefined');
      setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 3000);
      return;
    }
    
    setActionLoading(prev => ({ ...prev, [violationId]: 'ignoring' }));
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/video/${videoId}/ignore/copy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await res.json();
      
      if (res.ok) {
        console.log(`Successfully ignored violation for video ${videoId}`);
        // Fetch updated violations instead of manipulating the state
        fetchViolations();
      } else {
        console.error('Error ignoring violation:', data.message);
        setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
        setTimeout(() => {
          setActionLoading(prev => ({ ...prev, [violationId]: null }));
        }, 3000);
      }
    } catch (err) {
      console.error('Error ignoring violation:', err);
      setActionLoading(prev => ({ ...prev, [violationId]: 'error' }));
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 3000);
    } finally {
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [violationId]: null }));
      }, 1000);
    }
  };

  const getFormattedDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };

  // Function to fix S3 URLs if needed
  const fixVideoUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://test-strmly-adithya.s3.ap-south-1.amazonaws.com/${url}`;
  };

  // Action button component
  const ActionButton = ({ onClick, loading, icon, text, color, loadingText }) => (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded text-sm flex items-center gap-1 ${color} transition-all ${loading ? 'opacity-70' : 'hover:opacity-80'}`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {icon}
          {text}
        </>
      )}
    </button>
  );

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
          <button onClick={()=>router.push('/withdrawals')} className="hover:underline">Withdrawals</button>
          <button onClick={()=>router.push('/video_copy')} className="hover:underline underline">Copyright Violations</button>
          <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>

      <div className="pt-20 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-wide">Video Copyright Violations</h1>
            {isLoading && <span className="text-sm text-gray-500 font-mono">Loading...</span>}
          </div>
          
          {/* Statistics */}
          {stats && (
            <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-black rounded-lg p-4 bg-black text-white shadow-sm">
                <span className="text-xs uppercase tracking-wide">Total Violations</span>
                <div className="text-2xl font-mono mt-1">{stats.totalViolations}</div>
              </div>
              
              {stats.typeStats?.map((stat, idx) => (
                <div key={idx} className="border border-black rounded-lg p-4 bg-white shadow-sm">
                  <span className="text-xs uppercase tracking-wide">
                    {stat._id?.type || 'Unknown Type'}
                  </span>
                  <div className="text-2xl font-mono mt-1">{stat.count}</div>
                </div>
              ))}
            </div>
          )}
          
          {error && (
            <div className="border border-red-500 text-red-600 rounded p-4 mb-6 bg-red-50">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {violations.length === 0 && !error && !isLoading && (
            <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
              <p className="text-lg mb-2">No copyright violations detected</p>
              <p className="text-sm">All uploaded videos appear to be original content.</p>
            </div>
          )}
          
          <div className="space-y-8">
            {violations.map(violation => (
              <div key={violation.id} className="border border-black rounded-lg p-6 bg-white shadow">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-bold text-lg text-red-600">🚨 Copyright Violation</h3>
                  <span className="px-3 py-1 bg-black text-white text-xs rounded-full">
                    {violation.fingerprintType?.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Violation ID & Date */}
                <div className="text-xs text-gray-500 mb-4">
                  <div>Violation ID: <span className="font-mono">{violation.id}</span></div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Flagged Video Section */}
                  <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-red-700">Flagged Video</h4>
                    
                    <div className="mb-4">
                      {violation.flaggedVideo?.videoUrl ? (
                        <video 
                          controls 
                          src={fixVideoUrl(violation.flaggedVideo.videoUrl)} 
                          className="w-full max-w-md border border-gray-300 rounded"
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full max-w-md h-40 border border-gray-300 rounded flex items-center justify-center text-gray-500">
                          Video URL not available
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {violation.flaggedVideo?.name || 'Untitled'}</p>
                      <p><strong>Uploaded:</strong> {getFormattedDate(violation.flaggedVideo?.uploadedAt)}</p>
                      <p><strong>Video ID:</strong> <span className="font-mono text-xs">{violation.flaggedVideo?.id}</span></p>
                      <p><strong>Uploader:</strong> {violation.flaggedVideoOwner?.username} ({violation.flaggedVideoOwner?.email})</p>
                    </div>
                  </div>
                  
                  {/* Matched Video Section */}
                  <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-blue-700">Original Video</h4>
                    
                    <div className="mb-4">
                      {violation.matchedVideo?.videoUrl ? (
                        <video 
                          controls 
                          src={fixVideoUrl(violation.matchedVideo.videoUrl)} 
                          className="w-full max-w-md border border-gray-300 rounded"
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full max-w-md h-40 border border-gray-300 rounded flex items-center justify-center text-gray-500">
                          Video URL not available
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {violation.matchedVideo?.name || 'Untitled'}</p>
                      <p><strong>Uploaded:</strong> {getFormattedDate(violation.matchedVideo?.uploadedAt)}</p>
                      <p><strong>Video ID:</strong> <span className="font-mono text-xs">{violation.matchedVideo?.id}</span></p>
                    </div>
                  </div>
                </div>
                
                {/* Fingerprint Information */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-xs uppercase tracking-wide mb-2">Fingerprint Information</h4>
                  <div className="text-xs font-mono break-all bg-gray-100 p-2 rounded">
                    {violation.flaggedVideo?.fingerprint || 'No fingerprint data available'}
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end gap-3">
                  {actionLoading[violation.id] === 'error' ? (
                    <div className="text-red-500 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      Action failed. Please try again.
                    </div>
                  ) : violation.actionTaken && violation.actionTaken !== "none" ? (
                    <div className="text-green-600 text-sm flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Action taken: <span className="font-semibold ml-1 capitalize">{violation.actionTaken}</span>
                    </div>
                  ) : (
                    <>
                      <ActionButton 
                        onClick={() => handleIgnoreViolation(violation.flaggedVideo?.id, violation.id)}
                        loading={actionLoading[violation.id] === 'ignoring'}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" />
                          </svg>
                        }
                        text="Ignore"
                        color="bg-gray-700 text-white"
                        loadingText="Ignoring..."
                      />
                      <ActionButton 
                        onClick={() => handleDeleteVideo(violation.flaggedVideo?.id, violation.id)}
                        loading={actionLoading[violation.id] === 'deleting'}
                        icon={
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        }
                        text="Delete Video"
                        color="bg-red-600 text-white"
                        loadingText="Deleting..."
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center items-center mt-8 gap-4">
              <button 
                onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                disabled={page === 1 || isLoading}
                className="px-4 py-2 border border-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <span className="text-sm">
                Page {pagination.page} of {pagination.pages}
              </span>
              
              <button 
                onClick={() => setPage(prev => Math.min(prev + 1, pagination.pages))}
                disabled={page === pagination.pages || pagination.pages === 0 || isLoading}
                className="px-4 py-2 border border-black rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
            
