import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
    const { user, role, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    return (
        <nav className="glass-dark sticky top-0 z-50 text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-4">
                {/* Main Header */}
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center gap-4 group">
                        <div className="bg-white p-1.5 rounded-full transform group-hover:rotate-12 transition-transform duration-300">
                            <img src="/logo.jpeg" alt="Portal Logo" className="h-10 w-10 rounded-full" />
                        </div>
                        <div className="border-l border-white/20 pl-4">
                            <h1 className="text-xl font-extrabold leading-none tracking-tight uppercase">College Clubs</h1>
                            <p className="text-[10px] text-govt-accent font-bold uppercase mt-1 tracking-[0.2em]">Institutional Repository</p>
                        </div>
                    </Link>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex items-center gap-10">
                        <div className="flex items-center gap-8">
                            {['Directory', 'Notices', 'Events'].map((item) => (
                                <Link
                                    key={item}
                                    to={`/${item.toLowerCase()}`}
                                    className="text-sm font-bold uppercase tracking-widest hover:text-govt-accent transition-all relative group"
                                >
                                    {item}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-govt-accent transition-all group-hover:w-full"></span>
                                </Link>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 ml-6 pl-6 border-l border-white/10">
                            {user ? (
                                <div className="flex items-center gap-4">
                                    <Link to={`/dashboard/${role}`} className="flex items-center gap-2 bg-govt-accent text-govt-dark px-5 py-2 rounded-sm font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg">
                                        <User size={16} />
                                        <span>Console</span>
                                    </Link>
                                    <button onClick={() => signOut()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-300" title="Terminate Session">
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-6 text-sm font-bold">
                                    <Link to="/login" className="hover:text-govt-accent transition-colors uppercase tracking-widest">Login</Link>
                                    <Link to="/register-club" className="bg-white text-govt-dark font-black px-6 py-2.5 rounded-sm hover:bg-govt-light transition-all uppercase tracking-widest text-xs shadow-xl">
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button className="md:hidden p-2 hover:bg-white/10 rounded-sm transition-colors" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-govt-dark/95 backdrop-blur-xl border-t border-white/10 py-6 px-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-4">
                        <Link to="/directory" className="text-lg font-bold uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Clubs</Link>
                        <Link to="/notices" className="text-lg font-bold uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Notices</Link>
                        <Link to="/events" className="text-lg font-bold uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Events</Link>
                    </div>
                    <hr className="border-white/10" />
                    {user ? (
                        <div className="flex flex-col gap-4">
                            <Link to={`/dashboard/${role}`} className="text-govt-accent font-bold uppercase tracking-widest" onClick={() => setIsMenuOpen(false)}>Dashboard Console</Link>
                            <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="text-left font-bold text-red-400 uppercase tracking-widest">Logout</button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4">
                            <Link to="/login" className="flex items-center justify-center py-3 border border-white/20 font-bold uppercase tracking-widest text-xs" onClick={() => setIsMenuOpen(false)}>Login</Link>
                            <Link to="/register-club" className="flex items-center justify-center py-3 bg-govt-accent text-govt-dark font-black uppercase tracking-widest text-xs shadow-lg" onClick={() => setIsMenuOpen(false)}>Register</Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};


export default Navbar;
