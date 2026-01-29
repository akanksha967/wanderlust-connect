import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, X, Loader2, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
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

const AdminPanelScreen = () => {
  const { setScreen } = useAppStore();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchRequests();
  }, [filter]);

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
      toast({
        title: 'Error',
        description: 'Failed to load access requests.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    setProcessing(requestId);
    try {
      const { error } = await supabase
        .from('access_requests')
        .update({ 
          status: newStatus,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: newStatus === 'approved' ? 'Access Granted' : 'Access Denied',
        description: `User has been ${newStatus}.`,
      });

      // Update local state
      setRequests(prev => 
        prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r)
      );
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status.',
        variant: 'destructive',
      });
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
          <p className="text-xs text-white/80">Manage access requests</p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-8 pt-24 relative z-10">
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
                  ? 'bg-gradient-to-r from-sky-400 to-indigo-400 text-white shadow-lg'
                  : 'bg-white/40 text-foreground/80 hover:bg-white/60'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-white/40 mb-3" />
              <p className="text-white/70">No {filter === 'all' ? '' : filter} requests</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-2xl bg-white/30 backdrop-blur-xl border border-white/40 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-foreground">{request.email}</p>
                    <p className="text-xs text-foreground/60">
                      {new Date(request.requested_at).toLocaleDateString()}
                    </p>
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
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-1" /> Approve
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-9 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-red-500/50 text-red-700"
                      onClick={() => handleUpdateStatus(request.id, 'rejected')}
                      disabled={processing === request.id}
                    >
                      {processing === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <X className="w-4 h-4 mr-1" /> Reject
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanelScreen;
