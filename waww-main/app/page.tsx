"use client";

import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, ArrowRight, ShieldCheck, Clock, CheckCircle2, ChevronRight, Menu, X, Mail, Phone, MapPin as MapPinIcon } from 'lucide-react';

const LandingPage = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="premium-noise min-h-screen text-slate-900 overflow-x-hidden" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 15%, #f0f3fc 40%, #F7F8FC 60%, #eef1fb 80%, #e8ecf8 100%)' }}>
      
      {/* ── HEADER ── */}
      <header 
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out ${
          scrolled 
            ? 'py-3 bg-white/80 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-b border-slate-200/50' 
            : 'py-6 bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-3.5 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative w-12 h-12 overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA logo" fill className="object-contain" priority />
            </div>
            <span className="font-extrabold text-[1.75rem] tracking-tight text-[#0F1E7A] group-hover:text-[#1A2FA8] transition-colors duration-300" style={{ fontFamily: 'var(--font-display)' }}>GARIHA</span>
          </div>

          <nav className="hidden md:flex items-center gap-2">
            {[
              { name: 'Home', action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
              { name: 'About', action: () => scrollToSection('team') },
              { name: 'Features', action: () => scrollToSection('features') },
              { name: 'Team', action: () => scrollToSection('team') },
              { name: 'Contact', action: () => scrollToSection('contact') },
            ].map((link, i) => (
              <button 
                key={i} 
                onClick={link.action} 
                className="relative px-4 py-2 text-sm font-semibold text-slate-600 hover:text-blue-700 transition-colors rounded-full hover:bg-blue-50/80 group"
              >
                {link.name}
                <span className="absolute inset-x-4 -bottom-1 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-full"></span>
              </button>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link 
              href="/auth" 
              className="relative overflow-hidden px-6 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm shadow-[0_4px_20px_rgba(15,23,42,0.2)] hover:shadow-[0_8px_25px_rgba(15,23,42,0.3)] hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>

          <button 
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-full bg-slate-50 text-slate-900 border border-slate-200 hover:bg-slate-100 transition-colors" 
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="fixed inset-x-4 top-4 z-[60] bg-white/95 backdrop-blur-2xl p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col md:hidden"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA logo" fill className="object-contain" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-[#0F1E7A]" style={{ fontFamily: 'var(--font-display)' }}>GARIHA</span>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="text-slate-500 hover:text-slate-900 hover:rotate-90 transition-all duration-300 bg-slate-50 p-2 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {[
                { name: 'Home', action: () => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
                { name: 'About', action: () => scrollToSection('team') },
                { name: 'Features', action: () => scrollToSection('features') },
                { name: 'Team', action: () => scrollToSection('team') },
                { name: 'Contact', action: () => scrollToSection('contact') },
              ].map((link, i) => (
                <button 
                  key={i}
                  onClick={link.action} 
                  className="text-left px-4 py-3 rounded-xl font-semibold text-slate-700 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200"
                >
                  {link.name}
                </button>
              ))}
            </div>
            
            <div className="mt-8">
              <Link href="/auth" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-md shadow-[0_4px_20px_rgba(15,23,42,0.2)] transition-colors">
                Get Started
                <ArrowRight size={18} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main>
        {/* ── SECTION 1 — HERO ── */}
        <section className="relative pt-32 pb-24 md:pt-44 md:pb-36 overflow-hidden">
          {/* Premium background system */}
          <div className="absolute inset-0 -z-20" style={{ background: 'radial-gradient(ellipse 120% 80% at 20% 50%, #e0e8ff 0%, transparent 50%), radial-gradient(ellipse 100% 70% at 80% 20%, #ddf3f8 0%, transparent 50%), linear-gradient(180deg, #eaeffc 0%, #F7F8FC 50%, #f0f3fc 100%)' }}></div>
          <div className="absolute top-[-250px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#1A2FA8]/[0.07] blur-[120px] -z-10"></div>
          <div className="absolute bottom-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.09] blur-[120px] -z-10"></div>
          <div className="absolute top-[30%] left-[40%] w-[500px] h-[500px] rounded-full bg-[#7DDFF0]/[0.04] blur-[100px] -z-10"></div>
          <div className="absolute top-[10%] right-[20%] w-[300px] h-[300px] rounded-full bg-[#1A2FA8]/[0.05] blur-[80px] -z-10"></div>
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 -z-10 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #1A2FA8 0.8px, transparent 0.8px)', backgroundSize: '28px 28px' }}></div>
          {/* Light sweep */}
          <div className="absolute top-0 left-[10%] w-[60%] h-[1px] bg-gradient-to-r from-transparent via-[#4DCCE7]/20 to-transparent -z-10"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
            <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex-1 max-w-2xl text-center lg:text-left">
              <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-white/70 backdrop-blur-sm border border-[#1A2FA8]/10 text-[#1A2FA8] text-sm font-semibold tracking-wide shadow-sm" style={{ fontFamily: 'var(--font-display)' }}>
                <div className="w-2 h-2 rounded-full bg-[#4DCCE7] animate-pulse"></div>
                Smart Urban Mobility
              </motion.div>
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-[4.5rem] font-extrabold tracking-tight leading-[1.08] mb-7" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-[#0F1E7A]">Park Smarter.</span> <br/>
                <span className="bg-gradient-to-r from-[#1A2FA8] via-[#4DCCE7] to-[#7DDFF0] bg-clip-text text-transparent">Earn Smarter.</span>
              </motion.h1>
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-slate-500 mb-10 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Find available spaces in real time or turn your parking spot into an opportunity. Join the future of urban parking today.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link href="/auth" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white font-bold text-lg shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2.5 group" style={{ fontFamily: 'var(--font-display)' }}>
                  Find Parking
                  <Search size={18} className="group-hover:scale-110 transition-transform" />
                </Link>
                <Link href="/auth" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/80 backdrop-blur-sm text-[#1A2FA8] border-2 border-[#1A2FA8]/15 font-bold text-lg shadow-sm hover:shadow-lg hover:border-[#4DCCE7]/40 hover:bg-white hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2.5" style={{ fontFamily: 'var(--font-display)' }}>
                  Offer a Space
                  <ArrowRight size={18} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="flex-1 relative w-full max-w-xl lg:max-w-none">
              <div className="absolute -inset-4 bg-gradient-to-br from-[#1A2FA8]/10 to-[#4DCCE7]/10 rounded-[2rem] blur-2xl -z-10"></div>
              <div className="relative aspect-[4/3] w-full rounded-[1.5rem] overflow-hidden shadow-2xl shadow-[#1A2FA8]/10 border border-white/60 bg-white/50 backdrop-blur-sm p-3">
                 <div className="relative w-full h-full rounded-[1.2rem] overflow-hidden bg-slate-50">
                   <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/f_auto,q_auto/ChatGPT_Image_27_févr._2026_20_17_23_znsnhb" alt="Parking illustration" fill className="object-cover" priority />
                 </div>
                 <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }} className="absolute -left-4 top-12 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg shadow-[#1A2FA8]/8 border border-white flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={20} /></div>
                   <div>
                     <p className="text-[11px] text-slate-400 font-medium">Spot Status</p>
                     <p className="text-sm font-bold text-slate-800">Available Now</p>
                   </div>
                 </motion.div>
                 <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }} className="absolute -right-4 bottom-16 bg-white/90 backdrop-blur-md p-3.5 rounded-2xl shadow-lg shadow-[#1A2FA8]/8 border border-white flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-[#1A2FA8]/10 text-[#1A2FA8] flex items-center justify-center"><MapPin size={20} /></div>
                   <div>
                     <p className="text-[11px] text-slate-400 font-medium">Location</p>
                     <p className="text-sm font-bold text-slate-800">0.2 miles away</p>
                   </div>
                 </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── SECTION 2 — TECH STACK ── */}
        <section className="relative py-16 overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #f0f3fc 0%, #f5f7fe 30%, #fafbff 50%, #f5f7fe 70%, #eef1fb 100%)' }}></div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1A2FA8]/[0.06] to-transparent -z-10"></div>
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#4DCCE7]/[0.06] to-transparent -z-10"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] rounded-full bg-[#1A2FA8]/[0.02] blur-[80px] -z-10"></div>
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <p className="text-center text-xs font-bold tracking-[0.2em] text-[#1A2FA8]/40 uppercase mb-10" style={{ fontFamily: 'var(--font-display)' }}>Powered By Modern Technologies</p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-14">
              {[
                { src: 'https://res.cloudinary.com/dw1zljrse/image/upload/v1776986031/React-icon.svg_ivndbz.png', alt: 'React' },
                { src: 'https://res.cloudinary.com/dw1zljrse/image/upload/v1776985948/javascript-logo-javascript-icon-transparent-free-png_palvsu.webp', alt: 'JavaScript' },
                { src: 'https://res.cloudinary.com/dw1zljrse/image/upload/v1776985983/HTML5_logo_and_wordmark.svg_p9lyfi.png', alt: 'HTML5' },
                { src: 'https://res.cloudinary.com/dw1zljrse/image/upload/v1776986008/Python-logo-notext.svg_yuzuyu.png', alt: 'Python' },
                { src: 'https://res.cloudinary.com/dw1zljrse/image/upload/v1776986048/1000053973_zf6vli.png', alt: 'GitHub' },
              ].map((tech, i) => (
                <motion.div key={i} whileHover={{ scale: 1.15, y: -4 }} className="relative w-14 h-14 md:w-16 md:h-16 p-2.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-lg hover:border-[#4DCCE7]/30 transition-all duration-300 cursor-pointer">
                  <Image src={tech.src} alt={tech.alt} fill className="object-contain p-2" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 3 — FEATURES ── */}
        <section id="features" className="relative py-28 overflow-hidden">
          <div className="absolute inset-0 -z-20" style={{ background: 'linear-gradient(180deg, #eef1fb 0%, #e8ecf8 30%, #eaeffb 60%, #e5eaf6 100%)' }}></div>
          <div className="absolute top-[5%] right-[-150px] w-[600px] h-[600px] rounded-full bg-[#1A2FA8]/[0.05] blur-[100px] -z-10"></div>
          <div className="absolute bottom-[5%] left-[-150px] w-[500px] h-[500px] rounded-full bg-[#4DCCE7]/[0.06] blur-[100px] -z-10"></div>
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#1A2FA8]/[0.02] blur-[120px] -z-10"></div>
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1A2FA8]/[0.08] to-transparent"></div>

          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-[#1A2FA8] font-bold tracking-[0.15em] text-sm uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>Intelligent Mobility</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-[#0F1E7A] mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Stay Organized on the Move</h3>
              <p className="text-lg text-slate-500 leading-relaxed">Plan your parking, save time, and navigate the city with confidence using our state-of-the-art tools designed for the modern driver.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: MapPin, title: "Real-time Navigation", desc: "Find the closest available spots instantly with our live map system." },
                { icon: ShieldCheck, title: "Secure Payments", desc: "Pay safely and seamlessly within the app using encrypted gateways." },
                { icon: Clock, title: "Time Optimization", desc: "No more circling the block. Reserve in advance and drive straight in." }
              ].map((feature, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: i * 0.12 }} whileHover={{ y: -8 }}
                  className="relative bg-white/70 backdrop-blur-sm p-8 rounded-[1.5rem] border border-white shadow-[0_4px_40px_rgba(26,47,168,0.06)] hover:shadow-[0_12px_50px_rgba(26,47,168,0.12)] transition-all duration-300 group overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#4DCCE7]/5 to-transparent rounded-bl-full -z-10"></div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#1A2FA8]/10 to-[#4DCCE7]/10 text-[#1A2FA8] flex items-center justify-center mb-6 group-hover:bg-gradient-to-br group-hover:from-[#1A2FA8] group-hover:to-[#4DCCE7] group-hover:text-white group-hover:shadow-[0_8px_25px_rgba(26,47,168,0.25)] transition-all duration-300">
                    <feature.icon size={26} />
                  </div>
                  <h4 className="text-xl font-bold text-[#0F1E7A] mb-3" style={{ fontFamily: 'var(--font-display)' }}>{feature.title}</h4>
                  <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 4 — TEAM ── */}
        <section id="team" className="relative py-28 overflow-hidden" style={{ background: 'linear-gradient(160deg, #060d2e 0%, #0F1E7A 40%, #1A2FA8 70%, #163a8a 100%)' }}>
          <div className="absolute top-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #4DCCE7 20%, #7DDFF0 50%, #4DCCE7 80%, transparent 100%)', opacity: 0.3 }}></div>
          <div className="absolute top-[20%] left-[-250px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.08] blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[15%] right-[-250px] w-[600px] h-[600px] rounded-full bg-[#1A2FA8]/[0.18] blur-[120px] pointer-events-none"></div>
          <div className="absolute top-[60%] left-[30%] w-[400px] h-[400px] rounded-full bg-[#7DDFF0]/[0.04] blur-[100px] pointer-events-none"></div>
          <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: 'radial-gradient(circle, #4DCCE7 0.6px, transparent 0.6px)', backgroundSize: '36px 36px' }}></div>
          <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #4DCCE7 30%, #1A2FA8 50%, #4DCCE7 70%, transparent 100%)', opacity: 0.15 }}></div>

          <div className="max-w-[1400px] mx-auto px-6 md:px-12 relative z-10">
            {/* ── Team Hero: Image + Description ── */}
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20">
              <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="flex-1 w-full max-w-xl lg:max-w-none"
              >
                <div className="relative aspect-[4/3] w-full rounded-[1.5rem] overflow-hidden shadow-2xl shadow-black/20 border border-white/[0.08]">
                  <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985820/ChatGPT_Image_27_f%C3%A9vr._2026_23_17_43_fdwjso.png" alt="GARIHA Team" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#060d2e]/60 via-transparent to-transparent"></div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}
                className="flex-1 text-center lg:text-left"
              >
                <h2 className="text-[#4DCCE7] font-bold tracking-[0.15em] text-sm uppercase mb-4" style={{ fontFamily: 'var(--font-display)' }}>Built by Innovators</h2>
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>Meet the Team Behind GARIHA</h3>
                <p className="text-lg text-white/50 leading-relaxed mb-6">We are a tight-knit group of engineers and designers driven by a shared obsession — making urban parking seamless, intelligent, and fair. Every line of code and every pixel we craft is fueled by ambition, creativity, and a deep belief that cities deserve smarter mobility.</p>
                <p className="text-base text-white/35 leading-relaxed">Together, we combine complementary strengths — from backend architecture to user experience — to turn a complex urban challenge into an elegant, human-centered product.</p>
              </motion.div>
            </div>
            
            {/* ── Member Cards Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: 'Abdellah Amine KERNOU', role: 'Team Lead & Architect', initials: 'AK', desc: 'The strategic mind behind GARIHA. Abdellah drives the product vision with sharp decision-making, technical depth, and an uncompromising standard for quality.' },
                { name: 'Ahmed Rayen AKROUCHE', role: 'Back-end Engineer', initials: 'RA', desc: 'Rayane is the engine under the hood — designing robust APIs, optimizing database queries, and ensuring the backend scales gracefully under pressure.' },
                { name: 'Ahmed Ziad BEKHOUCHE', role: 'Back-end Engineer', initials: 'ZB', desc: 'Ziad brings calm precision to complex systems. His focus on clean architecture and data integrity makes the platform rock-solid and future-proof.' },
                { name: 'Thiziri HOCINE', role: 'UI/UX Designer', initials: 'TH', desc: 'Thiziri shapes how users feel when they interact with GARIHA — crafting intuitive flows, polished interfaces, and design systems that feel effortless.' },
                { name: 'Meriem TIGHIDET', role: 'Front-end Engineer', initials: 'MT', desc: 'Meriem translates designs into pixel-perfect, performant code. Her attention to detail and passion for responsive layouts bring the product to life.' },
                { name: 'Lina HADJAZ', role: 'Front-end Engineer', initials: 'LH', desc: 'Lina brings energy and versatility to the front-end — tackling animations, component architecture, and cross-browser challenges with creative confidence.' },
              ].map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ type: "spring", stiffness: 100, damping: 14, delay: i * 0.08 }}
                  onHoverStart={() => setHoveredMember(i)} onHoverEnd={() => setHoveredMember(null)}
                  animate={{ scale: hoveredMember === i ? 1.03 : 1, y: hoveredMember === i ? -6 : 0, opacity: hoveredMember === null || hoveredMember === i ? 1 : 0.5 }}
                  className="relative bg-white/[0.05] backdrop-blur-md border border-white/[0.07] rounded-[1.5rem] p-7 transition-all duration-300 hover:bg-white/[0.09] hover:border-[#4DCCE7]/25 hover:shadow-[0_0_35px_rgba(77,204,231,0.1)] group"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4DCCE7]/20 to-[#1A2FA8]/20 flex items-center justify-center flex-shrink-0 border border-white/[0.08] group-hover:from-[#4DCCE7]/30 group-hover:to-[#1A2FA8]/30 transition-all duration-300">
                      <span className="text-sm font-bold text-[#7DDFF0]" style={{ fontFamily: 'var(--font-display)' }}>{m.initials}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight mb-1" style={{ fontFamily: 'var(--font-display)' }}>{m.name}</h4>
                      <p className="text-xs font-semibold text-[#4DCCE7] tracking-[0.1em] uppercase">{m.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/40 leading-relaxed group-hover:text-white/55 transition-colors duration-300">{m.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-28 px-6 md:px-12 overflow-hidden">
          <div className="absolute inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #e5eaf6 0%, #eaeffc 30%, #eff2fd 50%, #F7F8FC 100%)' }}></div>
          <div className="absolute top-[20%] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#1A2FA8]/[0.04] blur-[100px] -z-10"></div>
          <div className="absolute bottom-[20%] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#4DCCE7]/[0.04] blur-[100px] -z-10"></div>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden shadow-[0_20px_80px_rgba(15,30,122,0.15)]" style={{ background: 'linear-gradient(135deg, #0F1E7A 0%, #1A2FA8 50%, #2d5cc7 100%)' }}
          >
            <div className="absolute top-0 right-0 -mr-24 -mt-24 w-72 h-72 bg-[#4DCCE7]/15 rounded-full blur-[80px]"></div>
            <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-72 h-72 bg-[#0F1E7A]/30 rounded-full blur-[80px]"></div>
            <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
            
            <h2 className="text-white/60 font-bold tracking-[0.2em] text-sm uppercase mb-5 relative z-10" style={{ fontFamily: 'var(--font-display)' }}>Are you ready?</h2>
            <h3 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-12 tracking-tight relative z-10" style={{ fontFamily: 'var(--font-display)' }}>Stop Searching. Start Parking.</h3>
            
            <Link href="/auth" className="inline-flex items-center gap-2.5 px-10 py-4.5 rounded-full bg-white text-[#0F1E7A] font-bold text-lg hover:scale-105 hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all duration-300 relative z-10 shadow-xl" style={{ fontFamily: 'var(--font-display)' }}>
              Get Started Now
              <ChevronRight size={20} />
            </Link>
          </motion.div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer id="contact" className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #F7F8FC 0%, #eef1fb 40%, #e8ecf8 70%, #e3e8f4 100%)' }}>
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#1A2FA8]/10 to-transparent"></div>
        <div className="absolute top-[30%] right-[-150px] w-[400px] h-[400px] rounded-full bg-[#1A2FA8]/[0.03] blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[20%] left-[-100px] w-[300px] h-[300px] rounded-full bg-[#4DCCE7]/[0.03] blur-[80px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3.5 mb-7">
                <div className="relative w-11 h-11">
                  <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA logo" fill className="object-contain" />
                </div>
                <span className="font-extrabold text-2xl tracking-tight text-[#0F1E7A]" style={{ fontFamily: 'var(--font-display)' }}>GARIHA</span>
              </div>
              <p className="text-slate-500 mb-6 leading-relaxed text-sm">Transforming urban mobility with smart, real-time parking solutions designed for modern drivers and space owners.</p>
            </div>

            <div>
              <h4 className="font-bold text-[#0F1E7A] mb-6 text-sm tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Contact Us</h4>
              <ul className="space-y-4 text-sm text-slate-500">
                <li className="flex items-center gap-3"><Mail size={15} className="text-[#1A2FA8]" /> contact@gariha.com</li>
                <li className="flex items-center gap-3"><Phone size={15} className="text-[#1A2FA8]" /> +213 123 456 789</li>
                <li className="flex items-center gap-3"><MapPinIcon size={15} className="text-[#1A2FA8]" /> Bejaia, Algeria</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#0F1E7A] mb-6 text-sm tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Company</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><button onClick={() => scrollToSection('team')} className="hover:text-[#1A2FA8] transition-colors">Our Team</button></li>
                <li><button className="hover:text-[#1A2FA8] transition-colors">Careers</button></li>
                <li><button className="hover:text-[#1A2FA8] transition-colors">Blog</button></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[#0F1E7A] mb-6 text-sm tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Stay Updated</h4>
              <p className="text-sm text-slate-500 mb-4">Subscribe to our newsletter for the latest updates.</p>
              <button onClick={() => window.open('mailto:contact@gariha.com?subject=Newsletter%20Subscription', '_blank')}
                className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-[#1A2FA8]/10 to-[#4DCCE7]/10 text-[#1A2FA8] font-semibold text-sm hover:from-[#1A2FA8] hover:to-[#4DCCE7] hover:text-white transition-all duration-300 border border-[#1A2FA8]/10 hover:border-transparent flex items-center justify-center gap-2"
              >
                <Mail size={15} />
                Subscribe via Email
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-[#1A2FA8]/8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm">© 2026 GARIHA. All rights reserved.</p>
            <div className="flex gap-6 text-sm font-medium text-slate-400">
              <button className="hover:text-[#1A2FA8] transition-colors">Privacy Policy</button>
              <button className="hover:text-[#1A2FA8] transition-colors">Terms of Service</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
