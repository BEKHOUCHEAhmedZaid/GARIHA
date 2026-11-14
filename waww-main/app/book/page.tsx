"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, MapPin, CheckCircle2, User, Hash, Loader2, Car, Clock, ShieldAlert } from "lucide-react";
import { api } from "../../lib/axios";
import { useRouter } from "next/navigation";

interface ParkingItem {
  id: number;
  parking_name: string;
  location: string;
  total_places: number;
  available_places: number;
}

interface SpotItem {
  id: number;
  name: string;
  status: string;
}

interface ReservationSuccess {
  id: number;
  start_time?: string;
  end_time?: string;
  total_price?: number;
  access_token?: string;
  spot_number?: string;
  spot_name?: string;
  parking_name?: string;
  driver_name?: string;
  plate_number?: string;
}

interface CurrentUser {
  id: number;
  full_name: string;
  email: string;
  plate_number?: string | null;
  phone?: string | null;
  role?: string;
}

export default function BookingPage() {
  const router = useRouter();
  const [parkings, setParkings] = useState<ParkingItem[]>([]);
  const [loadingParkings, setLoadingParkings] = useState(true);
  
  const [selectedParking, setSelectedParking] = useState<ParkingItem | null>(null);
  const [spots, setSpots] = useState<SpotItem[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(false);
  
  const [selectedSpot, setSelectedSpot] = useState<SpotItem | null>(null);
  const [driverName, setDriverName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [duration, setDuration] = useState("60");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [successReservation, setSuccessReservation] = useState<ReservationSuccess | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const res = await api.get("/reservations/public/parkings");
        if (isMounted) setParkings(res.data);
      } catch (e) {
        console.error(e);
        if (isMounted) setErrorMsg("Impossible de charger les parkings disponibles.");
      } finally {
        if (isMounted) setLoadingParkings(false);
      }

      if (typeof window !== "undefined") {
        const token = localStorage.getItem("gariha_token");
        if (token) {
          try {
            const userRes = await api.get("/auth/me");
            if (isMounted && userRes.data) {
              setCurrentUser(userRes.data);
              if (userRes.data.full_name) setDriverName(userRes.data.full_name);
              if (userRes.data.plate_number) setPlateNumber(userRes.data.plate_number);
            }
          } catch {
            // Unauthenticated or token expired
          }
        }
      }
      if (isMounted) setAuthLoading(false);
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectParking = async (parking: ParkingItem) => {
    setSelectedParking(parking);
    setSelectedSpot(null);
    setLoadingSpots(true);
    setErrorMsg("");
    try {
      const res = await api.get(`/reservations/public/parkings/${parking.id}/spots`);
      setSpots(res.data);
    } catch (e) {
      console.error(e);
      setErrorMsg("Impossible de charger les emplacements pour ce parking.");
    } finally {
      setLoadingSpots(false);
    }
  };

  const handleReserve = async () => {
    if (!selectedSpot) {
      setErrorMsg("Veuillez sélectionner un emplacement libre avant de confirmer.");
      return;
    }
    if (!driverName.trim()) {
      setErrorMsg("Le nom du conducteur est obligatoire.");
      return;
    }
    if (!plateNumber.trim()) {
      setErrorMsg("Le numéro d'immatriculation du véhicule est obligatoire pour valider la réservation.");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg("");
    
    try {
      const res = await api.post("/reservations/create", {
        parking_spot_id: selectedSpot.id,
        driver_name: driverName.trim(),
        plate_number: plateNumber.trim().toUpperCase(),
        duration_minutes: parseInt(duration, 10)
      });
      setSuccessReservation(res.data);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { status?: number; data?: { detail?: string } } };
      if (apiErr.response?.status === 409) {
        setErrorMsg(apiErr.response.data?.detail || "Cet emplacement vient d'être réservé. Veuillez en choisir un autre.");
        if (selectedParking) handleSelectParking(selectedParking);
        setSelectedSpot(null);
      } else {
        setErrorMsg(apiErr.response?.data?.detail || "Échec de la réservation. Veuillez vérifier les informations et réessayer.");
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
        
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_80px_rgba(16,185,129,0.15)] border border-white max-w-md w-full p-8 md:p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#10B981] to-[#047857]"></div>
          
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#ECFDF5] to-[#D1FAE5] rounded-full flex items-center justify-center mb-6 border-2 border-[#6EE7B7] shadow-[0_0_30px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={40} className="text-[#059669]" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-[#065F46] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Réservation Confirmée !</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">
            Votre place est garantie et verrouillée sur le statut <strong className="text-[#10B981]">RESERVEE</strong>.
          </p>
          
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 text-left mb-6 space-y-3">
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 text-sm">N° Réservation</span>
              <span className="font-bold text-[#0F1E7A]">#{successReservation.id}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 text-sm">Parking</span>
              <span className="font-bold text-[#0F1E7A]">{successReservation.parking_name || 'Parking'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 text-sm">Emplacement</span>
              <span className="font-bold text-[#10B981]">{successReservation.spot_name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2.5">
              <span className="text-slate-500 text-sm">Conducteur</span>
              <span className="font-bold text-[#0F1E7A]">{successReservation.driver_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 text-sm">Immatriculation</span>
              <span className="font-bold text-[#0F1E7A] tracking-wider uppercase">{successReservation.plate_number}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push(`/track?id=${successReservation.id}&plate=${encodeURIComponent(successReservation.plate_number || '')}`)} 
              className="w-full py-3.5 rounded-xl font-bold text-base bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md hover:-translate-y-0.5 transition-all"
            >
              Suivre ma réservation en direct
            </button>
            {currentUser && (
              <button 
                onClick={() => router.push('/driver')} 
                className="w-full py-3 rounded-xl font-bold text-sm bg-blue-50 text-[#1A2FA8] hover:bg-blue-100 transition-all"
              >
                Accéder à mon espace conducteur
              </button>
            )}
            <button 
              onClick={() => router.push('/')} 
              className="w-full py-3 rounded-xl font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Retour à l&apos;accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="premium-noise min-h-screen text-slate-900 overflow-x-hidden relative flex flex-col" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 15%, #f0f3fc 40%, #F7F8FC 60%, #eef1fb 80%, #e8ecf8 100%)' }}>
      <div className="absolute top-[-250px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#1A2FA8]/[0.07] blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.09] blur-[120px] -z-10"></div>
      
      <header className="absolute top-0 inset-x-0 p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
            <ArrowLeft size={16} /> Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/track" className="flex items-center gap-2 text-sm font-bold text-[#1A2FA8] bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 hover:shadow-sm transition-all">
              <Car size={16} /> Suivi de ma réservation
            </Link>
            {currentUser && (
              <Link href="/driver" className="hidden sm:flex items-center gap-2 text-sm font-bold text-slate-700 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 hover:shadow-sm transition-all">
                <User size={16} /> Mon Compte
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center pt-24 pb-20 px-6 max-w-5xl mx-auto w-full relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeInUp} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F1E7A] mb-3" style={{ fontFamily: 'var(--font-display)' }}>Trouver un Stationnement</h1>
          <p className="text-base md:text-lg text-slate-500">Réservez instantanément votre place en temps réel.</p>
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
          {/* AVAILABLE PARKINGS */}
          <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="lg:w-1/2 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#0F1E7A] px-2" style={{ fontFamily: 'var(--font-display)' }}>Parkings Disponibles</h2>
            
            {loadingParkings ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-[#1A2FA8]" size={32} />
              </div>
            ) : parkings.length === 0 ? (
              <div className="bg-white/50 border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                Aucun parking disponible pour le moment.
              </div>
            ) : (
              <div className="space-y-4">
                {parkings.map((p: ParkingItem) => (
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

          {/* SPOTS SELECTION & DRIVER FORM */}
          <AnimatePresence mode="wait">
            {selectedParking && (
              <motion.div key={selectedParking.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="lg:w-1/2 flex flex-col gap-6">
                
                <div className="bg-white/85 backdrop-blur-xl border border-white rounded-[2rem] p-7 md:p-8 shadow-[0_20px_80px_rgba(15,30,122,0.06)]">
                  <h2 className="text-xl font-bold text-[#0F1E7A] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Choisir un Emplacement</h2>
                  
                  {loadingSpots ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="animate-spin text-[#1A2FA8]" size={32} />
                    </div>
                  ) : spots.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center mb-6">
                      <p className="text-slate-500 font-medium text-sm">Aucun emplacement disponible actuellement dans ce parking.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {spots.map((s: SpotItem) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedSpot(s)}
                          className={`p-3.5 rounded-xl font-bold text-base transition-all border-2 flex flex-col items-center gap-1.5 ${selectedSpot?.id === s.id ? 'bg-[#10B981]/10 border-[#10B981] text-[#10B981] shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:border-[#10B981]/50 hover:bg-[#10B981]/5'}`}
                        >
                          <Car size={22} className={selectedSpot?.id === s.id ? 'text-[#10B981]' : 'text-slate-400'} />
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}

                  <h2 className="text-xl font-bold text-[#0F1E7A] mb-4 pt-5 border-t border-slate-100" style={{ fontFamily: 'var(--font-display)' }}>
                    Informations Conducteur
                  </h2>

                  {/* Connected driver notice */}
                  {currentUser ? (
                    <div className="p-3.5 mb-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between text-xs">
                      <span className="text-[#0F1E7A]">
                        Connecté : <strong>{currentUser.full_name}</strong>
                      </span>
                      <span className="text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                        Compte actif
                      </span>
                    </div>
                  ) : !authLoading ? (
                    <div className="p-3 mb-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex justify-between items-center">
                      <span>Vous avez un compte conducteur ?</span>
                      <Link href="/auth?role=driver&redirect=/book" className="font-bold text-[#1A2FA8] hover:underline">
                        Se connecter
                      </Link>
                    </div>
                  ) : null}

                  {currentUser && !currentUser.plate_number && !plateNumber && (
                    <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                      ℹ️ Veuillez renseigner l&apos;immatriculation de votre véhicule ci-dessous pour confirmer.
                    </div>
                  )}
                  
                  <div className="space-y-4 mb-6">
                    <div className="relative">
                      <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={driverName} 
                        onChange={e => setDriverName(e.target.value)} 
                        placeholder="Nom complet" 
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium transition-all" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                          type="text" 
                          value={plateNumber} 
                          onChange={e => setPlateNumber(e.target.value)} 
                          placeholder="Immatriculation (ex: 12345-116-16)" 
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium uppercase transition-all" 
                        />
                      </div>
                      <div className="relative">
                        <Clock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select 
                          value={duration} 
                          onChange={e => setDuration(e.target.value)} 
                          className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium transition-all appearance-none"
                        >
                          <option value="60">1 Heure (250 DZD)</option>
                          <option value="120">2 Heures (500 DZD)</option>
                          <option value="180">3 Heures (750 DZD)</option>
                          <option value="240">4 Heures (1000 DZD)</option>
                          <option value="720">Demi-journée (2000 DZD)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleReserve}
                    disabled={!selectedSpot || !driverName.trim() || !plateNumber.trim() || isSubmitting}
                    className={`w-full py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all duration-300 ${(!selectedSpot || !driverName.trim() || !plateNumber.trim()) ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-[0_8px_30px_rgba(15,30,122,0.3)] hover:shadow-[0_12px_40px_rgba(15,30,122,0.45)] hover:-translate-y-0.5'}`}
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                    {isSubmitting ? "Traitement de la réservation…" : "Confirmer la Réservation"}
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-4 font-medium flex items-center justify-center gap-1.5">
                    L&apos;emplacement passera instantanément au statut <strong className="text-[#4DCCE7]">RESERVEE</strong>
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
