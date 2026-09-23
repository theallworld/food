import React from 'react';
import { Settings, UtensilsCrossed, Flame } from 'lucide-react';

export default function Header({ todayCalories = 0, targetCalories = 2000, onOpenSettings }) {
  const percent = Math.min(Math.round((todayCalories / targetCalories) * 100), 100);

  return (
    <header style={{
      padding: '16px 20px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 20,
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <UtensilsCrossed size={20} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '700', lineHeight: 1.2 }}>食物热量助手</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', opacity: 0.9 }}>
            <Flame size={12} color="#fef08a" />
            <span>今日已摄入: <strong>{todayCalories}</strong> / {targetCalories} kcal</span>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenSettings}
        style={{
          border: 'none',
          background: 'rgba(255, 255, 255, 0.2)',
          color: '#ffffff',
          width: '38px',
          height: '38px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        title="设置 API Key"
      >
        <Settings size={20} />
      </button>
    </header>
  );
}
