import { Link } from 'react-router-dom';
import { Mail, MapPin } from 'lucide-react';
import { siteConfig } from '../../config/site';

const Footer = () => {
    return (
        <footer className="bg-white border-t-8 border-govt-dark mt-auto relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-govt-light rounded-full -translate-y-1/2 translate-x-1/2 opacity-50"></div>

            <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-16">
                    {/* About Column */}
                    <div className="col-span-1 md:col-span-2 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-govt-dark p-1 rounded-full overflow-hidden">
                                <img src="/logo.jpeg" alt="GECP Logo" className="h-8 w-8 invert rounded-full" />
                            </div>
                            <h3 className="text-xl font-black text-govt-dark uppercase tracking-tight">{siteConfig.name}</h3>
                        </div>
                        <p className="text-gray-500 leading-relaxed text-sm max-w-md font-medium">
                            {siteConfig.description}
                        </p>
                        <div className="flex gap-8 pt-4">
                            <div className="flex flex-col gap-2">
                                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Powered By</span>
                                <div className="flex gap-4 items-center opacity-60 hover:opacity-100 transition-opacity">
                                    <img src="/logo.jpeg" alt="Platform" className="h-6 rounded-full grayscale" />
                                    <span className="font-bold text-xs">Vite Enterprise</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="font-black text-govt-dark uppercase text-xs tracking-[0.2em] border-b border-govt-border pb-2 inline-block">Directory</h4>
                        <ul className="space-y-3 text-sm font-bold text-gray-500">
                            <li><Link to="/directory" className="hover:text-govt-blue hover:underline transition-colors flex items-center gap-2">Clubs Registry</Link></li>
                            <li><Link to="/notices" className="hover:text-govt-blue hover:underline transition-colors flex items-center gap-2">Official Notices</Link></li>
                            <li><Link to="/events" className="hover:text-govt-blue hover:underline transition-colors flex items-center gap-2">Event Calendar</Link></li>
                            <li><Link to="/register-club" className="hover:text-govt-blue hover:underline transition-colors flex items-center gap-2">New Onboarding</Link></li>
                        </ul>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-6">
                        <h4 className="font-black text-govt-dark uppercase text-xs tracking-[0.2em] border-b border-govt-border pb-2 inline-block">Contact</h4>
                        <ul className="space-y-4 text-sm text-gray-500 font-medium">
                            <li className="flex items-start gap-3">
                                <MapPin size={18} className="text-govt-accent mt-0.5 shrink-0" />
                                <span>{siteConfig.address}</span>
                            </li>
                            <li className="flex items-center gap-3 font-bold text-govt-dark">
                                <Mail size={18} className="text-govt-accent shrink-0" />
                                <span>{siteConfig.email}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Deep Footer */}
            <div className="bg-govt-dark text-white py-8">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] gap-6">
                    <p className="opacity-60">© {new Date().getFullYear()} {siteConfig.shortName} • Student Affairs</p>
                    <div className="flex gap-8">
                        <Link to="/privacy" className="hover:text-govt-accent transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-govt-accent transition-colors">Terms</Link>
                        <Link to="/sitemap" className="hover:text-govt-accent transition-colors">Sitemap</Link>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                        <span className="opacity-80">System Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
};


export default Footer;
