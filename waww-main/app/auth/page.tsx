"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, CheckCircle2, Lock, ChevronRight, User, Loader2, Building, Mail, Phone, MapPin, Hash, Eye, EyeOff, Clock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";
import { api } from "../../lib/axios";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthPage() {
  const router = useRouter();
  const [role, setRole] = useState<'none' | 'owner' | 'admin'>('none');
  
  // Auth State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [googleAuthStatus, setGoogleAuthStatus] = useState<'idle' | 'authenticating' | 'verified'>('idle');
  const [ownerTab, setOwnerTab] = useState<'register' | 'login'>('register');
  const [ownerStep, setOwnerStep] = useState<'form' | 'submitting' | 'pending' | 'approved'>('form');
  const [showPw, setShowPw] = useState(false);
  const [ownerForm, setOwnerForm] = useState({ firstName: '', lastName: '', parkingName: '', location: '', spots: '', phone: '', email: '', password: '' });
  const [ownerLogin, setOwnerLogin] = useState({ email: '', password: '' });

  const ownerRegValid = ownerForm.firstName.trim() && ownerForm.lastName.trim() && ownerForm.email.trim() && ownerForm.password.trim();
  const ownerLoginValid = ownerLogin.email.trim() && ownerLogin.password.trim();

  const handleGoogleSuccess = async (tokenResponse: { access_token: string }) => {
    try {
      if (role === 'owner') setOwnerStep('submitting');
      else setGoogleAuthStatus('authenticating');

      const res = await api.post("/auth/google-login", { token: tokenResponse.access_token });
      localStorage.setItem("gariha_token", res.data.access_token);
      
      const userRes = await api.get("/auth/me");
      const user = userRes.data;
      
      if (user.role === "admin") {
         if (role !== 'admin') {
           setRole('admin');
         }
         setGoogleAuthStatus('verified');
         setTimeout(() => router.push('/admin'), 1000);
      } else {
         if (role === 'admin') {
           alert("You do not have admin privileges. Redirecting to owner portal.");
           setRole('owner');
         }
         if (user.status === "approved") {
            router.push('/owner');
         } else {
            setOwnerStep('pending');
         }
      }
    } catch (err) {
      console.error(err);
      if (role === 'owner') setOwnerStep('form');
      else setGoogleAuthStatus('idle');
      alert("Google authentication failed. Please try again.");
    }
  };

  const handleOwnerRegister = async () => {
    if (!ownerRegValid) return;
    setOwnerStep('submitting');
    try {
      const payload = {
        first_name: ownerForm.firstName,
        last_name: ownerForm.lastName,
        email: ownerForm.email,
        password: ownerForm.password,
        phone: ownerForm.phone,
        parking_name: ownerForm.parkingName,
        location: ownerForm.location,
        spots: ownerForm.spots ? parseInt(ownerForm.spots.toString(), 10) : 0
      };
      await api.post("/auth/register", payload);
      setOwnerStep('pending');
    } catch (err: unknown) {
      console.error(err);
      alert((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Registration failed");
      setOwnerStep('form');
    }
  };

  const handleOwnerLogin = async () => {
    if (!ownerLoginValid) return;
    setOwnerStep('submitting');
    try {
      const payload = {
        email: ownerLogin.email,
        password: ownerLogin.password
      };
      const res = await api.post("/auth/login", payload);
      localStorage.setItem("gariha_token", res.data.access_token);
      
      const userRes = await api.get("/auth/me");
      const user = userRes.data;
      
      if (user.status === "approved") {
        router.push('/owner');
      } else {
        setOwnerStep('pending');
      }
    } catch (err: unknown) {
      console.error(err);
      alert((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Login failed");
      setOwnerStep('form');
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
  });

  const handleOwnerGoogleReg = () => loginWithGoogle();
  const handleOwnerGoogleLogin = () => loginWithGoogle();
  
  const canAuthenticate = true;
  const handleGoogleAuth = () => loginWithGoogle();
  const handleGetStarted = () => { router.push('/admin'); };


  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.4 } }
  };

  const inputCls = "w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 transition-all outline-none text-sm font-medium";

  return (
    <div className="premium-noise min-h-screen text-slate-900 overflow-x-hidden relative flex flex-col" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 15%, #f0f3fc 40%, #F7F8FC 60%, #eef1fb 80%, #e8ecf8 100%)' }}>
      
      {/* Background Orbs */}
      <div className="absolute top-[-250px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#1A2FA8]/[0.07] blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.09] blur-[120px] -z-10"></div>
      <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] rounded-full bg-[#7DDFF0]/[0.04] blur-[100px] -z-10"></div>
      
      {/* Header */}
      <header className="absolute top-0 inset-x-0 p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-start items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-20 pb-20 px-6 relative z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: ROLE SELECTION */}
          {role === 'none' && (
            <motion.div key="selection" variants={fadeInUp} initial="hidden" animate="visible" exit="exit" className="w-full max-w-4xl">
              <div className="text-center mb-12 flex flex-col items-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.8 }} className="relative w-28 h-28 mb-6">
                  <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA Premium Logo" fill className="object-contain drop-shadow-[0_10px_20px_rgba(26,47,168,0.2)]" priority />
                </motion.div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F1E7A] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Join the GARIHA Network</h1>
                <p className="text-lg text-slate-500">Select your account type to continue your journey with us.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Parking Owner Card */}
                <button onClick={() => setRole('owner')} className="group relative bg-white/70 backdrop-blur-md rounded-[2rem] p-10 text-left border border-white shadow-[0_8px_30px_rgba(15,30,122,0.06)] hover:shadow-[0_20px_50px_rgba(15,30,122,0.12)] transition-all duration-500 overflow-hidden text-slate-900">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#4DCCE7]/10 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1A2FA8]/10 to-[#4DCCE7]/10 flex items-center justify-center mb-8 group-hover:bg-gradient-to-br group-hover:from-[#1A2FA8] group-hover:to-[#4DCCE7] group-hover:text-white transition-all duration-500 text-[#1A2FA8]">
                    <Building size={32} />
                  </div>
                  <h2 className="text-2xl font-extrabold text-[#0F1E7A] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Parking Owner</h2>
                  <p className="text-slate-500 mb-8 leading-relaxed">List your parking space, manage availability, and turn your empty spot into a steady revenue stream.</p>
                  <div className="flex items-center gap-2 text-[#1A2FA8] font-bold text-sm uppercase tracking-wide">
                    Continue as Owner <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </button>

                {/* Admin Card */}
                <button onClick={() => setRole('admin')} className="group relative bg-[#0F1E7A] rounded-[2rem] p-10 text-left border border-[#1A2FA8] shadow-[0_8px_30px_rgba(15,30,122,0.15)] hover:shadow-[0_20px_50px_rgba(15,30,122,0.3)] transition-all duration-500 overflow-hidden text-white">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#4DCCE7]/20 to-transparent rounded-bl-full -z-10 transition-transform duration-500 group-hover:scale-110"></div>
                  <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-[#1A2FA8]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"></div>
                  <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-8 group-hover:bg-white group-hover:text-[#0F1E7A] transition-all duration-500 border border-white/20">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-2xl font-extrabold mb-3" style={{ fontFamily: 'var(--font-display)' }}>Administrator</h2>
                  <p className="text-white/70 mb-8 leading-relaxed">Secure access for system administrators to oversee operations, manage users, and monitor platform health.</p>
                  <div className="flex items-center gap-2 text-[#4DCCE7] font-bold text-sm uppercase tracking-wide">
                    Access Portal <ChevronRight size={16} className="group-hover:translate-x-2 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {/* PARKING OWNER AUTH FLOW */}
          {role === 'owner' && (
            <motion.div key="owner-auth" variants={fadeInUp} initial="hidden" animate="visible" exit="exit" className="w-full max-w-5xl mx-auto">
              <button onClick={() => { setRole('none'); setOwnerStep('form'); setOwnerTab('register'); }} className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
                <ArrowLeft size={16} /> Back to Selection
              </button>

              <AnimatePresence mode="wait">

                {/* SUBMITTING STATE */}
                {ownerStep === 'submitting' && (
                  <motion.div key="owner-submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-20">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}>
                      <Loader2 className="w-10 h-10 text-[#1A2FA8]" />
                    </motion.div>
                    <p className="text-lg font-bold text-[#0F1E7A] mt-6" style={{ fontFamily: 'var(--font-display)' }}>Processing your request...</p>
                    <p className="text-sm text-slate-500 mt-2">Securely verifying your information</p>
                  </motion.div>
                )}

                {/* PENDING APPROVAL STATE */}
                {ownerStep === 'pending' && (
                  <motion.div key="owner-pending" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.8 }} className="max-w-lg mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(15,30,122,0.08)] border border-white overflow-hidden relative">
                      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B]"></div>
                      <div className="p-10 text-center">
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, bounce: 0.5 }} className="w-20 h-20 mx-auto bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] rounded-full flex items-center justify-center mb-6 border-2 border-[#FDE68A] shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                          <Clock size={36} className="text-[#D97706]" />
                        </motion.div>
                        <h2 className="text-2xl font-extrabold text-[#0F1E7A] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Account Under Review</h2>
                        <p className="text-slate-500 mb-6 leading-relaxed max-w-sm mx-auto">Your registration has been received. Our team is reviewing your information to ensure platform quality and security.</p>
                        <div className="space-y-3 mb-8">
                          {['Application submitted successfully', 'Waiting for Admin validation', 'You will be notified once approved'].map((t, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.15 }} className="flex items-center gap-3 bg-[#FFFBEB] rounded-xl px-5 py-3 border border-[#FDE68A]/50">
                              <CheckCircle2 size={16} className="text-[#D97706] flex-shrink-0" />
                              <span className="text-sm font-medium text-[#92400E]">{t}</span>
                            </motion.div>
                          ))}
                        </div>
                        <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 mb-6">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Estimated Review Time</p>
                          <p className="text-lg font-extrabold text-[#0F1E7A]" style={{ fontFamily: 'var(--font-display)' }}>24 — 48 Hours</p>
                        </div>
                        <button onClick={() => { setRole('none'); setOwnerStep('form'); setOwnerTab('register'); setOwnerForm({ firstName: '', lastName: '', parkingName: '', location: '', spots: '', phone: '', email: '', password: '' }); }} className="text-sm font-semibold text-[#1A2FA8] hover:underline">
                          ← Return to Home
                        </button>
                        <button onClick={async () => {
                          try {
                            const res = await api.get('/auth/me');
                            if (res.data.status === 'approved') setOwnerStep('approved');
                            else alert('Status is still pending. Please wait for admin approval.');
                          } catch (e) {
                            console.error(e);
                          }
                        }} className="ml-4 text-sm font-semibold text-[#D97706] hover:underline">
                          Check Status
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* APPROVED STATE */}
                {ownerStep === 'approved' && (
                  <motion.div key="owner-approved" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", duration: 0.8 }} className="max-w-lg mx-auto">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(15,30,122,0.08)] border border-white overflow-hidden relative p-10 text-center">
                      <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#10B981] to-[#047857]"></div>
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2, bounce: 0.5 }} className="w-20 h-20 mx-auto bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-full flex items-center justify-center mb-6 border-2 border-[#6EE7B7] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={36} className="text-[#059669]" />
                      </motion.div>
                      <h2 className="text-2xl font-extrabold text-[#065F46] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Approved ✓</h2>
                      <p className="text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">Your parking owner account is fully active. You can now access your dashboard and start managing your spots.</p>
                      <button onClick={() => router.push('/owner')} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-lg hover:-translate-y-0.5 transition-all">
                        Start Now
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* FORM STATE */}
                {ownerStep === 'form' && (
                  <motion.div key="owner-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(15,30,122,0.08)] border border-white overflow-hidden flex flex-col lg:flex-row">

                      {/* Left Panel */}
                      <div className="bg-gradient-to-br from-[#0F1E7A] to-[#1A2FA8] p-12 text-white lg:w-[35%] relative overflow-hidden flex flex-col justify-between">
                        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-[#4DCCE7]/20 rounded-full blur-[40px]"></div>
                        <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-white/10 rounded-full blur-[40px]"></div>
                        <div className="relative z-10">
                          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-8">
                            <Building size={28} className="text-[#4DCCE7]" />
                          </div>
                          <h2 className="text-3xl font-extrabold mb-4" style={{ fontFamily: 'var(--font-display)' }}>Parking Owner</h2>
                          <p className="text-white/70 leading-relaxed text-sm">Join the GARIHA network and start monetizing your parking space. Your account will be reviewed by our team before activation.</p>
                        </div>
                        <div className="relative z-10 mt-12">
                          {[{ icon: <CheckCircle2 size={16} />, text: 'Verified Platform' }, { icon: <ShieldCheck size={16} />, text: 'Admin Validated' }, { icon: <MapPin size={16} />, text: 'Smart Location' }].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 mb-6 opacity-80">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">{item.icon}</div>
                              <span className="text-sm font-medium">{item.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right Panel - Forms */}
                      <div className="p-10 md:p-14 lg:w-[65%]">
                        {/* Tabs */}
                        <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
                          <button onClick={() => setOwnerTab('register')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${ownerTab === 'register' ? 'bg-white text-[#0F1E7A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>Create Account</button>
                          <button onClick={() => setOwnerTab('login')} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${ownerTab === 'login' ? 'bg-white text-[#0F1E7A] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`} style={{ fontFamily: 'var(--font-display)' }}>Sign In</button>
                        </div>

                        <AnimatePresence mode="wait">
                          {/* REGISTER TAB */}
                          {ownerTab === 'register' && (
                            <motion.div key="reg" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                              <h3 className="text-lg font-extrabold text-[#0F1E7A] mb-5 pb-2 border-b border-slate-100" style={{ fontFamily: 'var(--font-display)' }}>Personal & Parking Details</h3>
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={ownerForm.firstName} onChange={(e) => setOwnerForm({...ownerForm, firstName: e.target.value})} className={inputCls} placeholder="First Name" />
                                </div>
                                <div className="relative">
                                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={ownerForm.lastName} onChange={(e) => setOwnerForm({...ownerForm, lastName: e.target.value})} className={inputCls} placeholder="Last Name" />
                                </div>
                              </div>
                              <div className="space-y-4 mb-4">
                                <div className="relative">
                                  <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={ownerForm.parkingName} onChange={(e) => setOwnerForm({...ownerForm, parkingName: e.target.value})} className={inputCls} placeholder="Parking Name" />
                                </div>
                                <div className="relative">
                                  <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="text" value={ownerForm.location} onChange={(e) => setOwnerForm({...ownerForm, location: e.target.value})} className={inputCls} placeholder="Parking Location / Address" />
                                </div>
                              </div>
                              <div className="grid md:grid-cols-2 gap-4 mb-4">
                                <div className="relative">
                                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="number" value={ownerForm.spots} onChange={(e) => setOwnerForm({...ownerForm, spots: e.target.value})} className={inputCls} placeholder="Number of Spaces" />
                                </div>
                                <div className="relative">
                                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="tel" value={ownerForm.phone} onChange={(e) => setOwnerForm({...ownerForm, phone: e.target.value})} className={inputCls} placeholder="+213 5XX XXX XXX" />
                                </div>
                              </div>

                              <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>
                              <h3 className="text-lg font-extrabold text-[#0F1E7A] mb-5 pb-2 border-b border-slate-100" style={{ fontFamily: 'var(--font-display)' }}>Authentication</h3>

                              <div className="space-y-4 mb-6">
                                <div className="relative">
                                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="email" value={ownerForm.email} onChange={(e) => setOwnerForm({...ownerForm, email: e.target.value})} className={inputCls} placeholder="Email Address" />
                                </div>
                                <div className="relative">
                                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type={showPw ? 'text' : 'password'} value={ownerForm.password} onChange={(e) => setOwnerForm({...ownerForm, password: e.target.value})} className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 transition-all outline-none text-sm font-medium" placeholder="Create Password" />
                                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                              </div>

                              <button onClick={handleOwnerRegister} disabled={!ownerRegValid} className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${ownerRegValid ? 'bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-0.5 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-display)' }}>
                                Submit Registration
                              </button>

                              <div className="relative flex items-center justify-center py-5">
                                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                <span className="relative bg-white/80 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or register with</span>
                              </div>

                              <button onClick={handleOwnerGoogleReg} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:shadow-md transition-all duration-300">
                                <GoogleIcon /> Sign up with Google
                              </button>
                            </motion.div>
                          )}

                          {/* LOGIN TAB */}
                          {ownerTab === 'login' && (
                            <motion.div key="login" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                              <h3 className="text-lg font-extrabold text-[#0F1E7A] mb-5 pb-2 border-b border-slate-100" style={{ fontFamily: 'var(--font-display)' }}>Welcome Back</h3>
                              <div className="space-y-4 mb-6">
                                <div className="relative">
                                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type="email" value={ownerLogin.email} onChange={(e) => setOwnerLogin({...ownerLogin, email: e.target.value})} className={inputCls} placeholder="Email Address" />
                                </div>
                                <div className="relative">
                                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                  <input type={showPw ? 'text' : 'password'} value={ownerLogin.password} onChange={(e) => setOwnerLogin({...ownerLogin, password: e.target.value})} className="w-full pl-11 pr-12 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 transition-all outline-none text-sm font-medium" placeholder="Password" />
                                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                              </div>
                              <div className="flex justify-end mb-6">
                                <span className="text-xs font-semibold text-[#1A2FA8] cursor-pointer hover:underline">Forgot Password?</span>
                              </div>

                              <button onClick={handleOwnerLogin} disabled={!ownerLoginValid} className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${ownerLoginValid ? 'bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-0.5 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} style={{ fontFamily: 'var(--font-display)' }}>
                                Sign In
                              </button>

                              <div className="relative flex items-center justify-center py-5">
                                <div className="absolute inset-x-0 h-px bg-slate-200"></div>
                                <span className="relative bg-white/80 px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or continue with</span>
                              </div>

                              <button onClick={handleOwnerGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:shadow-md transition-all duration-300">
                                <GoogleIcon /> Sign in with Google
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </motion.div>
          )}

          {/* STEP 2: ADMIN AUTH FLOW */}
          {role === 'admin' && (
            <motion.div key="admin-auth" variants={fadeInUp} initial="hidden" animate="visible" exit="exit" className="w-full max-w-md mx-auto">
              <button onClick={() => setRole('none')} className="mb-8 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
                <ArrowLeft size={16} /> Back to Selection
              </button>
              
              <div className="text-center mb-8">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", duration: 0.8 }} className="relative w-24 h-24 mx-auto mb-6">
                  <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA Premium Logo" fill className="object-contain drop-shadow-[0_10px_20px_rgba(26,47,168,0.2)]" priority />
                </motion.div>
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_80px_rgba(15,30,122,0.08)] border border-white overflow-hidden p-10 relative">
                <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#0F1E7A] via-[#4DCCE7] to-[#0F1E7A]"></div>
                
                <div className="text-center mb-10">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-[#0F1E7A] to-[#1A2FA8] rounded-2xl flex items-center justify-center mb-5 shadow-xl shadow-[#0F1E7A]/20">
                    <ShieldCheck size={30} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-[#0F1E7A] mb-2" style={{ fontFamily: 'var(--font-display)' }}>System Admin</h2>
                  <p className="text-slate-500 text-sm font-medium">Secure platform administration portal</p>
                </div>

                <div className="space-y-6">
                  
                  {/* Step 1: Identity */}
                  <div className={`transition-opacity duration-300 ${googleAuthStatus !== 'idle' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 1</span>
                      <span className="text-xs font-semibold text-slate-500">Identity Verification</span>
                    </div>
                    <div className="space-y-4">
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 transition-all outline-none text-sm font-medium" 
                          placeholder="Admin First Name" 
                          disabled={googleAuthStatus !== 'idle'}
                        />
                      </div>
                      <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 transition-all outline-none text-sm font-medium" 
                          placeholder="Admin Last Name" 
                          disabled={googleAuthStatus !== 'idle'}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-6"></div>

                  {/* Step 2: Google Auth */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Step 2</span>
                      <span className="text-xs font-semibold text-slate-500">Secure Access</span>
                    </div>

                    <AnimatePresence mode="wait">
                      {googleAuthStatus === 'idle' && (
                        <motion.div key="google-btn" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                          <button 
                            onClick={handleGoogleAuth}
                            disabled={!canAuthenticate}
                            className={`w-full flex items-center justify-center gap-3 py-4 rounded-xl border font-bold transition-all duration-300 ${
                              canAuthenticate 
                                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-md cursor-pointer' 
                                : 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <svg className={`w-5 h-5 ${!canAuthenticate ? 'opacity-50' : ''}`} viewBox="0 0 24 24">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            Authenticate via Google
                          </button>
                          {!canAuthenticate && (
                            <p className="text-center text-xs text-slate-400 mt-3 font-medium">Please enter your identity above to unlock authentication.</p>
                          )}
                        </motion.div>
                      )}

                      {googleAuthStatus === 'authenticating' && (
                        <motion.div key="google-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-100">
                          <Loader2 className="w-6 h-6 text-[#1A2FA8] animate-spin mb-2" />
                          <span className="text-sm font-semibold text-[#0F1E7A]">Verifying credentials...</span>
                        </motion.div>
                      )}

                      {googleAuthStatus === 'verified' && (
                        <motion.div key="google-verified" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring" }} className="relative overflow-hidden flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-xl border border-[#A7F3D0] shadow-inner">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1, bounce: 0.5 }} className="w-12 h-12 bg-[#10B981] rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                            <CheckCircle2 size={24} className="text-white" />
                          </motion.div>
                          <h4 className="text-[#065F46] font-extrabold text-lg mb-1">Identity Verified</h4>
                          <p className="text-[#047857] text-xs font-semibold uppercase tracking-widest text-center">Secure Access Granted for {firstName}</p>
                          
                          {/* Shimmer effect */}
                          <motion.div 
                            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                            animate={{ translateX: ['-100%', '200%'] }}
                            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Step 3: Action */}
                  <div className="pt-4">
                    <button 
                      onClick={handleGetStarted}
                      disabled={googleAuthStatus !== 'verified'}
                      className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition-all duration-500 shadow-lg ${
                        googleAuthStatus === 'verified' 
                          ? 'bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-0.5 cursor-pointer' 
                          : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none cursor-not-allowed'
                      }`}
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {googleAuthStatus === 'verified' ? <Lock size={18} className="mr-1" /> : null}
                      Enter Dashboard
                      <ChevronRight size={20} className={googleAuthStatus === 'verified' ? 'animate-pulse' : ''} />
                    </button>
                    {googleAuthStatus === 'verified' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} className="text-[#10B981]" />
                        256-bit AES Encrypted Connection
                      </motion.p>
                    )}
                  </div>

                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
