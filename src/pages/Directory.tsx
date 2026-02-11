import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Users, ChevronRight, Award } from 'lucide-react';

import { supabase } from '../lib/supabase';

const Directory = () => {
    const [clubs, setClubs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [categories, setCategories] = useState<any[]>([]);

    const fetchCategories = async () => {
        const { data } = await supabase.from('categories').select('*');
        if (data) setCategories(data);
    };

    const fetchClubs = async () => {
        let query = supabase.from('clubs').select('*').eq('is_active', true);
        const { data } = await query;
        if (data) setClubs(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchCategories();
        fetchClubs();
    }, []);

    const filteredClubs = clubs.filter(club => {
        const matchesSearch = club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            club.short_description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="bg-govt-light min-h-screen pb-24">
            {/* Page Header */}
            <div className="bg-white border-b border-govt-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 govt-gradient rounded-full opacity-[0.03] translate-x-1/2 -translate-y-1/2"></div>
                <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
                    <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">
                        <Link to="/" className="hover:text-govt-blue transition-colors">Home</Link>
                        <ChevronRight size={12} className="text-govt-accent" />
                        <span className="text-govt-dark">Registry</span>
                    </nav>
                    <h2 className="text-4xl font-black text-govt-dark uppercase tracking-tight italic">Institutional Registry</h2>
                    <p className="text-gray-500 font-medium mt-2 max-w-2xl">Official repository of all recognized student chapters, organizations, and special interest groups authorized by the Student Affairs Division.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-12">
                <div className="flex flex-col lg:flex-row gap-10">
                    {/* Filters Sidebar */}
                    <aside className="lg:w-1/4 space-y-6">
                        <div className="card-premium p-8">
                            <h3 className="text-xs font-black text-govt-dark uppercase tracking-[0.2em] border-b border-govt-border pb-4 mb-6 flex items-center gap-3">
                                <Filter size={18} className="text-govt-accent" /> Query Parameters
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Institutional Category</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-govt-light border border-govt-border rounded-sm px-4 py-2.5 text-xs font-bold text-govt-dark outline-none focus:border-govt-blue focus:ring-1 focus:ring-govt-blue/20 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="All">Global (All)</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.label}>{cat.label}</option>
                                        ))}
                                        {!categories.length && [
                                            'Technical', 'Culture', 'Sports', 'R&D', 'Social'
                                        ].map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Protocol Order</label>
                                    <select className="w-full bg-govt-light border border-govt-border rounded-sm px-4 py-2.5 text-xs font-bold text-govt-dark outline-none appearance-none cursor-pointer">
                                        <option>Lexicographical (A-Z)</option>
                                        <option>Recent Activation</option>
                                        <option>High Engagement</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-govt-border">
                                <div className="bg-govt-dark text-white p-6 rounded-sm relative overflow-hidden">
                                    <Users className="absolute -bottom-4 -right-4 opacity-10" size={80} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-govt-accent mb-2">Member Access</p>
                                    <p className="text-[10px] font-medium leading-relaxed opacity-70">Club membership status is governed by individual chapter statutes. Check eligibility before requesting access.</p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Directory Content */}
                    <main className="lg:w-3/4 space-y-8 animate-fade-in">
                        {/* Search Bar */}
                        <div className="card-premium p-4 flex items-center gap-4">
                            <div className="bg-govt-light p-2 rounded-sm text-govt-blue">
                                <Search size={20} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by registry name, focus area, or keyword..."
                                className="flex-grow bg-transparent outline-none text-sm font-bold text-govt-dark placeholder:text-gray-300"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="flex items-center gap-3 px-4 border-l border-govt-border">
                                <span className="text-[10px] font-black text-govt-blue uppercase tracking-widest whitespace-nowrap">
                                    {filteredClubs.length} Entities
                                </span>
                            </div>
                        </div>

                        {/* Clubs Grid/Table Loop */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {loading ? (
                                [1, 2, 3, 4].map(i => <div key={i} className="h-64 card-premium animate-pulse"></div>)
                            ) : filteredClubs.length > 0 ? (
                                filteredClubs.map(club => (
                                    <div key={club.id} className="card-premium group hover-lift overflow-hidden flex flex-col">
                                        <div className="p-8 flex gap-6">
                                            <div className="h-24 w-24 bg-govt-light border border-govt-border rounded-full flex-shrink-0 flex items-center justify-center p-3 relative group-hover:border-govt-blue transition-colors overflow-hidden">
                                                {club.logo_url ? (
                                                    <img src={club.logo_url} alt={club.name} className="max-h-full max-w-full object-contain filter grayscale group-hover:grayscale-0 transition-all rounded-full" />
                                                ) : (
                                                    <Users size={40} className="text-gray-200" />
                                                )}
                                                {club.is_verified && (
                                                    <div className="absolute -top-3 -right-3 bg-govt-accent p-1.5 rounded-full shadow-lg border-2 border-white">
                                                        <Award size={14} className="text-govt-dark" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-grow">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-[9px] text-govt-blue font-black uppercase tracking-[0.2em]">{club.category}</span>
                                                </div>
                                                <h3 className="font-black text-govt-dark text-xl leading-tight group-hover:text-govt-blue transition-colors">
                                                    {club.name}
                                                </h3>
                                                <p className="text-xs text-gray-400 mt-3 line-clamp-2 leading-relaxed font-medium capitalize">
                                                    {club.short_description || "Registry details pending for this student chapter."}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-auto border-t border-govt-border p-4 bg-gray-50 flex justify-between items-center px-8 text-white">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Operational</span>
                                            </div>
                                            <Link to={`/club/${club.slug}`} className="text-[10px] font-black text-govt-dark hover:text-govt-accent flex items-center gap-2 uppercase tracking-widest transition-colors">
                                                Access Dossier <ChevronRight size={16} />
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-24 text-center card-premium bg-govt-light/50 border-dashed">
                                    <div className="flex justify-center mb-6 text-gray-200">
                                        <Search size={64} />
                                    </div>
                                    <h4 className="text-lg font-black text-govt-dark uppercase tracking-tight italic">Query Returned Zero Results</h4>
                                    <p className="text-gray-400 text-sm mt-2 max-w-xs mx-auto font-medium">No official chapters match your current filtering parameters.</p>
                                    <button
                                        onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                                        className="btn-govt-outline mt-8 px-10"
                                    >
                                        Reset Query
                                    </button>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};


export default Directory;
