'use client'
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { getAuthHeaders, logout } from '../../utils/authUtils';
import Image from 'next/image';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const router = useRouter();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  
  // Filter options
  const statusOptions = ['all', 'pending', 'reviewed', 'resolved', 'dismissed'];
  const contentTypeOptions = ['all', 'video', 'user', 'community', 'comment', 'series'];
  const reasonOptions = ['all', 'inappropriate_content', 'spam', 'harassment', 'copyright', 'hate_speech', 'violence', 'other'];

  const handleLogout = () => {
    logout(router);
  };

  const fetchReports = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit,
        status: statusFilter,
        content_type: contentTypeFilter,
        reason: reasonFilter
      });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/reports?${params.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Fetched reports data:', data);
      
      if (data.success) {
        setReports(data.reports || []);
        setPagination(data.pagination || null);
        setError('');
      } else {
        setError(data.message || 'Failed to fetch reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [page, statusFilter, contentTypeFilter, reasonFilter]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [reportId]: newStatus }));
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_STRMLY_BACKEND_URL}/report/${reportId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        fetchReports();
      } else {
        console.error('Error updating report status');
      }
    } catch (err) {
      console.error('Error updating report:', err);
    } finally {
      setTimeout(() => {
        setActionLoading(prev => ({ ...prev, [reportId]: null }));
      }, 1000);
    }
  };

  // Format dates consistently
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return dateString;
    }
  };
   const fixImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://strmly-videos-dev-mumbai-2.s3.ap-south-1.amazonaws.com/${url}`;
  };
 
  // UI Components
  const ReportItem = ({ report }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="border border-black rounded-lg p-6 bg-white shadow mb-6">
        {/* Report Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg">
              Report #{report._id.slice(-6)}
              <span className="ml-3 px-3 py-1 text-xs rounded-full bg-black text-white">
                {report.content_type.toUpperCase()}
              </span>
            </h3>
            <p className="text-sm text-gray-500">
              Reported {formatDate(report.createdAt)}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            report.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
            report.status === 'reviewed' ? 'bg-blue-200 text-blue-800' :
            report.status === 'resolved' ? 'bg-green-200 text-green-800' :
            'bg-gray-200 text-gray-800'
          }`}>
            {report.status.toUpperCase()}
          </span>
        </div>

        {/* Report Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Reporter & Reason Info */}
          <div className="space-y-3">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider font-bold">Reporter</span>
              <p className="text-sm">
                {report.reporter_id?.username} ({report.reporter_id?.email})
              </p>
            </div>
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider font-bold">Reason</span>
              <p className="text-sm font-medium capitalize">
                {report.reason.replace(/_/g, ' ')}
              </p>
            </div>
            {report.description && (
              <div className="mb-2">
                <span className="text-xs uppercase tracking-wider font-bold">Description</span>
                <p className="text-sm mt-1 bg-gray-100 p-3 rounded whitespace-pre-wrap">
                  {report.description}
                </p>
              </div>
            )}
          </div>
          
          {/* Reported Content */}
          <div className="space-y-3">
            <div className="mb-2">
              <span className="text-xs uppercase tracking-wider font-bold">
                Reported {report.content_type}
              </span>
              
              {/* Content details based on type */}
              {report.content_details ? (
                <div className="mt-2 p-3 border border-gray-300 rounded">
                  // Inside your ReportItem component, update the video rendering section:

{report.content_type === 'video' && (
  <>
    {report.content_details.videoUrl ? (
      <video
        width="100%"
        controls
        style={{ height: 'auto' }}
        src={report.content_details.videoUrl}
        preload="metadata"
      >
        Your browser does not support the video tag.
      </video>
    ) : (
      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded">
        <span className="text-gray-500">Video not available</span>
      </div>
    )}

    <p className="mt-2 font-medium">{report.content_details.name}</p>
    <p className="text-sm text-gray-600">
      By {report.content_details.created_by?.username}
    </p>
  </>
)}
                  
                  {report.content_type === 'comment' && (
                    <>
                      <p className="text-sm whitespace-pre-wrap">{report.content_details.content}</p>
                      <p className="mt-2 text-xs text-gray-600">
                        By {report.content_details.user?.username}
                      </p>
                    </>
                  )}
                  
                  {report.content_type === 'community' && (
                    <>
                      <div className="flex items-center">
                        
                        <div>
                          <p className="font-medium">{report.content_details.name}</p>
                          <p className="text-xs text-gray-600">
                            By {report.content_details.founder?.username}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm">{report.content_details.bio}</p>
                    </>
                  )}
                  
                  {report.content_type === 'series' && (
                    <>
                      <p className="mt-2 font-medium">{report.content_details.title}</p>
                      <p className="text-sm text-gray-600">
                        By {report.content_details.created_by?.username}
                      </p>
                    </>
                  )}
                  
                  {report.content_type === 'user' && (
                    <>
                      <div className="flex items-center">
                        
                        <div>
                          <p className="font-medium">{report.content_details.username}</p>
                          <p className="text-xs text-gray-600">{report.content_details.email}</p>
                          <p className={`text-xs mt-1 px-2 py-0.5 inline-block rounded ${
                            report.content_details.account_status?.is_deactivated ? 
                            'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {report.content_details.account_status?.is_deactivated ? 'Deactivated' : 'Active'}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-sm text-red-500 mt-1">Content details not available</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Evidence Images - Only render if there are images */}
        {report.evidence_images && report.evidence_images.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-xs uppercase tracking-wider font-bold mb-2 block">Evidence Images</span>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
              {report.evidence_images.map((img, idx) => (
                <div 
                  key={idx} 
                  className="relative h-40 bg-gray-100 rounded cursor-pointer"
                  onClick={() => window.open(img, '_blank')}
                >
                  <Image 
                    src={img} 
                    alt={`Evidence ${idx+1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="rounded object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
          <button onClick={()=>router.push('/video_copy')} className="hover:underline">Copyright Violations</button>
          <button onClick={()=>router.push('/nsfw')} className="hover:underline">NSFW Content</button>
          <button onClick={()=>router.push('/reports')} className="hover:underline underline">Reports</button>
          <button onClick={handleLogout} className="bg-white text-black px-3 py-1 rounded hover:bg-gray-200">Logout</button>
        </div>
      </nav>

      <div className="pt-20 px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold tracking-wide">Content Reports</h1>
            {isLoading && <span className="text-sm text-gray-500 font-mono">Loading...</span>}
          </div>

          {/* Filters */}
          <div className="mb-8 flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-black rounded bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Statuses' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Content Type</label>
              <select
                value={contentTypeFilter}
                onChange={e => { setContentTypeFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-black rounded bg-white"
              >
                {contentTypeOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All Content Types' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <select
                value={reasonFilter}
                onChange={e => { setReasonFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 border border-black rounded bg-white"
              >
                {reasonOptions.map(option => (
                  <option key={option} value={option}>
                    {option === 'all' 
                      ? 'All Reasons' 
                      : option.replace(/_/g, ' ').split(' ').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ')
                    }
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {error && (
            <div className="border border-red-500 text-red-600 rounded p-4 mb-6 bg-red-50">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {reports.length === 0 && !error && !isLoading && (
            <div className="text-center text-gray-500 py-16 border border-dashed border-gray-300 rounded-lg">
              <p className="text-lg mb-2">No reports found</p>
              <p className="text-sm">Try changing the filters to see more reports</p>
            </div>
          )}
          
          {/* Reports List */}
          <div className="space-y-8">
            {reports.map(report => (
              <ReportItem key={report._id} report={report} />
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