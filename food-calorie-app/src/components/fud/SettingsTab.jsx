import React, { useState } from 'react';
import {
  Key,
  Target,
  ShieldCheck,
  Save,
  CheckCircle2,
  Sparkles,
  Activity,
  Scale,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import {
  calculateBMI,
  calculateDietPlan,
  ACTIVITY_LEVELS,
  GOALS
} from '../../utils/nutritionCalculator';


export default function SettingsTab({
  settings,
  targetMacros,
  userProfile = {},
  onSaveSettings,
  onSaveMacros,
  onSaveProfile,
  onClearHistory,
  onClearAllData,
  onOpenPrivacy,
  onOpenTerms,
  onRevokePrivacy,
  theme = 'light',
  onThemeChange = () => {}
}) {
  // 身体档案状态
  const [profile, setProfile] = useState({
    gender: userProfile.gender || 'male',
    age: userProfile.age || 26,
    height: userProfile.height || 175,
    weight: userProfile.weight || 70,
    activityLevel: userProfile.activityLevel || 'light',
    goal: userProfile.goal || 'lose'
  });

  // 基础设置与宏量
  const [apiKey, setApiKey] = useState(settings.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || 'https://api.deepseek.com');
  const [model, setModel] = useState(settings.model || 'deepseek-flash');
  const [aiConsent, setAiConsent] = useState(Boolean(settings.aiConsent));
  const [targetCalories, setTargetCalories] = useState(settings.targetCalories || 2000);
  const [protein, setProtein] = useState(targetMacros.protein || 130);
  const [carbs, setCarbs] = useState(targetMacros.carbs || 220);
  const [fat, setFat] = useState(targetMacros.fat || 65);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedCalcSuccess, setAppliedCalcSuccess] = useState(false);
  const [activityPickerOpen, setActivityPickerOpen] = useState(false);

  // 实时科学推算数据
  const bmiInfo = calculateBMI(profile.height, profile.weight);
  const calculatedPlan = calculateDietPlan(profile);
  const selectedActivity = ACTIVITY_LEVELS.find(level => level.id === profile.activityLevel) || ACTIVITY_LEVELS[1];

  const handleProfileChange = (key, val) => {
    const updated = { ...profile, [key]: val };
    setProfile(updated);
    if (onSaveProfile) onSaveProfile(updated);
  };

  // 一键应用科学计算结果为目标
  const handleApplyCalculatedPlan = () => {
    setTargetCalories(calculatedPlan.targetCalories);
    setProtein(calculatedPlan.macros.protein);
    setCarbs(calculatedPlan.macros.carbs);
    setFat(calculatedPlan.macros.fat);

    onSaveSettings({
      ...settings,
      targetCalories: calculatedPlan.targetCalories
    });
    onSaveMacros(calculatedPlan.macros);

    setAppliedCalcSuccess(true);
    setTimeout(() => setAppliedCalcSuccess(false), 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveSettings({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      model: model.trim(),
      targetCalories: Number(targetCalories) || 2000,
      aiConsent
    });
    onSaveMacros({
      protein: Number(protein) || 130,
      carbs: Number(carbs) || 220,
      fat: Number(fat) || 65
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  return (
    <div className="screen-enter" style={{ padding: '20px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>
            BODY & TARGETS · 身体档案与热量预算
          </span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: 'var(--accent-surface)', padding: '2px 8px', borderRadius: '10px' }}>
            v1.8.5
          </span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
          身体数据与营养目标
        </h1>
        <div className="theme-picker-row">
          <div>
            <strong>界面外观</strong>
            <span>{theme === 'system' ? '跟随系统' : theme === 'dark' ? '夜间 · 黑底白字' : '白日 · 白底黑字'}</span>
          </div>
          <div className="theme-control-wrap">
            <div className="theme-switch theme-switch-three" role="group" aria-label="界面主题">
              {[['system', '系统'], ['light', '白日'], ['dark', '夜间']].map(([mode, label]) => (
                <button key={mode} type="button" className={`theme-option${theme === mode ? ' is-selected' : ''}`} aria-pressed={theme === mode} onClick={() => onThemeChange(mode)}>{label}</button>
              ))}
            </div>
            <small className="theme-follow-note">默认跟随手机系统切换，也可手动选择</small>
          </div>
        </div>
      </div>

      {/* 1. 身体档案与科学测算卡片 */}
      <div style={{ background: 'var(--surface)', borderRadius: '22px', padding: '18px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
            <Scale size={18} color="#10b981" />
            <span>个人身体档案 (BMR / TDEE 测算)</span>
          </div>
          <span style={{ fontSize: '11px', color: bmiInfo.color, fontWeight: '700', background: `${bmiInfo.color}15`, padding: '2px 8px', borderRadius: '8px' }}>
            BMI {bmiInfo.bmi} · {bmiInfo.status}
          </span>
        </div>

        {/* 基础输入网格 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          {/* 性别选择 */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>生理性别</label>
            <div style={{ display: 'flex', background: 'var(--surface-muted)', padding: '3px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => handleProfileChange('gender', 'male')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: profile.gender === 'male' ? '#ffffff' : 'transparent',
                  color: profile.gender === 'male' ? '#0f172a' : '#64748b',
                  boxShadow: profile.gender === 'male' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                👨 男
              </button>
              <button
                type="button"
                onClick={() => handleProfileChange('gender', 'female')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: profile.gender === 'female' ? '#ffffff' : 'transparent',
                  color: profile.gender === 'female' ? '#0f172a' : '#64748b',
                  boxShadow: profile.gender === 'female' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                👩 女
              </button>
            </div>
          </div>

          {/* 年龄 */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>年龄 (周岁)</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => handleProfileChange('age', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>

          {/* 身高 */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>身高 (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => handleProfileChange('height', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>

          {/* 体重 */}
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>体重 (kg)</label>
            <input
              type="number"
              step="0.5"
              value={profile.weight}
              onChange={(e) => handleProfileChange('weight', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>
        </div>

        {/* 活动量与目标 */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>日常运动活力水平</label>
            <button
              type="button"
              onClick={() => setActivityPickerOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={activityPickerOpen}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                background: 'var(--surface)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <span style={{ width: '34px', height: '34px', flexShrink: 0, borderRadius: '10px', background: 'var(--accent-surface)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={17} />
                </span>
                <span style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                  <span style={{ fontSize: '13px', fontWeight: '700' }}>{selectedActivity.label}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedActivity.desc}</span>
                </span>
              </span>
              <ChevronDown size={18} color="#64748b" />
            </button>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '4px' }}>当前饮食管理目标</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {GOALS.map(goal => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleProfileChange('goal', goal.id)}
                  style={{
                    padding: '8px 4px',
                    borderRadius: '10px',
                    border: profile.goal === goal.id ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                    background: profile.goal === goal.id ? '#f0fdf4' : '#ffffff',
                    color: profile.goal === goal.id ? '#047857' : '#475569',
                    fontSize: '12px',
                    fontWeight: profile.goal === goal.id ? '800' : '600',
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 科学推导结果与一键应用 */}
        <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-main)', borderRadius: '14px', border: '1px dashed var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              📊 科学推算结果 (Mifflin-St Jeor)
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
              BMR: {calculatedPlan.bmr} | TDEE: {calculatedPlan.tdee}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>每日推荐摄入：</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>
              {calculatedPlan.targetCalories}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>kcal</span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <span>蛋白 <b style={{ color: '#ef4444' }}>{calculatedPlan.macros.protein}g</b></span>
            <span>·</span>
            <span>碳水 <b style={{ color: '#3b82f6' }}>{calculatedPlan.macros.carbs}g</b></span>
            <span>·</span>
            <span>脂肪 <b style={{ color: '#f59e0b' }}>{calculatedPlan.macros.fat}g</b></span>
          </div>

          <button
            type="button"
            onClick={handleApplyCalculatedPlan}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: appliedCalcSuccess ? '#059669' : '#10b981',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(16,185,129,0.2)',
              transition: 'background 0.2s'
            }}
          >
            {appliedCalcSuccess ? (
              <>
                <CheckCircle2 size={16} />
                <span>已成功同步为每日营养目标！</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>一键应用此推荐为每日营养目标</span>
              </>
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 2. 当前生效的每日营养目标卡片 */}
        <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '18px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px' }}>
            <Target size={16} color="#10b981" />
            <span>当前生效的每日营养目标（可微调）</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>每日总热量预算 (kcal)</label>
              <input
                type="number"
                value={targetCalories}
                onChange={e => setTargetCalories(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '15px', fontWeight: '700', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>蛋白质 (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>碳水 (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>脂肪 (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. DeepSeek API 配置 */}
        <div style={{ background: 'var(--surface)', borderRadius: '20px', padding: '18px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '14px' }}>
            <Key size={16} color="#3b82f6" />
            <span>DeepSeek AI 视觉识别配置</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }}
              />
            </div>

            <div className="api-service-info">
              <span>官方服务地址</span><code>https://api.deepseek.com</code>
              <span>默认模型</span><code>deepseek-flash</code>
            </div>

            <label className="ai-consent-row">
              <input type="checkbox" checked={aiConsent} onChange={event => {
                const accepted = event.target.checked;
                setAiConsent(accepted);
                if (!accepted) localStorage.removeItem('food_ai_data_consent');
              }} />
              <span>我同意在主动使用 AI 时，将所需的照片、餐食描述、对话及营养上下文发送至 DeepSeek API 处理。我知道 AI 估算可能有误，且 API 费用按 DeepSeek 账号规则结算。</span>
            </label>
            <p className="settings-caption">未勾选或未保存时，AI 识别和 AI 教练不会发送请求；本地饮食记录功能仍可使用。</p>
            <a className="provider-policy-link" href="https://cdn.deepseek.com/policies/zh-CN/deepseek-privacy-policy.html" target="_blank" rel="noreferrer">查看 DeepSeek 官方隐私政策 ↗</a>
          </div>
        </div>

        {/* 保存按钮 */}
        <button
          type="submit"
          style={{
            padding: '14px',
            background: savedSuccess ? '#10b981' : '#0f172a',
            color: '#ffffff',
            borderRadius: '16px',
            border: 'none',
            fontSize: '15px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
            transition: 'background 0.2s'
          }}
        >
          {savedSuccess ? (
            <>
              <CheckCircle2 size={18} />
              <span>设置保存成功！</span>
            </>
          ) : (
            <>
              <Save size={18} />
              <span>保存配置</span>
            </>
          )}
        </button>
      </form>

      {/* 数据安全与关于 */}
      <div style={{ background: 'var(--bg-main)', borderRadius: '18px', padding: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>本地优先 Local-First 存储架构</span>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          饮食记录和照片保存在本机浏览器存储中。Android 版 API Key 使用系统 Android Keystore 加密保存。你可以在下方查看政策或清除本机数据。
        </p>
        <div className="settings-link-row">
          <button type="button" className="text-action" onClick={onOpenPrivacy}>隐私政策</button>
          <button type="button" className="text-action" onClick={onOpenTerms}>用户服务协议</button>
          <button type="button" className="text-action" onClick={onRevokePrivacy}>撤回隐私同意</button>
        </div>
        <button type="button" className="danger-action" onClick={onClearAllData}>清除本机全部数据</button>
      </div>

      {activityPickerOpen && (
        <div
          role="presentation"
          onClick={() => setActivityPickerOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            background: 'rgba(15, 23, 42, 0.58)',
            backdropFilter: 'blur(3px)',
            paddingTop: '24px'
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="activity-picker-title"
            onClick={event => event.stopPropagation()}
            onKeyDown={event => event.key === 'Escape' && setActivityPickerOpen(false)}
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '78dvh',
              overflowY: 'auto',
              padding: '10px 16px calc(18px + env(safe-area-inset-bottom, 0px))',
              background: 'var(--bg-main)',
              borderRadius: '24px 24px 0 0',
              boxShadow: '0 -12px 36px rgba(15,23,42,0.2)',
              animation: 'slideUp 0.22s ease-out'
            }}
          >
            <div style={{ width: '36px', height: '4px', borderRadius: '4px', background: 'var(--surface-muted)', margin: '2px auto 14px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
              <div>
                <h2 id="activity-picker-title" style={{ margin: 0, color: 'var(--text-main)', fontSize: '17px', fontWeight: '800' }}>选择日常活动水平</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>按你一周的平均运动情况选择</p>
              </div>
              <button
                type="button"
                aria-label="关闭活动水平选择"
                onClick={() => setActivityPickerOpen(false)}
                style={{ width: '34px', height: '34px', flexShrink: 0, border: 'none', borderRadius: '50%', background: 'var(--surface-muted)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {ACTIVITY_LEVELS.map(level => {
                const isSelected = profile.activityLevel === level.id;
                return (
                  <button
                    key={level.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => {
                      handleProfileChange('activityLevel', level.id);
                      setActivityPickerOpen(false);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '68px',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      border: isSelected ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                      background: isSelected ? '#ecfdf5' : '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(16,185,129,0.08)' : '0 1px 3px rgba(15,23,42,0.03)'
                    }}
                  >
                    <span style={{ width: '36px', height: '36px', flexShrink: 0, borderRadius: '11px', background: isSelected ? '#d1fae5' : '#f1f5f9', color: isSelected ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={18} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <span style={{ fontSize: '14px', fontWeight: '750', color: isSelected ? '#047857' : '#0f172a' }}>{level.label}</span>
                      <span style={{ fontSize: '11px', lineHeight: 1.4, color: 'var(--text-muted)' }}>{level.desc}</span>
                    </span>
                    <span style={{ width: '22px', height: '22px', flexShrink: 0, borderRadius: '50%', border: isSelected ? 'none' : '1.5px solid #cbd5e1', background: isSelected ? '#10b981' : 'transparent', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <Check size={14} strokeWidth={2.5} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
