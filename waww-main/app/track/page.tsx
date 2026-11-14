"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  MapPin, 
  Car, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2, 
  RefreshCw,
  Hash,
  LogIn
} from "lucide-react";
import { api } from "@/lib/axios";

interface ReservationDetail {
  id: number;
  driver_name: string;
  plate_number: string;
  status: string;
  created_at: string;
  expires_at: string;
  spot_id: number;
  spot_name: string;
  spot_level: string;
  spot_price: number;
  parking_id: number;
  parking_name: string;
  parking_location: string;
}

interface AlternativeSpot {
  id: number;
  name: string;
  level: string;
  price: number;
}

export default function TrackingPage() {
  const [reservationId, setReservationId] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("id") || "";
    }
    return "";
  });
  const [plateNumber, setPlateNumber] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("plate") || "";
    }
    return "";
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [altSpots, setAltSpots] = useState<AlternativeSpot[]>([]);

  // Modals for actions
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewSpotId, setSelectedNewSpotId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const performLookup = useCallback(async (idToSearch: string, plateToSearch: string) => {
    const cleanId = idToSearch.trim().replace(/[^0-9]/g, "");
    const cleanPlate = plateToSearch.trim().toUpperCase();

    if (!cleanId || !cleanPlate) {
      setErrorMessage("Veuillez renseigner le numéro de réservation et l'immatriculation du véhicule.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setReservation(null);
    setAltSpots([]);
    setActionFeedback(null);

    try {
      const res = await api.post("/reservations/lookup", {
        reservation_id: cleanId,
        plate_number: cleanPlate,
      });

      setReservation(res.data.reservation);
      setAltSpots(res.data.alternative_spots || []);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setErrorMessage(
        apiErr.response?.data?.detail || "Aucune réservation trouvée correspondant à ces informations de vérification."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Read URL query params on load (e.g. redirected from booking confirmation)
  useEffect(() => {
    let isMounted = true;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get("id");
      const urlPlate = params.get("plate");
      if (urlId && urlPlate) {
        Promise.resolve().then(() => {
          if (isMounted) {
            performLookup(urlId, urlPlate);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [performLookup]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLookup(reservationId, plateNumber);
  };

  const handleCancelReservation = async () => {
    if (!reservation) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${reservation.id}/cancel`, {
        plate_number: reservation.plate_number,
      });
      setShowCancelConfirm(false);
      setActionFeedback({ msg: res.data?.message || "Réservation annulée avec succès. La place a été libérée.", type: "ok" });
      setReservation(prev => prev ? { ...prev, status: "cancelled" } : null);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setActionFeedback({ msg: apiErr.response?.data?.detail || "Impossible d'annuler cette réservation.", type: "err" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeSpot = async () => {
    if (!reservation || !selectedNewSpotId) return;
    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${reservation.id}/change-spot`, {
        new_spot_id: selectedNewSpotId,
        plate_number: reservation.plate_number,
      });
      setShowChangeModal(false);
      setSelectedNewSpotId(null);
      setActionFeedback({ msg: res.data?.message || "Emplacement changé avec succès !", type: "ok" });

      // Refresh lookup
      performLookup(reservation.id.toString(), reservation.plate_number);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setActionFeedback({ msg: apiErr.response?.data?.detail || "Impossible de changer d'emplacement.", type: "err" });
    } finally {
      setActionLoading(false);
    }
  };

  const isActionAllowed = reservation && (reservation.status === "active" || reservation.status === "checked_in");

  return (
    <div className="premium-noise min-h-screen text-slate-900 overflow-x-hidden relative flex flex-col" style={{ fontFamily: 'var(--font-body)', background: 'linear-gradient(180deg, #edf0fa 0%, #F7F8FC 15%, #f0f3fc 40%, #F7F8FC 60%, #eef1fb 80%, #e8ecf8 100%)' }}>
      
      {/* Background Orbs */}
      <div className="absolute top-[-250px] right-[-200px] w-[800px] h-[800px] rounded-full bg-[#1A2FA8]/[0.07] blur-[120px] -z-10"></div>
      <div className="absolute bottom-[-200px] left-[-150px] w-[700px] h-[700px] rounded-full bg-[#4DCCE7]/[0.09] blur-[120px] -z-10"></div>
      
      {/* Header */}
      <header className="absolute top-0 inset-x-0 p-6 z-50">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[#0F1E7A] transition-colors">
            <ArrowLeft size={16} /> Accueil GARIHA
          </Link>
          <Link href="/book" className="flex items-center gap-2 text-sm font-bold text-[#1A2FA8] bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 hover:shadow-sm transition-all">
            <Car size={16} /> Trouver un parking
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center pt-24 pb-20 px-6 max-w-3xl mx-auto w-full relative z-10">
        
        {/* Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[#1A2FA8] text-xs font-bold tracking-wide">
            <Search size={14} />
            Suivi Sécurisé de Réservation
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#0F1E7A] tracking-tight mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Suivi de Réservation
          </h1>
          <p className="text-sm md:text-base text-slate-500 max-w-md mx-auto">
            Consultez le statut réel de votre réservation, changez d&apos;emplacement ou annulez en toute sécurité.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="w-full bg-white/90 backdrop-blur-xl border border-white rounded-[2rem] p-6 md:p-8 shadow-[0_20px_60px_rgba(15,30,122,0.06)] mb-8">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Numéro de Réservation
                </label>
                <div className="relative">
                  <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={reservationId}
                    onChange={(e) => setReservationId(e.target.value)}
                    placeholder="Ex: 42 ou #42"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Immatriculation du Véhicule
                </label>
                <div className="relative">
                  <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={plateNumber}
                    onChange={(e) => setPlateNumber(e.target.value)}
                    placeholder="Ex: 12345-116-16"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#4DCCE7] focus:ring-2 focus:ring-[#4DCCE7]/20 outline-none text-sm font-medium uppercase transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !reservationId.trim() || !plateNumber.trim()}
              className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                loading || !reservationId.trim() || !plateNumber.trim()
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Vérification en cours…
                </>
              ) : (
                <>
                  <Search size={18} />
                  Rechercher ma réservation
                </>
              )}
            </button>
          </form>

          {/* Account Login Prompt (No auto-account attribution) */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>Vous possédez un compte conducteur GARIHA ?</span>
            <Link 
              href="/auth?role=driver&redirect=/track" 
              className="inline-flex items-center gap-1.5 font-bold text-[#1A2FA8] hover:underline"
            >
              <LogIn size={14} />
              Se connecter pour voir l&apos;historique complet
            </Link>
          </div>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="w-full p-4 mb-6 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700 shadow-sm">
            <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
            <p className="font-medium">{errorMessage}</p>
          </div>
        )}

        {actionFeedback && (
          <div className={`w-full p-4 mb-6 rounded-2xl flex items-center gap-3 text-sm shadow-sm ${
            actionFeedback.type === "ok" ? "bg-emerald-50 border border-emerald-200 text-emerald-800" : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {actionFeedback.type === "ok" ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-red-600" />}
            <p className="font-medium">{actionFeedback.msg}</p>
          </div>
        )}

        {/* Found Reservation Card */}
        {reservation && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full bg-white rounded-[2rem] border border-slate-200 shadow-lg overflow-hidden"
          >
            {/* Header Status Bar */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Réservation N° #{reservation.id}
                </span>
                <h3 className="text-xl font-extrabold text-[#0F1E7A]">
                  {reservation.parking_name}
                </h3>
              </div>

              <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                reservation.status === "active" || reservation.status === "checked_in"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : reservation.status === "cancelled"
                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                  : "bg-slate-200 text-slate-700"
              }`}>
                {reservation.status === "active" ? "Active (En cours)" : reservation.status}
              </span>
            </div>

            {/* Details Grid */}
            <div className="p-6 md:p-8 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Place</span>
                  <strong className="text-lg text-[#10B981] font-extrabold">{reservation.spot_name}</strong>
                  <span className="text-xs text-slate-500 block">Niveau {reservation.spot_level}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Tarif</span>
                  <strong className="text-lg text-slate-800 font-extrabold">{reservation.spot_price} DZD</strong>
                  <span className="text-xs text-slate-500 block">Par heure</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Conducteur</span>
                  <strong className="text-sm text-slate-800 font-bold block truncate">{reservation.driver_name}</strong>
                  <span className="text-xs text-slate-500 font-mono uppercase">{reservation.plate_number}</span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block mb-1">Expiration</span>
                  <strong className="text-sm text-slate-800 font-bold block">
                    {new Date(reservation.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </strong>
                  <span className="text-xs text-slate-500 block">
                    {new Date(reservation.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-500 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                <MapPin size={16} className="text-[#1A2FA8] flex-shrink-0" />
                <span>Localisation : <strong>{reservation.parking_location}</strong></span>
              </div>

              {/* Actions Section */}
              {isActionAllowed ? (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => setShowChangeModal(true)}
                    className="flex-1 py-3 px-4 rounded-xl bg-blue-50 text-[#1A2FA8] hover:bg-blue-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw size={16} />
                    Changer d&apos;emplacement ({altSpots.length} libre{altSpots.length > 1 ? "s" : ""})
                  </button>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="py-3 px-4 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <XCircle size={16} />
                    Annuler la réservation
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-xl text-center text-xs text-slate-500 font-medium">
                  Cette réservation est clôturée ({reservation.status}). Aucune action supplémentaire n&apos;est autorisée.
                </div>
              )}
            </div>
          </motion.div>
        )}

      </main>

      {/* CONFIRM CANCEL MODAL */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Confirmer l&apos;annulation</h3>
            <p className="text-sm text-slate-500 mb-6">
              Êtes-vous sûr de vouloir annuler votre réservation pour la place <strong>{reservation?.spot_name}</strong> ? La place sera immédiatement libérée pour les autres conducteurs.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowCancelConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                disabled={actionLoading}
              >
                Retour
              </button>
              <button 
                onClick={handleCancelReservation}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold shadow-md hover:bg-rose-700 flex items-center gap-2"
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Oui, annuler"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE SPOT MODAL */}
      {showChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Changer d&apos;emplacement</h3>
              <button onClick={() => setShowChangeModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <p className="text-sm text-slate-500 mb-4">
              Sélectionnez une autre place libre dans <strong>{reservation?.parking_name}</strong> :
            </p>

            {altSpots.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-400 text-sm mb-4">
                Aucun autre emplacement disponible actuellement dans ce parking.
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 max-h-60 overflow-y-auto mb-6 p-1">
                {altSpots.map((spot) => (
                  <button
                    key={spot.id}
                    onClick={() => setSelectedNewSpotId(spot.id)}
                    className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                      selectedNewSpotId === spot.id
                        ? "border-[#1A2FA8] bg-blue-50 text-[#1A2FA8] shadow-sm"
                        : "border-slate-200 hover:border-slate-300 text-slate-700"
                    }`}
                  >
                    <div className="text-base">{spot.name}</div>
                    <div className="text-[11px] font-normal text-slate-400">Niveau {spot.level}</div>
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowChangeModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                disabled={actionLoading}
              >
                Annuler
              </button>
              <button 
                onClick={handleChangeSpot}
                disabled={!selectedNewSpotId || actionLoading}
                className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md flex items-center gap-2 ${
                  !selectedNewSpotId || actionLoading
                    ? "bg-slate-300 cursor-not-allowed"
                    : "bg-[#1A2FA8] hover:bg-[#16268a]"
                }`}
              >
                {actionLoading ? <Loader2 className="animate-spin" size={16} /> : "Valider le changement"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
