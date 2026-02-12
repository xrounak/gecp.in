import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User, Book, Award, Clock, ArrowRight,
    CheckCircle, XCircle, AlertCircle, PlusCircle,
    ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getUserNotifications } from '../../lib/notifications';

const StudentDashboard = () => {
    const { profile } = useAuth();
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [myMemberships, setMyMemberships] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!profile?.user_id) return;

            // 1. Fetch Club Requests
            const { data: requests } = await supabase
                .from('club_requests')
                .select('*')
                .eq('requested_by', profile.user_id)
                .order('created_at', { ascending: false });

            // 2. Fetch All Memberships (Active, Pending, Rejected)
            const { data: memberships } = await supabase
                .from('club_members')
                .select('*, clubs(*)')
                .eq('user_id', profile.user_id)
                .order('created_at', { ascending: false });

            setMyRequests(requests || []);
            setMyMemberships(memberships || []);

            // 3. Fetch Notifications
            const { data: notifs } = await getUserNotifications(profile.user_id, 20);
            setNotifications(notifs || []);

            setLoading(false);
        };

        fetchDashboardData();
    }, [profile]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
            case 'active': return <CheckCircle size={16} className="text-green-500" />;
            case 'rejected': return <XCircle size={16} className="text-red-500" />;
            case 'pending': return <Clock size={16} className="text-yellow-500" />;
            default: return <AlertCircle size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="bg-govt-light min-h-screen pb-20">
            {/* Header / Profile Summary */}
            <div className="govt-gradient text-white pt-16 pb-24">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center gap-8">
                    <div className="h-32 w-32 bg-white/10 backdrop-blur-md rounded-full border-4 border-white/20 p-2 flex items-center justify-center relative group">
                        <div className="absolute inset-0 bg-govt-accent/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <User size={64} className="text-white/80" />
                    </div>
                    <div className="text-center md:text-left space-y-2">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <h1 className="text-4xl font-black uppercase tracking-tight italic">
                                {profile?.full_name || 'Student Portal'}
                            </h1>
                            <span className="bg-govt-accent text-govt-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest relative">
                                <span className="absolute -inset-0.5 bg-govt-accent rounded-full animate-ping opacity-20"></span>
                                Institutional User
                            </span>
                        </div>
                        <p className="text-white/60 font-medium italic max-w-xl">
                            "Excellence is not an act, but a habit." Welcome to your central institutional workspace, student identity index.
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="max-w-7xl mx-auto px-4 -mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Stats & Quick Actions */}
                    <div className="space-y-6">
                        <div className="card-premium p-8 border-t-4 border-govt-blue">
                            <h3 className="text-sm font-black text-govt-dark uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <AlertCircle size={18} className="text-govt-accent" /> Identity Stats
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-govt-light p-4 rounded border-l-4 border-govt-blue">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Active Memberships</span>
                                    <span className="text-xl font-black text-govt-dark">{myMemberships.length}</span>
                                </div>
                                <div className="flex justify-between items-center bg-govt-light p-4 rounded border-l-4 border-govt-blue">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Registry Requests</span>
                                    <span className="text-xl font-black text-govt-dark">{myRequests.length}</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass-dark text-white p-8 rounded-sm shadow-2xl space-y-6">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                <PlusCircle size={18} className="text-govt-accent" /> Actions
                            </h3>
                            <button
                                onClick={() => navigate('/register-club')}
                                className="w-full btn-govt-primary !bg-govt-accent !text-govt-dark font-black tracking-widest py-4 text-xs"
                            >
                                START CLUB ONBOARDING
                            </button>
                            <button
                                onClick={() => navigate('/directory')}
                                className="w-full btn-govt-outline py-4 text-xs tracking-widest border-white/20 text-white hover:bg-white/10"
                            >
                                EXPLORE REGISTRY
                            </button>
                        </div>
                    </div>

                    {/* RIGHT: Major Sections */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Club Onboarding Status */}
                        <div className="card-premium p-10">
                            <div className="flex items-center justify-between mb-8 border-b border-govt-border pb-4">
                                <h3 className="text-xl font-black text-govt-dark uppercase tracking-tight flex items-center gap-3">
                                    <Clock className="text-govt-accent" size={24} /> Application Registry
                                </h3>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Synchronized Real-time</div>
                            </div>

                            {loading ? (
                                <div className="space-y-4 animate-pulse">
                                    {[1, 2].map(i => <div key={i} className="h-20 bg-gray-50 rounded border border-dashed"></div>)}
                                </div>
                            ) : myRequests.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-govt-border">
                                                <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Club Entity</th>
                                                <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Protocol Status</th>
                                                <th className="py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Initiated</th>
                                                <th className="py-4 text-right"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {myRequests.map(req => (
                                                <tr key={req.id} className="group hover:bg-govt-light transition-colors">
                                                    <td className="py-5">
                                                        <div className="font-extrabold text-govt-dark uppercase tracking-tight">{req.club_name}</div>
                                                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{req.category}</div>
                                                    </td>
                                                    <td className="py-5 text-center">
                                                        <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-govt-border shadow-sm">
                                                            {getStatusIcon(req.status)}
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-govt-dark">
                                                                {req.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                        {new Date(req.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-5 text-right">
                                                        <button className="text-govt-blue hover:text-govt-accent transition-colors">
                                                            <ArrowRight size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="py-20 text-center space-y-6 border border-dashed border-gray-200 rounded-sm bg-gray-50/50">
                                    <Book className="mx-auto text-gray-300" size={48} />
                                    <div className="space-y-2">
                                        <p className="text-sm font-extrabold text-govt-dark uppercase tracking-[0.15em]">Registry is Empty</p>
                                        <p className="text-xs text-gray-400 font-medium italic">You haven't initiated any club onboarding protocols yet.</p>
                                    </div>
                                    <button
                                        onClick={() => navigate('/register-club')}
                                        className="text-govt-blue text-xs font-black uppercase tracking-widest hover:underline"
                                    >
                                        Establish New Club Body
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Active Memberships */}
                        <div className="card-premium p-10">
                            <div className="flex items-center justify-between mb-8 border-b border-govt-border pb-4">
                                <h3 className="text-xl font-black text-govt-dark uppercase tracking-tight flex items-center gap-3">
                                    <Award className="text-govt-accent" size={24} /> Chapter Credentials
                                </h3>
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verified Roles</div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
                                    {[1, 2].map(i => <div key={i} className="h-24 bg-gray-50 rounded border border-dashed"></div>)}
                                </div>
                            ) : myMemberships.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {myMemberships.map(m => (
                                        <div
                                            key={m.id}
                                            className={`group border p-6 rounded-sm transition-all bg-white hover:shadow-2xl flex flex-col gap-4 relative overflow-hidden ${m.status === 'active' ? 'border-govt-border hover:border-govt-blue' :
                                                m.status === 'rejected' ? 'border-red-100 bg-red-50/10 opacity-75' :
                                                    'border-yellow-100 animate-pulse-subtle'
                                                }`}
                                        >
                                            {m.status === 'active' && <div className="absolute top-0 right-0 w-16 h-16 bg-govt-blue/5 -mr-8 -mt-8 rotate-45 group-hover:bg-govt-blue/10 transition-colors"></div>}

                                            <div className="flex justify-between items-start relative z-10">
                                                <div className="space-y-1">
                                                    <h4 className="font-black text-govt-dark group-hover:text-govt-blue transition-colors uppercase tracking-tight text-lg">
                                                        {m.clubs?.name}
                                                    </h4>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] italic">{m.clubs?.slug}</p>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    {m.status === 'active' ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-govt-blue text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                            <CheckCircle size={10} className="text-govt-accent" /> Active Affiliation
                                                        </span>
                                                    ) : m.status === 'rejected' ? (
                                                        <span className="inline-flex items-center gap-1.5 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                            <XCircle size={10} /> Registry Denied
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 bg-yellow-400 text-govt-dark text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                                            <Clock size={10} /> Pending Authorization
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-govt-border/30 relative z-10">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-[0.15em] ${m.is_admin ? 'bg-govt-dark text-govt-accent border border-govt-accent/30' : 'bg-govt-light text-govt-blue border border-govt-blue/10'}`}>
                                                        {m.is_admin ? 'Level 2: Admin' : 'Level 1: Regular'}
                                                    </span>
                                                    {m.is_admin && m.status === 'active' && (
                                                        <Link
                                                            to="/dashboard/club_admin"
                                                            className="text-[9px] font-black text-govt-blue uppercase tracking-widest hover:text-govt-accent transition-colors flex items-center gap-1 group/link"
                                                        >
                                                            Registry Console <ArrowRight size={10} className="group-hover/link:translate-x-1 transition-transform" />
                                                        </Link>
                                                    )}
                                                </div>
                                                {m.status === 'active' && (
                                                    <Link to={`/club/${m.clubs?.slug}`} className="p-2 bg-govt-light text-govt-blue rounded hover:bg-govt-blue hover:text-white transition-all">
                                                        <ChevronRight size={16} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center text-gray-400 bg-gray-50/30 border border-dashed rounded-sm font-bold uppercase tracking-widest text-[10px]">
                                    No active chapter affiliations found.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="lg:col-span-3">
                        <div className="card-premium p-8 border-t-4 border-govt-accent">
                            <h3 className="text-sm font-black text-govt-dark uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <CheckCircle size={18} className="text-govt-accent" /> Recent Notifications
                            </h3>
                            {notifications.length > 0 ? (
                                <div className="space-y-3">
                                    {notifications.map((notif: any) => (
                                        <Link
                                            key={notif.id}
                                            to={notif.redirect_url || '#'}
                                            className="block bg-govt-light p-5 rounded border-l-4 border-govt-blue hover:border-govt-accent hover:shadow-lg transition-all group"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-grow">
                                                    <h4 className="text-sm font-black text-govt-dark uppercase tracking-tight group-hover:text-govt-accent transition-colors">
                                                        {notif.title}
                                                    </h4>
                                                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                                                        {notif.body}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                                            {notif.clubs?.name || 'System'}
                                                        </span>
                                                        <span className="text-[9px] text-gray-300">•</span>
                                                        <span className="text-[9px] font-medium text-gray-400">
                                                            {new Date(notif.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ArrowRight size={16} className="text-govt-blue group-hover:text-govt-accent group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center text-gray-400 bg-gray-50/30 border border-dashed rounded-sm font-bold uppercase tracking-widest text-[10px]">
                                    No notifications at this time.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
