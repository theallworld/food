import React, { useEffect, useState } from 'react';
import { X, Key, Target, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [targetCalories, setTargetCalories] = useState(settings.targetCalories || 2000);
  const [aiConsent, setAiConsent] = useState(Boolean(settings.aiConsent));
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setApiKey(settings.apiKey || '');
    setTargetCalories(settings.targetCalories || 2000);
    setAiConsent(Boolean(settings.aiConsent));
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKey.trim(),
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-flash',
      targetCalories: Number(targetCalories) || 2000,
      aiConsent
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      zIndex: 50
    }}>
      <div style={{
        background: 'var(--surface)',
        width: '100%',
        maxWidth: '420px',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>⚙️ 配置 DeepSeek 接口</h2>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'var(--surface-muted)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* API Key */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Key size={14} color="#10b981" />
              <span>DeepSeek API Key</span>
              <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              密钥保存在本机；你主动发起 AI 请求时，会通过 HTTPS 发送给 DeepSeek 用于身份验证。
            </p>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'var(--surface-muted)', color: 'var(--text-secondary)', fontSize: '13px' }}>
            AI 服务：DeepSeek 官方接口 · deepseek-flash
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-secondary)', fontSize: '12px', lineHeight: 1.6 }}>
            <input type="checkbox" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} style={{ marginTop: '3px' }} />
            <span><ShieldCheck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />我同意在主动使用 AI 功能时，将我提交的文字、图片及必要的饮食营养信息发送至 DeepSeek 处理。AI 服务可能产生费用。</span>
          </label>

          {/* Daily Calorie Target */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Target size={14} color="#f59e0b" />
              <span>每日热量预算目标 (kcal)</span>
            </label>
            <input
              type="number"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value)}
              min="800"
              max="6000"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            style={{
              marginTop: '10px',
              padding: '12px',
              borderRadius: '12px',
              background: savedSuccess ? '#059669' : '#10b981',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'background 0.2s'
            }}
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 size={18} />
                <span>保存成功！</span>
              </>
            ) : (
              <>
                <Save size={18} />
                <span>保存并应用设置</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
