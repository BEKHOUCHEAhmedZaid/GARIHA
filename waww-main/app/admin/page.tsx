/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/purity */
"use client";

import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { api } from "../../lib/axios";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [navActive, setNavActive] = useState("nav-home");
  const [isAddOwnerModalOpen, setIsAddOwnerModalOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const router = useRouter();

  // Messaging State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [activeMessages, setActiveMessages] = useState<any[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = async () => {
    try {
      const res = await api.get("/messages/conversations");
      setConversations(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchActiveThread = async (userId: number) => {
    setLoadingMessages(true);
    try {
      const res = await api.get(`/messages/with/${userId}`);
      setActiveMessages(res.data);
      // Refresh conversation list to clear unread badges
      fetchConversations();
    } catch (e) { console.error(e); }
    finally { setLoadingMessages(false); }
  };

  const handleSendReply = async () => {
    if (!adminReply.trim() || !activeChat) return;
    try {
      await api.post("/messages/send", {
        content: adminReply,
        receiver_id: activeChat.user_id
      });
      setAdminReply("");
      fetchActiveThread(activeChat.user_id);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (activeTab === "support") {
      fetchConversations();
      const interval = setInterval(fetchConversations, 10000); // Polling conversations
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeChat) {
      fetchActiveThread(activeChat.user_id);
      const interval = setInterval(() => fetchActiveThread(activeChat.user_id), 5000); // Polling active thread
      return () => clearInterval(interval);
    }
  }, [activeChat]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const showToast = (msg: string, type: string = "ok") => {
    const id = Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };

  const [broadcastForm, setBroadcastForm] = useState({
    targetRole: "All Users",
    category: "📢 Announcement",
    priority: "Normal",
    title: "",
    message: "",
    scheduleDate: "",
    scheduleTime: ""
  });

  const handleBroadcastTarget = (role: string) => setBroadcastForm(prev => ({ ...prev, targetRole: role }));

  const handleSendBroadcast = async (isScheduled: boolean) => {
    if (!broadcastForm.title || !broadcastForm.message) {
      showToast("Title and message are required", "error");
      return;
    }
    
    let scheduled_for = null;
    if (isScheduled) {
      if (!broadcastForm.scheduleDate || !broadcastForm.scheduleTime) {
        showToast("Please select schedule date and time", "error");
        return;
      }
      scheduled_for = new Date(`${broadcastForm.scheduleDate}T${broadcastForm.scheduleTime}:00Z`).toISOString();
    }
    
    try {
      const token = localStorage.getItem('gariha_token');
      await api.post("/notifications/broadcast", {
        title: broadcastForm.title,
        message: broadcastForm.message,
        category: broadcastForm.category,
        priority: broadcastForm.priority,
        target_role: broadcastForm.targetRole,
        scheduled_for: scheduled_for
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(isScheduled ? "Message scheduled successfully" : "Notification sent successfully", "ok");
      setBroadcastForm({ ...broadcastForm, title: "", message: "", scheduleDate: "", scheduleTime: "" });
    } catch (e) {
      console.error(e);
      showToast("Failed to send notification", "error");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("gariha_token");
    sessionStorage.clear();
    document.cookie.split(";").forEach((c) => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    router.replace('/auth');
  };

  // Chart Tabs State
  const [revChartRange, setRevChartRange] = useState<"week" | "month" | "year">("week");
  
  // Settings State
  const [activeRegions, setActiveRegions] = useState<string[]>(['Sétif', 'Constantine', 'Batna', 'Béjaïa']);
  const [newRegion, setNewRegion] = useState("");
  const allRegions = [...new Set([...activeRegions, 'Algiers', 'Oran', 'Annaba', 'Tizi Ouzou'])];

  const toggleRegion = (region: string) => {
    if (activeRegions.includes(region)) {
      setActiveRegions(activeRegions.filter(r => r !== region));
    } else {
      setActiveRegions([...activeRegions, region]);
    }
  };
  
  const handleAddRegion = () => {
    if (newRegion.trim() && !activeRegions.includes(newRegion.trim())) {
      setActiveRegions([...activeRegions, newRegion.trim()]);
    }
    setNewRegion("");
  };

  // Real Owners State
  const [pendingOwners, setPendingOwners] = useState<Array<{ id: number; full_name: string; email: string; role: string; avatar: string; created_at: string; }>>([]);
  const [approvedOwners, setApprovedOwners] = useState<Array<{ id: number; full_name: string; email: string; role: string; avatar: string; created_at: string; }>>([]);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const pendingRes = await api.get("/admin/pending-owners");
        setPendingOwners(pendingRes.data);
        const approvedRes = await api.get("/admin/approved-owners");
        setApprovedOwners(approvedRes.data);
      } catch (e) { console.error(e); }
    };
    if (activeTab === "owners") fetchOwners();
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/admin/approve-owner/${id}`);
      showToast("Owner approved");
      setPendingOwners(p => p.filter(o => o.id !== id));
    } catch (e) { console.error(e); showToast("Failed to approve", "err"); }
  }

  const handleReject = async (id: number) => {
    try {
      await api.put(`/admin/reject-owner/${id}`);
      showToast("Owner rejected", "err");
      setPendingOwners(p => p.filter(o => o.id !== id));
    } catch (e) { console.error(e); }
  }

  const [ownerFilter, setOwnerFilter] = useState("");
  
  const handleDeleteOwner = async (id: number) => {
    if (!window.confirm("Are you sure you want to completely delete this owner and all their parkings? This action cannot be undone.")) return;
    try {
      await api.delete(`/admin/delete-owner/${id}`);
      showToast("Owner deleted successfully");
      setApprovedOwners(p => p.filter(o => o.id !== id));
      setPendingOwners(p => p.filter(o => o.id !== id));
    } catch (e) { console.error(e); showToast("Failed to delete owner", "err"); }
  }

  // Reset Data (Everything is 0 or empty)
  const [stats, setStats] = useState({
    parkings: 0,
    drivers: 0,
    revenue: 0,
    transactions: 0,
    newUsers: 0,
    activeOwners: 0,
    pendingOwners: 0,
    suspendedOwners: 0,
    activeDrivers: 0,
    reportedDrivers: 0,
    bannedDrivers: 0,
    openReports: 0,
    warningsIssued: 0,
    bansThisMonth: 0,
    resolvedReports: 0,
    totalProcessed: 0,
    commissionsEarned: 0,
    pendingPayments: 0,
    disputes: 0,
    pendingValidations: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/stats");
        const data = res.data;
        setStats({
          parkings: data.total_parkings || 0,
          drivers: data.active_drivers || 0,
          revenue: data.revenue || 0,
          transactions: data.transactions || 0,
          newUsers: data.new_users || 0,
          activeOwners: data.approved_owners || 0,
          pendingOwners: data.pending_owners || 0,
          suspendedOwners: data.suspended_owners || 0,
          activeDrivers: data.active_drivers || 0,
          reportedDrivers: data.reported_drivers || 0,
          bannedDrivers: data.banned_drivers || 0,
          openReports: data.open_reports || 0,
          warningsIssued: data.warnings_issued || 0,
          bansThisMonth: data.bans_this_month || 0,
          resolvedReports: data.resolved_reports || 0,
          totalProcessed: data.total_processed || 0,
          commissionsEarned: data.commissions_earned || 0,
          pendingPayments: data.pending_payments || 0,
          disputes: data.disputes || 0,
          pendingValidations: data.pending_validations || 0,
        });
      } catch (e) { console.error(e); }
    };
    if (activeTab === "dashboard" || activeTab === "validation") {
        fetchStats();
    }
  }, [activeTab]);


  const [currentUser, setCurrentUser] = useState<{ id: number; full_name: string; avatar?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get("/auth/me");
        setCurrentUser(res.data);
      } catch {
        console.error("Not logged in");
      }
    };
    fetchUser();
  }, []);

  const getInitials = (name: string) => {
    if (!name) return "SA";
    const parts = name.split(" ");
    return parts.map(p => p[0]).join("").substring(0, 2).toUpperCase();
  };

  const handleNav = (tab: string, navId: string = "nav-home") => {
    setActiveTab(tab);
    setNavActive(navId);
  };

  const logoUrl = "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png";

  return (
    <div className="main" style={{ marginLeft: activeTab ? "104px" : "104px" }}>
      {/* SIDEBAR */}
      <aside className="sb">
        <div className="sb-logo" onClick={() => handleNav("dashboard")}>
          <img src={logoUrl} alt="Gariha" />
        </div>
        {[
          { id: "dashboard", label: "Dashboard", tip: "Dashboard", svg: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></> },
          { id: "owners", label: "Owners", tip: "Owner Requests", svg: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></> },
          { id: "drivers", label: "Drivers", tip: "Drivers", svg: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></> },
          { id: "reports", label: "Reports", tip: "Reports & Moderation", svg: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></> },
          { id: "payments", label: "Payments", tip: "Payments & Commissions", svg: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></> },
          { id: "validation", label: "Validate", tip: "Parking Validation", svg: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></> },
          { id: "notifications", label: "Notifs", tip: "Notifications", svg: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></> },
          { id: "support", label: "Support", tip: "Support Messaging", svg: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></> },
          { id: "analytics", label: "Analytics", tip: "Analytics", svg: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></> }
        ].map((item) => (
          <div key={item.id} className={`ni ${activeTab === item.id ? "active" : ""}`} onClick={() => handleNav(item.id)}>
            <svg viewBox="0 0 24 24">{item.svg}</svg>
            <span className="ni-lbl">{item.label}</span>
            <span className="ni-tip">{item.tip}</span>
          </div>
        ))}
        <div className="sb-spacer"></div>
        <div className={`ni ${activeTab === "settings" ? "active" : ""}`} onClick={() => handleNav("settings")}>
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
          <span className="ni-lbl">Settings</span>
          <span className="ni-tip">Settings</span>
        </div>
        <div className="ni" onClick={() => setShowLogoutModal(true)} style={{ color: "#EF4444", marginTop: "auto" }}>
          <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span className="ni-lbl">Log Out</span>
          <span className="ni-tip">Log Out</span>
        </div>
      </aside>

      {/* TOPBAR */}
      <header className="topbar">
        <div className="tb-brand">
          <img src={logoUrl} alt="Gariha" className="tb-logo-img" />
          <span className="admin-badge">SUPER ADMIN</span>
        </div>
        <nav className="tb-nav">
          <a href="#" className={navActive === "nav-home" ? "active" : ""} onClick={(e) => { e.preventDefault(); handleNav("dashboard", "nav-home"); }}>Home</a>
          <a href="#" className={navActive === "nav-support" ? "active" : ""} onClick={(e) => { e.preventDefault(); handleNav("support", "nav-support"); }}>Support</a>
        </nav>
        <div className="tb-right">
          <button className="icon-btn" onClick={() => handleNav("support")} title="Messaging">
            <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            {conversations.some(c => c.unread_count > 0) && <span className="notif-dot" style={{ background: "#3B82F6" }}></span>}
          </button>
          <button className="icon-btn" onClick={() => showToast("0 pending validations", "ok")} title="Alerts">
            <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>
            {stats.pendingValidations > 0 && <span className="notif-dot"></span>}
          </button>
          <div className="avatar" title={currentUser?.full_name || "Admin"}>
            {currentUser?.avatar ? <img src={currentUser.avatar} alt="Avatar" style={{ width: "100%", height: "100%", borderRadius: "50%" }} /> : getInitials(currentUser?.full_name || "")}
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="content">

        {/* DASHBOARD TAB */}
        <div className={`page ${activeTab === "dashboard" ? "active" : ""}`} id="page-dashboard">
          <div className="sh">
            <div><div className="sh-title">Platform Overview</div><div className="sh-sub">Gariha Super Admin · Real-time global control center</div></div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => showToast("Report exported")}><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>Export</button>
              <button className="btn btn-primary" onClick={() => showToast("Data refreshed", "ok")}><svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>Refresh</button>
            </div>
          </div>
          <div className="stat-grid">
            <div className="stat-card"><div className="stat-icon si-blue"><svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /></svg></div><div className="stat-label">Total Parkings</div><div className="stat-val">{stats.parkings}</div><div className="stat-meta"><span className="up">-</span></div></div>
            <div className="stat-card"><div className="stat-icon si-green"><svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div><div className="stat-label">Total Drivers</div><div className="stat-val">{stats.drivers}</div><div className="stat-meta"><span className="up">-</span></div></div>
            <div className="stat-card"><div className="stat-icon si-amber"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div><div className="stat-label">Platform Revenue</div><div className="stat-val" style={{ fontSize: "20px" }}>{stats.revenue} <span style={{ fontSize: "13px", color: "var(--text2)", fontWeight: "600" }}>DZD</span></div><div className="stat-meta"><span className="up">-</span></div></div>
            <div className="stat-card"><div className="stat-icon si-purple"><svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg></div><div className="stat-label">Today&apos;s Transactions</div><div className="stat-val">{stats.transactions}</div><div className="stat-meta"><span className="up">-</span></div></div>
            <div className="stat-card"><div className="stat-icon si-red"><svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg></div><div className="stat-label">New Users Today</div><div className="stat-val">{stats.newUsers}</div><div className="stat-meta"><span className="up">-</span></div></div>
          </div>
          <div className="grid-6-4">
            <div className="card">
              <div className="card-title">Revenue Evolution<div className="chart-tabs"><button className={`ct ${revChartRange === "week" ? "active" : ""}`} onClick={() => setRevChartRange("week")}>Week</button><button className={`ct ${revChartRange === "month" ? "active" : ""}`} onClick={() => setRevChartRange("month")}>Month</button><button className={`ct ${revChartRange === "year" ? "active" : ""}`} onClick={() => setRevChartRange("year")}>Year</button></div></div>
              <div className="chart-wrap" style={{ height: "200px" }}>
                <Line
                  data={{
                    labels: revChartRange === "week" ? ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] : revChartRange === "month" ? ['S1', 'S2', 'S3', 'S4'] : ['Jan', 'Feb', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
                    datasets: [{
                      label: 'Revenue',
                      data: revChartRange === "week" ? [stats.revenue*0.1, stats.revenue*0.2, stats.revenue*0.15, stats.revenue*0.3, stats.revenue*0.25, stats.revenue*0.4, stats.revenue*0.5] : revChartRange === "month" ? [stats.revenue*0.2, stats.revenue*0.3, stats.revenue*0.4, stats.revenue*0.1] : [stats.revenue*0.05, stats.revenue*0.06, stats.revenue*0.08, stats.revenue*0.1, stats.revenue*0.15, stats.revenue*0.2, stats.revenue*0.1, 0, 0, 0, 0, 0],
                      borderColor: '#182FB0',
                      backgroundColor: 'rgba(75,207,231,0.08)',
                      borderWidth: 2.5,
                      pointBackgroundColor: '#4BCFE7',
                      pointBorderColor: '#182FB0',
                      pointBorderWidth: 2,
                      pointRadius: 4,
                      tension: .45,
                      fill: true
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F1F5F9' }, border: { display: false } } } }}
                />
              </div>
            </div>
            <div className="card">
              <div className="card-title">User Distribution <span>Live</span></div>
              <div className="chart-wrap" style={{ height: "200px" }}>
                <Doughnut
                  data={{
                    labels: ['Active Drivers', 'Active Owners', 'Pending', 'Banned'],
                    datasets: [{
                      data: [stats.activeDrivers, stats.activeOwners, stats.pendingOwners, stats.bannedDrivers],
                      backgroundColor: ['rgba(75,207,231,0.85)', 'rgba(24,47,176,0.85)', 'rgba(245,158,11,0.85)', 'rgba(239,68,68,0.85)'],
                      borderWidth: 0,
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'right', labels: { padding: 12, font: { size: 11 } } } } }}
                />
              </div>
            </div>
          </div>
          <div className="grid-6-4">
            <div className="tbl-card" style={{ marginBottom: 0 }}>
              <div className="card-title">Recent Transactions <span onClick={() => handleNav('payments')} style={{ cursor: "pointer", color: "var(--primary)" }}>View all →</span></div>
              <table className="tbl">
                <thead><tr><th>ID</th><th>Parking</th><th>Driver</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
                <tbody>
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>No recent transactions yet</td></tr>
                </tbody>
              </table>
            </div>
            <div className="card">
              <div className="card-title">Platform Activity <span>Live</span></div>
              <div style={{ maxHeight: "220px", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text2)" }}>
                No recent activity.
              </div>
            </div>
          </div>
        </div>

        {/* OWNERS TAB */}
        <div className={`page ${activeTab === "owners" ? "active" : ""}`} id="page-owners">
          <div className="sh">
            <div><div className="sh-title">Parking Owners</div><div className="sh-sub">Manage all parking owners on the platform</div></div>
            <div className="btn-row">
              <button className="btn btn-secondary" onClick={() => showToast("Exported owners list")}>Export</button>
              <button className="btn btn-primary" onClick={() => setIsAddOwnerModalOpen(true)}><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Add Owner</button>
            </div>
          </div>
          <div className="kpi-row">
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#EFF6FF" }}><svg viewBox="0 0 24 24" stroke="#2563EB"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /></svg></div><div><div className="kpi-lbl">Total Owners</div><div className="kpi-val">{approvedOwners.length + pendingOwners.length}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#ECFDF5" }}><svg viewBox="0 0 24 24" stroke="#10B981"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div><div><div className="kpi-lbl">Active</div><div className="kpi-val">{approvedOwners.length}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#FFFBEB" }}><svg viewBox="0 0 24 24" stroke="#F59E0B"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg></div><div><div className="kpi-lbl">Pending</div><div className="kpi-val">{pendingOwners.length}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#FEF2F2" }}><svg viewBox="0 0 24 24" stroke="#EF4444"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div><div><div className="kpi-lbl">Suspended</div><div className="kpi-val">0</div></div></div>
          </div>
          <div className="tbl-card">
            <div className="tbl-controls">
              <div className="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg><input type="text" placeholder="Search owners…" /></div>
              <select className="fsel" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <table className="tbl">
              <thead><tr><th>Owner</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingOwners
                  .filter(o => ownerFilter === "" || ownerFilter === "pending")
                  .map(o => (
                  <tr key={o.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img src={o.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png"} alt={o.full_name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                        <strong>{o.full_name}</strong>
                      </div>
                    </td>
                    <td>{o.email}</td>
                    <td>{o.role}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><span className="badge b-pending">Pending</span></td>
                    <td>
                      <button className="ab ab-ok" onClick={() => handleApprove(o.id)} title="Approve"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg></button>
                      <button className="ab ab-del" onClick={() => handleReject(o.id)} title="Reject"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                    </td>
                  </tr>
                ))}
                {approvedOwners
                  .filter(o => ownerFilter === "" || ownerFilter === "active")
                  .map(o => (
                  <tr key={o.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img src={o.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png"} alt={o.full_name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                        <strong>{o.full_name}</strong>
                      </div>
                    </td>
                    <td>{o.email}</td>
                    <td>{o.role}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><span className="badge b-active">Approved</span></td>
                    <td>
                      <button className="ab ab-info" title="View"><svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg></button>
                      <button className="ab ab-del" onClick={() => handleDeleteOwner(o.id)} title="Delete Owner" style={{ marginLeft: "4px" }}><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                    </td>
                  </tr>
                ))}
                {pendingOwners.length === 0 && approvedOwners.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>No parking owners registered yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* DRIVERS TAB */}
        <div className={`page ${activeTab === "drivers" ? "active" : ""}`} id="page-drivers">
          <div className="sh">
            <div><div className="sh-title">Drivers Management</div><div className="sh-sub">Monitor and moderate all platform drivers</div></div>
            <button className="btn btn-secondary" onClick={() => showToast("Exported drivers list")}>Export</button>
          </div>
          <div className="kpi-row">
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#EFF6FF" }}><svg viewBox="0 0 24 24" stroke="#2563EB"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg></div><div><div className="kpi-lbl">Total Drivers</div><div className="kpi-val">{stats.activeDrivers + stats.bannedDrivers + stats.reportedDrivers}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#ECFDF5" }}><svg viewBox="0 0 24 24" stroke="#10B981"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div><div><div className="kpi-lbl">Active</div><div className="kpi-val">{stats.activeDrivers}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#FFFBEB" }}><svg viewBox="0 0 24 24" stroke="#F59E0B"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg></div><div><div className="kpi-lbl">Reported</div><div className="kpi-val">{stats.reportedDrivers}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon" style={{ background: "#FEF2F2" }}><svg viewBox="0 0 24 24" stroke="#EF4444"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div><div><div className="kpi-lbl">Banned</div><div className="kpi-val">{stats.bannedDrivers}</div></div></div>
          </div>
          <div className="tbl-card">
            <div className="tbl-controls">
              <div className="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg><input type="text" placeholder="Search drivers…" /></div>
              <select className="fsel"><option value="">All Status</option><option value="active">Active</option><option value="reported">Reported</option><option value="banned">Banned</option></select>
            </div>
            <table className="tbl">
              <thead><tr><th>Driver</th><th>Plate</th><th>Reservations</th><th>Reports</th><th>Spent</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>No drivers registered yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* REPORTS TAB */}
        <div className={`page ${activeTab === "reports" ? "active" : ""}`} id="page-reports">
          <div className="sh">
            <div><div className="sh-title">Reports & Moderation</div><div className="sh-sub">Click any report to expand details — review and take action</div></div>
            <div className="btn-row">
              <button className="btn btn-warn" onClick={() => showToast("All dismissed", "warn-t")}>Dismiss All</button>
              <button className="btn btn-primary" onClick={() => showToast("Exported reports")}>Export</button>
            </div>
          </div>
          <div className="kpi-row">
            <div className="kpi-card"><div className="kpi-icon si-red"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg></div><div><div className="kpi-lbl">Open Reports</div><div className="kpi-val">{stats.openReports}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg></div><div><div className="kpi-lbl">Warnings Issued</div><div className="kpi-val">{stats.warningsIssued}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-red"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg></div><div><div className="kpi-lbl">Bans This Month</div><div className="kpi-val">{stats.bansThisMonth}</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-green"><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg></div><div><div className="kpi-lbl">Resolved</div><div className="kpi-val">{stats.resolvedReports}</div></div></div>
          </div>
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No open reports at this time.</div>
        </div>

        {/* PAYMENTS TAB */}
        <div className={`page ${activeTab === "payments" ? "active" : ""}`} id="page-payments">
          <div className="sh">
            <div><div className="sh-title">Payments & Commissions</div><div className="sh-sub">Platform-wide financial overview and commission management</div></div>
            <button className="btn btn-primary" onClick={() => showToast("Finance report exported", "ok")}>Export Finance</button>
          </div>
          <div className="comm-box">
            <div><div style={{ fontSize: "12px", opacity: .8, fontWeight: 600, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: "6px" }}>Current Platform Commission</div><div className="comm-val">10%</div><div className="comm-sub">Applied to every transaction across all parkings</div></div>
            <div><div style={{ fontSize: "12px", opacity: .8, marginBottom: "8px", fontWeight: 600 }}>Adjust Commission</div><div className="comm-edit"><input className="comm-input" type="number" defaultValue="10" min="1" max="30" /><button className="btn" style={{ background: "rgba(255,255,255,.25)", color: "#fff", border: "1.5px solid rgba(255,255,255,.4)" }} onClick={() => showToast("Commission applied", "ok")}>Apply</button></div></div>
          </div>
          <div className="kpi-row">
            <div className="kpi-card"><div className="kpi-icon si-green"><svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg></div><div><div className="kpi-lbl">Total Processed</div><div className="kpi-val" style={{ fontSize: "15px" }}>{stats.totalProcessed} DZD</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-blue"><svg viewBox="0 0 24 24"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-5.5 4 2.4-7.4L2 9.4h7.6z" /></svg></div><div><div className="kpi-lbl">Commissions Earned</div><div className="kpi-val" style={{ fontSize: "15px" }}>{stats.commissionsEarned} DZD</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-amber"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /></svg></div><div><div className="kpi-lbl">Pending</div><div className="kpi-val" style={{ fontSize: "15px" }}>{stats.pendingPayments} DZD</div></div></div>
            <div className="kpi-card"><div className="kpi-icon si-red"><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg></div><div><div className="kpi-lbl">Disputes</div><div className="kpi-val">{stats.disputes}</div></div></div>
          </div>
          <div className="tbl-card">
            <div className="tbl-controls">
              <div className="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg><input type="text" placeholder="Search transactions…" /></div>
              <select className="fsel"><option value="">All Status</option><option value="paid">Paid</option><option value="pending">Pending</option></select>
            </div>
            <table className="tbl">
              <thead><tr><th>Transaction</th><th>Parking</th><th>Driver</th><th>Amount</th><th>Commission</th><th>Method</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                <tr><td colSpan={9} style={{ textAlign: "center", padding: "30px", color: "var(--text2)" }}>No transactions yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* VALIDATION TAB */}
        <div className={`page ${activeTab === "validation" ? "active" : ""}`} id="page-validation">
          <div className="sh">
            <div><div className="sh-title">Owner Validation</div><div className="sh-sub">Review and approve new parking owner submissions</div></div>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--warning)", background: "#FFFBEB", padding: "6px 14px", borderRadius: "20px" }}>⏳ {pendingOwners.length} Pending Reviews</span>
          </div>
          
          <div className="tbl-card">
            <table className="tbl">
              <thead><tr><th>Owner</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {pendingOwners.map(o => (
                  <tr key={o.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <img src={o.avatar || "https://res.cloudinary.com/dw1zljrse/image/upload/v1776985917/gariha1_1_kluzyl.png"} alt={o.full_name} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                        <strong>{o.full_name}</strong>
                      </div>
                    </td>
                    <td>{o.email}</td>
                    <td>{o.role}</td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td><span className="badge b-pending">Pending</span></td>
                    <td>
                      <button className="ab ab-ok" onClick={() => handleApprove(o.id)} title="Approve"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" /></svg></button>
                      <button className="ab ab-del" onClick={() => handleReject(o.id)} title="Reject"><svg viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                    </td>
                  </tr>
                ))}
                {pendingOwners.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No pending validations. All owners are processed.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* NOTIFICATIONS TAB */}
        <div className={`page ${activeTab === "notifications" ? "active" : ""}`} id="page-notifications">
          <div className="sh"><div><div className="sh-title">Notifications & Broadcast</div><div className="sh-sub">Send platform-wide messages and manage system alerts</div></div></div>
          <div className="grid-6-4">
            <div className="form-card" style={{ marginBottom: 0 }}>
              <div className="card-title" style={{ marginBottom: "14px" }}>New Broadcast Message</div>
              <div style={{ marginBottom: "14px" }}>
                <div className="flbl" style={{ marginBottom: "8px" }}>Target Audience</div>
                <div className="notif-targets">
                  {["All Users", "Drivers Only", "Owners Only"].map(role => (
                    <div 
                      key={role} 
                      className={`ntarget ${broadcastForm.targetRole === role ? "active" : ""}`} 
                      onClick={() => handleBroadcastTarget(role)}
                    >
                      {role}
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-grid" style={{ marginBottom: "14px" }}>
                <div className="fg">
                  <label className="flbl">Type</label>
                  <select className="fsel2" value={broadcastForm.category} onChange={e => setBroadcastForm({...broadcastForm, category: e.target.value})}>
                    <option>📢 Announcement</option>
                    <option>⚠️ Warning</option>
                    <option>🔧 Maintenance</option>
                    <option>💰 Payment Alert</option>
                    <option>📅 Reservation Alert</option>
                    <option>🛡️ Admin Message</option>
                    <option>⚙️ System Alert</option>
                  </select>
                </div>
                <div className="fg">
                  <label className="flbl">Priority</label>
                  <select className="fsel2" value={broadcastForm.priority} onChange={e => setBroadcastForm({...broadcastForm, priority: e.target.value})}>
                    <option>Low</option>
                    <option>Normal</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div className="fg full">
                  <label className="flbl">Title</label>
                  <input className="finput" type="text" placeholder="Notification title…" value={broadcastForm.title} onChange={e => setBroadcastForm({...broadcastForm, title: e.target.value})} />
                </div>
                <div className="fg full">
                  <label className="flbl">Message</label>
                  <textarea className="finput" placeholder="Write your message here…" value={broadcastForm.message} onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}></textarea>
                </div>
                
                {/* Scheduling Logic */}
                <div className="fg">
                  <label className="flbl">Schedule Date (Optional)</label>
                  <input className="finput" type="date" value={broadcastForm.scheduleDate} onChange={e => setBroadcastForm({...broadcastForm, scheduleDate: e.target.value})} />
                </div>
                <div className="fg">
                  <label className="flbl">Schedule Time (Optional)</label>
                  <input className="finput" type="time" value={broadcastForm.scheduleTime} onChange={e => setBroadcastForm({...broadcastForm, scheduleTime: e.target.value})} />
                </div>
              </div>
              <div className="btn-row">
                <button className="btn btn-primary" onClick={() => handleSendBroadcast(false)}>
                  <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                  Send Now
                </button>
                <button className="btn btn-secondary" onClick={() => handleSendBroadcast(true)}>Schedule</button>
              </div>
            </div>
            <div className="card">
              <div className="card-title">Recent Broadcasts</div>
              <div style={{ textAlign: "center", padding: "40px", color: "var(--text2)" }}>No past broadcasts.</div>
            </div>
          </div>
        </div>

        {/* ANALYTICS TAB */}
        <div className={`page ${activeTab === "analytics" ? "active" : ""}`} id="page-analytics">
          <div className="sh"><div><div className="sh-title">Platform Analytics</div><div className="sh-sub">Deep insights on growth, revenue, and platform activity</div></div><button className="btn btn-primary" onClick={() => showToast("Analytics exported", "ok")}>Export Report</button></div>
          <div className="grid-2" style={{ marginBottom: "16px" }}>
            <div className="card"><div className="card-title">Revenue by Month <span>Current Year</span></div>
              <div className="chart-wrap" style={{ height: "190px" }}>
                <Bar
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [{
                      label: 'Revenue',
                      data: [0, 0, 0, 0, 0, 0],
                      backgroundColor: 'rgba(24,47,176,0.12)',
                      borderColor: '#182FB0',
                      borderWidth: 2,
                      borderRadius: 8
                    }]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F1F5F9' }, border: { display: false } } } }}
                />
              </div>
            </div>
            <div className="card"><div className="card-title">User Acquisition <span>Drivers vs Owners</span></div>
              <div className="chart-wrap" style={{ height: "190px" }}>
                <Line
                  data={{
                    labels: ['Jan', 'Feb', 'Mar', 'Avr', 'Mai', 'Jun'],
                    datasets: [
                      { label: 'Drivers', data: [0, 0, 0, 0, 0, 0], borderColor: '#4BCFE7', backgroundColor: 'rgba(75,207,231,0.08)', borderWidth: 2.5, tension: .45, fill: true, pointRadius: 3 },
                      { label: 'Owners', data: [0, 0, 0, 0, 0, 0], borderColor: '#182FB0', backgroundColor: 'transparent', borderWidth: 2, tension: .45, pointRadius: 3 }
                    ]
                  }}
                  options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { padding: 10, font: { size: 11 } } } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#F1F5F9' }, border: { display: false } } } }}
                />
              </div>
            </div>
          </div>
          <div className="grid-2">
            <div className="card"><div className="card-title">Top Cities by Activity</div>
              <div style={{ marginTop: "4px", textAlign: "center", color: "var(--text2)", padding: "20px" }}>No data yet.</div>
            </div>
            <div className="card"><div className="card-title">Key Platform Metrics</div>
              <div className="tog-row"><div><div className="tog-title">Cancellation Rate</div><div className="tog-sub">Global average</div></div><strong style={{ color: "var(--warning)" }}>0.0%</strong></div>
              <div className="tog-row"><div><div className="tog-title">Avg. Reservation Duration</div></div><strong>0h 00m</strong></div>
              <div className="tog-row"><div><div className="tog-title">Platform Uptime</div><div className="tog-sub">Last 30 days</div></div><strong style={{ color: "var(--success)" }}>100%</strong></div>
              <div className="tog-row"><div><div className="tog-title">Driver Satisfaction</div></div><strong style={{ color: "var(--success)" }}>0.0 / 5</strong></div>
              <div className="tog-row"><div><div className="tog-title">Peak Hour</div></div><strong>--:--</strong></div>
            </div>
          </div>
        </div>

        {/* SETTINGS TAB */}
        <div className={`page ${activeTab === "settings" ? "active" : ""}`} id="page-settings">
          <div className="sh"><div><div className="sh-title">Platform Settings</div><div className="sh-sub">Global configuration for the Gariha platform</div></div><button className="btn btn-primary" onClick={() => showToast("Settings saved", "ok")}>Save All Changes</button></div>
          <div className="grid-2">
            <div className="form-card" style={{ marginBottom: 0 }}>
              <div className="settings-lbl">Platform Configuration</div>
              <div className="form-grid" style={{ marginBottom: "16px" }}>
                <div className="fg"><label className="flbl">Platform Name</label><input className="finput" defaultValue="Gariha" /></div>
                <div className="fg"><label className="flbl">Support Email</label><input className="finput" defaultValue="support@gariha.dz" /></div>
                <div className="fg"><label className="flbl">Max Reservation (hrs)</label><input className="finput" type="number" defaultValue="8" /></div>
                <div className="fg"><label className="flbl">Cancellation Window (min)</label><input className="finput" type="number" defaultValue="30" /></div>
                <div className="fg"><label className="flbl">Default Language</label><select className="fsel2"><option>Arabic</option><option>French</option><option>English</option></select></div>
                <div className="fg"><label className="flbl">Service Fee (%)</label><input className="finput" type="number" defaultValue="10" /></div>
              </div>
              <button className="btn btn-primary" onClick={() => showToast("Config saved", "ok")}>Save Config</button>
            </div>
            <div className="form-card" style={{ marginBottom: 0 }}>
              <div className="settings-lbl">Platform Toggles</div>
              <div className="tog-row"><div><div className="tog-title">New Registrations</div><div className="tog-sub">Allow new drivers to sign up</div></div><label className="tog"><input type="checkbox" defaultChecked /><span className="tog-sl"></span></label></div>
              <div className="tog-row"><div><div className="tog-title">Parking Submissions</div><div className="tog-sub">Allow owners to submit new parkings</div></div><label className="tog"><input type="checkbox" defaultChecked /><span className="tog-sl"></span></label></div>
              <div className="tog-row"><div><div className="tog-title">Maintenance Mode</div><div className="tog-sub">Take platform offline for all users</div></div><label className="tog"><input type="checkbox" /><span className="tog-sl"></span></label></div>
              <div className="tog-row"><div><div className="tog-title">Auto-Ban on 5 Reports</div><div className="tog-sub">Automatically ban drivers with 5+ reports</div></div><label className="tog"><input type="checkbox" defaultChecked /><span className="tog-sl"></span></label></div>
              <div className="tog-row"><div><div className="tog-title">Fraud Detection</div><div className="tog-sub">AI-based payment fraud monitoring</div></div><label className="tog"><input type="checkbox" defaultChecked /><span className="tog-sl"></span></label></div>
            </div>
          </div>
          <div className="form-card" style={{ marginTop: "16px" }}>
            <div className="settings-lbl">Active Regions</div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
              {allRegions.map(region => (
                <div 
                  key={region} 
                  className={`ntarget ${activeRegions.includes(region) ? "active" : ""}`}
                  onClick={() => toggleRegion(region)}
                  style={{ cursor: "pointer" }}
                >
                  {region}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", maxWidth: "300px" }}>
              <input type="text" className="finput" placeholder="New region..." value={newRegion} onChange={e => setNewRegion(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddRegion()} />
              <button className="btn btn-secondary" onClick={handleAddRegion}>Add</button>
            </div>
            <div style={{ marginTop: "16px" }}><button className="btn btn-primary" onClick={() => showToast("Regions updated", "ok")}>Update Regions</button></div>
          </div>
        </div>

        {/* SUPPORT TAB */}
        <div className={`page ${activeTab === "support" ? "active" : ""}`} id="page-support">
          <div className="sh">
            <div>
              <div className="sh-title">Support Center</div>
              <div className="sh-sub">Manage conversations with parking owners in real-time</div>
            </div>
            <div className="btn-row">
              <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--success)", background: "#ECFDF5", padding: "6px 14px", borderRadius: "20px" }}>
                ✓ {conversations.length} Active Conversations
              </span>
            </div>
          </div>
          <div className="support-layout">
            <div className="ticket-list">
              <div className="ticket-list-header">
                Owners Messaging 
                {conversations.some(c => c.unread_count > 0) && <span className="badge b-active" style={{ fontSize: "10px", marginLeft: "8px" }}>New</span>}
              </div>
              <div className="ticket-items" style={{ padding: "0" }}>
                {conversations.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text2)", fontSize: "13px" }}>No messages yet</div>
                ) : (
                  conversations.map(c => (
                    <div 
                      key={c.user_id} 
                      className={`ticket-item ${activeChat?.user_id === c.user_id ? "active" : ""}`}
                      onClick={() => setActiveChat(c)}
                      style={{ 
                        padding: "16px", 
                        borderBottom: "1px solid var(--border)", 
                        cursor: "pointer",
                        display: "flex",
                        gap: "12px",
                        position: "relative"
                      }}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                        {c.avatar ? <img src={c.avatar} style={{ width: "100%", height: "100%", borderRadius: "10px" }} /> : c.full_name[0]}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--text1)" }}>{c.full_name}</span>
                          <span style={{ fontSize: "11px", color: "var(--text3)" }}>
                            {new Date(c.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text2)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.last_message}
                        </p>
                      </div>
                      {c.unread_count > 0 && (
                        <div style={{ position: "absolute", top: "16px", right: "16px", width: "8px", height: "8px", background: "var(--accent)", borderRadius: "50%" }}></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="chat-panel">
              {activeChat ? (
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div className="chat-header" style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                      {activeChat.full_name[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "14px" }}>{activeChat.full_name}</div>
                      <div style={{ fontSize: "11px", color: "var(--success)" }}>Online • Owner</div>
                    </div>
                  </div>
                  <div className="chat-messages" style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", background: "#fcfcfc" }}>
                    {loadingMessages ? (
                      <div style={{ textAlign: "center", color: "var(--text3)" }}>Loading...</div>
                    ) : (
                      activeMessages.map(m => (
                        <div key={m.id} style={{ alignSelf: m.sender_id === currentUser?.id ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                          <div style={{ 
                            padding: "10px 14px", 
                            borderRadius: "14px", 
                            fontSize: "13px", 
                            background: m.sender_id === currentUser?.id ? "var(--primary)" : "#fff",
                            color: m.sender_id === currentUser?.id ? "#fff" : "var(--text1)",
                            border: m.sender_id === currentUser?.id ? "none" : "1px solid var(--border)",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
                          }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "4px", textAlign: m.sender_id === currentUser?.id ? "right" : "left" }}>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="chat-input" style={{ padding: "16px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px", alignItems: "flex-end", background: "#fff" }}>
                    <textarea 
                      className="finput" 
                      placeholder="Type your reply..." 
                      style={{ 
                        borderRadius: "12px", 
                        flex: 1, 
                        minHeight: "44px", 
                        maxHeight: "150px", 
                        resize: "none", 
                        padding: "11px 16px",
                        fontSize: "14px",
                        lineHeight: "1.4",
                        background: "var(--surface)"
                      }} 
                      value={adminReply}
                      onChange={e => setAdminReply(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendReply();
                        }
                      }}
                    />
                    <button 
                      className="btn btn-primary" 
                      style={{ 
                        borderRadius: "12px", 
                        height: "44px", 
                        padding: "0 20px", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center",
                        flexShrink: 0
                      }} 
                      onClick={handleSendReply}
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <div className="chat-empty">
                  <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
                  <p>Select a conversation to start messaging</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL */}
      {isAddOwnerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOwnerModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Add New Owner <button className="modal-close" onClick={() => setIsAddOwnerModalOpen(false)}>✕</button></div>
            <div className="form-grid" style={{ marginBottom: "16px" }}>
              <div className="fg"><label className="flbl">Full Name</label><input className="finput" placeholder="e.g. Mohamed Benali" /></div>
              <div className="fg"><label className="flbl">Email</label><input className="finput" placeholder="email@example.com" type="email" /></div>
              <div className="fg"><label className="flbl">Phone</label><input className="finput" placeholder="+213 5XX XXX XXX" /></div>
              <div className="fg"><label className="flbl">City</label><select className="fsel2"><option>Sétif</option><option>Constantine</option><option>Batna</option><option>Béjaïa</option><option>Oran</option></select></div>
              <div className="fg full"><label className="flbl">Parking Name</label><input className="finput" placeholder="Name of the parking lot" /></div>
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" onClick={() => { showToast("Owner added successfully"); setIsAddOwnerModalOpen(false); }}><svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>Add Owner</button>
              <button className="btn btn-secondary" onClick={() => setIsAddOwnerModalOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ textAlign: "center", padding: "32px 24px" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" style={{ width: "32px", height: "32px" }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <h3 style={{ fontSize: "20px", fontWeight: "bold", color: "var(--primary)", marginBottom: "8px" }}>Sign out of Admin Portal?</h3>
            <p style={{ color: "var(--text2)", marginBottom: "24px" }}>You will need to verify your identity to access the dashboard again.</p>
            <div className="btn-row" style={{ justifyContent: "center" }}>
              <button className="btn btn-secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-primary" style={{ background: "#EF4444", borderColor: "#EF4444" }} onClick={handleLogout}>Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
