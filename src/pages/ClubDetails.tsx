import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    Users, Mail, Phone, Calendar,
    ExternalLink, Facebook, Instagram, Twitter,
    CheckCircle, Bell, Clock, XCircle, Shield, PlusCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ClubDetails = () => {
    const { slug } = useParams();
    const { profile } = useAuth();
    const [club, setClub] = useState<any>(null);
    const [updates, setUpdates] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [membership, setMembership] = useState<any>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        const fetchClubData = async () => {
            // Fetch Club
            const { data: clubData } = await supabase
                .from('clubs')
                .select('*')
                .eq('slug', slug)
                .single();

            if (clubData) {
                setClub(clubData);

                // Fetch Updates
                const { data: updateData } = await supabase
                    .from('updates')
                    .select('*')
                    .eq('club_id', clubData.id)
                    .eq('is_published', true)
                    .order('published_at', { ascending: false });

                setUpdates(updateData || []);

                // Fetch Events
                const { data: eventData } = await supabase
                    .from('events')
                    .select('*')
                    .eq('club_id', clubData.id)
                    .eq('is_published', true)
                    .gte('start_time', new Date().toISOString())
                    .order('start_time', { ascending: true });

                setEvents(eventData || []);

                // Fetch membership if user logged in
                if (profile?.user_id) {
                    const { data: mem } = await supabase
                        .from('club_members')
                        .select('*')
                        .eq('club_id', clubData.id)
                        .eq('user_id', profile.user_id)
                        .maybeSingle();
                    setMembership(mem);
                }
            }
            setLoading(false);
        };

        fetchClubData();
    }, [slug, profile]);

    const handleJoinClub = async () => {
        if (!profile) {
            alert('Authentication Required: Please sign in to initiate institutional onboarding.');
            return;
        }
        if (!club) return;

        setIsJoining(true);
        const { error } = await supabase
            .from('club_members')
            .insert([{
                club_id: club.id,
                user_id: profile.user_id,
                status: 'pending',
                is_admin: false
            }]);

        if (error) {
            alert('Request Failed: ' + error.message);
        } else {
            alert('Protocol Initiated: Your request is now in the administrative vetting queue.');
            const { data: mem } = await supabase
                .from('club_members')
                .select('*')
                .eq('club_id', club.id)
                .eq('user_id', profile.user_id)
                .maybeSingle();
            setMembership(mem);
        }
        setIsJoining(false);
    };

    const handleWebsiteClick = async () => {
        if (!club) return;
        await supabase.rpc('increment_website_clicks', { club_id: club.id });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading Club Repository...</div>;
    if (!club) return <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Club Not Found</h2>
        <Link to="/directory" className="text-govt-blue underline mt-4">Back to Directory</Link>
    </div>;

    return (
        <div className="bg-govt-light min-h-screen pb-20">
            {/* Banner & Breadcrumb */}
            <div className="relative h-64 bg-govt-dark overflow-hidden">
                {club.banner_url ? (
                    <img src={club.banner_url} alt="Banner" className="w-full h-full object-cover opacity-50" />
                ) : (
                    <div className="w-full h-full bg-govt-blue flex items-center justify-center">
                        <Users size={120} className="text-white opacity-10" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-govt-dark to-transparent"></div>
                <div className="absolute bottom-10 left-0 w-full">
                    <div className="max-w-7xl mx-auto px-4 flex items-end gap-8">
                        <div className="h-40 w-40 bg-white border-4 border-white rounded-full shadow-2xl overflow-hidden flex items-center justify-center p-4 transform translate-y-12">
                            {club.logo_url ? (
                                <img src={club.logo_url} alt={club.name} className="max-h-full max-w-full object-contain rounded-full" />
                            ) : (
                                <Users size={64} className="text-gray-300" />
                            )}
                        </div>
                        <div className="flex-grow pb-2">
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-extrabold text-white">{club.name}</h1>
                                {club.is_verified && <CheckCircle size={28} className="text-govt-accent fill-govt-accent text-white" />}
                            </div>
                            <div className="flex items-center gap-4 text-gray-300 mt-2">
                                <span className="text-sm uppercase font-bold tracking-widest">{club.category}</span>
                                <span className="h-1 w-1 bg-gray-500 rounded-full"></span>
                                <span className="text-sm italic">Established {new Date(club.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-10">
                        <section className="bg-white p-8 border rounded shadow-sm">
                            <h2 className="text-xl font-bold text-govt-dark border-b-2 border-govt-accent inline-block pb-1 mb-6 uppercase tracking-tight">About the Club</h2>
                            <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed">
                                {club.long_description ? (
                                    <div dangerouslySetInnerHTML={{ __html: club.long_description }} />
                                ) : (
                                    <p>{club.short_description || "No detailed description available."}</p>
                                )}
                            </div>
                        </section>

                        {/* Updates Section */}
                        <section>
                            <h2 className="text-xl font-bold text-govt-dark flex items-center gap-2 mb-6">
                                <Bell size={20} className="text-govt-accent" />
                                Latest Notifications & Updates
                            </h2>
                            <div className="space-y-4">
                                {updates.length > 0 ? (
                                    updates.map(update => (
                                        <div key={update.id} className="bg-white border-l-4 border-govt-blue p-5 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">{update.type}</span>
                                                <span className="text-xs text-gray-400">{new Date(update.published_at).toLocaleDateString()}</span>
                                            </div>
                                            <h4 className="font-bold text-govt-dark mb-2">{update.title}</h4>
                                            <p className="text-sm text-gray-600 line-clamp-2">{update.body}</p>
                                            {update.redirect_url && (
                                                <a href={update.redirect_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-govt-blue mt-3 hover:underline">
                                                    Read More <ExternalLink size={12} />
                                                </a>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-white border p-10 text-center text-gray-500 italic rounded">
                                        No active updates or notices from this club at the moment.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <div className="bg-white border p-8 rounded shadow-sm space-y-6">
                            {membership ? (
                                <div className="space-y-4">
                                    <div className={`w-full py-3 rounded text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-2 ${membership.status === 'pending'
                                        ? 'bg-yellow-50 border-yellow-200 text-yellow-600'
                                        : membership.status === 'active'
                                            ? 'bg-green-50 border-green-200 text-green-600'
                                            : 'bg-red-50 border-red-200 text-red-600'
                                        }`}>
                                        {membership.status === 'pending' && <Clock size={16} />}
                                        {membership.status === 'active' && <CheckCircle size={16} />}
                                        {membership.status === 'rejected' && <XCircle size={16} />}
                                        {membership.status === 'pending' ? 'Verification Pending' : membership.status === 'active' ? 'Authorized Member' : 'Registry Denied'}
                                    </div>
                                    {membership.status === 'active' && membership.is_admin && (
                                        <Link
                                            to="/club-dashboard"
                                            className="w-full bg-govt-dark text-white font-bold py-3 rounded hover:bg-govt-blue transition-colors flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                                        >
                                            <Shield size={16} className="text-govt-accent" /> Club Console
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={handleJoinClub}
                                    disabled={isJoining}
                                    className="w-full bg-govt-dark text-white font-bold py-3 rounded hover:bg-govt-blue transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {isJoining ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <PlusCircle size={18} className="group-hover:rotate-90 transition-transform" />
                                    )}
                                    Join this Club
                                </button>
                            )}

                            {club.website_url && (
                                <a
                                    href={club.website_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleWebsiteClick}
                                    className="w-full bg-white border-2 border-govt-dark text-govt-dark font-bold py-3 rounded hover:bg-govt-light transition-colors flex items-center justify-center gap-2"
                                >
                                    Visit Official Website <ExternalLink size={18} />
                                </a>
                            )}
                        </div>

                        {/* Upcoming Events */}
                        <div className="bg-white border rounded shadow-sm overflow-hidden">
                            <div className="bg-govt-dark text-white px-6 py-3 font-bold text-sm uppercase tracking-wider flex justify-between items-center">
                                Events
                                <Calendar size={18} />
                            </div>
                            <div className="divide-y">
                                {events.length > 0 ? (
                                    events.map(event => (
                                        <div key={event.id} className="p-4 hover:bg-gray-50">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center justify-center bg-gray-100 px-3 py-1 rounded border min-w-[60px]">
                                                    <span className="text-xs font-bold text-govt-blue uppercase">{new Date(event.start_time).toLocaleString('default', { month: 'short' })}</span>
                                                    <span className="text-xl font-bold text-govt-dark">{new Date(event.start_time).getDate()}</span>
                                                </div>
                                                <div className="flex-grow">
                                                    <h5 className="text-sm font-bold text-govt-dark leading-tight">{event.title}</h5>
                                                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                        <Calendar size={10} /> {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-xs text-gray-400 italic">
                                        No upcoming events scheduled.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Connect */}
                        <div className="bg-white border p-8 rounded shadow-sm">
                            <h4 className="font-bold text-govt-dark mb-4 uppercase text-xs tracking-widest border-b pb-2">Connect & Reach out</h4>
                            <ul className="space-y-4">
                                {club.email && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <Mail size={16} className="text-govt-dark" />
                                        <span className="truncate">{club.email}</span>
                                    </li>
                                )}
                                {club.phone && (
                                    <li className="flex items-center gap-3 text-sm text-gray-600">
                                        <Phone size={16} className="text-govt-dark" />
                                        <span>{club.phone}</span>
                                    </li>
                                )}
                            </ul>
                            <div className="flex gap-4 mt-6">
                                {club.social_facebook && <a href={club.social_facebook} className="p-2 bg-gray-100 rounded-full hover:bg-govt-blue hover:text-white transition-all"><Facebook size={18} /></a>}
                                {club.social_instagram && <a href={club.social_instagram} className="p-2 bg-gray-100 rounded-full hover:bg-govt-blue hover:text-white transition-all"><Instagram size={18} /></a>}
                                {club.social_twitter && <a href={club.social_twitter} className="p-2 bg-gray-100 rounded-full hover:bg-govt-blue hover:text-white transition-all"><Twitter size={18} /></a>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubDetails;
