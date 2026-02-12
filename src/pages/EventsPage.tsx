import { useEffect, useState } from 'react';
import { Calendar, MapPin, Globe, ExternalLink, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import type { ClubEvent } from '../types';

const EventsPage = () => {
    const [events, setEvents] = useState<ClubEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            const { data } = await supabase
                .from('events')
                .select('*, clubs(name, slug)')
                .eq('is_published', true)
                .order('start_time', { ascending: true });

            setEvents((data as ClubEvent[]) || []);
            setLoading(false);
        };
        fetchEvents();
    }, []);

    return (
        <div className="bg-govt-light min-h-screen pb-20">
            <div className="bg-govt-dark text-white py-12 px-4 shadow-inner">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="md:w-2/3">
                        <h2 className="text-4xl font-black uppercase tracking-tight">Institutional Events Calendar</h2>
                        <p className="mt-2 text-gray-400">Centrally managed schedule for all student-led events and chapters</p>
                    </div>
                    <div className="md:w-1/3 flex justify-end">
                        <div className="bg-govt-blue/50 p-6 rounded border border-white/10 text-center">
                            <div className="text-3xl font-bold">{events.length}</div>
                            <div className="text-[10px] uppercase font-bold tracking-widest text-govt-accent">Active Events Tracked</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-12">
                {loading ? (
                    <div className="p-20 text-center bg-white border animate-pulse rounded">Synchronizing with Official Calendar...</div>
                ) : events.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {events.map((event) => (
                            <div key={event.id} className="bg-white border hover:shadow-xl transition-all group rounded-sm overflow-hidden flex flex-col md:flex-row">
                                {/* Date Side Panel */}
                                <div className="md:w-32 bg-gray-50 border-r flex flex-col items-center justify-center p-6 gap-1 group-hover:bg-govt-blue group-hover:text-white transition-colors">
                                    <span className="text-xs font-bold uppercase tracking-widest">{new Date(event.start_time).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-4xl font-black leading-none">{new Date(event.start_time).getDate()}</span>
                                    <span className="text-[10px] font-medium opacity-60">{new Date(event.start_time).getFullYear()}</span>
                                </div>

                                {/* Event Details */}
                                <div className="flex-grow p-8 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Link to={`/ club / ${event.clubs?.slug} `} className="text-[10px] font-bold text-govt-blue uppercase tracking-widest hover:underline">
                                            Hosted by: {event.clubs?.name}
                                        </Link>
                                        <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold border border-red-100">UPCOMING</span>
                                    </div>
                                    <h3 className="text-xl font-extrabold text-govt-dark leading-tight group-hover:underline cursor-pointer">
                                        {event.title}
                                    </h3>
                                    <div className="flex flex-wrap gap-6 text-xs text-gray-500">
                                        <span className="flex items-center gap-1.5 font-medium"><Clock size={14} className="text-govt-accent" /> {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Onwards</span>
                                        <span className="flex items-center gap-1.5 font-medium">
                                            {event.is_online ? <Globe size={14} className="text-govt-blue" /> : <MapPin size={14} className="text-govt-blue" />}
                                            {event.location || "Location TBD"}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                                        {event.description || "Official institutional event coordinated by students chapters. Click for more details."}
                                    </p>
                                    <div className="pt-2 flex justify-between items-center">
                                        <button onClick={() => window.open(event.registration_url, "_blank")} className="text-xs font-bold text-govt-dark flex items-center gap-1 hover:text-govt-accent">
                                            Full Protocol <ChevronRight size={14} />
                                        </button>
                                        {event.registration_url && (
                                            <a href={event.registration_url} className="bg-govt-dark text-white px-6 py-2 rounded text-xs font-bold shadow-md hover:bg-govt-blue transition-all uppercase tracking-widest">
                                                Register Now
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border p-32 text-center rounded text-gray-400 capitalize bg-[url('https://www.transparenttextures.com/patterns/grid-me.png')]">
                        Historical data only. No upcoming events scheduled in the official roster.
                    </div>
                )}
            </div>

            {/* Guidelines Section */}
            <div className="max-w-7xl mx-auto px-4 mt-20">
                <div className="bg-white border p-12 rounded-sm shadow-sm flex flex-col md:flex-row items-center gap-12">
                    <div className="md:w-2/3 space-y-4">
                        <h4 className="text-2xl font-bold text-govt-dark uppercase tracking-tight">Organizing Institutional Events</h4>
                        <p className="text-gray-600">
                            All events listed here have undergone institutional vetting by the Students Affairs Division.
                            To host an event, club admins must submit a formal protocol request through their dashboard at least 15 days in advance.
                        </p>
                        <button className="text-govt-blue font-bold text-sm flex items-center gap-1 underline">
                            <ExternalLink size={16} /> Read Event Authorization Policy
                        </button>
                    </div>
                    <div className="md:w-1/3 flex justify-center">
                        <div className="h-40 w-40 border-8 border-govt-light rounded-full flex items-center justify-center bg-gray-50 text-govt-dark relative">
                            <Calendar size={64} className="opacity-10" />
                            <div className="absolute inset-0 flex items-center justify-center font-black text-4xl">SAC</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventsPage;
