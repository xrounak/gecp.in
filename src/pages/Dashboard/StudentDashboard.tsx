import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    User, Book, Award, Clock, ArrowRight,
    CheckCircle, XCircle, AlertCircle, PlusCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

const StudentDashboard = () => {
    const { profile } = useAuth();
    const [myRequests, setMyRequests] = useState<any[]>([]);
    const [myMemberships, setMyMemberships] = useState<any[]>([]);
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

            // 2. Fetch Active Memberships
            const { data: memberships } = await supabase
                .from('club_members')
                .select('*, clubs(*)')
                .eq('user_id', profile.user_id);

            setMyRequests(requests || []);
            setMyMemberships(memberships || []);
            setLoading(false);
        };

        fetchDashboardData();
    }, [profile]);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved': return <CheckCircle size={16} className="text-green-500" />;
            case 'rejected': return <XCircle size={16} className="text-red-500" />;
            default: return <Clock size={16} className="text-yellow-500" />;
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
                            <span className="bg-govt-accent text-govt-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
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
                                        <Link
                                            key={m.id}
                                            to={`/club/${m.clubs?.slug}`}
                                            className="group border border-govt-border p-5 rounded-sm hover:border-govt-blue transition-all bg-white hover:shadow-xl flex items-center justify-between"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-black text-govt-dark group-hover:text-govt-blue transition-colors line-clamp-1 uppercase tracking-tight">
                                                    {m.clubs?.name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black bg-govt-light px-2 py-0.5 rounded text-govt-blue uppercase tracking-widest">
                                                        {m.is_admin ? 'Admin' : 'Member'}
                                                    </span>
                                                    {m.is_admin && (
                                                        <Link
                                                            to="/dashboard/club_admin"
                                                            className="text-[9px] font-black text-govt-accent uppercase tracking-widest hover:underline underline-offset-2"
                                                        >
                                                            Manage Feed
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="text-gray-300 group-hover:text-govt-blue transition-colors" size={20} />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center text-gray-400 bg-gray-50/30 border border-dashed rounded-sm font-bold uppercase tracking-widest text-[10px]">
                                    No active chapter affiliations found.
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

const ChevronRight = ({ className, size }: { className?: string, size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size || 24}
        height={size || 24}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m9 18 6-6-6-6" />
    </svg>
);

export default StudentDashboard;
