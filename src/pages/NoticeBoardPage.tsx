import { useEffect, useState } from 'react';
import {
    Bell, ChevronRight, ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import type { ClubUpdate } from '../types';

const NoticeBoardPage = () => {
    const [notices, setNotices] = useState<ClubUpdate[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        const fetchNotices = async () => {
            const { data } = await supabase
                .from('updates')
                .select('*, clubs(name, slug)')
                .eq('is_published', true)
                .order('published_at', { ascending: false });

            setNotices((data as ClubUpdate[]) || []);
            setLoading(false);
        };
        fetchNotices();
    }, []);

    const filteredNotices = filter === 'All' ? notices : notices.filter(n => n.type === filter);

    return (
        <div className="bg-govt-light min-h-screen pb-20">
            <div className="bg-white border-b py-8 shadow-sm">
                <div className="max-w-7xl mx-auto px-4">
                    <h2 className="text-3xl font-bold text-govt-dark flex items-center gap-3">
                        <Bell className="text-govt-accent" />
                        Institutional Notice Board
                    </h2>
                    <p className="text-gray-600 mt-1">Official updates and announcements from all recognized clubs</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-8 flex flex-col md:flex-row gap-8">
                {/* Filter Sidebar */}
                <aside className="md:w-1/4 space-y-4">
                    <div className="bg-white border p-6 rounded shadow-sm">
                        <h4 className="font-bold text-govt-dark uppercase text-xs tracking-widest border-b pb-2 mb-4">Notice Type</h4>
                        <div className="space-y-2">
                            {['All', 'Notice', 'Announcement', 'Event', 'Urgent'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilter(type)}
                                    className={`w-full text-left px-3 py-2 rounded text-sm transition-all ${filter === type ? 'bg-govt-blue text-white font-bold' : 'hover:bg-gray-100 text-gray-600'}`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Notices Main List */}
                <div className="md:w-3/4 space-y-4">
                    {loading ? (
                        <div className="p-20 text-center animate-pulse">Scanning Archive...</div>
                    ) : filteredNotices.length > 0 ? (
                        filteredNotices.map(notice => (
                            <div key={notice.id} className="bg-white border p-6 shadow-sm hover:shadow-md transition-shadow group flex items-start gap-6">
                                <div className="flex flex-col items-center justify-center bg-gray-50 border rounded p-3 min-w-[80px]">
                                    <span className="text-[10px] uppercase font-bold text-govt-blue">{new Date(notice.published_at).toLocaleString('default', { month: 'short' })}</span>
                                    <span className="text-2xl font-black text-govt-dark">{new Date(notice.published_at).getDate()}</span>
                                </div>
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-bold text-govt-accent uppercase tracking-widest">{notice.type}</span>
                                        <Link to={`/club/${notice.clubs?.slug}`} className="text-xs text-govt-blue hover:underline font-bold flex items-center gap-1">
                                            {notice.clubs?.name} <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                    <h3 className="text-lg font-bold text-govt-dark mt-1 group-hover:text-govt-blue transition-colors">{notice.title}</h3>
                                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{notice.body}</p>
                                    {notice.redirect_url && (
                                        <a href={notice.redirect_url} className="inline-flex items-center gap-1 text-xs font-bold text-govt-blue mt-4 hover:underline">
                                            View Document / Reference <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border p-20 text-center text-gray-400 italic rounded">
                            No active notifications found in this category.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoticeBoardPage;
