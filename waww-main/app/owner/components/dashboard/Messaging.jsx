import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/axios';
import s from './Messaging.module.css';

export default function Messaging({ owner }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await api.get('/messages/my');
      setMessages(res.data);
    } catch (e) {
      console.error("Failed to fetch messages", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      await api.post('/messages/send', {
        content: newMessage,
        receiver_id: 0
      });
      setNewMessage('');
      fetchMessages();
    } catch (e) {
      console.error("Failed to send message", e);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className={s.container}>Loading conversation...</div>;

  return (
    <div className={s.container}>
      <div className={s.chatWrapper}>
        <div className={s.header}>
          <div className={s.adminInfo}>
            <div className={s.avatar}>G</div>
            <div>
              <h3 className={s.adminName}>Gariha Support</h3>
              <p className={s.adminStatus}>Always here to help you</p>
            </div>
          </div>
        </div>

        <div className={s.messageList} ref={scrollRef}>
          {messages.length === 0 ? (
            <div className={s.emptyChat}>
              <div className={s.emptyIcon}>💬</div>
              <h4>No messages yet</h4>
              <p>Send a message to start a conversation with Gariha Support.</p>
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
            placeholder="Type your message here..."
            className={s.input}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={sending}
            rows={1}
          />
          <button type="submit" className={s.sendBtn} disabled={sending || !newMessage.trim()}>
            {sending ? '...' : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
