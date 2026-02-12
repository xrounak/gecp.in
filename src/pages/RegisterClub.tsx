import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, User, Link as LinkIcon,
    Send, CheckCircle, ArrowRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

import { siteConfig } from '../config/site';

const RegisterClub = () => {
    const { profile } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        club_name: '',
        category: '',
        description: '',
        website_url: '',
        contact_name: '',
        contact_email: '',
        social_facebook: '',
        social_instagram: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('club_requests')
            .insert([
                {
                    ...formData,
                    requested_by: profile?.user_id,
                    status: 'pending'
                }
            ]);

        if (!error) {
            setSubmitted(true);
        } else {
            alert('Error submitting request: ' + error.message);
        }
        setLoading(false);
    };

    if (!profile) {
        return (
            <div className="bg-govt-light min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white border-t-8 border-red-600 shadow-2xl max-w-2xl w-full p-12 text-center space-y-8">
                    <div className="flex justify-center flex-col items-center gap-4">
                        <div className="bg-red-50 p-6 rounded-full text-red-600">
                            <User size={64} />
                        </div>
                        <h2 className="text-3xl font-black text-govt-dark uppercase tracking-tighter">Identity Verification Required</h2>
                    </div>

                    <p className="text-gray-500 font-medium leading-relaxed max-w-md mx-auto italic">
                        The Institutional Club Registry is a restricted repository. You must establish your student identity or personnel credentials before initiating an onboarding request.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <button
                            onClick={() => navigate('/signup')}
                            className="bg-govt-dark text-white font-black px-8 py-4 rounded hover:bg-govt-blue transition-all uppercase tracking-widest text-xs"
                        >
                            Register Identity
                        </button>
                        <button
                            onClick={() => navigate('/login')}
                            className="bg-white border-2 border-govt-dark text-govt-dark font-black px-8 py-4 rounded hover:bg-govt-light transition-all uppercase tracking-widest text-xs"
                        >
                            Existing Personnel Login
                        </button>
                    </div>

                    <button onClick={() => navigate('/')} className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] hover:text-govt-blue py-4">
                        Return to Public Domain
                    </button>
                </div>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="bg-govt-light min-h-[80vh] flex items-center justify-center p-4">
                <div className="bg-white border-t-8 border-green-600 shadow-2xl max-w-2xl w-full p-12 text-center space-y-6">
                    <div className="flex justify-center">
                        <CheckCircle size={80} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold text-govt-dark uppercase tracking-tight">Application Submitted Successfully</h2>
                    <p className="text-gray-600 leading-relaxed">
                        Your application for registering <strong>{formData.club_name}</strong> has been received by the Student Affairs Division.
                        A reference ID has been generated and sent to <strong>{formData.contact_email}</strong>.
                    </p>
                    <div className="bg-gray-50 p-6 border rounded text-sm text-left">
                        <p className="font-bold text-govt-dark mb-2 uppercase tracking-widest text-xs">Next Steps:</p>
                        <ul className="list-disc pl-5 space-y-2 text-gray-500">
                            <li>Verification of documents by the Moderator (2-3 working days)</li>
                            <li>Email notification for physical vetting (if required)</li>
                            <li>Provision of administrative credentials upon approval</li>
                        </ul>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-govt-dark text-white font-bold px-8 py-3 rounded hover:bg-govt-blue transition-all"
                    >
                        Return to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-govt-light min-h-screen pb-20">
            {/* Header */}
            <div className="bg-govt-dark text-white py-12 px-4 shadow-inner">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl font-bold uppercase tracking-tight border-l-4 border-govt-accent pl-6">New Club Registration Portal</h2>
                    <p className="mt-2 text-gray-400 pl-10">Official Onboarding for Institutional Recognition (Session {new Date().getFullYear()}-{new Date().getFullYear() + 1})</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 -mt-6">
                {/* Progress Indicator */}
                <div className="flex items-center gap-2 mb-8 bg-white p-4 shadow-sm border rounded">
                    {[1, 2, 3].map(i => (
                        <React.Fragment key={i}>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= i ? 'bg-govt-dark text-white' : 'bg-gray-200 text-gray-500'}`}>
                                {i}
                            </div>
                            {i < 3 && <div className={`flex-grow h-1 ${step > i ? 'bg-govt-dark' : 'bg-gray-200'}`}></div>}
                        </React.Fragment>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="bg-white shadow-xl border rounded overflow-hidden">
                    <div className="p-8 md:p-12">
                        {step === 1 && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="border-b pb-4 mb-8">
                                    <h3 className="text-xl font-bold text-govt-dark flex items-center gap-2 uppercase tracking-tight">
                                        <FileText size={20} className="text-govt-accent" /> Section I: Basic Club Information
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Club Official Name</label>
                                        <input
                                            type="text" name="club_name" required
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            placeholder="e.g. GECP Robotics Society"
                                            value={formData.club_name} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Category Type</label>
                                        <select
                                            name="category" required
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            value={formData.category} onChange={handleChange}
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Technical">Technical</option>
                                            <option value="Art & Culture">Art & Culture</option>
                                            <option value="Drama">Drama</option>
                                            <option value="Sports">Sports</option>
                                            <option value="Photography">Photography</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Short Description / Moto</label>
                                        <textarea
                                            name="description" required rows={3}
                                            className="w-full border-2 border-gray-100 p-3 rounded focus:border-govt-blue outline-none text-sm transition-all"
                                            placeholder="Briefly describe the club's primary objective..."
                                            value={formData.description} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="border-b pb-4 mb-8">
                                    <h3 className="text-xl font-bold text-govt-dark flex items-center gap-2 uppercase tracking-tight">
                                        <User size={20} className="text-govt-accent" /> Section II: Lead Representative Details
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Person Name</label>
                                        <input
                                            type="text" name="contact_name" required
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            placeholder="Full Name"
                                            value={formData.contact_name} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Institutional Email ID</label>
                                        <input
                                            type="email" name="contact_email" required
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            placeholder="official@gmail.com"
                                            value={formData.contact_email} onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in duration-500">
                                <div className="border-b pb-4 mb-8">
                                    <h3 className="text-xl font-bold text-govt-dark flex items-center gap-2 uppercase tracking-tight">
                                        <LinkIcon size={20} className="text-govt-accent" /> Section III: Digital Presence (Optional)
                                    </h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">External Website URL</label>
                                        <input
                                            type="url" name="website_url"
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            placeholder="https://yourclub.com"
                                            value={formData.website_url} onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instagram Handle</label>
                                        <input
                                            type="text" name="social_instagram"
                                            className="w-full border-b-2 border-gray-200 focus:border-govt-blue outline-none py-2 text-sm transition-all"
                                            placeholder="@yourclub"
                                            value={formData.social_instagram} onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="bg-yellow-50 p-4 border-l-4 border-yellow-400 text-xs text-yellow-800 space-y-2">
                                    <p className="font-bold flex items-center gap-1 uppercase tracking-tight">Declaration:</p>
                                    <p>I hereby declare that the information provided above is true to the best of my knowledge and complies with the {siteConfig.shortName} Guidelines of {new Date().getFullYear()}.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-8 border-t flex justify-between">
                        {step > 1 ? (
                            <button
                                type="button" onClick={() => setStep(step - 1)}
                                className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-govt-dark py-2 px-6"
                            >
                                <ArrowLeft size={18} /> Back
                            </button>
                        ) : <div></div>}

                        {step < 3 ? (
                            <button
                                type="button" onClick={() => setStep(step + 1)}
                                className="flex items-center gap-2 bg-govt-dark text-white font-bold py-2 px-8 rounded hover:bg-govt-blue transition-all"
                            >
                                Continue <ArrowRight size={18} />
                            </button>
                        ) : (
                            <button
                                type="submit" disabled={loading}
                                className="flex items-center gap-2 bg-govt-accent text-govt-dark font-extrabold py-3 px-10 rounded shadow-lg hover: brightness-110 transition-all uppercase tracking-widest"
                            >
                                {loading ? 'Submitting Application...' : (
                                    <>
                                        <Send size={18} /> Submit Application
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterClub;
