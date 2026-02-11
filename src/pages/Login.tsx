import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, LogIn } from 'lucide-react';
import { supabase } from '../lib/supabase';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Fetch profile to redirect correctly
            const { data: profile } = await supabase
                .from('profiles')
                .select('*, roles(slug)')
                .eq('user_id', data.user?.id)
                .single();

            const role = profile?.roles?.slug || 'student';
            navigate(`/dashboard/${role}`);
        }
    };

    return (
        <div className="bg-govt-light min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white border-t-4 border-govt-dark shadow-xl max-w-md w-full p-8 md:p-12">
                <div className="text-center mb-10">
                    <div className="bg-govt-dark inline-block p-4 rounded-full text-white mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-govt-dark uppercase tracking-tight">Portal Authentication</h2>
                    <p className="text-sm text-gray-500 mt-2 italic">Access for Club Admins and Portal Personnel</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-govt-dark uppercase tracking-widest flex items-center gap-2">
                            <Mail size={14} /> Registered Email
                        </label>
                        <input
                            type="email"
                            required
                            placeholder="admin@college.edu.in"
                            className="w-full border-2 border-gray-200 focus:border-govt-blue outline-none px-4 py-3 transition-colors rounded-sm"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-govt-dark uppercase tracking-widest flex items-center gap-2">
                            <Lock size={14} /> Security Key
                        </label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="w-full border-2 border-gray-200 focus:border-govt-blue outline-none px-4 py-3 transition-colors rounded-sm"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-govt-dark text-white font-bold py-4 rounded-sm hover:bg-govt-blue transition-all uppercase tracking-widest flex items-center justify-center gap-3"
                    >
                        {loading ? 'Authenticating...' : (
                            <>
                                <LogIn size={20} /> Authorize Access
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t text-center space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                        Don't have an institutional account? <Link to="/signup" className="text-govt-blue hover:underline">Register Identity Here</Link>
                    </p>
                    <div className="flex flex-col gap-2">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Access strictly restricted to authorized portal personnel.</p>
                        <button onClick={() => navigate('/')} className="text-govt-blue text-xs font-black hover:underline uppercase tracking-tighter">
                            Return to Public Registry
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
