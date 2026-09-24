import React, { useState, useEffect } from 'react';
import {
  Key,
  Target,
  ShieldCheck,
  Database,
  Save,
  CheckCircle2,
  RotateCcw,
  User,
  Calculator,
  Sparkles,
  Activity,
  Flame,
  Scale
} from 'lucide-react';
import {
  calculateBMI,
  calculateBMR,
  calculateTDEE,
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
  onClearHistory
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
  const [targetCalories, setTargetCalories] = useState(settings.targetCalories || 2000);
  const [protein, setProtein] = useState(targetMacros.protein || 130);
  const [carbs, setCarbs] = useState(targetMacros.carbs || 220);
  const [fat, setFat] = useState(targetMacros.fat || 65);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [appliedCalcSuccess, setAppliedCalcSuccess] = useState(false);

  // 实时科学推算数据
  const bmiInfo = calculateBMI(profile.height, profile.weight);
  const calculatedPlan = calculateDietPlan(profile);

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
      targetCalories: Number(targetCalories) || 2000
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
    <div style={{ padding: '20px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>
            BODY & TARGETS · 身体档案与热量预算
          </span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '10px' }}>
            v1.8.1
          </span>
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
          身体数据与营养目标
        </h1>
      </div>

      {/* 1. 身体档案与科学测算卡片 */}
      <div style={{ background: '#ffffff', borderRadius: '22px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
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
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>生理性别</label>
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
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
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>年龄 (周岁)</label>
            <input
              type="number"
              value={profile.age}
              onChange={(e) => handleProfileChange('age', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>

          {/* 身高 */}
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>身高 (cm)</label>
            <input
              type="number"
              value={profile.height}
              onChange={(e) => handleProfileChange('height', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>

          {/* 体重 */}
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '6px' }}>体重 (kg)</label>
            <input
              type="number"
              step="0.5"
              value={profile.weight}
              onChange={(e) => handleProfileChange('weight', e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600', outline: 'none' }}
            />
          </div>
        </div>

        {/* 活动量与目标 */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>日常运动活力水平</label>
            <select
              value={profile.activityLevel}
              onChange={(e) => handleProfileChange('activityLevel', e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', color: '#0f172a', outline: 'none' }}
            >
              {ACTIVITY_LEVELS.map(level => (
                <option key={level.id} value={level.id}>
                  {level.label}（{level.desc}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', display: 'block', marginBottom: '4px' }}>当前饮食管理目标</label>
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
        <div style={{ marginTop: '16px', padding: '14px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#475569' }}>
              📊 科学推算结果 (Mifflin-St Jeor)
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              BMR: {calculatedPlan.bmr} | TDEE: {calculatedPlan.tdee}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: '#64748b' }}>每日推荐摄入：</span>
            <span style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>
              {calculatedPlan.targetCalories}
            </span>
            <span style={{ fontSize: '12px', color: '#64748b' }}>kcal</span>
          </div>

          <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '8px', marginBottom: '12px' }}>
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
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
            <Target size={16} color="#10b981" />
            <span>当前生效的每日营养目标（可微调）</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>每日总热量预算 (kcal)</label>
              <input
                type="number"
                value={targetCalories}
                onChange={e => setTargetCalories(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '15px', fontWeight: '700', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600' }}>蛋白质 (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={e => setProtein(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#3b82f6', fontWeight: '600' }}>碳水 (g)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={e => setCarbs(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '600' }}>脂肪 (g)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={e => setFat(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: '600', outline: 'none', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. DeepSeek API 配置 */}
        <div style={{ background: '#ffffff', borderRadius: '20px', padding: '18px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#0f172a', marginBottom: '14px' }}>
            <Key size={16} color="#3b82f6" />
            <span>DeepSeek AI 视觉识别配置</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '13px', outline: 'none' }}
              />
              <div style={{ fontSize: '11px', color: '#10b981', marginTop: '4px' }}>
                ✓ 已预置测试 Key，可直接使用
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>接口地址 (Base URL)</label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '4px' }}>调用模型</label>
                <input
                  type="text"
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none' }}
                />
              </div>
            </div>
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
      <div style={{ background: '#f8fafc', borderRadius: '18px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: '#334155' }}>
          <ShieldCheck size={16} color="#10b981" />
          <span>本地优先 Local-First 存储架构</span>
        </div>
        <p style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
          所有饮食历史照片与数据均通过 IndexedDB 加密保存在您的手机本地沙盒中。历史记录支持按日期无限期永久回溯。
        </p>
      </div>
    </div>
  );
}
