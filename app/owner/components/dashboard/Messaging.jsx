import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import s from './Messaging.module.css';

export default function Messaging({ owner }) {
  const [contacts, setContacts] = useState([]);
  const [activeContact, setActiveContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const scrollRef = useRef(null);

  // 1. Load contacts
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const contactsRes = await api.get('/owner/contacts');

        if (isMounted) {
          const loadedContacts = contactsRes.data || [];
          setContacts(loadedContacts);

          // Set default active contact (support admin if available)
          setActiveContact(prev => prev || (loadedContacts.length > 0 ? loadedContacts[0] : null));
        }
      } catch (err) {
        console.error("Failed to load messaging data", err);
        if (isMounted) setErrorMsg("Impossible de charger les contacts ou discussions.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();
    const interval = setInterval(init, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // 2. Fetch thread when activeContact changes
  useEffect(() => {
    if (!activeContact) return;
    let isMounted = true;

    const fetchThread = async () => {
      try {
        const res = await api.get(`/messages/with/${activeContact.user_id}`);
        if (isMounted) {
          setMessages(res.data || []);
          setErrorMsg('');
        }
      } catch (err) {
        console.error("Failed to fetch thread", err);
        if (isMounted) {
          const detail = err.response?.data?.detail;
          setErrorMsg(detail || "Impossible de charger la conversation.");
        }
      }
    };

    fetchThread();
    const interval = setInterval(fetchThread, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [activeContact]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !activeContact) return;

    setSending(true);
    setErrorMsg('');
    try {
      await api.post('/messages/send', {
        content: newMessage.trim(),
        receiver_id: activeContact.user_id
      });
      setNewMessage('');
      
      // Refresh thread
      const res = await api.get(`/messages/with/${activeContact.user_id}`);
      setMessages(res.data || []);
    } catch (err) {
      console.error("Failed to send message", err);
      const detail = err.response?.data?.detail;
      setErrorMsg(detail || "Échec de l'envoi du message. Vérifiez vos autorisations.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className={s.container}>
        <div style={{ padding: "40px", textAlign: "center", color: "#64748B" }}>
          Chargement de la messagerie…
        </div>
      </div>
    );
  }

  return (
    <div className={s.container}>
      <div className={s.chatWrapper} style={{ display: "flex", flexDirection: "row" }}>
        
        {/* SIDEBAR: CONTACTS & DISCUSSIONS */}
        <div style={{ width: "280px", borderRight: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "16px", borderBottom: "1px solid #E2E8F0", fontWeight: 700, fontSize: "14px", color: "#1E293B" }}>
            Contacts autorisés ({contacts.length})
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {contacts.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#94A3B8", fontSize: "12px" }}>
                Aucun contact disponible
              </div>
            ) : (
              contacts.map((c) => {
                const isActive = activeContact?.user_id === c.user_id;
                return (
                  <button
                    key={c.user_id}
                    onClick={() => setActiveContact(c)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 16px",
                      border: "none",
                      borderBottom: "1px solid #E2E8F0",
                      background: isActive ? "#FFFFFF" : "transparent",
                      borderLeft: isActive ? "4px solid #1A2FA8" : "4px solid transparent",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px"
                    }}
                  >
                    <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: c.role === "admin" ? "#1A2FA8" : "#10B981", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                      {c.full_name ? c.full_name[0] : "U"}
                    </div>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>{c.full_name}</div>
                      <div style={{ fontSize: "11px", color: "#64748B", overflow: "hidden", textOverflow: "ellipsis" }}>{c.subtitle}</div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* CHAT WINDOW */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div className={s.header} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div className={s.adminInfo}>
              <div className={s.avatar} style={{ background: activeContact?.role === "admin" ? "#1A2FA8" : "#10B981" }}>
                {activeContact ? activeContact.full_name[0] : "G"}
              </div>
              <div>
                <h3 className={s.adminName}>{activeContact ? activeContact.full_name : "Support GARIHA"}</h3>
                <p className={s.adminStatus}>{activeContact ? activeContact.subtitle : "Toujours disponible pour vous aider"}</p>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div style={{ padding: "10px 20px", background: "#FEF2F2", color: "#DC2626", fontSize: "12px", borderBottom: "1px solid #FEE2E2" }}>
              {errorMsg}
            </div>
          )}

          <div className={s.messageList} ref={scrollRef}>
            {messages.length === 0 ? (
              <div className={s.emptyChat}>
                <div className={s.emptyIcon}>💬</div>
                <h4>Aucun message pour le moment</h4>
                <p>Envoyez un message pour démarrer la discussion.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.sender_id === owner?.id;
                
                return (
                  <div key={m.id} className={`${s.messageRow} ${isMe ? s.myMessageRow : s.adminMessageRow}`}>
                    <div className={`${s.messageBubble} ${isMe ? s.myBubble : s.adminBubble}`}>
                      {m.content}
                      <span className={s.timestamp}>
                        {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <form className={s.inputArea} onSubmit={handleSendMessage}>
            <textarea
              placeholder="Écrivez votre message ici…"
              className={s.input}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={sending || !activeContact}
              rows={1}
            />
            <button type="submit" className={s.sendBtn} disabled={sending || !newMessage.trim() || !activeContact}>
              {sending ? '…' : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
