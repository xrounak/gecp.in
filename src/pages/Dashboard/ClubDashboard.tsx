import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Users, UserCheck, Bell, Calendar, Settings,
    LogOut, Plus, Edit, Trash2, Check, X, Shield,
    Upload, Globe, ExternalLink, RefreshCw, ChevronRight, Clock,
    BarChart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createNotification, notifyClubSubscribers } from '../../lib/notifications';

const ClubDashboard = () => {
    const { profile, signOut } = useAuth();
    const [myClubs, setMyClubs] = useState<any[]>([]);
    const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
    const [club, setClub] = useState<any>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [stats, setStats] = useState({ clicks: 0, updates: 0, events: 0, members: 0 });
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingUpdate, setEditingUpdate] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [isProcessingMember, setIsProcessingMember] = useState<string | null>(null);

    // Form States
    const [updateForm, setUpdateForm] = useState({ title: '', body: '', type: 'announcement', is_published: true });
    const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', start_time: '', registration_url: '', is_published: true });
    // Club Profile Form State
    const [updateClubForm, setUpdateClubForm] = useState({
        short_description: '',
        website_url: '',
        email: '',
        phone: '',
        social_facebook: '',
        social_instagram: '',
        social_twitter: '',
        social_youtube: ''
    });
    const [uploadingLogo, setUploadingLogo] = useState(false);

    const fetchMyClubs = async () => {
        setLoading(true);
        if (!profile?.user_id) return;

        const { data: members, error } = await supabase
            .from('club_members')
            .select('club_id, clubs(*)')
            .eq('user_id', profile.user_id)
            .eq('is_admin', true);

        if (error) {
            console.error("Error fetching club memberships:", error);
            setLoading(false);
            return;
        }

        const clubs: any[] = members?.map(m => m.clubs).filter(Boolean) || [];
        setMyClubs(clubs);

        if (clubs.length === 1) {
            setSelectedClubId(clubs[0].id);
        } else {
            setLoading(false);
        }
    };

    const fetchClubData = async (clubId: string) => {
        setLoading(true);
        const { data: clubData, error: clubError } = await supabase
            .from('clubs')
            .select('*')
            .eq('id', clubId)
            .single();

        console.log(clubData);

        if (clubError) {
            console.error("Error fetching club data:", clubError);
            setLoading(false);
            return;
        }

        setClub(clubData);
        // Initialize update form with current club description
        if (clubData) {
            setUpdateClubForm({
                short_description: clubData.short_description || '',
                website_url: clubData.website_url || '',
                email: clubData.email || '',
                phone: clubData.phone || '',
                social_facebook: clubData.social_facebook || '',
                social_instagram: clubData.social_instagram || '',
                social_twitter: clubData.social_twitter || '',
                social_youtube: clubData.social_youtube || ''
            });
        }

        if (clubData) {
            const { data: upData, error: updatesError } = await supabase
                .from('updates')
                .select('*')
                .eq('club_id', clubData.id)
                .order('created_at', { ascending: false });

            if (updatesError) console.error("Error fetching updates:", updatesError);
            setUpdates(upData || []);

            const { data: evData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('club_id', clubData.id)
                .order('start_time', { ascending: true });

            if (eventsError) console.error("Error fetching events:", eventsError);
            setEvents(evData || []);

            const { data: memData, error: membersError } = await supabase
                .from('club_members')
                .select('*, profiles(full_name, email)')
                .eq('club_id', clubData.id);

            console.log(memData);

            if (membersError) console.error("Error fetching members:", membersError);
            setMembers(memData || []);

            setStats({
                clicks: Number(clubData.website_clicks) || 0,
                updates: upData?.length || 0,
                events: evData?.length || 0,
                members: memData?.filter(m => m.status === 'active').length || 0
            });
        }
        setLoading(false);
    };

    const handleUpdateClub = async () => {
        if (!club) return;
        setLoading(true);

        const { error } = await supabase
            .from('clubs')
            .update({
                short_description: updateClubForm.short_description,
                website_url: updateClubForm.website_url,
                email: updateClubForm.email,
                phone: updateClubForm.phone,
                social_facebook: updateClubForm.social_facebook,
                social_instagram: updateClubForm.social_instagram,
                social_twitter: updateClubForm.social_twitter,
                social_youtube: updateClubForm.social_youtube
            })
            .eq('id', club.id);

        if (error) {
            console.error("Error updating club:", error);
            alert("Failed to update club profile. Please try again.");
        } else {
            // Refresh local data
            await fetchClubData(club.id);
            alert("Club profile updated successfully.");
        }
        setLoading(false);
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0 || !club) return;

        const file = event.target.files[0];
        const fileExt = file.name.split('.').pop();
        // Policy requires path structure: folder/UUID/filename
        const fileName = `clubs/${club.id}/logo-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploadingLogo(true);

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('club-assets')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading logo:', uploadError);
            alert('Upload Failed: ' + uploadError.message);
            setUploadingLogo(false);
            return;
        }

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('club-assets')
            .getPublicUrl(filePath);

        // 3. Update Club Record
        const { error: updateError } = await supabase
            .from('clubs')
            .update({ logo_url: publicUrl })
            .eq('id', club.id);

        if (updateError) {
            console.error('Error updating club logo:', updateError);
            alert('Database Sync Failed: ' + updateError.message);
        } else {
            await fetchClubData(club.id);
            alert('Master Symbol (Logo) Updated Successfully');
        }
        setUploadingLogo(false);
    };

    const handleMemberStatus = async (userId: string, status: 'active' | 'rejected', isAdmin?: boolean) => {
        if (!club) return;
        setIsProcessingMember(userId);

        const updatePayload: any = { status };
        if (isAdmin !== undefined) updatePayload.is_admin = isAdmin;

        const { error } = await supabase
            .from('club_members')
            .update(updatePayload)
            .eq('club_id', club.id)
            .eq('user_id', userId);

        if (error) {
            alert('Operation Denied: ' + error.message);
        } else {
            // Notify user about join request response
            if (status === 'active') {
                await createNotification({
                    userId: userId,
                    clubId: club.id,
                    type: 'notification_join_approved',
                    title: 'Join Request Approved',
                    message: `Your request to join "${club.name}" has been approved!${isAdmin ? ' You have been promoted to Club Admin.' : ''}`,
                    link: `/clubs/${club.slug}`
                });
            } else if (status === 'rejected') {
                await createNotification({
                    userId: userId,
                    clubId: club.id,
                    type: 'notification_join_rejected',
                    title: 'Join Request Declined',
                    message: `Your request to join "${club.name}" was declined.`,
                    link: `/clubs/${club.slug}`
                });
            }
            fetchClubData(club.id);
        }
        setIsProcessingMember(null);
    };

    const handleRemoveMember = async (userId: string) => {
        if (!club) return;
        if (!window.confirm('Institutional Purge: Remove this member from the registry?')) return;

        setIsProcessingMember(userId);
        const { error } = await supabase
            .from('club_members')
            .delete()
            .eq('club_id', club.id)
            .eq('user_id', userId);

        if (error) {
            alert('Purge Failed: ' + error.message);
        } else {
            fetchClubData(club.id);
        }
        setIsProcessingMember(null);
    };

    const handleCreateUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!club) return;
        const payload = {
            ...updateForm,
            club_id: club.id,
            created_by: profile.user_id
        };

        if (editingUpdate) {
            const { error } = await supabase.from('updates').update(payload).eq('id', editingUpdate.id);
            if (!error) {
                setShowUpdateModal(false);
                setEditingUpdate(null);
                fetchClubData(club.id);
            }
        } else {
            const { error } = await supabase.from('updates').insert([payload]);
            if (!error) {
                setShowUpdateModal(false);
                setUpdateForm({ title: '', body: '', type: 'announcement', is_published: true });
                fetchClubData(club.id);
            }
        }
    };

    const handleCreateEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!club) return;
        const payload = {
            ...eventForm,
            club_id: club.id,
            created_by: profile.user_id
        };

        if (editingEvent) {
            const { error } = await supabase.from('events').update(payload).eq('id', editingEvent.id);
            if (!error) {
                setShowEventModal(false);
                setEditingEvent(null);
                fetchClubData(club.id);
            }
        } else {
            const { data: newEvent, error } = await supabase.from('events').insert([payload]).select().single();
            if (!error && newEvent) {
                // Notify all club subscribers about the new event
                await notifyClubSubscribers(club.id, club.name, payload.title, newEvent.id);

                setShowEventModal(false);
                setEventForm({ title: '', description: '', location: '', start_time: '', registration_url: '', is_published: true });
                fetchClubData(club.id);
            }
        }
    };

    const openEditUpdate = (up: any) => {
        setEditingUpdate(up);
        setUpdateForm({ title: up.title, body: up.body, type: up.type, is_published: up.is_published });
        setShowUpdateModal(true);
    };

    const openEditEvent = (ev: any) => {
        setEditingEvent(ev);
        // Format date for datetime-local input
        const dateStr = ev.start_time ? new Date(ev.start_time).toISOString().slice(0, 16) : '';
        setEventForm({ title: ev.title, description: ev.description, location: ev.location, start_time: dateStr, registration_url: ev.registration_url || '', is_published: ev.is_published });
        setShowEventModal(true);
    };

    const handleDelete = async (table: 'updates' | 'events', id: string) => {
        if (!club) return;
        if (window.confirm('Institutional Record Deletion: Are you certain you wish to purge this data?')) {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (!error) fetchClubData(club.id);
        }
    };

    useEffect(() => {
        if (profile?.user_id) {
            fetchMyClubs();
        }
    }, [profile]);

    useEffect(() => {
        if (selectedClubId) {
            fetchClubData(selectedClubId);
        }
    }, [selectedClubId]);

    if (loading) return (
        <div className="min-h-screen bg-govt-light flex items-center justify-center p-8">
            <div className="text-center animate-fade-in">
                <div className="w-16 h-16 border-4 border-govt-blue border-t-govt-accent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-sm font-black text-govt-dark uppercase tracking-[0.2em]">Authenticating Repository</h2>
                <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest italic">Decrypting protocols...</p>
            </div>
        </div>
    );

    if (!selectedClubId && myClubs.length > 0) {
        return (
            <div className="min-h-screen bg-govt-light p-12">
                <div className="max-w-4xl mx-auto space-y-12">
                    <header className="border-b border-govt-border pb-8">
                        <h2 className="text-4xl font-black text-govt-dark uppercase tracking-tight italic">
                            Institutional <span className="text-govt-blue">Identity Matrix</span>
                        </h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 animate-pulse">
                            Select an administrative domain to manage
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {myClubs.map(c => (
                            <button
                                key={c.id}
                                onClick={() => setSelectedClubId(c.id)}
                                className="group card-premium p-10 text-left hover:border-govt-blue transition-all bg-white hover:shadow-2xl flex items-center justify-between"
                            >
                                <div className="space-y-2">
                                    <h3 className="text-xl font-black text-govt-dark uppercase tracking-tight group-hover:text-govt-blue transition-colors">
                                        {c.name}
                                    </h3>
                                    <div className="text-[10px] font-black text-govt-accent uppercase tracking-widest">
                                        Verified Administrative Entity
                                    </div>
                                </div>
                                <ChevronRight size={24} className="text-gray-200 group-hover:text-govt-blue transition-colors" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!club) return (
        <div className="min-h-screen bg-govt-light flex items-center justify-center p-8">
            <div className="card-premium p-12 max-w-md text-center border-t-4 border-t-red-500">
                <Shield size={64} className="text-red-100 mx-auto mb-6" />
                <h2 className="text-xl font-black text-red-600 uppercase tracking-tight">Access Prohibited</h2>
                <p className="mt-4 text-sm text-gray-400 font-medium leading-relaxed">This identity index is not authorized to manage any active institutional repositories. Please contact the Registry Oversight for credentialing.</p>
                <button
                    onClick={() => signOut()}
                    className="btn-govt-outline mt-10 w-full text-red-500 border-red-100 hover:bg-red-50"
                >
                    Terminate Session
                </button>
            </div>
        </div>
    );

    return (
        <div className="bg-govt-light min-h-screen flex flex-col md:flex-row divide-x divide-govt-border">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-72 glass-dark text-white p-8 sticky top-0 h-screen flex flex-col gap-10 shadow-2xl z-20 overflow-y-auto">
                <div className="border-b border-white/10 pb-6 relative group">
                    <div className="absolute -top-4 -left-4 w-12 h-12 bg-govt-accent/10 rounded-full blur-xl group-hover:bg-govt-accent/20 transition-all"></div>
                    <h3 className="font-extrabold flex items-center gap-3 uppercase tracking-[0.15em] text-xs relative z-10">
                        <Settings size={20} className="text-govt-accent" />
                        Management
                    </h3>
                    <p className="text-[9px] text-govt-accent font-black uppercase mt-2 tracking-widest pl-8 animate-pulse italic">{club.name}</p>
                </div>

                <nav className="flex flex-col gap-3">
                    {[
                        { id: 'overview', icon: <BarChart size={16} />, label: 'Metrics Overview' },
                        { id: 'personnel', icon: <UserCheck size={16} />, label: 'Personnel Matrix' },
                        { id: 'profile', icon: <Globe size={16} />, label: 'Repository Node' },
                        { id: 'updates', icon: <Bell size={16} />, label: 'Dispatch Feed' },
                        { id: 'events', icon: <Calendar size={16} />, label: 'Event Registry' },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group ${activeTab === item.id ? 'bg-govt-accent text-govt-dark shadow-2xl scale-[1.02]' : 'hover:bg-white/5 opacity-60 hover:opacity-100'}`}
                        >
                            <span className="z-10">{item.icon}</span>
                            <span className="z-10">{item.label}</span>
                            {activeTab === item.id && <div className="absolute inset-0 bg-white/10"></div>}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto pt-8 border-t border-white/10">
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-3 py-3 border border-white/10 rounded-sm text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-950/30 transition-all"
                    >
                        <LogOut size={16} /> Exit Secure Zone
                    </button>
                </div>
            </aside>
            {/* Main Content Area */}
            <main className="flex-grow p-12 overflow-y-auto">
                <header className="flex justify-between items-end mb-16 animate-fade-up">
                    <div className="space-y-2">
                        <nav className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">
                            <span>Club Console</span>
                            <ChevronRight size={12} className="text-govt-accent" />
                            <span className="text-govt-dark capitalize font-black italic">{activeTab} Controls</span>
                        </nav>
                        <h2 className="text-4xl font-black text-govt-dark uppercase tracking-tight leading-none italic">
                            Administrative <span className="text-govt-blue">Panel</span>
                        </h2>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="card-premium p-10 text-center relative overflow-hidden group hover-lift">
                                <div className="absolute -bottom-6 -right-6 text-govt-blue/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <BarChart size={120} />
                                </div>
                                <div className="text-5xl font-black text-govt-dark italic">{stats.clicks}</div>
                                <div className="text-[10px] font-black text-gray-400 uppercase mt-3 tracking-[0.2em]">Node Reach (Total)</div>
                            </div>
                            <div className="card-premium p-10 text-center relative overflow-hidden group hover-lift border-b-4 border-b-govt-blue">
                                <div className="absolute -bottom-6 -right-6 text-govt-blue/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Bell size={120} />
                                </div>
                                <div className="text-5xl font-black text-govt-dark italic">{stats.updates}</div>
                                <div className="text-[10px] font-black text-gray-400 uppercase mt-3 tracking-[0.2em]">Dispatches Active</div>
                            </div>
                            <div className="card-premium p-10 text-center relative overflow-hidden group hover-lift">
                                <div className="absolute -bottom-6 -right-6 text-govt-blue/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Calendar size={120} />
                                </div>
                                <div className="text-5xl font-black text-govt-dark italic">{stats.events}</div>
                                <div className="text-[10px] font-black text-gray-400 uppercase mt-3 tracking-[0.2em]">Registry Items</div>
                            </div>
                        </div>

                        <div className="card-premium overflow-hidden shadow-2xl">
                            <div className="px-8 py-6 govt-gradient text-white flex justify-between items-center">
                                <h4 className="text-xs font-black uppercase tracking-[0.25em] italic">Historical Activity Log</h4>
                                <button onClick={() => setActiveTab('updates')} className="text-[10px] font-black text-govt-accent uppercase tracking-widest hover:underline">Access Feed</button>
                            </div>
                            <div className="divide-y divide-govt-border bg-white">
                                {updates.slice(0, 5).map(up => (
                                    <div key={up.id} className="p-6 flex justify-between items-center hover:bg-govt-light/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${up.is_published ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gray-200'}`}></div>
                                            <span className="text-sm font-black text-govt-dark uppercase tracking-tight">{up.title}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(up.published_at).toLocaleDateString()}</span>
                                            < ChevronRight size={14} className="text-govt-accent" />
                                        </div>
                                    </div>
                                ))}
                                {updates.length === 0 && (
                                    <div className="p-10 text-center text-gray-400 text-xs font-bold uppercase tracking-widest italic opacity-50">Empty Transaction Log</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {(activeTab === 'updates' || activeTab === 'events') && (
                    <div className="space-y-10 animate-fade-in">
                        <div className="card-premium p-16 text-center border-dashed border-2 bg-white/50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-2 h-full bg-govt-accent translate-x-[-100%] group-hover:translate-x-0 transition-transform"></div>
                            <div className="flex justify-center mb-8"><Plus size={64} className="text-govt-blue/10 group-hover:text-govt-accent transition-colors duration-500" /></div>
                            <div className="space-y-4">
                                <h4 className="text-xl font-black text-govt-dark uppercase tracking-tight italic">Initialize New {activeTab.slice(0, -1)} Protocol</h4>
                                <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto font-medium leading-relaxed">Prepare institutional dispatch for university-wide registry. Verification mandatory before publication.</p>
                            </div>
                            <button
                                onClick={() => activeTab === 'updates' ? setShowUpdateModal(true) : setShowEventModal(true)}
                                className="btn-govt-primary mt-10 px-12 py-4"
                            >
                                Launch Creator
                            </button>
                        </div>

                        <div className="card-premium overflow-hidden shadow-2xl">
                            <table className="w-full text-left">
                                <thead className="govt-gradient text-white text-[9px] font-black uppercase tracking-[0.25em]">
                                    <tr>
                                        <th className="px-8 py-6">Record Identity</th>
                                        <th className="px-8 py-6">Status Code</th>
                                        <th className="px-8 py-6">Registry Date</th>
                                        <th className="px-8 py-6 text-right">Moderation</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-govt-border text-[11px] font-bold text-gray-600 bg-white">
                                    {(activeTab === 'updates' ? updates : events).map(item => (
                                        <tr key={item.id} className="group hover:bg-govt-light/50 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-black text-govt-dark uppercase tracking-tight leading-tight">{item.title}</div>
                                                <div className="text-[9px] font-medium text-gray-300 uppercase mt-1">Ref_Node_{item.id.slice(0, 8)}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest shadow-sm ${item.is_published ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-gray-50 text-gray-400 border border-gray-200'}`}>
                                                    {item.is_published ? 'ACTIVE' : 'DRAFT'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                                {new Date(item.created_at || item.start_time).toLocaleDateString()}
                                            </td>
                                            <td className="px-8 py-6 text-right space-x-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                <button
                                                    onClick={() => activeTab === 'updates' ? openEditUpdate(item) : openEditEvent(item)}
                                                    className="p-2 text-govt-blue hover:scale-125 transition-transform"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(activeTab === 'updates' ? 'updates' : 'events', item.id)}
                                                    className="p-2 text-red-500 hover:scale-125 transition-transform"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {((activeTab === 'updates' ? updates : events).length === 0) && (
                                        <tr>
                                            <td colSpan={4} className="px-12 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-16 h-0.5 bg-govt-border"></div>
                                                    <p className="text-xs font-black text-gray-300 uppercase tracking-[0.3em] italic">Null Directory Index</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'personnel' && (
                    <div className="space-y-12 animate-fade-in">
                        {/* Recruitment Queue */}
                        <section className="card-premium overflow-hidden shadow-xl border-l-4 border-l-yellow-400">
                            <div className="px-8 py-6 bg-yellow-50/50 border-b border-yellow-100 flex justify-between items-center text-yellow-900">
                                <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
                                    <Clock size={18} className="text-yellow-600" /> Recruitment Operational Queue
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="bg-yellow-200 text-yellow-900 text-[10px] font-black px-3 py-1 rounded-sm uppercase tracking-widest shadow-sm">
                                        {members.filter(m => m.status === 'pending').length} Ingress Requests
                                    </span>
                                    <button
                                        onClick={() => fetchClubData(club.id)}
                                        className="p-2 hover:bg-yellow-100 rounded-full transition-all text-yellow-700 active:rotate-180 duration-500"
                                    >
                                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="divide-y divide-yellow-50 bg-white">
                                {members.filter(m => m.status === 'pending').length > 0 ? (
                                    members.filter(m => m.status === 'pending').map(m => (
                                        <div key={m.user_id} className="p-8 flex items-center justify-between hover:bg-yellow-50/20 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-black border-2 border-white shadow-inner">
                                                    {(m.profiles?.full_name || 'A')[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-govt-dark uppercase tracking-tight">{m.profiles?.full_name || 'Anonymous Applicant'}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1 opacity-60">{m.profiles?.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-4">
                                                <button
                                                    onClick={() => handleMemberStatus(m.user_id, 'active')}
                                                    disabled={!!isProcessingMember}
                                                    className="flex items-center gap-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-sm hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-green-900/20"
                                                >
                                                    <Check size={14} /> Admit
                                                </button>
                                                <button
                                                    onClick={() => handleMemberStatus(m.user_id, 'rejected')}
                                                    disabled={!!isProcessingMember}
                                                    className="flex items-center gap-2 bg-white border border-red-100 text-red-500 text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-sm hover:bg-red-50 disabled:opacity-50 transition-all"
                                                >
                                                    <X size={14} /> Deny
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-20 text-center">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] italic">No Active Recruitment Packets</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Institutional Roster */}
                        <section className="card-premium overflow-hidden shadow-2xl">
                            <div className="px-8 py-6 govt-gradient text-white flex justify-between items-center">
                                <h3 className="text-xs font-black uppercase tracking-[0.25em] flex items-center gap-3 italic">
                                    <Users size={20} className="text-govt-accent" /> Institutional Personnel Matrix
                                </h3>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">
                                        {members.filter(m => m.status === 'active').length} Authorized Personnel
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-x-auto bg-white">
                                <table className="w-full text-left">
                                    <thead className="bg-govt-light/30 text-gray-400 uppercase text-[9px] font-black tracking-[0.2em] border-b border-govt-border">
                                        <tr>
                                            <th className="px-10 py-5">Personnel Identity</th>
                                            <th className="px-10 py-5 text-center">Clearance Level</th>
                                            <th className="px-10 py-5 text-right">Administrative Protocol</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-govt-border/50">
                                        {members.filter(m => m.status === 'active').map(m => (
                                            <tr key={m.user_id} className="hover:bg-govt-light/20 transition-all group">
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-12 h-12 rounded-sm bg-govt-dark text-govt-accent flex items-center justify-center font-black border border-white/10 shadow-xl group-hover:scale-110 transition-transform">
                                                            {(m.profiles?.full_name || 'A')[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-govt-dark uppercase tracking-tight mb-1">{m.profiles?.full_name}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-[0.15em] opacity-60">{m.profiles?.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-center">
                                                    {m.is_admin ? (
                                                        <span className="inline-flex items-center gap-2 bg-govt-blue/90 text-white text-[9px] font-black px-4 py-1.5 rounded-sm uppercase tracking-[0.2em] shadow-lg border border-govt-accent/30">
                                                            <Shield size={12} className="text-govt-accent" /> Level 2: Admin
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-[10px] font-black uppercase tracking-widest border border-govt-border/50 px-3 py-1.5 rounded-sm bg-govt-light/20">Level 1: Regular</span>
                                                    )}
                                                </td>
                                                <td className="px-10 py-6 text-right">
                                                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                                        <button
                                                            onClick={() => handleMemberStatus(m.user_id, 'active', !m.is_admin)}
                                                            disabled={!!isProcessingMember}
                                                            title={m.is_admin ? 'Demote to Regular' : 'Promote to Admin'}
                                                            className={`p-3 rounded-sm border transition-all shadow-sm ${m.is_admin
                                                                ? 'bg-yellow-50 text-yellow-600 border-yellow-200 hover:bg-yellow-600 hover:text-white'
                                                                : 'bg-govt-light text-govt-blue border-govt-blue/20 hover:bg-govt-blue hover:text-white'
                                                                }`}
                                                        >
                                                            {m.is_admin ? <RefreshCw size={16} /> : <Shield size={16} />}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveMember(m.user_id)}
                                                            disabled={!!isProcessingMember}
                                                            title="Purge Personnel Instance"
                                                            className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-sm hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {members.filter(m => m.status === 'active').length === 0 && (
                                    <div className="p-24 text-center">
                                        <div className="w-20 h-20 bg-govt-light rounded-sm flex items-center justify-center mx-auto mb-6 border border-govt-border shadow-inner opacity-40">
                                            <Users className="text-govt-blue" size={40} />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] italic">Personnel Directory Empty</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
                {activeTab === 'profile' && (
                    <div className="card-premium overflow-hidden animate-fade-in shadow-2xl">
                        <div className="px-8 py-6 govt-gradient text-white">
                            <h4 className="text-xs font-black uppercase tracking-[0.25em] italic">Institutional Repository Node Configuration</h4>
                        </div>
                        <div className="p-12 space-y-12 bg-white">
                            {/* Section 1: General Identity */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                <div className="space-y-8">
                                    <div className="flex flex-col items-center p-12 border-2 border-dashed border-govt-border rounded-sm bg-govt-light/30 group cursor-pointer hover:border-govt-blue transition-all relative overflow-hidden">
                                        <label className="cursor-pointer flex flex-col items-center w-full h-full">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoUpload}
                                                className="hidden"
                                                disabled={uploadingLogo}
                                            />
                                            <div className="relative">
                                                {club.logo_url ? (
                                                    <img
                                                        src={club.logo_url}
                                                        className={`h-40 w-40 object-cover rounded-full ml-4 grayscale group-hover:grayscale-0 transition-all duration-500 ${uploadingLogo ? 'opacity-50 blur-sm' : ''}`}
                                                    />
                                                ) : (
                                                    <Upload size={64} className="text-govt-blue/20" />
                                                )}

                                                {uploadingLogo && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <div className="w-12 h-12 border-4 border-govt-blue border-t-transparent rounded-full animate-spin"></div>
                                                    </div>
                                                )}

                                                {!uploadingLogo && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <div className="bg-govt-dark/80 p-3 rounded-full text-white shadow-2xl">
                                                            <Upload size={24} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[10px] font-black mt-8 text-govt-blue uppercase tracking-[0.25em] group-hover:text-govt-accent transition-colors">
                                                {uploadingLogo ? 'Transmitting Data...' : 'Replace Master Symbol'}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Registry Identity (Read-Only)</label>
                                        <div className="relative">
                                            <input type="text" readOnly value={club.name} className="w-full bg-govt-light/50 border border-govt-border p-4 rounded-sm text-sm font-black text-govt-dark uppercase tracking-tight outline-none" />
                                            <Shield size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-govt-blue/30" />
                                        </div>
                                        <p className="text-[8px] text-gray-400 font-bold uppercase tracking-widest italic pl-1">Protocol: Major modifications require institutional re-vetting.</p>
                                    </div>
                                </div>
                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Global Endpoint (Slug)</label>
                                        <div className="flex gap-4">
                                            <div className="bg-govt-light/50 border border-govt-border px-5 py-4 rounded-sm text-xs font-black text-govt-blue flex items-center gap-3 flex-grow italic">
                                                <Globe size={16} className="text-govt-blue/30" /> gecp.in/club/{club.slug}
                                            </div>
                                            <Link to={`/club/${club.slug}`} target="_blank" className="btn-govt-dark p-4 shadow-xl"><ExternalLink size={20} /></Link>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Organizational Statement (Memo)</label>
                                        <textarea
                                            rows={6}
                                            value={updateClubForm.short_description}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, short_description: e.target.value })}
                                            className="w-full border border-govt-border p-5 rounded-sm text-sm font-medium text-gray-600 focus:border-govt-blue focus:ring-1 focus:ring-govt-blue/10 outline-none transition-all leading-relaxed"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-govt-border/50" />

                            {/* Section 2: Contact Node Configuration */}
                            <div className="space-y-8">
                                <h5 className="text-xs font-black text-govt-dark uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-8 h-0.5 bg-govt-accent"></span> Contact Node Configuration
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Official Website</label>
                                        <input
                                            type="url"
                                            value={updateClubForm.website_url}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, website_url: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300 pointer-events-auto"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Institutional Email</label>
                                        <input
                                            type="email"
                                            value={updateClubForm.email}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, email: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                            placeholder="club@gecp.ac.in"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Helpline / Contact</label>
                                        <input
                                            type="text"
                                            value={updateClubForm.phone}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, phone: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                            placeholder="+91..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-govt-border/50" />

                            {/* Section 3: Social Signal Transmitters */}
                            <div className="space-y-8">
                                <h5 className="text-xs font-black text-govt-dark uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-8 h-0.5 bg-govt-accent"></span> Social Signal Transmitters
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Instagram Handle</label>
                                        <div className="flex items-center">
                                            <span className="text-gray-400 text-sm font-bold mr-2">@</span>
                                            <input
                                                type="text"
                                                value={updateClubForm.social_instagram}
                                                onChange={e => setUpdateClubForm({ ...updateClubForm, social_instagram: e.target.value })}
                                                className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Twitter / X Handle</label>
                                        <div className="flex items-center">
                                            <span className="text-gray-400 text-sm font-bold mr-2">@</span>
                                            <input
                                                type="text"
                                                value={updateClubForm.social_twitter}
                                                onChange={e => setUpdateClubForm({ ...updateClubForm, social_twitter: e.target.value })}
                                                className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Facebook Page URL</label>
                                        <input
                                            type="url"
                                            value={updateClubForm.social_facebook}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, social_facebook: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                            placeholder="https://facebook.com/..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">YouTube Channel URL</label>
                                        <input
                                            type="url"
                                            value={updateClubForm.social_youtube}
                                            onChange={e => setUpdateClubForm({ ...updateClubForm, social_youtube: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-3 outline-none text-sm font-bold text-gray-600 transition-all placeholder:text-gray-300"
                                            placeholder="https://youtube.com/..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-10 border-t border-govt-border flex justify-end">
                                <button
                                    onClick={handleUpdateClub}
                                    disabled={loading}
                                    className="btn-govt-primary px-16 py-4 shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Syncing...' : 'Sync Repository v2.0'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-govt-dark/80 backdrop-blur-md animate-fade-in">
                    <div className="card-premium w-full max-w-2xl overflow-hidden animate-scale-in">
                        <div className="px-8 py-6 govt-gradient text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-[0.25em] italic">{editingUpdate ? 'Modify Dispatch Protocol' : 'Initialize Dispatch Protocol'}</h4>
                            <button onClick={() => { setShowUpdateModal(false); setEditingUpdate(null); }} className="hover:rotate-90 transition-transform"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateUpdate} className="p-10 space-y-8 bg-white">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Communication Title</label>
                                    <input
                                        type="text"
                                        required
                                        value={updateForm.title}
                                        onChange={e => setUpdateForm({ ...updateForm, title: e.target.value })}
                                        className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-black text-govt-dark uppercase tracking-tight transition-all"
                                        placeholder="e.g. ANNUAL GENERAL BODY MEETING"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Protocol Type</label>
                                        <select
                                            value={updateForm.type}
                                            onChange={e => setUpdateForm({ ...updateForm, type: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-bold text-gray-600 uppercase tracking-widest bg-transparent cursor-pointer"
                                        >
                                            <option value="announcement">Announcement</option>
                                            <option value="notice">Official Notice</option>
                                            <option value="highlight">Club Highlight</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Visibility Level</label>
                                        <div className="flex items-center gap-4 pt-4">
                                            <label className="flex items-center gap-2 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={updateForm.is_published}
                                                    onChange={e => setUpdateForm({ ...updateForm, is_published: e.target.checked })}
                                                    className="w-4 h-4 text-govt-blue rounded-sm border-govt-border focus:ring-govt-blue"
                                                />
                                                <span className="text-[11px] font-black text-govt-dark uppercase tracking-widest group-hover:text-govt-accent transition-colors">Immediate Publication</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Communication Body</label>
                                    <textarea
                                        rows={5}
                                        required
                                        value={updateForm.body}
                                        onChange={e => setUpdateForm({ ...updateForm, body: e.target.value })}
                                        className="w-full border-2 border-govt-border focus:border-govt-blue p-5 rounded-sm outline-none text-sm font-medium text-gray-600 leading-relaxed transition-all"
                                        placeholder="Enter detailed institutional dispatch contents..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-6 pt-6 border-t border-govt-border">
                                <button type="button" onClick={() => { setShowUpdateModal(false); setEditingUpdate(null); }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-govt-dark transition-colors">Abort</button>
                                <button type="submit" className="btn-govt-primary px-12 py-3 shadow-xl">{editingUpdate ? 'Sync Dispatch' : 'Execute Dispatch'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEventModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-govt-dark/80 backdrop-blur-md animate-fade-in">
                    <div className="card-premium w-full max-w-2xl overflow-hidden animate-scale-in">
                        <div className="px-8 py-6 govt-gradient text-white flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase tracking-[0.25em] italic">{editingEvent ? 'Edit Institutional Event' : 'Register Institutional Event'}</h4>
                            <button onClick={() => { setShowEventModal(false); setEditingEvent(null); }} className="hover:rotate-90 transition-transform"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateEvent} className="p-10 space-y-8 bg-white">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Event Identity</label>
                                    <input
                                        type="text"
                                        required
                                        value={eventForm.title}
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                        className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-black text-govt-dark uppercase tracking-tight transition-all"
                                        placeholder="e.g. TECH_FEST_2026_SYMPOSIUM"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Temporal Node (Start Time)</label>
                                        <div className="relative">
                                            <input
                                                type="datetime-local"
                                                required
                                                value={eventForm.start_time}
                                                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })}
                                                className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-bold text-gray-600 bg-transparent cursor-pointer"
                                            />
                                            <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-govt-blue/30" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Geographic Location</label>
                                        <input
                                            type="text"
                                            required
                                            value={eventForm.location}
                                            onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                            className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-bold text-gray-600"
                                            placeholder="e.g. SEMINAR HALL 1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">External Endpoint (URL)</label>
                                    <input
                                        type="url"
                                        value={eventForm.registration_url}
                                        onChange={e => setEventForm({ ...eventForm, registration_url: e.target.value })}
                                        className="w-full border-b-2 border-govt-border focus:border-govt-blue p-4 outline-none text-sm font-bold text-gray-600"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Abstract/Description</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={eventForm.description}
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                        className="w-full border-2 border-govt-border focus:border-govt-blue p-5 rounded-sm outline-none text-sm font-medium text-gray-600 leading-relaxed transition-all"
                                        placeholder="Provide comprehensive event details..."
                                    ></textarea>
                                </div>
                            </div>
                            <div className="flex justify-end gap-6 pt-6 border-t border-govt-border">
                                <button type="button" onClick={() => { setShowEventModal(false); setEditingEvent(null); }} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-govt-dark transition-colors">Abort</button>
                                <button type="submit" className="btn-govt-primary px-12 py-3 shadow-xl">{editingEvent ? 'Sync Event' : 'Commit to Registry'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubDashboard;
