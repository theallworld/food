import React from 'react';
import { LayoutGrid, BookOpen, Plus, Bot, Sliders } from 'lucide-react';

export default function BottomNav({ activeTab, onTabChange, onOpenLog, theme = 'light' }) {
  return (
    <nav className={`bottom-nav-glass theme-${theme}`} style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      width: '100%',
      background: 'var(--nav-bg)',
      backdropFilter: 'blur(18px) saturate(145%)',
      WebkitBackdropFilter: 'blur(18px) saturate(145%)',
      borderTop: '1px solid var(--nav-border)',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr auto 1fr 1fr',
      alignItems: 'center',
      padding: '6px 4px',
      /* 适配底部全面屏手势横条与虚拟按键，彻底消除底部白边 */
      paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
      zIndex: 40,
      boxShadow: '0 -4px 20px var(--nav-shadow)',
      color: 'var(--nav-text)',
      paddingLeft: 'max(4px, env(safe-area-inset-left, 0px))',
      paddingRight: 'max(4px, env(safe-area-inset-right, 0px))'
    }}>
      {/* 1. 总览 Tab */}
      <button
        className={`bottom-nav-item${activeTab === 'dashboard' ? ' is-active' : ''}`}
        onClick={() => onTabChange('dashboard')}
        style={{
          border: 'none',
          background: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeTab === 'dashboard' ? 'var(--nav-active)' : 'var(--nav-inactive)',
          cursor: 'pointer',
          padding: '6px 0',
          transition: 'color 0.2s'
        }}
      >
        <LayoutGrid size={20} />
        <span style={{ fontSize: '11px', fontWeight: activeTab === 'dashboard' ? '700' : '500' }}>总览</span>
      </button>

      {/* 2. 饮食日记 Tab */}
      <button
        className={`bottom-nav-item${activeTab === 'diary' ? ' is-active' : ''}`}
        onClick={() => onTabChange('diary')}
        style={{
          border: 'none',
          background: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeTab === 'diary' ? 'var(--nav-active)' : 'var(--nav-inactive)',
          cursor: 'pointer',
          padding: '6px 0',
          transition: 'color 0.2s'
        }}
      >
        <BookOpen size={20} />
        <span style={{ fontSize: '11px', fontWeight: activeTab === 'diary' ? '700' : '500' }}>日记</span>
      </button>

      {/* 3. 绝对正中心：+号 核心悬浮智能记餐按钮 */}
      <div style={{ padding: '0 8px', display: 'flex', justifyContent: 'center' }}>
        <button
          onClick={onOpenLog}
          className="nav-add-action"
          style={{
            border: 'none',
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.45)',
            transform: 'translateY(-12px)',
            transition: 'transform 0.15s ease'
          }}
          title="快速智能记餐"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* 4. AI 教练 Tab */}
      <button
        className={`bottom-nav-item${activeTab === 'coach' ? ' is-active' : ''}`}
        onClick={() => onTabChange('coach')}
        style={{
          border: 'none',
          background: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeTab === 'coach' ? 'var(--nav-active)' : 'var(--nav-inactive)',
          cursor: 'pointer',
          padding: '6px 0',
          transition: 'color 0.2s'
        }}
      >
        <Bot size={20} />
        <span style={{ fontSize: '11px', fontWeight: activeTab === 'coach' ? '700' : '500' }}>AI教练</span>
      </button>

      {/* 5. 设置 Tab */}
      <button
        className={`bottom-nav-item${activeTab === 'settings' ? ' is-active' : ''}`}
        onClick={() => onTabChange('settings')}
        style={{
          border: 'none',
          background: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          color: activeTab === 'settings' ? 'var(--nav-active)' : 'var(--nav-inactive)',
          cursor: 'pointer',
          padding: '6px 0',
          transition: 'color 0.2s'
        }}
      >
        <Sliders size={20} />
        <span style={{ fontSize: '11px', fontWeight: activeTab === 'settings' ? '700' : '500' }}>设置</span>
      </button>
    </nav>
  );
}
