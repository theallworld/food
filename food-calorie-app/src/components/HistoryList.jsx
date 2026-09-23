import React from 'react';
import { Calendar, Trash2, Clock, Utensils } from 'lucide-react';

export default function HistoryList({ history = [], onDeleteItem, onClearAll }) {
  if (history.length === 0) {
    return (
      <div style={{
        padding: '30px 20px',
        textAlign: 'center',
        color: '#94a3b8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <Utensils size={32} strokeWidth={1.5} color="#cbd5e1" />
        <div style={{ fontSize: '13px' }}>今日还没有饮食记录，快去拍一张吧！</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px 40px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
          <Calendar size={16} color="#10b981" />
          <span>今日饮食记录 ({history.length}次)</span>
        </div>
        <button
          onClick={onClearAll}
          style={{
            border: 'none',
            background: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer'
          }}
        >
          清空记录
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {history.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              borderRadius: '16px',
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.dishName}
                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  backgroundColor: '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Utensils size={20} color="#94a3b8" />
                </div>
              )}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>
                  {item.dishName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  <Clock size={11} />
                  <span>{item.time}</span>
                  <span>·</span>
                  <span>蛋{item.totalProtein}g 碳{item.totalCarbs}g 脂{item.totalFat}g</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#ef4444' }}>
                +{item.totalCalories} <span style={{ fontSize: '10px', fontWeight: 'normal', color: '#94a3b8' }}>kcal</span>
              </div>
              <button
                onClick={() => onDeleteItem(item.id)}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
