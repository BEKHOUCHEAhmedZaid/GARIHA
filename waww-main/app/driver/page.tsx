"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Loader2, 
  MessageSquare, 
  Settings, 
  Send, 
  User, 
  Lock, 
  Phone, 
  Search, 
  PlusCircle, 
  ShieldCheck 
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

interface ContactItem {
  user_id: number;
  full_name: string;
  email: string;
  avatar: string;
  role: string;
  subtitle: string;
}

interface ConversationItem {
  user_id: number;
  full_name: string;
  avatar: string;
  role: string;
  subtitle?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
  is_read: number;
}

interface LookupReservation {
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

export default function DriverDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<DriverUser | null>(null);
  const [activeReservation, setActiveReservation] = useState<ActiveReservation | null>(null);
  const [alternativeSpots, setAlternativeSpots] = useState<AlternativeSpot[]>([]);
  const [history, setHistory] = useState<HistoryReservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Tab: reservations | messages | settings
  const [activeTab, setActiveTab] = useState<"reservations" | "messages" | "settings">("reservations");

  // Messaging State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeChat, setActiveChat] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Settings State
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    plate_number: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Guest Lookup State (unauthenticated)
  const [lookupResId, setLookupResId] = useState("");
  const [lookupPlate, setLookupPlate] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [lookupResult, setLookupResult] = useState<LookupReservation | null>(null);
  const [lookupAltSpots, setLookupAltSpots] = useState<AlternativeSpot[]>([]);

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

  // 1. Load authenticated driver data
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const userRes = await api.get("/auth/me");
        if (!isMounted) return;

        if (userRes.data.role !== "driver") {
          router.replace("/auth?role=driver");
          return;
        }

        setIsAuthenticated(true);
        setUser(userRes.data);
        setProfileForm(prev => ({
          ...prev,
          full_name: userRes.data.full_name || "",
          phone: userRes.data.phone || "",
          plate_number: userRes.data.plate_number || "",
        }));

