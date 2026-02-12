import { useEffect, useState } from 'react';
import {
    Shield, Users,
    Search, Mail, User, Clock,
    Trash2, Filter, ChevronRight, BarChart, RotateCcw, Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { createNotification } from '../../lib/notifications';

const AdminDashboard = () => {
    const [requests, setRequests] = useState<any[]>([]);
    const [clubs, setClubs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalClubs: 0,
        totalMembers: 0,
        totalEvents: 0,
        pendingRequests: 0
    });
    const [activeTab, setActiveTab] = useState('requests');
    const [loading, setLoading] = useState(true);


    const fetchData = async () => {
        setLoading(true);
        // 1. Fetch Requests
        const { data: reqData } = await supabase
            .from('club_requests')
            .select('*')
            .order('created_at', { ascending: false });

        setRequests(reqData || []);

        // 2. Fetch Clubs
        const { data: clubData } = await supabase
            .from('clubs')
            .select('*')
            .order('created_at', { ascending: false });

        setClubs(clubData || []);

        // 3. Fetch Global Stats (Parallel for performance)
        const [membersRes, eventsRes] = await Promise.all([
            supabase.from('club_members').select('user_id', { count: 'exact', head: true }),
            supabase.from('events').select('id', { count: 'exact', head: true })
        ]);

        setStats({
            totalClubs: clubData?.length || 0,
            totalMembers: membersRes.count || 0,
            totalEvents: eventsRes.count || 0,
            pendingRequests: reqData?.filter(r => r.status === 'pending').length || 0
        });

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

        if (updateError) {
            console.error('Error updating request status:', updateError);
            alert('Failed to update request status: ' + updateError.message);
            return;
        }

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

                if (clubError) {
                    console.error('Error creating club:', clubError);
                    alert('Failed to create club record: ' + clubError.message);
                    return;
                }

                if (newClub && req.requested_by) {
                    // 2. Assign requester as Club Admin in the club_members table
                    const { error: memberError } = await supabase
                        .from('club_members')
                        .insert([{
                            club_id: newClub.id,
                            user_id: req.requested_by,
                            is_admin: true
                        }]);

                    if (memberError) {
                        console.error('Error assigning member:', memberError);
                        alert('Club created, but failed to assign administrator: ' + memberError.message);
                    }

                    // 3. Promote User Role to 'club_admin' globally
                    const { data: adminRole } = await supabase
                        .from('roles')
                        .select('id')
                        .eq('slug', 'club_admin')
                        .single();

                    if (adminRole) {
                        // Use atomic upsert to handle both new profiles and existing profile updates
                        // This bypasses the need for a prior SELECT and prevents 23505 (duplicate key) errors
                        const { error: syncError } = await supabase
                            .from('profiles')
                            .upsert({
                                user_id: req.requested_by,
                                email: req.contact_email,
                                role_id: adminRole.id
                            }, {
                                onConflict: 'user_id',
                                ignoreDuplicates: false // We must overwrite role_id to ensure they are promoted
                            });

                        if (syncError) {
                            console.error('Institutional Identity Sync Error:', syncError);
                            alert('Credential Sync Failed: ' + syncError.message);
                        } else {
                            alert('Institutional Identity Verified: User has been synchronized as Club Admin.');

                            // Notify user about club approval and admin promotion
                            await createNotification({
                                userId: req.requested_by,
                                clubId: newClub.id,
                                type: 'notification_club_approved',
                                title: 'Club Registration Approved',
                                message: `Congratulations! Your club "${req.club_name}" has been approved and you have been promoted to Club Admin.`,
                                link: `/dashboard/club/${newClub.id}`
                            });
                        }
                    }
                }
            }
        } else if (action === 'rejected') {
            // Notify user about club rejection
            const req = requests.find(r => r.id === requestId);
            if (req && req.requested_by) {
                await createNotification({
                    userId: req.requested_by,
                    clubId: req.requested_by, // Use user_id as placeholder since no club exists
                    type: 'notification_club_rejected',
                    title: 'Club Registration Declined',
                    message: `Your club registration for "${req.club_name}" was declined. ${notes ? `Reason: ${notes}` : ''}`,
                    link: '/register-club'
                });
            }
        }
        fetchData();
    };

    const handleResetRequest = async (requestId: string) => {
        if (!window.confirm('Institutional Reversion: This will purge the associated club record and members. Proceed?')) return;

        const req = requests.find(r => r.id === requestId);
        if (!req) return;

        // 1. Find the club to delete
        const slug = req.club_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const { data: clubToDelete } = await supabase
            .from('clubs')
            .select('id')
            .eq('slug', slug)
            .maybeSingle();

        if (clubToDelete) {
            // 2. Cascade delete (members first if RLS requires, though club delete should cascade if configured)
            await supabase.from('club_members').delete().eq('club_id', clubToDelete.id);
            await supabase.from('clubs').delete().eq('id', clubToDelete.id);
        }

        // 3. Reset request status
        const { error: resetError } = await supabase
            .from('club_requests')
            .update({
                status: 'pending',
                reviewed_at: null,
                reviewed_by: null,
                review_notes: null
            })
            .eq('id', requestId);

        if (resetError) {
            alert('Status reset failed: ' + resetError.message);
        } else {
            alert('Registry Reverted: Request is now pending review.');
            fetchData();
        }
    };

    const handleDeleteClub = async (clubId: string, clubName: string) => {
        if (!window.confirm(`⚠️ CRITICAL OPERATION ⚠️\n\nYou are about to permanently delete "${clubName}".\n\nThis will CASCADE DELETE:\n• All club members\n• All events\n• All updates\n• All associated data\n\nThis action CANNOT be undone.\n\nType the club name to confirm: "${clubName}"`)) {
            return;
        }

        const userInput = window.prompt(`Type "${clubName}" to confirm deletion:`);
        if (userInput !== clubName) {
            alert('Club name does not match. Deletion cancelled.');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('clubs')
            .delete()
            .eq('id', clubId);

        if (error) {
            console.error('Error deleting club:', error);
            alert('Deletion failed: ' + error.message);
        } else {
            alert(`Club "${clubName}" has been permanently deleted.`);
            await fetchData();
        }
        setLoading(false);
    };

    const handleToggleVerification = async (clubId: string, currentStatus: boolean) => {
        const newStatus = !currentStatus;
        const action = newStatus ? 'AUTHORIZE' : 'REVOKE AUTHORIZATION';

        if (!window.confirm(`${action} this club?\n\nThis will change the verification status from "${currentStatus ? 'Authorized' : 'In Review'}" to "${newStatus ? 'Authorized' : 'In Review'}".`)) {
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('clubs')
            .update({ is_verified: newStatus })
            .eq('id', clubId);

        if (error) {
            console.error('Error toggling verification:', error);
            alert('Verification update failed: ' + error.message);
        } else {
            alert(`Verification status updated to: ${newStatus ? 'Authorized' : 'In Review'}`);
            await fetchData();
        }
        setLoading(false);
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

                {/* Global Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 animate-fade-in">
                    <div className="card-premium p-6 border-l-4 border-l-govt-blue hover:shadow-2xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-govt-blue/10 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Shield size={24} className="text-govt-blue" />
                            </div>
                            <span className="text-3xl font-black text-govt-dark">{stats.totalClubs}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Clubs</p>
                    </div>

                    <div className="card-premium p-6 border-l-4 border-l-govt-accent hover:shadow-2xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-govt-accent/10 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users size={24} className="text-govt-accent" />
                            </div>
                            <span className="text-3xl font-black text-govt-dark">{stats.totalMembers}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Members</p>
                    </div>

                    <div className="card-premium p-6 border-l-4 border-l-green-500 hover:shadow-2xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-green-500/10 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Calendar size={24} className="text-green-500" />
                            </div>
                            <span className="text-3xl font-black text-govt-dark">{stats.totalEvents}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Events</p>
                    </div>

                    <div className="card-premium p-6 border-l-4 border-l-orange-500 hover:shadow-2xl transition-all group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="h-12 w-12 bg-orange-500/10 rounded-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Clock size={24} className="text-orange-500" />
                            </div>
                            <span className="text-3xl font-black text-govt-dark">{stats.pendingRequests}</span>
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending Approvals</p>
                    </div>
                </div>

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
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="px-6 py-2 bg-govt-light border border-govt-border rounded-sm text-[9px] font-black text-gray-300 uppercase tracking-widest italic text-center">
                                                        Dossier Sealed ({req.status})
                                                    </div>
                                                    <button
                                                        onClick={() => handleResetRequest(req.id)}
                                                        className="text-[9px] font-black text-red-500 hover:text-red-700 uppercase tracking-widest flex items-center gap-2"
                                                    >
                                                        <RotateCcw size={12} /> Revert to Pending
                                                    </button>
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
                                                        {club.logo_url ? <img src={club.logo_url} className="h-8 w-8 object-cover rounded-full grayscale group-hover:grayscale-0" /> : <Users size={18} className="text-gray-300" />}
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
                                                <button
                                                    onClick={() => handleToggleVerification(club.id, club.is_verified)}
                                                    className="p-2 text-govt-blue hover:scale-125 transition-transform"
                                                    title={club.is_verified ? 'Revoke Authorization' : 'Grant Authorization'}
                                                >
                                                    <Shield size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClub(club.id, club.name)}
                                                    className="p-2 text-red-400 hover:scale-125 transition-transform"
                                                    title="Delete Club (Permanent)"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
