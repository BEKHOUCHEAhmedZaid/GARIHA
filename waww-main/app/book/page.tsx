"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, Search, MapPin, CheckCircle2, ChevronRight, User, Hash, Loader2, Car, Clock, ShieldAlert } from "lucide-react";
import { api } from "../../lib/axios";
import { useRouter } from "next/navigation";

export default function BookingPage() {
  const router = useRouter();
  const [parkings, setParkings] = useState([]);
  const [loadingParkings, setLoadingParkings] = useState(true);
  
  const [selectedParking, setSelectedParking] = useState(null);
  const [spots, setSpots] = useState([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [driverName, setDriverName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [duration, setDuration] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [successReservation, setSuccessReservation] = useState(null);

  useEffect(() => {
    fetchParkings();
  }, []);

  const fetchParkings = async () => {
    try {
      const res = await api.get("/reservations/public/parkings");
      setParkings(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load parkings");
    } finally {
      setLoadingParkings(false);
    }
  };

  const handleSelectParking = async (parking: any) => {
    setSelectedParking(parking);
    setSelectedSpot(null);
    setLoadingSpots(true);
    setErrorMsg("");
    try {
      const res = await api.get(`/reservations/public/parkings/${parking.id}/spots`);
      setSpots(res.data); // this route only returns LIBRE spots
    } catch (e) {
      console.error(e);
      setErrorMsg("Failed to load parking spots");
    } finally {
      setLoadingSpots(false);
    }
  };

  const handleReserve = async () => {
    if (!driverName || !plateNumber || !selectedSpot) {
      setErrorMsg("Please fill in all fields.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const res = await api.post("/reservations/create", {
        parking_spot_id: selectedSpot.id,
        driver_name: driverName,
        plate_number: plateNumber,
        duration_minutes: parseInt(duration)
      });
      setSuccessReservation(res.data);
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setErrorMsg(err.response.data.detail || "This spot is no longer available. Please select another one.");
        // Refresh spots
        if (selectedParking) handleSelectParking(selectedParking);
        setSelectedSpot(null);
      } else {
        setErrorMsg("Failed to create reservation. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  if (successReservation) {
    return (
      <div className="premium-noise min-h-screen text-slate-900 flex items-center justify-center relative p-6" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 100%)' }}>
        <div className="absolute top-[20%] right-[-100px] w-[400px] h-[400px] rounded-full bg-[#10B981]/[0.08] blur-[100px] -z-10"></div>
        <div className="absolute bottom-[20%] left-[-100px] w-[400px] h-[400px] rounded-full bg-[#4DCCE7]/[0.08] blur-[100px] -z-10"></div>
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_80px_rgba(16,185,129,0.15)] border border-white max-w-md w-full p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#10B981] to-[#047857]"></div>
          
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-full flex items-center justify-center mb-6 border-2 border-[#6EE7B7] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={40} className="text-[#059669]" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-[#065F46] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Reservation Confirmed!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Your spot has been secured successfully and marked as <strong className="text-[#10B981]">RESERVEE</strong>.</p>
          
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-left mb-8 space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 text-sm">Parking</span>
              <span className="font-bold text-[#0F1E7A]">{successReservation.parking_name || 'Parking'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 text-sm">Spot</span>
              <span className="font-bold text-[#10B981]">{successReservation.spot_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-3">
              <span className="text-slate-500 text-sm">Driver</span>
              <span className="font-bold text-[#0F1E7A]">{successReservation.driver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Plate</span>
              <span className="font-bold text-[#0F1E7A] tracking-wider uppercase">{successReservation.plate_number}</span>
            </div>
          </div>
          
          <button onClick={() => router.push('/')} className="w-full py-4 rounded-xl font-bold text-lg bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:-translate-y-0.5 transition-all">
            Return to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="premium-noise min-h-screen text-slate-900 overflow-x-hidden relative flex flex-col" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 15%, #f0f3fc 40%, #F7F8FC 60%, #eef1fb 80%, #e8ecf8 100%)' }}>
      <div className="absolute top-[-250px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#1A2FA8]/[0.07] blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.09] blur-[120px] -z-10"></div>
      
      <header className="absolute top-0 inset-x-0 p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-start items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 pb-20 px-6 max-w-5xl mx-auto w-full relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F1E7A] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Find Your Spot</h1>
          <p className="text-lg text-slate-500">Secure your parking space in real-time instantly.</p>
        </motion.div>

        {errorMsg && (
          <div className="w-full mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <ShieldAlert size={18} className="text-red-600" />
            </div>
            <p className="text-sm font-medium text-red-700">{errorMsg}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 w-full">
          {/* Left Column: Parkings List */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:w-1/2 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#0F1E7A] px-2" style={{ fontFamily: 'var(--font-display)' }}>Available Parkings</h2>
            
            {loadingParkings ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#1A2FA8]" size={32} />
              </div>
            ) : parkings.length === 0 ? (
              <div className="bg-white/50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                No parkings available at the moment.
              </div>
            ) : (
              <div className="space-y-4">
                {parkings.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => handleSelectParking(p)}
                    className={`w-full text-left p-6 rounded-2xl border transition-all duration-300 relative overflow-hidden group ${selectedParking?.id === p.id ? 'bg-[#0F1E7A] border-[#0F1E7A] shadow-[0_12px_40px_rgba(15,30,122,0.2)]' : 'bg-white/70 backdrop-blur-md border-white hover:border-[#4DCCE7]/50 hover:shadow-lg'}`}
                  >
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <h3 className={`text-xl font-bold ${selectedParking?.id === p.id ? 'text-white' : 'text-[#0F1E7A]'}`} style={{ fontFamily: 'var(--font-display)' }}>{p.parking_name}</h3>
                      <div className={`px-3 py-1 text-xs font-bold rounded-full ${selectedParking?.id === p.id ? 'bg-[#4DCCE7]/20 text-[#4DCCE7]' : 'bg-[#10B981]/10 text-[#10B981]'}`}>
                        {p.available_places} LIBRE
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 text-sm relative z-10 ${selectedParking?.id === p.id ? 'text-white/70' : 'text-slate-500'}`}>
                      <MapPin size={16} />
                      {p.location}
                    </div>
                    
                    {selectedParking?.id === p.id && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Right Column: Spots & Reservation Form */}
          <AnimatePresence mode="wait">
            {selectedParking && (
              <motion.div key={selectedParking.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:w-1/2 flex flex-col gap-6">
                
                <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[2rem] p-8 shadow-[0_20px_80px_rgba(15,30,122,0.06)]">
                  <h2 className="text-xl font-bold text-[#0F1E7A] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Select a Spot</h2>
                  
                  {loadingSpots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-[#1A2FA8]" size={32} />
                    </div>
                  ) : spots.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                      <p className="text-slate-500 font-medium">No available spots currently.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 mb-8">
                      {spots.map(s => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSpot(s)}
                          className={`p-4 rounded-xl font-bold text-lg transition-all border-2 flex flex-col items-center gap-2 ${selectedSpot?.id === s.id ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-[#10B981]/50 hover:bg-[#10B981]/5'}`}
                        >
                          <Car size={24} className={selectedSpot?.id === s.id ? 'text-[#10B981]' : 'text-slate-400'} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-[#0F1E7A] mb-6 pt-6 border-t border-slate-100" style={{ fontFamily: 'var(--font-display)' }}>Driver Details</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="Full Name" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="text" value={plateNumber} onChange={e => setPlateNumber(e.target.value)} placeholder="License Plate" className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium uppercase transition-all" />
                      </div>
                      <div className="relative">
                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select value={duration} onChange={e => setDuration(e.target.value)} className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium transition-all appearance-none">
                          <option value="60">1 Hour</option>
                          <option value="120">2 Hours</option>
                          <option value="180">3 Hours</option>
                          <option value="240">4 Hours</option>
                          <option value="720">Half Day</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleReserve}
                    disabled={!selectedSpot || !driverName || !plateNumber || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 ${(!selectedSpot || !driverName || !plateNumber) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-0.5'}`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={20} />}
                    {isSubmitting ? "Processing..." : "Confirm Reservation"}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-1.5">
                    Spot will instantly change to <strong className="text-[#4DCCE7]">RESERVEE</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
