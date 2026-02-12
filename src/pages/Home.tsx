import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ExternalLink, Calendar, ChevronRight, Award } from 'lucide-react';
import NoticeBoard from '../components/ui/NoticeBoard';
import { supabase } from '../lib/supabase';
import type { Club } from '../types';
import { siteConfig } from '../config/site';

const Home = () => {
    const [featuredClubs, setFeaturedClubs] = useState<Club[]>([]);
    const [stats, setStats] = useState({ clubs: 0, events: 0, active: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            // Fetch Featured Clubs
            const { data: clubsData } = await supabase
                .from('clubs')
                .select('*')
                .eq('is_verified', true)
                .limit(3);

            if (clubsData) setFeaturedClubs(clubsData);

            // Fetch Stats (Approximate counts)
            const { count: clubCount } = await supabase.from('clubs').select('*', { count: 'estimated', head: true });
            const { count: eventCount } = await supabase.from('events').select('*', { count: 'estimated', head: true });

            setStats({
                clubs: clubCount || 0,
                events: eventCount || 0,
                active: (clubCount || 0) // For now assuming all are active or similar metric
            });

            setLoading(false);
        };
        fetchHomeData();
    }, []);

    return (
        <div className="bg-govt-light min-h-screen">
            {/* Hero Section */}
            <section className="govt-gradient text-white py-24 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 border-2 border-white rounded-full animate-pulse"></div>
                    <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/20 rounded-full"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center justify-between gap-16 relative z-10">
                    <div className="lg:w-3/5 space-y-8 animate-fade-up">
                        <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm shadow-xl">
                            <span className="w-2 h-2 bg-govt-accent rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{siteConfig.shortName} Official Registry</span>
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1]">
                            The Central Hub for <span className="text-govt-accent">Student Excellence</span> & Innovation
                        </h2>
                        <p className="text-xl text-white/70 max-w-2xl font-medium leading-relaxed">
                            A secure, unified platform for discovery, management, and institutional oversight of all recognized student chapters and clubs.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-6">
                            <Link to="/directory" className="btn-govt-primary !bg-govt-accent !text-govt-dark !border-orange-600 shadow-2xl hover:scale-105">
                                Explore Registry
                            </Link>
                            <Link to="/login" className="btn-govt-outline !bg-white/10 !text-white !border-white/30 hover:!bg-white/20">
                                Access Personnel Portal
                            </Link>
                            <Link to="/register-club" className="w-full md:w-auto flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-white/50 hover:text-govt-accent transition-colors mt-2 md:mt-0">
                                <Award size={14} /> Official Club Registration Flow
                            </Link>
                        </div>
                    </div>
                    <div className="lg:w-2/5 flex justify-center animate-fade-in delay-300">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-govt-accent/20 blur-2xl rounded-full group-hover:bg-govt-accent/30 transition-all duration-500"></div>
                            <div className="bg-white p-12 rounded-full shadow-2xl relative rotate-3 group-hover:rotate-0 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                                <img src="/logo.jpeg" alt="College Emblem" className="h-48 w-48 opacity-10 rounded-full" />
                                <div className="absolute inset-0 flex items-center justify-center font-black text-govt-dark text-center px-8 leading-tight">
                                    {siteConfig.acronym} <br /> STUDENT BODIES
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Stats & Notices Grid */}
            <section className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="card-premium p-10">
                            <div className="flex items-center justify-between mb-10 border-b border-govt-border pb-4">
                                <h3 className="text-2xl font-black text-govt-dark flex items-center gap-3 uppercase tracking-tight">
                                    <Award className="text-govt-accent" size={28} />
                                    Featured Repositories
                                </h3>
                                <Link to="/directory" className="text-xs font-bold text-govt-blue hover:underline">View All Clubs</Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {loading ? (
                                    [1, 2].map(i => <div key={i} className="h-48 bg-gray-50 border border-dashed rounded-sm animate-pulse"></div>)
                                ) : featuredClubs.length > 0 ? (
                                    featuredClubs.map(club => (
                                        <div key={club.id} className="group hover-lift">
                                            <div className="flex gap-5 items-start">
                                                <div className="h-20 w-20 bg-gray-50 flex-shrink-0 flex items-center justify-center rounded-full border border-govt-border p-2 group-hover:border-govt-blue transition-colors relative overflow-hidden shadow-sm">
                                                    <div className="absolute inset-0 bg-govt-blue/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                    {club.logo_url ? <img src={club.logo_url} alt={club.name} className="relative z-10 max-h-full rounded-full" /> : <Users className="text-gray-300 relative z-10" />}
                                                </div>
                                                <div className="flex-grow">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] text-govt-blue font-black uppercase tracking-widest">{club.category}</span>
                                                        {club.is_verified && <Award size={12} className="text-govt-accent" />}
                                                    </div>
                                                    <h4 className="font-extrabold text-govt-dark line-clamp-1 mt-1 group-hover:text-govt-blue transition-colors">{club.name}</h4>
                                                    <p className="text-xs text-gray-400 mt-2 line-clamp-2 leading-relaxed font-medium">{club.short_description}</p>
                                                    <Link to={`/club/${club.slug}`} className="inline-flex items-center gap-1 text-[10px] font-black text-govt-accent mt-3 uppercase tracking-widest hover:brightness-90 transition-all">
                                                        Profile Deep Dive <ChevronRight size={14} />
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-16 text-center text-gray-400 border border-dashed rounded-sm font-bold uppercase tracking-widest text-[10px]">
                                        Empty Repository State.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { label: 'Registered Entities', value: stats.clubs, icon: <Users size={22} /> },
                                { label: 'Upcoming Protocols', value: stats.events, icon: <Calendar size={22} /> },
                                { label: 'Verified Chapters', value: stats.active, icon: <Award size={22} /> },
                            ].map((stat, i) => (
                                <div key={i} className="card-premium p-8 text-center hover-lift border-b-4 border-b-govt-blue">
                                    <div className="flex justify-center text-govt-accent mb-3">{stat.icon}</div>
                                    <div className="text-3xl font-black text-govt-dark">{loading ? '-' : stat.value}</div>
                                    <div className="text-[9px] uppercase font-black text-gray-400 tracking-[0.2em] mt-2 leading-tight px-2">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-8">
                        <NoticeBoard />

                        <div className="glass-dark text-white p-8 rounded-sm shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <Search size={120} />
                            </div>
                            <h4 className="font-black border-b border-white/10 pb-3 mb-6 flex items-center gap-3 uppercase text-xs tracking-[0.15em]">
                                <Search size={18} className="text-govt-accent" /> Global Query
                            </h4>
                            <p className="text-xs mb-6 text-white/60 font-medium leading-relaxed italic">Search the institutional database by club name, official category, or specialization.</p>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="e.g. Robotics Soc, Media..."
                                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-5 py-3 rounded-sm text-sm outline-none focus:bg-white/20 transition-all"
                                />
                                <button className="absolute right-3 top-3 text-govt-accent hover:scale-110 active:scale-95 transition-transform">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                                {['Technical', 'Cultures', 'Sports', 'R&D'].map(tag => (
                                    <span key={tag} className="text-[9px] font-bold bg-white/5 border border-white/10 px-2.5 py-1 rounded-sm cursor-pointer hover:bg-govt-accent hover:text-govt-dark transition-all uppercase tracking-widest">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer-ish Info Section */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="card-premium flex flex-col md:flex-row items-center gap-12 p-12 bg-white relative overflow-hidden group">
                    <div className="absolute -bottom-10 -left-10 opacity-5 group-hover:opacity-10 transition-all duration-700">
                        <img src="/logo.jpeg" alt="Decoration" className="h-64 w-64 rotate-12" />
                    </div>
                    <div className="md:w-1/4 flex justify-center">
                        <div className="h-40 w-40 govt-gradient p-10 rounded-full flex items-center justify-center text-white shadow-2xl">
                            <img src="/logo.jpeg" alt="SAC" className="invert" />
                        </div>
                    </div>
                    <div className="md:w-3/4 space-y-6 relative z-10">
                        <h3 className="text-3xl font-black text-govt-dark uppercase tracking-tight leading-none italic">Onboarding for Aspiring Leaders</h3>
                        <p className="text-gray-500 font-medium leading-relaxed max-w-3xl">
                            Are you ready to innovate? The Students Affairs Division provides all necessary infrastructure and authorization protocols for establishing new student chapters. Review the 2026 Institutional Framework to begin your journey.
                        </p>
                        <div className="pt-2 flex flex-wrap gap-10">
                            <button className="text-govt-blue font-black text-xs uppercase tracking-widest hover:text-govt-accent transition-colors flex items-center gap-2 border-b-2 border-govt-blue pb-1">
                                <ExternalLink size={14} /> Download Protocols (PDF)
                            </button>
                            <button className="text-govt-blue font-black text-xs uppercase tracking-widest hover:text-govt-accent transition-colors flex items-center gap-2 border-b-2 border-govt-blue pb-1">
                                <ExternalLink size={14} /> Knowledge Retrieval (FAQ)
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};


export default Home;
