import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const SignUp = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 1. Sign Up the user via Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (signUpError) {
            setError(signUpError.message);
            setLoading(false);
            return;
        }

        if (data.user) {
            // 2. Update the profile with full name (trigger handle_new_user should have created the base profile)
            // But we can also do an explicit update here for safety and name assignment
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: fullName,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', data.user.id);

            if (profileError) {
                console.error('Error updating profile:', profileError);
                // Non-blocking for the user
            }

            setSuccess(true);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-govt-light min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white border-t-8 border-govt-accent shadow-2xl max-w-md w-full p-12 text-center space-y-6">
                    <div className="bg-govt-dark inline-block p-6 rounded-full text-white">
                        <UserPlus size={48} />
                    </div>
                    <h2 className="text-3xl font-bold text-govt-dark uppercase tracking-tight leading-none">Account Initiated</h2>
                    <p className="text-gray-500 font-medium italic">
                        Your institutional identity index has been created. Please check your email <strong>{email}</strong> for verification.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full bg-govt-dark text-white font-black py-4 rounded hover:bg-govt-blue transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    >
                        Proceed to Login <ArrowRight size={20} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-govt-light min-h-[80vh] flex items-center justify-center p-4">
            <div className="bg-white border-t-4 border-govt-dark shadow-xl max-w-md w-full p-8 md:p-12">
                <div className="text-center mb-10">
                    <div className="bg-govt-dark inline-block p-4 rounded-full text-white mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-govt-dark uppercase tracking-tight">Student Registration</h2>
                    <p className="text-sm text-gray-400 mt-2 italic font-medium">Register your identity to access institutional features.</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-govt-dark uppercase tracking-[0.2em] flex items-center gap-2">
                            <User size={14} /> Full Legal Name
                        </label>
                        <input
                            type="text" required
                            className="w-full border-b-2 border-gray-100 focus:border-govt-blue outline-none px-0 py-2 text-sm transition-all"
                            placeholder="AS PER COLLEGE RECORDS"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-govt-dark uppercase tracking-[0.2em] flex items-center gap-2">
                            <Mail size={14} /> Institutional Email
                        </label>
                        <input
                            type="email" required
                            className="w-full border-b-2 border-gray-100 focus:border-govt-blue outline-none px-0 py-2 text-sm transition-all"
                            placeholder="name@college.edu.in"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-govt-dark uppercase tracking-[0.2em] flex items-center gap-2">
                            <Lock size={14} /> Security Key
                        </label>
                        <input
                            type="password" required
                            className="w-full border-b-2 border-gray-100 focus:border-govt-blue outline-none px-0 py-2 text-sm transition-all"
                            placeholder="MINIMUM 6 CHARACTERS"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-govt-dark text-white font-black py-4 hover:bg-govt-blue transition-all uppercase tracking-[0.25em] shadow-lg flex items-center justify-center gap-2"
                        >
                            {loading ? 'Processing...' : (
                                <>
                                    <ArrowRight size={18} /> Register Identity
                                </>
                            )}
                        </button>
                    </div>
                </form>

                <div className="mt-10 pt-8 border-t text-center space-y-4">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed px-4">
                        Note: This is for user account creation only. To register a new club entity, use the club registry flow after login.
                    </p>
                    <div className="text-xs font-bold text-gray-500">
                        Already have an account? <Link to="/login" className="text-govt-blue hover:underline">Login here</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignUp;
