"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Car, 
  MapPin, 
  Clock, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  XCircle, 
  LogOut,
  ChevronRight,
  Loader2
} from "lucide-react";
import { api } from "@/lib/axios";

interface DriverUser {
  id: number;
  full_name: string;
  email: string;
  phone?: string;
  plate_number?: string;
}

interface ActiveReservation {
  id: number;
  parking_name: string;
  spot_name: string;
  parking_location: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  parking_id: number;
  spot_level?: string;
  spot_price?: number;
  created_at: string;
  expires_at: string;
  plate_number: string;
  driver_name: string;
}

interface AlternativeSpot {
  id: number;
  name: string;
  level?: string;
  price: number;
}

interface HistoryReservation {
  id: number;
  parking_name: string;
  spot_name: string;
  start_time: string;
  end_time: string;
  status: string;
  price: number;
  created_at: string;
  parking_location: string;
  duration?: string | number;
  spot_price?: number;
}

export default function DriverDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<DriverUser | null>(null);
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(null);
  const [alternativeSpots, setAlternativeSpots] = useState<AlternativeSpot[]>([]);
  const [history, setHistory] = useState<HistoryReservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals & Action States
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [selectedNewSpotId, setSelectedNewSpotId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Ref to trigger re-fetch from action handlers
  const [refreshTick, setRefreshTick] = useState(0);
  const refresh = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const userRes = await api.get("/auth/me");
        const activeRes = await api.get("/driver/reservations/active");
        const historyRes = await api.get("/driver/reservations/history");
        if (!isMounted) return;
        setUser(userRes.data);
        if (activeRes.data.active) {
          setActiveReservation(activeRes.data.reservation);
          setAlternativeSpots(activeRes.data.alternative_spots || []);
        } else {
          setActiveReservation(null);
          setAlternativeSpots([]);
        }
        setHistory(historyRes.data || []);
      } catch (err: unknown) {
        if (!isMounted) return;
        console.error("Failed to load driver data", err);
        const apiErr = err as { response?: { status?: number } };
        if (apiErr.response?.status === 401) {
          router.replace("/auth");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [router, refreshTick]);

  const handleCancelReservation = async () => {
    if (!activeReservation) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler votre réservation ? Cette action libérera immédiatement la place.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${activeReservation.id}/cancel`);
      showToast(res.data.message || "Réservation annulée avec succès.", "ok");
      refresh();
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Échec de l'annulation de la réservation.", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeSpot = async () => {
    if (!activeReservation || !selectedNewSpotId) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${activeReservation.id}/change-spot`, {
        new_spot_id: selectedNewSpotId,
      });
      showToast(res.data.message || "Place modifiée avec succès !", "ok");
      setShowChangeModal(false);
      setSelectedNewSpotId(null);
      refresh();
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Impossible de changer de place.", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gariha_token");
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    router.replace("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#1A2FA8]" />
          <p className="font-semibold text-sm">Chargement de votre espace conducteur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div 
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${
            notification.type === "ok" 
              ? "bg-[#10B981] text-white" 
              : "bg-[#EF4444] text-white"
          }`}
        >
          {notification.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="relative w-10 h-10 overflow-hidden">
              <Image 
                src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" 
                alt="GARIHA logo" 
                fill 
                className="object-contain" 
              />
            </Link>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0F1E7A]">GARIHA</span>
              <span className="ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700">Conducteur</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-6">
            <Link 
              href="/book" 
              className="px-4 py-2 text-sm font-bold text-white bg-[#1A2FA8] hover:bg-[#0F1E7A] rounded-xl shadow-sm transition-all"
            >
              + Réserver une place
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-600 transition-colors"
              title="Se déconnecter"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* WELCOME BANNER */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] p-6 rounded-2xl text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {user?.full_name || "Conducteur"}</h1>
            <p className="text-white/80 text-sm mt-1">
              Immatriculation : <span className="font-mono font-bold tracking-wider">{user?.plate_number || "Non renseignée"}</span>
            </p>
          </div>
          <button 
            onClick={refresh}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all border border-white/20"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {/* SECTION 1: ACTIVE RESERVATION */}
        <section className="mb-10">
          <h2 className="text-xl font-extrabold text-[#0F1E7A] mb-4 flex items-center gap-2">
            <Car className="text-[#10B981]" />
            Suivi de votre réservation en cours
          </h2>

          {activeReservation ? (
            <div className="bg-white border-2 border-[#10B981]/30 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#10B981] text-white px-4 py-1 text-xs font-bold rounded-bl-xl uppercase tracking-wider">
                {activeReservation.status === "checked_in" ? "Occupée (En stationnement)" : "Réservée (Active)"}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400">Parking</span>
                  <h3 className="text-2xl font-bold text-[#0F1E7A] mt-1">{activeReservation.parking_name}</h3>
                  <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-1">
                    <MapPin size={16} className="text-slate-400" />
                    {activeReservation.parking_location || "Alger, Algérie"}
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="bg-blue-50 text-[#1A2FA8] border border-blue-100 rounded-xl px-4 py-2">
                      <span className="text-xs font-bold text-blue-500 uppercase block">Place assignée</span>
                      <span className="text-xl font-extrabold">{activeReservation.spot_name}</span>
                      <span className="text-xs text-blue-400 ml-1.5">({activeReservation.spot_level || "RDC"})</span>
                    </div>

                    <div className="bg-slate-50 text-slate-700 border border-slate-100 rounded-xl px-4 py-2">
                      <span className="text-xs font-bold text-slate-400 uppercase block">Tarif</span>
                      <span className="text-xl font-extrabold">{activeReservation.spot_price || 250} DZD</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50/70 rounded-xl p-5 border border-slate-100 flex flex-col justify-between">
                  <div>
                    <span className="text-xs uppercase font-bold text-slate-400">Période de réservation</span>
                    <div className="mt-2 space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#10B981]" />
                        <span>Début : <strong>{new Date(activeReservation.created_at).toLocaleTimeString('fr-DZ', { timeZone: 'Africa/Algiers', hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-[#EF4444]" />
                        <span>Expire à : <strong>{new Date(activeReservation.expires_at).toLocaleTimeString('fr-DZ', { timeZone: 'Africa/Algiers', hour: '2-digit', minute: '2-digit' })}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                    <span>Véhicule : <strong className="font-mono text-slate-700">{activeReservation.plate_number}</strong></span>
                    <span>Conducteur : <strong className="text-slate-700">{activeReservation.driver_name}</strong></span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setShowChangeModal(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-50 text-[#1A2FA8] hover:bg-blue-100 border border-blue-200 font-bold text-sm transition-all"
                >
                  <RefreshCw size={16} />
                  Changer de place ({alternativeSpots.length} libre{alternativeSpots.length > 1 ? "s" : ""})
                </button>

                <button
                  onClick={handleCancelReservation}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-bold text-sm transition-all"
                >
                  <XCircle size={16} />
                  Annuler la réservation
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Car size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Aucune réservation active en cours</h3>
              <p className="text-slate-500 text-sm max-w-md mx-auto mt-1 mb-6">
                Vous n&apos;avez pas de stationnement en cours. Vous pouvez réserver une place instantanément parmi les parkings disponibles.
              </p>
              <Link 
                href="/book" 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white bg-[#1A2FA8] hover:bg-[#0F1E7A] shadow-md transition-all"
              >
                Trouver et réserver une place
                <ChevronRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* SECTION 2: RESERVATIONS HISTORY */}
        <section>
          <h2 className="text-xl font-extrabold text-[#0F1E7A] mb-4 flex items-center gap-2">
            <Calendar className="text-[#1A2FA8]" />
            Historique de vos réservations ({history.length})
          </h2>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-400">
                  <tr>
                    <th className="py-3.5 px-6">ID</th>
                    <th className="py-3.5 px-6">Parking</th>
                    <th className="py-3.5 px-6">Place</th>
                    <th className="py-3.5 px-6">Date</th>
                    <th className="py-3.5 px-6">Durée</th>
                    <th className="py-3.5 px-6">Montant</th>
                    <th className="py-3.5 px-6">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length > 0 ? (
                    history.map((h) => {
                      const d = new Date(h.created_at);
                      const dateStr = d.toLocaleDateString("fr-DZ", { timeZone: "Africa/Algiers" });
                      const timeStr = d.toLocaleTimeString("fr-DZ", { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" });

                      return (
                        <tr key={h.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-6 font-bold text-slate-800">#{h.id}</td>
                          <td className="py-4 px-6 font-medium text-[#0F1E7A]">
                            {h.parking_name}
                            <span className="block text-xs text-slate-400">{h.parking_location || "Alger"}</span>
                          </td>
                          <td className="py-4 px-6 font-bold text-[#10B981]">{h.spot_name}</td>
                          <td className="py-4 px-6">
                            <span>{dateStr}</span>
                            <span className="block text-xs text-slate-400">{timeStr}</span>
                          </td>
                          <td className="py-4 px-6">{h.duration}</td>
                          <td className="py-4 px-6 font-bold text-slate-800">{h.spot_price || 250} DZD</td>
                          <td className="py-4 px-6">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              h.status === "completed" || h.status === "active" || h.status === "checked_in"
                                ? "bg-emerald-50 text-emerald-700"
                                : h.status === "cancelled"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {h.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 px-6 text-center text-slate-400">
                        Aucun historique de réservation disponible pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>

      {/* MODAL: CHANGE SPOT */}
      {showChangeModal && activeReservation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-[#0F1E7A] mb-2">Changer de place de parking</h3>
            <p className="text-sm text-slate-500 mb-6">
              Place actuelle : <strong>{activeReservation.spot_name}</strong> au <strong>{activeReservation.parking_name}</strong>.
            </p>

            {alternativeSpots.length > 0 ? (
              <div className="space-y-4 mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase">
                  Sélectionnez une nouvelle place libre :
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                  {alternativeSpots.map((spot) => (
                    <button
                      key={spot.id}
                      type="button"
                      onClick={() => setSelectedNewSpotId(spot.id)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedNewSpotId === spot.id
                          ? "bg-[#1A2FA8] text-white border-[#1A2FA8] shadow-md font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-400"
                      }`}
                    >
                      <div className="text-base font-extrabold">{spot.name}</div>
                      <div className={`text-xs ${selectedNewSpotId === spot.id ? "text-white/80" : "text-slate-400"}`}>
                        {spot.level || "RDC"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm mb-6">
                Aucune autre place n&apos;est actuellement libre dans ce parking pour effectuer un changement.
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowChangeModal(false); setSelectedNewSpotId(null); }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleChangeSpot}
                disabled={actionLoading || !selectedNewSpotId}
                className="px-5 py-2.5 rounded-xl bg-[#1A2FA8] hover:bg-[#0F1E7A] text-white font-bold text-sm shadow-sm disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {actionLoading && <Loader2 size={16} className="animate-spin" />}
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
