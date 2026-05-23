"use client";
import React, { useState, useEffect, createContext } from 'react';
import { api } from '@/lib/axios';
import s from './OwnerDashboard.module.css';
import Sidebar from './Sidebar';
import Overview from './Overview';
import ParkingSpaces from './ParkingSpaces';
import Reports from './Reports';
import Payments from './Payments';
import Reservations from './Reservations';
import PricingRules from './PricingRules';
import AccessControl from './AccessControl';
import Settings from './Settings';
import Notifications from './Notifications';
import Messaging from './Messaging';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard', spaces: 'Parking Spaces', reports: 'Reports', payments: 'Payments', reservations: 'Reservations', pricing: 'Pricing', access: 'Access Control', settings: 'Settings', messaging: 'Messaging', logout: 'Log Out', welcome: 'Welcome back', totalSpaces: 'Total Spaces', occupied: 'Occupied', available: 'Available', revenue: 'Monthly Revenue', pending: 'Pending Payments', activeRes: 'Active Reservations',
  },
  fr: {
    dashboard: 'Tableau de bord', spaces: 'Places de parking', reports: 'Rapports', payments: 'Paiements', reservations: 'Réservations', pricing: 'Tarification', access: 'Contrôle d\'accès', settings: 'Paramètres', messaging: 'Messagerie', logout: 'Se déconnecter', welcome: 'Bon retour', totalSpaces: 'Places totales', occupied: 'Occupées', available: 'Disponibles', revenue: 'Revenus mensuels', pending: 'Paiements en attente', activeRes: 'Réservations actives',
  },
  ar: {
    dashboard: 'لوحة التحكم', spaces: 'أماكن الانتظار', reports: 'التقارير', payments: 'المدفوعات', reservations: 'الحجوزات', pricing: 'التسعير', access: 'التحكم في الوصول', settings: 'الإعدادات', messaging: 'الرسائل', logout: 'تسجيل الخروج', welcome: 'مرحباً بعودتك', totalSpaces: 'إجمالي الأماكن', occupied: 'مشغولة', available: 'متاحة', revenue: 'الإيرادات الشهرية', pending: 'مدفوعات معلقة', activeRes: 'الحجوزات النشطة',
  },
};

export const LangContext = createContext({ t: TRANSLATIONS.en, lang: 'en', setLang: (_l: string) => {} });

export default function OwnerDashboard() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gariha_owner_lang') || 'en';
    }
    return 'en';
  });

  const [owner, setOwner] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load language preference and fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile only if it's missing (initial load)
        if (!owner) {
          const userRes = await api.get('/auth/me');
          setOwner(userRes.data);
        }

        // Always fetch latest dashboard data
        const dashRes = await api.get('/owner/dashboard');
        setDashboardData(dashRes.data);
      } catch (err) {
        console.error("Failed to fetch backend data", err);
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === 'overview' || !dashboardData) {
      fetchData();
    }
  }, [activeSection]);

  const handleSetLang = (l: string) => {
    setLang(l);
    localStorage.setItem('gariha_owner_lang', l);
  };

  const t = TRANSLATIONS[lang];

  if (loading) {
    return <div className={s.shell} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading dashboard...</div>;
  }

  // Map backend data to frontend props format
  const displayOwner = {
    id: owner?.id,
    fullName: owner?.full_name || "Owner",
    email: owner?.email,
    phone: owner?.phone || "No phone provided",
    parkingName: dashboardData?.parkings?.[0]?.parking_name || "Main Parking",
    status: owner?.status === 'approved' ? 'Approved' : 'Pending',
    partnerType: "Verified Partner",
    activeSince: owner?.created_at ? new Date(owner.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Unknown",
    totalSpaces: dashboardData?.total_places || 0,
  };

  // Provide initial spaces if available via dashboard parkings (this will be deeply handled in ParkingSpaces component)
  const initialParkingId = dashboardData?.parkings?.[0]?.id || null;

  const sections: Record<string, React.ReactNode> = {
    overview: <Overview owner={displayOwner} dashboardData={dashboardData} />,
    spaces: <ParkingSpaces parkingId={initialParkingId} />,
    reports: <Reports />,
    payments: <Payments />,
    reservations: <Reservations />,
    pricing: <PricingRules />,
    access: <AccessControl />,
    messaging: <Messaging owner={owner} />,
    notifications: <Notifications />,
    settings: <Settings owner={displayOwner} />,
  };

  return (
    <LangContext.Provider value={{ t, lang, setLang: handleSetLang }}>
      <div className={s.shell} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {sidebarOpen && <div className={s.overlay} onClick={() => setSidebarOpen(false)} />}
        <button className={s.burger} onClick={() => setSidebarOpen(true)}>☰</button>
        <Sidebar 
          active={activeSection} 
          onNavigate={(id: string) => { setActiveSection(id); setSidebarOpen(false); }} 
          open={sidebarOpen}
        />
        <main className={s.content}>
          <div className={s.topbar}>
            <div className={s.brand}>
              <img src="http://localhost:3000/_next/image?url=https%3A%2F%2Fres.cloudinary.com%2Fdw1zljrse%2Fimage%2Fupload%2Fv1776985917%2Fgariha1_1_kluzyl.png&w=1920&q=75" alt="Gariha" className={s.realLogo} />
              <span className={s.brandBadgeRole}>OWNERS</span>
            </div>
            <div className={s.topbarProfile}>
              <div 
                style={{ position: "relative", marginRight: "16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "#F1F5F9" }}
                onClick={() => setActiveSection('messaging')}
                title="Messaging"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                {/* Simulated badge for unread messages */}
                <div style={{ position: "absolute", top: 8, right: 10, width: "8px", height: "8px", background: "#3B82F6", borderRadius: "50%", border: "2px solid #F1F5F9" }}></div>
              </div>
              <div 
                style={{ position: "relative", marginRight: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "40px", height: "40px", borderRadius: "50%", background: "#F1F5F9" }}
                onClick={() => setActiveSection('notifications')}
                title="Notifications"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                {/* Simulated badge for unread count */}
                <div style={{ position: "absolute", top: 8, right: 10, width: "8px", height: "8px", background: "#EF4444", borderRadius: "50%", border: "2px solid #F1F5F9" }}></div>
              </div>
              <div className={s.tpInfo}>
                <p className={s.tpName}>{displayOwner.fullName}</p>
                <p className={s.tpStatus}>
                  <span className={s.statusDot}></span>
                  {displayOwner.status} • {displayOwner.partnerType} • Since {displayOwner.activeSince}
                </p>
              </div>
              <div className={s.tpAvatar}>
                {displayOwner.fullName.substring(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
          <div className={s.pageContent}>
            {sections[activeSection]}
          </div>
        </main>
      </div>
    </LangContext.Provider>
  );
}