        const activeRes = await api.get("/driver/reservations/active");
        const historyRes = await api.get("/driver/reservations/history");
        if (!isMounted) return;

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
        const apiErr = err as { response?: { status?: number } };
        if (apiErr.response?.status === 401) {
          setIsAuthenticated(false);
        } else {
          console.error("Failed to load driver data", err);
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
  }, [refreshTick, router]);

  // 2. Load conversations & contacts when Messaging tab is opened
  useEffect(() => {
    if (!isAuthenticated || activeTab !== "messages") return;
    let isMounted = true;

    const loadMessaging = async () => {
      try {
        const convRes = await api.get("/messages/conversations");
        const contactRes = await api.get("/driver/contacts");
        if (!isMounted) return;
        setConversations(convRes.data || []);
        setContacts(contactRes.data || []);
      } catch (err) {
        console.error("Failed to load messaging data", err);
      }
    };

    loadMessaging();
    const interval = setInterval(loadMessaging, 8000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, activeTab]);

  // 3. Load active thread messages
  useEffect(() => {
    if (!isAuthenticated || !activeChat) return;
    let isMounted = true;

    const loadThread = async () => {
      try {
        const res = await api.get(`/messages/with/${activeChat.user_id}`);
        if (!isMounted) return;
        setMessages(res.data || []);
      } catch (err) {
        console.error("Failed to load thread", err);
      }
    };

    loadThread();
    const interval = setInterval(loadThread, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, activeChat]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handlers for authenticated reservations
  const handleCancelReservation = async (reservationId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir annuler votre réservation ? Cette action libérera immédiatement la place.")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${reservationId}/cancel`);
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

  const handleChangeSpot = async (reservationId: number, targetSpotId: number) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${reservationId}/change-spot`, {
        new_spot_id: targetSpotId,
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

  // Handlers for guest lookup
  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupResId.trim() || !lookupPlate.trim()) {
      setLookupError("Veuillez renseigner le numéro de réservation et la plaque d'immatriculation.");
      return;
    }

    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);

    try {
      const res = await api.post("/reservations/lookup", {
        reservation_id: lookupResId.trim(),
        plate_number: lookupPlate.trim(),
      });
      setLookupResult(res.data.reservation);
      setLookupAltSpots(res.data.alternative_spots || []);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      setLookupError(apiErr.response?.data?.detail || "Aucune réservation trouvée pour ces identifiants.");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleGuestCancel = async () => {
    if (!lookupResult) return;
    if (!window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${lookupResult.id}/cancel`, {
        plate_number: lookupResult.plate_number,
      });
      showToast(res.data.message || "Réservation annulée avec succès.", "ok");
      // Refresh lookup
      setLookupResult(prev => prev ? { ...prev, status: "cancelled" } : null);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Impossible d'annuler la réservation.", "err");
    } finally {
      setActionLoading(false);
    }
  };

  const handleGuestChangeSpot = async () => {
    if (!lookupResult || !selectedNewSpotId) return;

    setActionLoading(true);
    try {
      const res = await api.post(`/reservations/${lookupResult.id}/change-spot`, {
        new_spot_id: selectedNewSpotId,
        plate_number: lookupResult.plate_number,
      });
      showToast(res.data.message || "Place changée avec succès !", "ok");
      setShowChangeModal(false);
      setSelectedNewSpotId(null);
      // Re-fetch lookup
      const ref = await api.post("/reservations/lookup", {
        reservation_id: lookupResult.id,
        plate_number: lookupResult.plate_number,
      });
      setLookupResult(ref.data.reservation);
      setLookupAltSpots(ref.data.alternative_spots || []);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Impossible de changer la place.", "err");
    } finally {
      setActionLoading(false);
    }
  };

  // Messaging Handlers
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      await api.post("/messages/send", {
        receiver_id: activeChat.user_id,
        content: newMessage.trim(),
      });
      setNewMessage("");
      // Refresh thread
      const res = await api.get(`/messages/with/${activeChat.user_id}`);
      setMessages(res.data || []);
      // Refresh conversation preview
      const convRes = await api.get("/messages/conversations");
      setConversations(convRes.data || []);
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Erreur lors de l'envoi du message.", "err");
    } finally {
      setSendingMessage(false);
    }
  };

  const startNewConversation = (contact: ContactItem) => {
    const existing = conversations.find(c => c.user_id === contact.user_id);
    if (existing) {
      setActiveChat(existing);
    } else {
      const newConv: ConversationItem = {
        user_id: contact.user_id,
        full_name: contact.full_name,
        avatar: contact.avatar,
        role: contact.role,
        subtitle: contact.subtitle,
        last_message: "Aucun message",
        last_message_time: new Date().toISOString(),
        unread_count: 0,
      };
      setConversations(prev => [newConv, ...prev]);
      setActiveChat(newConv);
    }
    setShowNewChatModal(false);
  };

  // Settings Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      showToast("Le nom complet est obligatoire.", "err");
      return;
    }

    if (profileForm.new_password) {
      if (!profileForm.current_password) {
        showToast("Veuillez saisir votre mot de passe actuel.", "err");
        return;
      }
      if (profileForm.new_password.length < 6) {
        showToast("Le nouveau mot de passe doit comporter au moins 6 caractères.", "err");
        return;
      }
      if (profileForm.new_password !== profileForm.confirm_password) {
        showToast("Les mots de passe ne correspondent pas.", "err");
        return;
      }
    }

    setSavingProfile(true);
    try {
      const res = await api.put("/driver/profile", {
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
        plate_number: profileForm.plate_number.trim(),
        current_password: profileForm.current_password || undefined,
        new_password: profileForm.new_password || undefined,
      });

      showToast(res.data.message || "Profil mis à jour avec succès !", "ok");
      setUser(res.data.user);
      setProfileForm(prev => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }));
    } catch (err: unknown) {
      console.error(err);
      const apiErr = err as { response?: { data?: { detail?: string } } };
      showToast(apiErr.response?.data?.detail || "Erreur lors de la mise à jour du profil.", "err");
    } finally {
      setSavingProfile(false);
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

  // ──────────────────────────────────────────────────────────
  // VIEW A : VISITEUR NON CONNECTÉ — SUIVI DE RÉSERVATION & CONNEXION
  // ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
        {/* Toast Notification */}
        {notification && (
          <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${notification.type === "ok" ? "bg-[#10B981] text-white" : "bg-[#EF4444] text-white"}`}>
            {notification.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* HEADER */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Link href="/" className="relative w-10 h-10 overflow-hidden">
                <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA logo" fill className="object-contain" priority />
              </Link>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-[#0F1E7A]">GARIHA</span>
                <span className="ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700">Suivi Conducteur</span>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/book" className="px-4 py-2 text-sm font-bold text-[#1A2FA8] hover:text-[#0F1E7A] transition-colors">
                Trouver un parking
              </Link>
              <Link href="/auth?redirect=/driver&role=driver" className="px-5 py-2 text-sm font-bold text-white bg-[#0F1E7A] hover:bg-[#1A2FA8] rounded-xl shadow-sm transition-all">
                Connexion / Inscription
              </Link>
            </div>
          </div>
        </header>

        {/* MAIN LOOKUP & AUTH PROMPT */}
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-10">
          
          {/* BANNER CONNEXION */}
          <div className="bg-gradient-to-r from-[#0F1E7A] to-[#1A2FA8] rounded-3xl p-8 text-white shadow-xl mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-cyan-300 text-xs font-bold mb-3">
                <User size={14} /> Espace Conducteur Connecté
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">
                Consultez et gérez toutes vos réservations
              </h2>
              <p className="text-white/80 text-sm mt-2">
                Connectez-vous pour retrouver l&apos;ensemble de vos stationnements actifs et passés, échanger avec le support et modifier vos informations.
              </p>
            </div>
            <Link 
              href="/auth?redirect=/driver&role=driver"
              className="flex-shrink-0 px-6 py-3.5 rounded-xl font-bold text-sm bg-white text-[#0F1E7A] hover:bg-slate-100 shadow-md transition-all flex items-center gap-2"
            >
              Se connecter à mon compte
              <ChevronRight size={16} />
            </Link>
          </div>

          {/* GUEST LOOKUP CARD */}
          <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#0F1E7A] flex items-center gap-2">
                <Search size={22} className="text-[#10B981]" />
                Suivi d&apos;une réservation (sans compte)
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Si vous avez réservé sans compte, renseignez votre numéro de réservation et votre immatriculation pour vérifier votre place en direct.
              </p>
            </div>

            <form onSubmit={handleLookupSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Numéro de réservation
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">#</span>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: 12"
                    value={lookupResId}
                    onChange={e => setLookupResId(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-bold focus:outline-none focus:border-[#1A2FA8]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                  Numéro d&apos;immatriculation
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: 00123-116-16"
                  value={lookupPlate}
                  onChange={e => setLookupPlate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold focus:outline-none focus:border-[#1A2FA8]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={lookupLoading}
                  className="w-full py-2.5 px-6 rounded-xl font-bold text-sm bg-[#1A2FA8] hover:bg-[#0F1E7A] text-white shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Rechercher
                </button>
              </div>
            </form>

            {/* ERROR STATE */}
            {lookupError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
                <AlertCircle size={20} className="flex-shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* FOUND RESERVATION CARD */}
            {lookupResult && (
              <div className="mt-8 border-2 border-[#10B981]/40 rounded-2xl p-6 sm:p-8 bg-gradient-to-b from-emerald-50/20 to-white relative overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-200">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-emerald-700 tracking-wider">Réservation #{lookupResult.id} trouvée</span>
                    <h4 className="text-2xl font-bold text-[#0F1E7A] mt-1">{lookupResult.parking_name}</h4>
                    <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                      <MapPin size={16} className="text-slate-400" />
                      {lookupResult.parking_location}
                    </p>
                  </div>
                  <div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                      lookupResult.status === "active" || lookupResult.status === "checked_in" 
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-300" 
                        : lookupResult.status === "cancelled" 
                        ? "bg-rose-100 text-rose-800 border border-rose-300"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      Statut : {lookupResult.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Place attribuée</span>
                    <span className="text-xl font-extrabold text-[#10B981] mt-1 block">{lookupResult.spot_name}</span>
                    <span className="text-xs text-slate-400">Niveau {lookupResult.spot_level}</span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Période</span>
                    <span className="text-xs font-semibold text-slate-700 mt-1 block">
                      Début : {new Date(lookupResult.created_at).toLocaleTimeString("fr-DZ", { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="text-xs font-semibold text-rose-600 block mt-0.5">
                      Fin : {new Date(lookupResult.expires_at).toLocaleTimeString("fr-DZ", { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                    <span className="text-xs uppercase font-bold text-slate-400 block">Immatriculation</span>
                    <span className="text-base font-mono font-extrabold text-slate-800 mt-1 block">{lookupResult.plate_number}</span>
                    <span className="text-xs text-slate-400">{lookupResult.driver_name}</span>
                  </div>
                </div>

                {/* GUEST ACTIONS IF ACTIVE */}
                {["active", "checked_in"].includes(lookupResult.status) && (
                  <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-200">
                    <button
                      onClick={() => setShowChangeModal(true)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-blue-50 text-[#1A2FA8] hover:bg-blue-100 border border-blue-200 font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Changer de place ({lookupAltSpots.length} disponible{lookupAltSpots.length > 1 ? "s" : ""})
                    </button>

                    <button
                      onClick={handleGuestCancel}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 font-bold text-sm transition-all flex items-center gap-2"
                    >
                      <XCircle size={16} />
                      Annuler la réservation
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* MODAL GUEST CHANGE SPOT */}
        {showChangeModal && lookupResult && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
              <h3 className="text-xl font-bold text-[#0F1E7A] mb-1">Changer de place de stationnement</h3>
              <p className="text-sm text-slate-500 mb-6">
                Parking : <strong>{lookupResult.parking_name}</strong> (Place actuelle : {lookupResult.spot_name})
              </p>

              {lookupAltSpots.length > 0 ? (
                <div className="space-y-4 mb-6">
                  <label className="block text-xs font-bold text-slate-500 uppercase">
                    Choisissez une nouvelle place libre :
                  </label>
                  <div className="grid grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                    {lookupAltSpots.map((spot) => (
                      <button
                        key={spot.id}
                        type="button"
                        onClick={() => setSelectedNewSpotId(spot.id)}
                        className={`p-3 rounded-xl border-2 font-bold text-center transition-all ${
                          selectedNewSpotId === spot.id 
                            ? "bg-[#10B981] border-[#10B981] text-white shadow-md" 
                            : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                        }`}
                      >
                        <div className="text-sm">{spot.name}</div>
                        <div className="text-[10px] opacity-75">{spot.level || "RDC"}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm mb-6">
                  Aucune autre place n&apos;est actuellement libre dans ce parking.
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowChangeModal(false); setSelectedNewSpotId(null); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  disabled={!selectedNewSpotId || actionLoading}
                  onClick={handleGuestChangeSpot}
                  className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Confirmer le changement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────
  // VIEW B : CONDUCTEUR CONNECTÉ — DASHBOARD AVEC ONGLETS
  // ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-xl flex items-center gap-3 text-sm font-semibold transition-all ${notification.type === "ok" ? "bg-[#10B981] text-white" : "bg-[#EF4444] text-white"}`}>
          {notification.type === "ok" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="relative w-10 h-10 overflow-hidden">
              <Image src="https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png" alt="GARIHA logo" fill className="object-contain" priority />
            </Link>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0F1E7A]">GARIHA</span>
              <span className="ml-2 px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700">Conducteur</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href="/book" 
              className="px-4 py-2 text-sm font-bold text-white bg-[#1A2FA8] hover:bg-[#0F1E7A] rounded-xl shadow-sm transition-all"
            >
              + Réserver
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

        {/* NAVIGATION TABS */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab("reservations")}
            className={`py-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "reservations" 
                ? "border-[#1A2FA8] text-[#1A2FA8]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Car size={16} />
            Mes Réservations
          </button>

          <button
            onClick={() => setActiveTab("messages")}
            className={`py-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all relative ${
              activeTab === "messages" 
                ? "border-[#1A2FA8] text-[#1A2FA8]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <MessageSquare size={16} />
            Messagerie
            {conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0) > 0 && (
              <span className="ml-1 w-2 h-2 rounded-full bg-[#10B981]"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("settings")}
            className={`py-3 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "settings" 
                ? "border-[#1A2FA8] text-[#1A2FA8]" 
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Settings size={16} />
            Paramètres
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        
        {/* BANNER CONDUCTEUR */}
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

        {/* ── TAB 1 : MES RÉSERVATIONS ── */}
        {activeTab === "reservations" && (
          <div className="space-y-10">
            {/* ACTIVE RESERVATION */}
            <section>
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
                      onClick={() => handleCancelReservation(activeReservation.id)}
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

            {/* HISTORY */}
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
                          <td colSpan={6} className="py-12 px-6 text-center text-slate-400">
                            Aucun historique de réservation disponible pour le moment.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── TAB 2 : MESSAGERIE ── */}
        {activeTab === "messages" && (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[580px]">
            {/* CONVERSATION LIST (SIDEBAR) */}
            <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                <h3 className="font-bold text-[#0F1E7A] text-base flex items-center gap-2">
                  <MessageSquare size={18} className="text-[#1A2FA8]" />
                  Discussions
                </h3>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="p-1.5 rounded-lg text-[#1A2FA8] hover:bg-blue-50 transition-colors"
                  title="Nouveau message"
                >
                  <PlusCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {conversations.length > 0 ? (
                  conversations.map((c) => (
                    <button
                      key={c.user_id}
                      onClick={() => setActiveChat(c)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                        activeChat?.user_id === c.user_id 
                          ? "bg-white border-l-4 border-[#1A2FA8] shadow-sm" 
                          : "hover:bg-white/80"
                      }`}
                    >
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                        <Image src={c.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png"} alt={c.full_name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline mb-0.5">
                          <span className="font-bold text-sm text-slate-800 truncate">{c.full_name}</span>
                          {c.unread_count > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#10B981] text-white">
                              {c.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mb-1">{c.subtitle}</p>
                        <p className="text-xs text-slate-500 truncate">{c.last_message}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    <p>Aucune conversation en cours.</p>
                    <button
                      onClick={() => setShowNewChatModal(true)}
                      className="mt-3 text-xs font-bold text-[#1A2FA8] hover:underline"
                    >
                      + Contacter le support ou un propriétaire
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* CHAT WINDOW */}
            <div className="flex-1 flex flex-col bg-white">
              {activeChat ? (
                <>
                  {/* CHAT HEADER */}
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200">
                        <Image src={activeChat.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png"} alt={activeChat.full_name} fill className="object-cover" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">{activeChat.full_name}</h4>
                        <span className="text-xs text-slate-400 block">{activeChat.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* MESSAGES LIST */}
                  <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[420px] bg-slate-50/30">
                    {messages.length > 0 ? (
                      messages.map((m) => {
                        const isMine = m.sender_id === user?.id;
                        return (
                          <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-md rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                              isMine 
                                ? "bg-[#1A2FA8] text-white rounded-br-xs" 
                                : "bg-white border border-slate-200 text-slate-800 rounded-bl-xs"
                            }`}>
                              <p className="whitespace-pre-wrap">{m.content}</p>
                              <span className={`text-[10px] mt-1 block ${isMine ? "text-white/70 text-right" : "text-slate-400"}`}>
                                {new Date(m.created_at).toLocaleTimeString("fr-DZ", { timeZone: "Africa/Algiers", hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center text-slate-400 text-xs py-12">
                        Démarrez la conversation en envoyant un message ci-dessous.
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* MESSAGE INPUT */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 flex gap-3 bg-white">
                    <input 
                      type="text"
                      placeholder="Écrivez votre message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A2FA8]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || sendingMessage}
                      className="px-5 py-2.5 rounded-xl bg-[#1A2FA8] hover:bg-[#0F1E7A] text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Envoyer
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                  <MessageSquare size={48} className="text-slate-200 mb-3" />
                  <h4 className="font-bold text-slate-700 text-base">Sélectionnez une discussion</h4>
                  <p className="text-sm max-w-sm mt-1">
                    Choisissez une conversation dans la liste ou démarrez un échange avec le support ou le propriétaire de votre parking.
                  </p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-[#1A2FA8] font-bold text-xs hover:bg-blue-100 transition-colors"
                  >
                    + Nouvelle conversation
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TAB 3 : PARAMÈTRES ── */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 shadow-sm">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-[#0F1E7A] flex items-center gap-2">
                <Settings size={22} className="text-[#1A2FA8]" />
                Paramètres du profil conducteur
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Gérez vos coordonnées et informations de véhicule prises en charge par la plateforme.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  Nom complet
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={profileForm.full_name}
                    onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-semibold focus:outline-none focus:border-[#1A2FA8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Numéro de téléphone
                  </label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="tel"
                      placeholder="Ex: 0555000000"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-medium focus:outline-none focus:border-[#1A2FA8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                    Plaque d&apos;immatriculation
                  </label>
                  <div className="relative">
                    <Car size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Ex: 00123-116-16"
                      value={profileForm.plate_number}
                      onChange={e => setProfileForm({ ...profileForm, plate_number: e.target.value })}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 font-mono font-bold focus:outline-none focus:border-[#1A2FA8]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                  Adresse Email (Identifiant de connexion)
                </label>
                <input 
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed font-medium"
                />
                <span className="text-xs text-slate-400 mt-1 block">L&apos;adresse email ne peut pas être modifiée directement.</span>
              </div>

              {/* PASSWORD SECTION */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                  <Lock size={16} className="text-slate-400" />
                  Modifier le mot de passe (optionnel)
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
                      Mot de passe actuel
                    </label>
                    <input 
                      type="password"
                      placeholder="••••••••"
                      value={profileForm.current_password}
                      onChange={e => setProfileForm({ ...profileForm, current_password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A2FA8]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Nouveau mot de passe
                      </label>
                      <input 
                        type="password"
                        placeholder="Au moins 6 caractères"
                        value={profileForm.new_password}
                        onChange={e => setProfileForm({ ...profileForm, new_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A2FA8]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
                        Confirmer le mot de passe
                      </label>
                      <input 
                        type="password"
                        placeholder="Répétez le mot de passe"
                        value={profileForm.confirm_password}
                        onChange={e => setProfileForm({ ...profileForm, confirm_password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#1A2FA8]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-3 rounded-xl bg-[#1A2FA8] hover:bg-[#0F1E7A] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        )}

      </main>

      {/* MODAL: NOUVELLE CONVERSATION */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-[#0F1E7A] mb-2">Nouvelle conversation</h3>
            <p className="text-xs text-slate-500 mb-6">
              Choisissez un contact autorisé : le support officiel GARIHA ou un propriétaire de parking où vous avez une réservation.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-6">
              {contacts.length > 0 ? (
                contacts.map((c) => (
                  <button
                    key={c.user_id}
                    onClick={() => startNewConversation(c)}
                    className="w-full p-3.5 rounded-2xl border border-slate-100 hover:border-[#1A2FA8]/40 hover:bg-blue-50/50 flex items-center gap-3 transition-all text-left"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden bg-slate-200 flex-shrink-0">
                      <Image src={c.avatar} alt={c.full_name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-slate-800">{c.full_name}</div>
                      <div className="text-xs text-slate-400 truncate">{c.subtitle}</div>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-slate-400 text-xs">
                  Aucun contact disponible pour le moment.
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CHANGE SPOT (AUTHENTICATED) */}
      {showChangeModal && activeReservation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
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
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        selectedNewSpotId === spot.id
                          ? "bg-[#10B981] border-[#10B981] text-white shadow-md"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
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
                disabled={!selectedNewSpotId || actionLoading}
                onClick={() => selectedNewSpotId && handleChangeSpot(activeReservation.id, selectedNewSpotId)}
                className="px-5 py-2.5 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Confirmer le changement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
