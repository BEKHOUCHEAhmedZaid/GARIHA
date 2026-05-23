import React, { useState } from 'react';
import s from './PricingRules.module.css';

const TYPE_COLORS = {
  Daily: '#1A2FA8',
  Weekly: '#4DCCE7',
  Monthly: '#10B981',
  VIP: '#F59E0B',
  'Long-term': '#8B5CF6',
  Seasonal: '#F97316',
};

const RULE_TYPES = ['Daily', 'Weekly', 'Monthly', 'VIP', 'Long-term', 'Seasonal'];

export default function PricingRules() {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    type: 'Daily',
    price: 250,
  });

  const handleSave = () => {
    const newRule = { ...formData, id: Date.now(), active: true };
    setRules(prev => [...prev, newRule]);
    setShowModal(false);
  };

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <div className={s.container}>
      <div className={s.header}>
        <div>
          <h1>Pricing Rules</h1>
          <p>Manage your dynamic pricing</p>
        </div>
      </div>

      <div className={s.defaultBanner}>
        <span className={s.pinIcon}>📌</span>
        <div>
          <p className={s.bannerTitle}>Default Space Price</p>
          <p className={s.bannerValue}>250 DZD / day</p>
          <p className={s.bannerNote}>Applied to all spaces unless a custom pricing rule is active.</p>
        </div>
      </div>

      {rules.length === 0 ? (
        <div className={s.emptyState}>
          <div className={s.emptyIcon}>◎</div>
          <h3 className={s.emptyTitle}>No custom pricing rules</h3>
          <p className={s.emptyText}>Create a rule to override the default 250 DZD/day pricing for specific scenarios.</p>
          <button className={s.addBtn} onClick={() => setShowModal(true)}>+ Create First Rule</button>
        </div>
      ) : (
        <div className={s.rulesList}>
          <div className={s.rulesHeader}>
            <h3>Custom Rules</h3>
            <button className={s.addBtnSmall} onClick={() => setShowModal(true)}>+ Add Rule</button>
          </div>
          {rules.map(rule => (
            <div key={rule.id} className={s.ruleCard}>
              <div className={s.ruleInfo}>
                <span className={s.ruleBadge} style={{ background: `${TYPE_COLORS[rule.type]}1A`, color: TYPE_COLORS[rule.type] }}>
                  {rule.type}
                </span>
                <span className={s.rulePrice}>{rule.price} DZD</span>
              </div>
              <label className={s.toggle}>
                <input type="checkbox" checked={rule.active} onChange={() => toggleRule(rule.id)} />
                <span className={s.slider}></span>
              </label>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={s.overlay}>
          <div className={s.modal}>
            <h3>Create Pricing Rule</h3>
            <div className={s.formGroup}>
              <label>Rule Type</label>
              <div className={s.typeGrid}>
                {RULE_TYPES.map(type => (
                  <button 
                    key={type}
                    className={`${s.typeBtn} ${formData.type === type ? s.typeActive : ''}`}
                    onClick={() => setFormData({ ...formData, type })}
                    style={{ borderColor: formData.type === type ? TYPE_COLORS[type] : '' }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className={s.formGroup}>
              <label>Price (DZD)</label>
              <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
            </div>
            <div className={s.modalActions}>
              <button className={s.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={s.saveBtn} onClick={handleSave}>Save Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
