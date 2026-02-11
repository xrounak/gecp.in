import { useEffect, useState } from 'react';
import {
    Shield, Users,
    Search, Mail, User, Clock,
    Trash2, Filter, ChevronRight, BarChart
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminDashboard = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [clubs, setClubs] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('requests');
    const [loading, setLoading] = useState(true);


    const fetchData = async () => {
        setLoading(true);
        const { data: reqData } = await supabase
            .from('club_requests')
            .select('*')
            .order('created_at', { ascending: false });

        setRequests(reqData || []);

        const { data: clubData } = await supabase
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false });

        setClubs(clubData || []);
        setLoading(false);
    };

    const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
        let notes = '';
        if (action === 'rejected') {
            notes = window.prompt('Institutional Decline Note: Please provide a reason for the candidate to review.') || '';
            if (notes === null) return; // User cancelled
        }

        const { error: updateError } = await supabase
            .from('club_requests')
            .update({
                status: action,
                reviewed_at: new Date().toISOString(),
                reviewed_by: (await supabase.auth.getUser()).data.user?.id,
                review_notes: notes
            })
            .eq('id', requestId);

        if (!updateError) {
            if (action === 'approved') {
                const req = requests.find(r => r.id === requestId);
                if (req) {
                    // 1. Create the club
                    const slug = req.club_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const { data: newClub, error: clubError } = await supabase
                        .from('clubs')
                        .insert([{
                            name: req.club_name,
                            slug: slug,
                            category: req.category,
                            short_description: req.description,
                            website_url: req.website_url,
                            social_facebook: req.social_facebook,
                            social_instagram: req.social_instagram,
                            social_twitter: req.social_twitter,
                            email: req.contact_email,
                            is_verified: true,
                            created_by: req.requested_by
                        }])
                        .select()
                        .single();

                    if (!clubError && newClub && req.requested_by) {
                        // 2. Assign requester as Club Admin
                        await supabase
                            .from('club_members')
                            .insert([{
                                club_id: newClub.id,
                                user_id: req.requested_by,
                                is_admin: true
                            }]);
                    }
                }
            }
            fetchData();
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-govt-light flex items-center justify-center p-8">
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 border-4 border-govt-blue border-t-govt-accent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-sm font-black text-govt-dark uppercase tracking-[0.2em]">Institutional Authentication</h2>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest italic">Vetting records in progress...</p>
            </div>
        </div>
    );

    return (
        <div className="bg-govt-light min-h-screen flex">
            {/* Admin Sidebar */}
            <aside className="w-72 glass-dark text-white p-8 sticky top-0 h-screen flex flex-col gap-10 shadow-2xl z-20">
                <div className="border-b border-white/10 pb-6 relative group">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-govt-accent/10 rounded-full blur-xl group-hover:bg-govt-accent/20 transition-all"></div>
                    <h3 className="font-extrabold flex items-center gap-3 uppercase tracking-[0.15em] text-xs relative z-10">
                        <Shield size={20} className="text-govt-accent" />
                        Command Center
                    </h3>
                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-2 tracking-widest pl-8 opacity-60">Level 4 Oversight</p>
                </div>

                <nav className="flex flex-col gap-3">
                    {[
                        { id: 'requests', icon: <Clock size={16} />, label: 'Approval Queue', count: requests.filter(r => r.status === 'pending').length },
                        { id: 'clubs', icon: <Users size={16} />, label: 'Active Registry', count: clubs.length },
                        { id: 'audit', icon: <BarChart size={16} />, label: 'Audit Logs', count: 0 },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center justify-between px-5 py-3.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${activeTab === item.id ? 'bg-govt-accent text-govt-dark shadow-2xl scale-[1.02]' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                        >
                            <span className="flex items-center gap-4 z-10">{item.icon} {item.label}</span>
                            {item.count > 0 && <span className={`px-2 py-0.5 rounded-full text-[9px] z-10 ${activeTab === item.id ? 'bg-govt-dark/10' : 'bg-white/10'}`}>{item.count}</span>}
                            {activeTab === item.id && <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-0 transition-transform"></div>}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/10">
                    <button className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-sm text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-950/30 transition-all">
                        <Trash2 size={16} /> Global Reset
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow p-12 overflow-y-auto">
                <header className="flex justify-between items-end mb-16 animate-fade-up">
                    <div className="space-y-2">
                        <nav className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            <span>Admin Console</span>
                            <ChevronRight size={12} className="text-govt-accent" />
                            <span className="text-govt-dark">{activeTab === 'requests' ? 'Vetting Queue' : 'Registry Management'}</span>
                        </nav>
                        <h2 className="text-4xl font-black text-govt-dark uppercase tracking-tight leading-none italic">
                            Institutional <span className="text-govt-blue">Oversight</span>
                        </h2>
                    </div>
                    <div className="glass px-8 py-4 flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Session Protocol</p>
                            <p className="text-xs font-black text-govt-dark uppercase tracking-widest italic">Root_Admin_2026</p>
                        </div>
                        <div className="h-10 w-10 govt-gradient rounded-full flex items-center justify-center text-white shadow-xl">
                            <User size={20} />
                        </div>
                    </div>
                </header>

                {activeTab === 'requests' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="grid grid-cols-1 gap-6">
                            {requests.length > 0 ? (
                                requests.map(req => (
                                    <div key={req.id} className="card-premium p-8 flex flex-col md:flex-row items-center justify-between gap-10 hover:shadow-2xl transition-all border-l-4 border-l-govt-accent">
                                        <div className="md:w-3/5 space-y-4">
                                            <div className="flex items-center gap-4">
                                                <h4 className="text-xl font-black text-govt-dark uppercase tracking-tight">{req.club_name}</h4>
                                                <span className={`text-[9px] font-black px-3 py-1 rounded-sm uppercase tracking-[0.2em] shadow-sm ${req.status === 'pending' ? 'bg-orange-50 text-orange-600 border border-orange-200 animate-pulse' : 'bg-green-50 text-green-600 border border-green-200'}`}>
                                                    {req.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-400 font-medium leading-relaxed italic line-clamp-2">
                                                "{req.description || 'No organizational statement provided.'}"
                                            </p>
                                            <div className="flex flex-wrap gap-8 pt-2">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Primary Liaison</p>
                                                    <p className="text-[11px] font-black text-govt-dark flex items-center gap-2"><User size={14} className="text-govt-blue" /> {req.contact_name}</p>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">System Endpoint</p>
                                                    <p className="text-[11px] font-black text-govt-dark flex items-center gap-2"><Mail size={14} className="text-govt-blue" /> {req.contact_email}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 shrink-0">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'approved')}
                                                        className="btn-govt-primary min-w-[140px] shadow-lg"
                                                    >
                                                        Validate
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'rejected')}
                                                        className="btn-govt-outline text-red-500 border-red-100 hover:bg-red-50 min-w-[140px]"
                                                    >
                                                        Decline
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="px-10 py-3 bg-govt-light border border-govt-border rounded-sm text-[10px] font-black text-gray-300 uppercase tracking-widest italic">
                                                    Dossier Sealed
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="card-premium py-32 text-center border-dashed border-2 bg-white/50 animate-fade-in">
                                    <div className="flex justify-center mb-6 text-gray-200">
                                        <Clock size={80} />
                                    </div>
                                    <h4 className="text-xl font-black text-govt-dark uppercase tracking-[0.2em] italic">Queue Depleted</h4>
                                    <p className="text-gray-400 text-xs mt-3 max-w-sm mx-auto font-medium">There are currently no student chapter applications awaiting institutional vetting.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'clubs' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className="card-premium p-4 flex items-center justify-between border-b-4 border-b-govt-blue">
                            <div className="flex items-center gap-5 flex-grow px-4">
                                <Search size={22} className="text-govt-blue opacity-50" />
                                <input type="text" placeholder="Filter active institutional repositories by identity or category..." className="w-full outline-none bg-transparent text-sm font-black text-govt-dark placeholder:text-gray-300" />
                            </div>
                            <button className="flex items-center gap-2 text-[10px] font-black text-govt-blue uppercase tracking-widest px-6 h-full border-l border-govt-border">
                                <Filter size={16} /> Advanced Query
                            </button>
                        </div>

                        <div className="card-premium overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="govt-gradient text-white text-[9px] font-black uppercase tracking-[0.25em]">
                                    <tr>
                                        <th className="px-8 py-6">Entity Identity</th>
                                        <th className="px-8 py-6">Vetting Status</th>
                                        <th className="px-8 py-6">Category</th>
                                        <th className="px-8 py-6">Link</th>
                                        <th className="px-8 py-6 text-right">Moderation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-govt-border text-[11px] font-bold text-gray-600 bg-white">
                                    {clubs.map(club => (
                                        <tr key={club.id} className="hover:bg-govt-light/50 group transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 bg-govt-light rounded-sm border border-govt-border flex items-center justify-center p-1.5 group-hover:border-govt-blue transition-colors">
                                                        {club.logo_url ? <img src={club.logo_url} className="max-h-full grayscale group-hover:grayscale-0" /> : <Users size={18} className="text-gray-300" />}
                                                    </div>
                                                    <span className="font-black text-govt-dark uppercase tracking-tight">{club.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {club.is_verified ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                                        <span className="text-green-600 uppercase tracking-widest text-[9px] font-black">Authorized</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                        <span className="text-orange-500 uppercase tracking-widest text-[9px] font-black">In Review</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-govt-blue uppercase tracking-widest text-[9px] font-black opacity-60 group-hover:opacity-100 transition-opacity">{club.category}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <a href={club.website_url} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-govt-blue transition-colors">
                                                    <Search size={16} />
                                                </a>
                                            </td>
                                            <td className="px-8 py-5 text-right space-x-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button className="p-2 text-govt-blue hover:scale-125 transition-transform"><Shield size={18} /></button>
                                                <button className="p-2 text-red-400 hover:scale-125 transition-transform"><Trash2 size={18} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};


export default AdminDashboard;
