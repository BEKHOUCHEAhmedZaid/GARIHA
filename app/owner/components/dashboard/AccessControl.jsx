import React, { useState, useEffect } from 'react';
import s from './AccessControl.module.css';

function WhitelistCard({ driver, onRemove }) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const end = driver.whitelistedAt + 7 * 24 * 3600 * 1000;
    return Math.max(0, end - Date.now());
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1000;
        if (next <= 0) { clearInterval(interval); return 0; }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const days = Math.floor(timeLeft / 86400000);
  const hours = Math.floor((timeLeft % 86400000) / 3600000);
  const minutes = Math.floor((timeLeft % 3600000) / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const progress = timeLeft / (7 * 24 * 3600 * 1000);

  const barColor = progress > 0.3 ? '#10B981' : progress > 0.1 ? '#F59E0B' : '#EF4444';

  return (
    <div className={s.driverCard}>
      <div className={s.driverAvatar}>{driver.initials}</div>
      <div className={s.driverInfo}>
        <div className={s.driverHeader}>
          <p className={s.driverName}>{driver.name}</p>
          <button className={s.removeBtn} onClick={() => onRemove(driver.id)}>Remove</button>
        </div>
        <p className={s.driverPlate}>{driver.plate}</p>
        <div className={s.countdown}>
          <div className={s.countdownTime}>
            {days}d {hours}h {minutes}m {seconds}s remaining
          </div>
          <div className={s.progressTrack}>
            <div className={s.progressBar} style={{ width: `${progress * 100}%`, background: barColor }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function BlacklistCard({ driver, onRemove }) {
  return (
    <div className={s.driverCard}>
      <div className={s.driverAvatar} style={{ background: '#EF4444' }}>{driver.initials}</div>
      <div className={s.driverInfo}>
        <div className={s.driverHeader}>
          <p className={s.driverName}>{driver.name}</p>
          <button className={s.removeBtn} onClick={() => onRemove(driver.id)}>Remove</button>
        </div>
        <p className={s.driverPlate}>{driver.plate}</p>
      </div>
    </div>
  );
}

export default function AccessControl() {
  const [whitelisted, setWhitelisted] = useState([]);
  const [blacklisted, setBlacklisted] = useState([]);
  const [activeDrivers, setActiveDrivers] = useState([]);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [formDriver, setFormDriver] = useState({ name: '', plate: '', ruleType: 'whitelist' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchAccess = async () => {
      try {
        const res = await (await import('@/lib/axios')).api.get('/owner/access');
        if (isMounted) {
          setWhitelisted(res.data.whitelisted || []);
          setBlacklisted(res.data.blacklisted || []);
          setActiveDrivers(res.data.active_access_drivers || []);
        }
      } catch (err) {
        console.error("Failed to load access rules", err);
      } finally {
        if (isMounted) { /* access data loaded */ }
      }
    };
    fetchAccess();
    return () => { isMounted = false; };
  }, []);

  const handleRemoveWhitelist = async (id) => {
    try {
      const { api } = await import('@/lib/axios');
      await api.delete(`/owner/access/${id}`);
      setWhitelisted(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to remove rule", err);
    }
  };

  const handleRemoveBlacklist = async (id) => {
    try {
      const { api } = await import('@/lib/axios');
      await api.delete(`/owner/access/${id}`);
      setBlacklisted(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to remove rule", err);
    }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if (!formDriver.name.trim() || !formDriver.plate.trim()) return;
    setSubmitting(true);
    try {
      const { api } = await import('@/lib/axios');
      await api.post('/owner/access', {
        driver_name: formDriver.name,
        plate_number: formDriver.plate,
        rule_type: formDriver.ruleType,
      });
      setShowModal(false);
      setFormDriver({ name: '', plate: '', ruleType: 'whitelist' });
      fetchAccess();
    } catch (err) {
      console.error("Failed to add access rule", err);
      alert("Failed to add rule: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={s.container}>
      <div className={s.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Access Control</h1>
          <p>Manage driver permissions and free access limits for your parkings</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          style={{ 
            background: '#1A2FA8', 
            color: '#fff', 
            border: 'none', 
            padding: '10px 18px', 
            borderRadius: '10px', 
            fontWeight: '600', 
            cursor: 'pointer',
            fontSize: '14px' 
          }}
        >
          + Add Access Rule
        </button>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', maxWidth: '420px', width: '100%' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '14px', color: '#1A2FA8' }}>Add Driver Access Rule</h2>
            <form onSubmit={handleAddRule}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>Driver Name</label>
                <input 
                  type="text" 
                  required
                  value={formDriver.name} 
                  onChange={e => setFormDriver({ ...formDriver, name: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  placeholder="e.g. Karim Belkacem"
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>Plate Number</label>
                <input 
                  type="text" 
                  required
                  value={formDriver.plate} 
                  onChange={e => setFormDriver({ ...formDriver, plate: e.target.value })} 
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', textTransform: 'uppercase' }}
                  placeholder="e.g. 16-12345-12"
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px', color: '#374151' }}>Rule Type</label>
                <select 
                  value={formDriver.ruleType} 
                  onChange={e => setFormDriver({ ...formDriver, ruleType: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                >
                  <option value="whitelist">Whitelist (Free 7-Day Access)</option>
                  <option value="blacklist">Blacklist (Block Entry)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={submitting} style={{ padding: '8px 16px', borderRadius: '8px', background: '#1A2FA8', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                  {submitting ? 'Saving...' : 'Save Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={s.panel} style={{ marginBottom: '24px' }}>
        <div className={s.panelHeader}>
          <h2>Active Parking Access ({activeDrivers.length})</h2>
        </div>
        {activeDrivers.length === 0 ? (
          <div className={s.emptyState}>
            <h3 className={s.emptyTitle}>No active parking sessions</h3>
            <p className={s.emptyText}>Drivers with active reservations will appear here with real-time access status.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px', padding: '16px' }}>
            {activeDrivers.map(d => (
              <div key={d.id} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '14px', color: '#111827' }}>{d.driver_name}</strong>
                  <span style={{ fontSize: '11px', background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>Active</span>
                </div>
                <div style={{ fontSize: '12px', color: '#4B5563', fontFamily: 'monospace' }}>{d.plate_number}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>Spot: {d.spot_name} ({d.parking_name})</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={s.grid}>
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <h2>✅ Whitelisted Drivers</h2>
            <span className={s.panelBadge} style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)' }}>Free 7-day access</span>
          </div>
          {whitelisted.length === 0 ? (
            <div className={s.emptyStateSmall}>
              <p>No whitelisted drivers. Grant free weekly access to trusted drivers.</p>
            </div>
          ) : (
            whitelisted.map(driver => <WhitelistCard key={driver.id} driver={driver} onRemove={handleRemoveWhitelist} />)
          )}
        </div>

        <div className={s.panel}>
          <div className={s.panelHeader}>
            <h2>🚫 Blacklisted Drivers</h2>
          </div>
          {blacklisted.length === 0 ? (
            <div className={s.emptyStateSmall}>
              <p>No blacklisted drivers.</p>
            </div>
          ) : (
            blacklisted.map(driver => <BlacklistCard key={driver.id} driver={driver} onRemove={handleRemoveBlacklist} />)
          )}
        </div>
      </div>
    </div>
  );
}
