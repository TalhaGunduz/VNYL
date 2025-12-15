import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, CheckCircle2, FileText, Mail, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const STEPS = [
    { id: 1, title: 'Confirmation' },
    { id: 2, title: 'Benefits' },
    { id: 3, title: 'Terms' },
    { id: 4, title: 'Verification' },
    { id: 5, title: 'Complete' }
];

const VerificationModal = ({ isOpen, onClose, onSuccess }: VerificationModalProps) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isAgreed, setIsAgreed] = useState(false);
    const [emailCode, setEmailCode] = useState('');
    const [isSendingCode, setIsSendingCode] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleNext = () => setCurrentStep(prev => prev + 1);
    const handleBack = () => setCurrentStep(prev => prev - 1);

    const handleSendCode = async () => {
        setIsSendingCode(true);
        // Simulate API
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsSendingCode(false);
        setCodeSent(true);

        // Auto-fill for demo purposes after "sending"
        // In a real app the user checks their email
        // setEmailCode('123456'); 

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'info',
            title: 'Verification code sent',
            showConfirmButton: false,
            timer: 3000,
            background: '#333',
            color: '#fff'
        });
    };

    const handleFinalSubmit = async () => {
        if (!emailCode) return;
        setIsSubmitting(true);

        // Simulate API Verification
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update User State
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const user = JSON.parse(storedUser);
            user.verification_status = 'pending'; // 'verified' would be after admin review usually
            localStorage.setItem('user', JSON.stringify(user));
            window.dispatchEvent(new Event('storage'));
        }

        setIsSubmitting(false);
        handleNext(); // Move to step 5 (Success)

        // Call onSuccess after a delay or just let them close it manually
        // onSuccess(); 
    };

    // Render step content
    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Confirmation
                return (
                    <div className="space-y-6 text-center py-6">
                        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4">
                            <ShieldCheck size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-white">Apply for Verified Status?</h3>
                        <p className="text-white/60 leading-relaxed">
                            Verification badges confirm your identity as an artist. This process involves a manual review by our team to ensure the authenticity of your profile.
                        </p>
                    </div>
                );
            case 2: // Benefits
                return (
                    <div className="space-y-6 py-4">
                        <h3 className="text-xl font-bold text-white mb-6">Why Get Verified?</h3>
                        <div className="space-y-4">
                            {[
                                "Official Blue Checkmark on your profile",
                                "Priority placement in search results",
                                "Access to advanced artist analytics",
                                "Direct support channel for artists"
                            ].map((benefit, i) => (
                                <div key={i} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <span className="text-white/90 font-medium">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 3: // Terms
                return (
                    <div className="space-y-6 py-4">
                        <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)] mb-2">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-white">Terms & Conditions</h3>
                        <div className="h-48 overflow-y-auto bg-black/20 rounded-xl p-4 border border-white/10 text-sm text-white/60 space-y-4 leading-relaxed">
                            <p>By applying for artist verification, you agree to the VNYL Artist Agreement.</p>
                            <p>1. You represent that you are the creator or authorized representative of the content you upload.</p>
                            <p>2. You acknowledge that providing false information may result in immediate account suspension.</p>
                            <p>3. Verification status is a privilege and may be revoked if you violate community guidelines.</p>
                            <p>4. You grant VNYL the right to feature your verified profile in promotional materials.</p>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={isAgreed}
                                onChange={(e) => setIsAgreed(e.target.checked)}
                                className="w-5 h-5 rounded border-white/30 bg-black/40 text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                            />
                            <span className="text-white/80 group-hover:text-white transition-colors select-none">I have read and agree to the terms above.</span>
                        </label>
                    </div>
                );
            case 4: // Email Verification
                return (
                    <div className="space-y-6 py-4">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-white mb-2">Verify Your Email</h3>
                            <p className="text-white/40 text-sm">We need to confirm you have access to the email linked to this account.</p>
                        </div>

                        {!codeSent ? (
                            <div className="text-center py-8">
                                <button
                                    onClick={handleSendCode}
                                    disabled={isSendingCode}
                                    className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all flex items-center gap-3 mx-auto"
                                >
                                    {isSendingCode ? <div className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></div> : <Mail size={20} />}
                                    Send Verification Code
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 max-w-xs mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <label className="text-xs font-bold text-white/40 uppercase tracking-wider ml-1">Enter Code</label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder="e.g. 123456"
                                    className="w-full bg-black/40 border-0 rounded-xl px-5 py-4 text-white text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-[var(--accent)]"
                                    maxLength={6}
                                />
                                <p className="text-center text-white/30 text-xs">A code has been sent to your email.</p>
                            </div>
                        )}
                    </div>
                );
            case 5: // Complete
                return (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            type="spring"
                            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-black shadow-xl shadow-green-500/20"
                        >
                            <CheckCircle2 size={48} strokeWidth={3} />
                        </motion.div>
                        <div>
                            <h2 className="text-3xl font-black text-white mb-2">Request Submitted!</h2>
                            <p className="text-white/50 max-w-xs mx-auto">
                                Your account is currently under review. You will be notified once the process is complete.
                            </p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="bg-[#18181b] border border-white/10 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div>
                                <h2 className="text-lg font-bold text-white">Artist Verification</h2>
                                <p className="text-white/40 text-xs">Step {currentStep} of 5</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-white/5">
                            <motion.div
                                className="h-full bg-[var(--accent)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentStep / 5) * 100}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>

                        {/* Content Body */}
                        <div className="p-8 overflow-y-auto flex-1">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full"
                                >
                                    {renderStepContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-white/10 bg-black/20 flex justify-between items-center">
                            {currentStep > 1 && currentStep < 5 && (
                                <button
                                    onClick={handleBack}
                                    className="px-6 py-3 rounded-xl font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                                >
                                    <ArrowLeft size={18} />
                                    Back
                                </button>
                            )}

                            {/* Spacer if no back button */}
                            {currentStep === 1 && <div />}
                            {currentStep === 5 && <div />}

                            {/* Next / Submit Buttons */}
                            {currentStep === 1 && (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center gap-2"
                                >
                                    Start Application
                                    <ChevronRight size={18} />
                                </button>
                            )}

                            {currentStep === 2 && (
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90 transition-all flex items-center gap-2"
                                >
                                    I Understand
                                    <ChevronRight size={18} />
                                </button>
                            )}

                            {currentStep === 3 && (
                                <button
                                    onClick={handleNext}
                                    disabled={!isAgreed}
                                    className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-bold hover:bg-[var(--accent-light)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                >
                                    Continue
                                    <ChevronRight size={18} />
                                </button>
                            )}

                            {currentStep === 4 && (
                                <button
                                    onClick={handleFinalSubmit}
                                    disabled={!emailCode || isSubmitting}
                                    className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-bold hover:bg-[var(--accent-light)] transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--accent)]/20"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Verification'}
                                </button>
                            )}

                            {currentStep === 5 && (
                                <button
                                    onClick={() => {
                                        onSuccess();
                                        onClose();
                                    }}
                                    className="px-10 py-3 rounded-xl bg-white text-black font-bold hover:scale-105 transition-all shadow-lg shadow-white/10"
                                >
                                    Back to Artist Dashboard
                                </button>
                            )}
                        </div>

                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default VerificationModal;
