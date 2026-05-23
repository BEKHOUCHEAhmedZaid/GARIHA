import React, { useState, useContext } from 'react';
import { api } from '@/lib/axios';
import s from './Settings.module.css';
import { LangContext } from './OwnerDashboard';

const NOTIF_ITEMS = [
  { id: 'reservation', label: 'New Reservation', desc: 'When a driver books your space', default: true },
  { id: 'payment', label: 'Payment Received', desc: 'Confirm incoming payments', default: true },
  { id: 'overdue', label: 'Payment Overdue', desc: 'Alert on missed payments', default: true },
  { id: 'access', label: 'New Access Request', desc: 'Driver whitelist/blacklist events', default: false },
  { id: 'maint', label: 'Maintenance Alert', desc: 'Space status changes', default: false },
  { id: 'summary', label: 'Weekly Summary Report', desc: 'Every Monday morning', default: true },
];

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
];

const FAQ_ITEMS = [
  { question: "How do I add a parking space?", answer: "Navigate to Parking Spaces from the sidebar, then click '+ Add Space'. Fill in the space name, floor, status, and daily price. The space name is auto-suggested (P1, P2...) but can be customized." },
  { question: "How do I create a custom pricing rule?", answer: "Go to Pricing in the sidebar and click '+ Create Rule'. Select a rule type (Daily, Weekly, VIP, etc.), enter the price in DZD, and choose which spaces it applies to. A Daily rule will update space prices across the dashboard." },
  { question: "How do whitelist and blacklist work?", answer: "In Access Control, you can whitelist drivers to grant them free 7-day parking access. A countdown timer shows their remaining free access time. Blacklisting prevents a driver from booking your spaces. Both actions can be reversed at any time." },
  { question: "Why are my revenue charts showing zero?", answer: "Revenue data populates automatically once drivers start making reservations. The Driver system integration is currently in progress. All your infrastructure is correctly set up and ready to receive data." },
];

