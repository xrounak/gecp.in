import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications } from '../../lib/notifications';
import { siteConfig } from '../../config/site';

const Navbar = () => {
    const { user, role, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [notificationCount, setNotificationCount] = React.useState(0);

    // Fetch notification count when user is logged in
    React.useEffect(() => {
        if (user) {
            const fetchNotifications = async () => {
                const { data } = await getUserNotifications(user.id, 10);
                setNotificationCount(data?.length || 0);
            };
            fetchNotifications();
            // Poll every 30 seconds for new notifications
            const interval = setInterval(fetchNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <nav className="glass-dark sticky top-0 z-50 text-white shadow-2xl">
            <div className="max-w-7xl mx-auto px-4">
                {/* Main Header */}
                <div className="flex justify-between items-center h-20">
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="bg-govt-dark p-1.5 rounded-full overflow-hidden transition-transform group-hover:scale-105 shadow-md border border-govt-border">
                            <img src="/logo2.jpeg" alt="GECP" className="h-8 w-8 invert rounded-full" />
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-black text-govt-dark leading-none tracking-tight group-hover:text-govt-blue transition-colors uppercase">
                                {siteConfig.acronym} <span className="text-govt-accent">Portal</span>
                            </h1>
                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Student Affairs Div.</span>
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
                                <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[9px] font-black text-govt-accent uppercase tracking-widest leading-none mb-1">
                                            {role?.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] font-medium text-white/50 lowercase leading-none truncate max-w-[120px]">
                                            {user.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Notification Bell */}
                                        <Link
                                            to="/dashboard/student"
                                            className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
                                            title="Notifications"
                                        >
                                            <Bell size={20} />
                                            {notificationCount > 0 && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                                                    {notificationCount > 9 ? '9+' : notificationCount}
                                                </span>
                                            )}
                                        </Link>
                                        <Link to={`/dashboard/${role}`} className="flex items-center gap-2 bg-govt-accent text-govt-dark px-5 py-2 rounded-sm font-black text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg">
                                            <User size={16} />
                                            <span>Console</span>
                                        </Link>
                                        <button onClick={() => signOut()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-300" title="Terminate Session">
                                            <LogOut size={20} />
                                        </button>
                                    </div>
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
                        <div className="flex flex-col gap-6">
                            <div className="bg-white/5 p-4 rounded-sm border border-white/10">
                                <p className="text-[10px] font-black text-govt-accent uppercase tracking-[.2em] mb-1">{role?.replace('_', ' ')}</p>
                                <p className="text-xs font-medium text-white/70">{user.email}</p>
                            </div>
                            <div className="flex flex-col gap-4">
                                <Link to={`/dashboard/${role}`} className="text-govt-accent font-bold uppercase tracking-widest text-lg" onClick={() => setIsMenuOpen(false)}>Dashboard Console</Link>
                                <button onClick={() => { signOut(); setIsMenuOpen(false); }} className="text-left font-bold text-red-400 uppercase tracking-widest">Logout Session</button>
                            </div>
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
