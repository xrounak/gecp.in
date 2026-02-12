import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { ClubUpdate } from '../../types';

const NoticeBoard = () => {
    const [notices, setNotices] = useState<ClubUpdate[]>([]);
    const [loading, setLoading] = useState(true);

    // Current time for purity-safe calculations
    const now = React.useMemo(() => Date.now(), []);

    useEffect(() => {
        const fetchNotices = async () => {
            const { data } = await supabase
                .from('updates')
                .select('*, clubs(name, slug)')
                .eq('is_published', true)
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) {
                setNotices(data as ClubUpdate[]);
            }
            setLoading(false);
        };

        fetchNotices();
    }, []);

    const isNew = (dateStr: string) => {
        const diff = now - new Date(dateStr).getTime();
        return diff < 48 * 60 * 60 * 1000;
    };

    return (
        <div className="card-premium overflow-hidden">
            <div className="govt-gradient text-white px-5 py-4 flex justify-between items-center relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Bell size={40} />
                </div>

                <h3 className="font-black flex items-center gap-3 uppercase text-xs tracking-[0.2em] relative z-10">
                    <Bell size={18} className="text-govt-accent" />
                    Dispatch Feed
                </h3>
                <Link to="/notices" className="text-[10px] font-bold hover:text-govt-accent transition-colors flex items-center gap-1 uppercase tracking-widest relative z-10">
                    Full Archives <ChevronRight size={14} />
                </Link>
            </div>

            <div className="divide-y divide-govt-border max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-govt-blue/20">
                {loading ? (
                    <div className="p-8 text-center text-xs text-gray-400 animate-pulse">
                        Synchronizing with central dispatch...
                    </div>
                ) : notices.length > 0 ? (
                    notices.map((notice) => (
                        <div key={notice.id} className="p-5 hover:bg-govt-light transition-colors group relative">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-govt-blue bg-govt-blue/5 border border-govt-blue/10 px-2 py-0.5 rounded-sm">
                                    {notice.type}
                                </span>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                                    {new Date(notice.published_at || notice.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                            <Link to={`/notices/${notice.id || '#'}`} className="block">
                                <h4 className="text-sm font-extrabold text-govt-dark leading-snug group-hover:text-govt-blue transition-colors">
                                    {notice.title}
                                    {isNew(notice.published_at || notice.created_at) && (
                                        <span className="ml-2 inline-flex items-center gap-1 bg-govt-accent text-govt-dark text-[8px] font-black px-1.5 py-0.5 rounded-sm shadow-sm">
                                            PRIORITY
                                        </span>
                                    )}
                                </h4>
                            </Link>
                            {notice.clubs && (
                                <Link to={`/club/${notice.clubs.slug}`} className="text-[9px] font-bold text-gray-400 mt-1 hover:text-govt-blue block">
                                    via {notice.clubs.name}
                                </Link>
                            )}
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-govt-accent scale-y-0 group-hover:scale-y-100 transition-transform origin-top"></div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center text-xs text-gray-400 italic">
                        No active dispatches at this moment.
                    </div>
                )}
            </div>

            <div className="p-4 bg-white border-t border-govt-border text-center">
                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Institutional Dispatch Service v2.4</p>
            </div>
        </div>
    );
};

export default NoticeBoard;