export default function Settings({ owner }) {
  const [tab, setTab] = useState('notifications');
  const [snackbar, setSnackbar] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [expandedPrivacy, setExpandedPrivacy] = useState(null);

  const { lang, setLang } = useContext(LangContext);

  const showSnackbar = () => {
    setSnackbar(true);
    setTimeout(() => setSnackbar(false), 2500);
  };

  const tabs = [
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy & Security' },
    { id: 'language', label: 'Language' },
    { id: 'help', label: 'Help & Support' },
  ];

  return (
    <div className={s.container}>
      <div className={s.header}>
        <h1>Settings</h1>
        <p>Manage your account preferences</p>
      </div>

      <div className={s.tabs}>
        {tabs.map(t => (
          <button
            key={t.id}
            className={`${s.tabBtn} ${tab === t.id ? s.activeTab : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={s.content}>
        {tab === 'notifications' && (
          <div className={s.panel}>
            <h2>Notification Preferences</h2>
            <div className={s.notifList}>
              {NOTIF_ITEMS.map(item => (
                <div key={item.id} className={s.notifItem}>
                  <div>
                    <p className={s.notifLabel}>{item.label}</p>
                    <p className={s.notifDesc}>{item.desc}</p>
                  </div>
                  <label className={s.toggle}>
                    <input type="checkbox" defaultChecked={item.default} onChange={showSnackbar} />
                    <span className={s.slider}></span>
                  </label>
                </div>
              ))}
            </div>
            
            <h2 style={{ marginTop: '48px' }}>Notification History</h2>
            <div className={s.historyEmpty}>
              <p>No notifications yet. Notifications will appear here as activity occurs.</p>
            </div>
          </div>
        )}

        {tab === 'privacy' && (
          <div className={s.panel}>
            <div className={s.securityBadge}>🔒 Account Secure</div>
            
            <div className={s.accordionGroup}>
              <div className={s.accordion}>
                <div className={s.accordionHeader}>
                  <div>
                    <h3>Email Address</h3>
                    <p>{owner?.email || 'No email'}</p>
                  </div>
                  <button className={s.accordionBtn} onClick={() => setExpandedPrivacy(expandedPrivacy === 'email' ? null : 'email')}>
                    Change Email
                  </button>
                </div>
                <div className={`${s.accordionContent} ${expandedPrivacy === 'email' ? s.open : ''}`}>
                  <input id="new-email" type="email" placeholder="New Email Address" className={s.input} />
                  <button className={s.saveBtn} onClick={async () => {
                    const val = document.getElementById('new-email').value;
                    if(val) {
                      await api.put('/owner/profile', { email: val });
                      showSnackbar();
                      window.location.reload();
                    }
                  }}>Update Email</button>
                </div>
              </div>

              <div className={s.accordion}>
                <div className={s.accordionHeader}>
                  <div>
                    <h3>Phone Number</h3>
                    <p>{owner?.phone || 'No phone number'}</p>
                  </div>
                  <button className={s.accordionBtn} onClick={() => setExpandedPrivacy(expandedPrivacy === 'phone' ? null : 'phone')}>
                    Update Phone
                  </button>
                </div>
                <div className={`${s.accordionContent} ${expandedPrivacy === 'phone' ? s.open : ''}`}>
                  <input id="new-phone" type="text" placeholder="New Phone Number" className={s.input} />
                  <button className={s.saveBtn} onClick={async () => {
                    const val = document.getElementById('new-phone').value;
                    if(val) {
                      await api.put('/owner/profile', { phone: val });
                      showSnackbar();
                      window.location.reload();
                    }
                  }}>Update Phone</button>
                </div>
              </div>

              <div className={s.accordion}>
                <div className={s.accordionHeader}>
                  <div>
                    <h3>Password</h3>
                    <p>Last updated: {owner?.activeSince}</p>
                  </div>
                  <button className={s.accordionBtn} onClick={() => setExpandedPrivacy(expandedPrivacy === 'password' ? null : 'password')}>
                    Change Password
                  </button>
                </div>
                <div className={`${s.accordionContent} ${expandedPrivacy === 'password' ? s.open : ''}`}>
                  <input type="password" placeholder="Current Password" className={s.input} />
                  <input id="new-pwd" type="password" placeholder="New Password" className={s.input} style={{ marginTop: '12px' }} />
                  <button className={s.saveBtn} onClick={async () => {
                    const val = document.getElementById('new-pwd').value;
                    if(val) {
                      await api.put('/owner/profile', { password: val });
                      showSnackbar();
                    }
                  }}>Update Password</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'language' && (
          <div className={s.panel}>
            <h2>Display Language</h2>
            <p className={s.desc}>Select your preferred language for the dashboard interface.</p>
            <div className={s.langGrid}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`${s.langCard} ${lang === l.code ? s.langActive : ''}`}
                  onClick={() => { setLang(l.code); showSnackbar(); }}
                >
                  <span className={s.langFlag}>{l.flag}</span>
                  <span className={s.langLabel}>{l.label}</span>
                  {lang === l.code && <span className={s.checkmark}>✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'help' && (
          <div className={s.panel}>
            <section className={s.helpSection}>
              <div className={s.helpIntro}>
                <h2>Help Center</h2>
                <p>
                  Welcome to GARIHA Support. Our team is dedicated to helping you manage your
                  parking operations with confidence. Browse the topics below or reach our team directly.
                </p>
              </div>

              <div className={s.faqList}>
                {FAQ_ITEMS.map((faq, i) => (
                  <div key={i} className={`${s.faq} ${expandedFaq === i ? s.faqOpen : ''}`}>
                    <button className={s.faqQ} onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                      {faq.question}
                      <span className={s.faqArrow}>{expandedFaq === i ? '▲' : '▼'}</span>
                    </button>
                    <div className={s.faqA}>{faq.answer}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className={s.reportSection}>
              <h2>Report an Issue</h2>
              <p>Experiencing a problem? Our team typically responds within 24 hours.</p>
              <select className={s.select}>
                <option>Bug / Technical Issue</option>
                <option>Feature Request</option>
                <option>Billing Question</option>
                <option>Other</option>
              </select>
              <textarea className={s.textarea} placeholder="Describe your issue clearly..." rows={5} />
              <button className={s.submitBtn} onClick={showSnackbar}>Submit Report</button>
            </section>

            <section className={s.contactSection}>
              <h2>Direct Support Contact</h2>
              <div className={s.contactCards}>
                <a href="tel:+21300000000" className={s.contactCard}>
                  <span className={s.contactIcon}>📞</span>
                  <div>
                    <p className={s.contactLabel}>Phone Support</p>
                    <p className={s.contactValue}>+213 XX XX XX XX</p>
                  </div>
                </a>
                <a href="mailto:support@gariha.dz" className={s.contactCard}>
                  <span className={s.contactIcon}>✉</span>
                  <div>
                    <p className={s.contactLabel}>Email Support</p>
                    <p className={s.contactValue}>support@gariha.dz</p>
                  </div>
                </a>
              </div>
            </section>
          </div>
        )}
      </div>

      {snackbar && (
        <div className={s.snackbar}>✓ Settings saved</div>
      )}
    </div>
  );
}
