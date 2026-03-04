import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Loader2, Users, Clock, CheckCircle, XCircle, AlertTriangle, User, Eye } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AccessRequest {
  id: string;
  user_id: string;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  description: string | null;
  status: string | null;
  created_at: string;
  reporter_name?: string;
  reporter_photo?: string;
  reported_name?: string;
  reported_photo?: string;
}

const AdminPanelScreen = () => {
  const { setScreen } = useAppStore();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'access' | 'reports'>('access');

  // Access requests state
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportFilter, setReportFilter] = useState<'all' | 'pending' | 'reviewed'>('pending');

  useEffect(() => {
    if (activeTab === 'access') fetchRequests();
    else fetchReports();
  }, [filter, reportFilter, activeTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('access_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRequests((data || []).map(r => ({
        ...r,
        status: r.status as 'pending' | 'approved' | 'rejected',
      })));
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Error', description: 'Failed to load access requests.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportFilter === 'pending') {
        query = query.eq('status', 'pending');
      } else if (reportFilter === 'reviewed') {
        query = query.neq('status', 'pending');
      }

      const { data, error } = await query;
      if (error) throw error;

      const reportsList = data || [];
      
      // Fetch profile names and photos for reporters and reported users
      const profileIds = [...new Set(reportsList.flatMap(r => [r.reporter_id, r.reported_id]))];
      
      if (profileIds.length > 0) {
        const [profilesRes, photosRes] = await Promise.all([
          supabase.from('profiles').select('id, name').in('id', profileIds),
          supabase.from('photos').select('profile_id, url').in('profile_id', profileIds).eq('is_primary', true),
        ]);

        const nameMap = new Map((profilesRes.data || []).map(p => [p.id, p.name]));
        const photoMap = new Map((photosRes.data || []).map(p => [p.profile_id, p.url]));

        setReports(reportsList.map(r => ({
          ...r,
          reporter_name: nameMap.get(r.reporter_id) || 'Unknown',
          reporter_photo: photoMap.get(r.reporter_id),
          reported_name: nameMap.get(r.reported_id) || 'Unknown',
          reported_photo: photoMap.get(r.reported_id),
        })));
      } else {
        setReports(reportsList);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({ title: 'Error', description: 'Failed to load reports.', variant: 'destructive' });
    } finally {
      setReportsLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      toast({
        title: newStatus === 'approved' ? 'Access Granted' : 'Access Denied',
        description: `User has been ${newStatus}.`,
      });
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to update status.', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleDismissReport = async (reportId: string) => {
    setProcessing(reportId);
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'dismissed' })
        .eq('id', reportId);

      if (error) throw error;
      toast({ title: 'Report dismissed' });
      setReports(prev => prev.filter(r => r.id !== reportId));
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-700 text-xs">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
      case 'approved':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-700 text-xs">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-700 text-xs">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return null;
    }
  };

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden flex flex-col">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80)` }}
      />
      <div className="fixed inset-0 bg-gradient-to-br from-sky-300/45 via-blue-200/40 to-lavender-300/45" />
      <div className="fixed inset-0 backdrop-blur-sm" />

      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-6 left-6 right-6 z-50 flex items-center gap-3"
      >
        <button 
          onClick={() => setScreen('account')}
          className="h-11 w-11 rounded-full bg-white/40 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-all hover:bg-white/50"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="text-lg font-serif text-white drop-shadow-lg">Admin Panel</h1>
          <p className="text-xs text-white/80">Manage your community</p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-24 relative z-10">
        {/* Top Tabs: Access / Reports */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setActiveTab('access')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              activeTab === 'access'
                ? 'bg-white/40 backdrop-blur-xl border border-white/50 text-white shadow-lg'
                : 'bg-white/15 backdrop-blur-md border border-white/20 text-white/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Access
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-medium transition-all relative ${
              activeTab === 'reports'
                ? 'bg-white/40 backdrop-blur-xl border border-white/50 text-white shadow-lg'
                : 'bg-white/15 backdrop-blur-md border border-white/20 text-white/60'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Reports
          </button>
        </div>

        {activeTab === 'access' ? (
          <>
            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="p-4 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-center">
                <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                <p className="text-xs text-amber-600">Pending</p>
              </div>
              <div className="p-4 rounded-2xl bg-green-500/20 backdrop-blur-md border border-green-500/30 text-center">
                <p className="text-2xl font-bold text-green-700">{stats.approved}</p>
                <p className="text-xs text-green-600">Approved</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-center">
                <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                <p className="text-xs text-red-600">Rejected</p>
              </div>
            </motion.div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    filter === f
                      ? 'bg-white/40 backdrop-blur-xl text-white shadow-lg border border-white/50'
                      : 'bg-white/15 text-white/60 hover:bg-white/25 border border-white/20'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Requests List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 mx-auto text-white/40 mb-3" />
                  <p className="text-white/70">No {filter === 'all' ? '' : filter} requests</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="p-4 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white drop-shadow">{request.email}</p>
                        <p className="text-xs text-white/60">{new Date(request.requested_at).toLocaleDateString()}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    {request.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 h-9 rounded-xl bg-green-500 hover:bg-green-600 text-white"
                          onClick={() => handleUpdateStatus(request.id, 'approved')}
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Approve</>}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-200"
                          onClick={() => handleUpdateStatus(request.id, 'rejected')}
                          disabled={processing === request.id}
                        >
                          {processing === request.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" /> Reject</>}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          </>
        ) : (
          <>
            {/* Report Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {(['pending', 'reviewed', 'all'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setReportFilter(f)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    reportFilter === f
                      ? 'bg-white/40 backdrop-blur-xl text-white shadow-lg border border-white/50'
                      : 'bg-white/15 text-white/60 hover:bg-white/25 border border-white/20'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Reports List */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              {reportsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-white/60" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-12">
                  <AlertTriangle className="w-12 h-12 mx-auto text-white/40 mb-3" />
                  <p className="text-white/70">No {reportFilter === 'all' ? '' : reportFilter} reports</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report.id} className="p-4 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg">
                    {/* Reported User */}
                    <div className="flex items-center gap-3 mb-3">
                      {report.reported_photo ? (
                        <img src={report.reported_photo} alt="" className="w-11 h-11 rounded-xl object-cover border border-white/30" />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                          <User className="w-5 h-5 text-white/50" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white drop-shadow text-sm">{report.reported_name}</p>
                        <p className="text-xs text-white/50">Reported user</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        report.status === 'pending' 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-white/15 text-white/50'
                      }`}>
                        {report.status}
                      </span>
                    </div>

                    {/* Reason */}
                    <div className="mb-2 p-2.5 rounded-xl bg-white/10 border border-white/15">
                      <p className="text-xs text-white/40 mb-0.5">Reason</p>
                      <p className="text-sm text-white/90">{report.reason}</p>
                      {report.description && (
                        <p className="text-xs text-white/60 mt-1">{report.description}</p>
                      )}
                    </div>

                    {/* Reporter info & date */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {report.reporter_photo ? (
                          <img src={report.reporter_photo} alt="" className="w-6 h-6 rounded-full object-cover border border-white/20" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                            <User className="w-3 h-3 text-white/40" />
                          </div>
                        )}
                        <span className="text-xs text-white/50">by {report.reporter_name}</span>
                      </div>
                      <span className="text-xs text-white/40">
                        {new Date(report.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Actions */}
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/20 border-white/20 text-white/80"
                          onClick={() => handleDismissReport(report.id)}
                          disabled={processing === report.id}
                        >
                          {processing === report.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dismiss'}
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPanelScreen;