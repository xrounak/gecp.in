import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HardHat, ShieldAlert, X } from 'lucide-react';

const IntroOverlay = () => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Automatically hide after 8 seconds if not dismissed
        const timer = setTimeout(() => {
            // setIsVisible(false); // Let the user dismiss it manually for institutional awareness
        }, 8000);
        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-govt-dark/95 backdrop-blur-xl"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative max-w-2xl w-full bg-white border-t-[12px] border-govt-accent shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #003366 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    </div>

                    <div className="p-10 md:p-16 text-center space-y-8 relative z-10">
                        <motion.div
                            animate={{
                                rotate: [0, -10, 10, -10, 0],
                                scale: [1, 1.1, 1]
                            }}
                            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-yellow-50 border-4 border-yellow-400 text-yellow-600 mb-4"
                        >
                            <AlertTriangle size={48} />
                        </motion.div>

                        <div className="space-y-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="text-4xl font-black text-govt-dark uppercase tracking-tighter italic leading-none"
                            >
                                Institutional Disclaimer
                            </motion.h1>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100px" }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                className="h-1 bg-govt-accent mx-auto"
                            ></motion.div>
                        </div>

                        <div className="space-y-6">
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl font-bold text-gray-800 uppercase tracking-tight"
                            >
                                UN-OFFICIAL PORTAL <span className="text-govt-accent mx-2">|</span> UNDER CONSTRUCTION
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.6 }}
                                className="bg-govt-light p-6 border-l-4 border-govt-blue text-left"
                            >
                                <div className="flex gap-4 items-start">
                                    <ShieldAlert className="text-govt-blue shrink-0 mt-1" size={20} />
                                    <p className="text-xs font-medium text-govt-dark leading-relaxed">
                                        This platform is a development prototype for the <span className="font-bold">GECP Information Management System</span>.
                                        All data, listings, and functionalities are part of an active engineering phase.
                                        Not meant for public institutional use until formal verification.
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            onClick={() => setIsVisible(false)}
                            className="btn-govt-primary px-12 py-4 text-sm font-black tracking-[0.2em] shadow-2xl"
                        >
                            ACKNOWLEDGE & ENTER
                        </motion.button>

                        <div className="flex items-center justify-center gap-6 pt-4 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><HardHat size={12} /> Dev_Node_0.8.2</span>
                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                            <span>System_Beta_Restricted</span>
                        </div>
                    </div>

                    {/* Security Lines */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400 opacity-50"></div>
                </motion.div>

                {/* Close Button Top Right */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"
                >
                    <X size={32} />
                </button>
            </motion.div>
        </AnimatePresence>
    );
};

export default IntroOverlay;
