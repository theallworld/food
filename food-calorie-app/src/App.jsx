import React, { useState, useEffect } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import BottomNav from './components/fud/BottomNav';
import DashboardTab from './components/fud/DashboardTab';
import DiaryTab from './components/fud/DiaryTab';
import CoachTab from './components/fud/CoachTab';
import SettingsTab from './components/fud/SettingsTab';
import LogModal from './components/fud/LogModal';
import {
  getTodayDateString,
  getMealsByDate,
  saveMealRecord,
  deleteMealRecord,
  clearMealsByDate,
  getUserProfile,
  saveUserProfile
} from './utils/storage';

const FoodWidget = registerPlugin('FoodWidget');

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showApiSetup, setShowApiSetup] = useState(() => {
    try { return !JSON.parse(localStorage.getItem('deepseek_food_settings') || '{}').apiKey?.trim(); }
    catch { return true; }
  });
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [targetMealType, setTargetMealType] = useState('lunch');
  const [selectedDate, setSelectedDate] = useState(() => getTodayDateString());

  // 用户身体档案 (身高、体重、BMR、TDEE、目标)
  const [userProfile, setUserProfile] = useState(() => getUserProfile());

  // 配置项
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('deepseek_food_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.apiKey.trim()) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return {
      apiKey: '',
      baseUrl: 'https://api.deepseek.com',
      model: 'deepseek-flash',
      targetCalories: 2000
    };
  });

  // 宏量营养素目标
  const [targetMacros, setTargetMacros] = useState(() => {
    const saved = localStorage.getItem('fud_target_macros');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return { protein: 130, carbs: 220, fat: 65 };
  });

  // 所选日期的饮食记录
  const [meals, setMeals] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);

  // 加载所选日期的记录
  const loadMeals = async (dateStr) => {
    const list = await getMealsByDate(dateStr);
    setMeals(list);
  };

  useEffect(() => {
    loadMeals(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    getMealsByDate(getTodayDateString()).then(setTodayMeals);
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;
    const totals = todayMeals.reduce((sum, meal) => ({
      calories: sum.calories + (Number(meal.totalCalories) || 0),
      protein: sum.protein + (Number(meal.totalProtein) || 0),
      carbs: sum.carbs + (Number(meal.totalCarbs) || 0),
      fat: sum.fat + (Number(meal.totalFat) || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    FoodWidget.updateToday({
      ...totals,
      targetCalories: Number(settings.targetCalories) || 2000,
      proteinTarget: Number(targetMacros.protein) || 130,
      carbsTarget: Number(targetMacros.carbs) || 220,
      fatTarget: Number(targetMacros.fat) || 65,
      date: getTodayDateString()
    })
      .catch(() => {});
  }, [todayMeals, settings.targetCalories, targetMacros]);

  useEffect(() => {
    if (settings.apiKey?.trim()) setShowApiSetup(false);
  }, [settings.apiKey]);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('deepseek_food_settings', JSON.stringify(newSettings));
  };

  const handleSaveMacros = (newMacros) => {
    setTargetMacros(newMacros);
    localStorage.setItem('fud_target_macros', JSON.stringify(newMacros));
  };

  const handleSaveProfile = (newProfile) => {
    setUserProfile(newProfile);
    saveUserProfile(newProfile);
  };

  const handleSaveMeal = async (newMealData) => {
    const record = {
      id: `meal-${Date.now()}`,
      time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      mealType: newMealData.mealType || targetMealType,
      dishName: newMealData.dishName || '餐食记录',
      totalCalories: newMealData.totalCalories,
      totalProtein: newMealData.totalProtein,
      totalFat: newMealData.totalFat,
      totalCarbs: newMealData.totalCarbs,
      foods: newMealData.foods,
      image: newMealData.image
    };

    // 保存到所选日期 (如果是从今天保存或日历选定天)
    const targetDate = selectedDate || getTodayDateString();
    await saveMealRecord(record, targetDate);
    await loadMeals(targetDate);
    if (targetDate === getTodayDateString()) setTodayMeals(await getMealsByDate(targetDate));
  };

  const handleDeleteMeal = async (id, dateStr) => {
    const targetDate = dateStr || selectedDate;
    await deleteMealRecord(id, targetDate);
    await loadMeals(targetDate);
    if (targetDate === getTodayDateString()) setTodayMeals(await getMealsByDate(targetDate));
  };

  const handleClearHistory = async (dateStr) => {
    const targetDate = dateStr || selectedDate;
    if (window.confirm(`确定要清空 ${targetDate} 的所有饮食打卡记录吗？`)) {
      await clearMealsByDate(targetDate);
      await loadMeals(targetDate);
      if (targetDate === getTodayDateString()) setTodayMeals(await getMealsByDate(targetDate));
    }
  };

  const handleOpenLogWithMeal = (mealType) => {
    setTargetMealType(mealType);
    setIsLogOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <main style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <DashboardTab
            todayMeals={todayMeals}
            targetCalories={settings.targetCalories}
            targetMacros={targetMacros}
            userProfile={userProfile}
            onOpenLogWithMeal={handleOpenLogWithMeal}
            onDeleteMeal={(id) => handleDeleteMeal(id, getTodayDateString())}
          />
        )}

        {activeTab === 'diary' && (
          <DiaryTab
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            todayMeals={meals}
            targetCalories={settings.targetCalories}
            onDeleteMeal={(id) => handleDeleteMeal(id, selectedDate)}
            onClearHistory={(date) => handleClearHistory(date)}
            onOpenLogWithMeal={handleOpenLogWithMeal}
          />
        )}

        {activeTab === 'coach' && (
          <CoachTab
            todayMeals={todayMeals}
            targetCalories={settings.targetCalories}
            targetMacros={targetMacros}
            settings={settings}
            userProfile={userProfile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            settings={settings}
            targetMacros={targetMacros}
            userProfile={userProfile}
            onSaveSettings={handleSaveSettings}
            onSaveMacros={handleSaveMacros}
            onSaveProfile={handleSaveProfile}
            onClearHistory={() => handleClearHistory(selectedDate)}
          />
        )}
      </main>

      {showApiSetup && (
        <div role="dialog" aria-modal="true" aria-labelledby="api-setup-title" style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(15, 23, 42, 0.62)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <section style={{ width: '100%', maxWidth: '420px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--surface)', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,.25)' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--accent-surface)', color: '#059669', display: 'grid', placeItems: 'center', fontSize: '24px', marginBottom: '16px' }}>✦</div>
            <h2 id="api-setup-title" style={{ margin: '0 0 8px', color: 'var(--text-main)', fontSize: '21px' }}>配置 DeepSeek API Key</h2>
            <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.65 }}>配置后即可使用 AI 拍照识别和饮食建议。申请 Key 通常只需几步：</p>
            <ol style={{ margin: '0 0 18px', paddingLeft: '21px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.8 }}>
              <li>打开 DeepSeek 开放平台并注册或登录账号。</li>
              <li>进入 API Keys 页面，创建一个新的 API Key。</li>
              <li>复制新生成的 Key，回到饭时记设置页粘贴并保存。</li>
            </ol>
            <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', color: '#059669', fontWeight: 700, fontSize: '14px', textDecoration: 'none', padding: '12px', borderRadius: '12px', background: 'var(--accent-surface)', marginBottom: '16px' }}>前往 DeepSeek 官方平台申请 ↗</a>
            <p style={{ margin: '0 0 18px', color: 'var(--text-soft)', fontSize: '12px', lineHeight: 1.5 }}>API Key 由你自行申请并保存在本机设置中。请勿分享给他人。</p>
            <button onClick={() => { setShowApiSetup(false); setActiveTab('settings'); }} style={{ width: '100%', border: 0, borderRadius: '14px', padding: '14px', background: '#0f172a', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>去设置并填写 Key</button>
            <button onClick={() => setShowApiSetup(false)} style={{ width: '100%', border: 0, background: 'transparent', color: 'var(--text-muted)', padding: '10px', fontSize: '14px', cursor: 'pointer' }}>稍后再说</button>
          </section>
        </div>
      )}

      <LogModal
        isOpen={isLogOpen}
        initialMealType={targetMealType}
        settings={settings}
        onSaveMeal={handleSaveMeal}
        onClose={() => setIsLogOpen(false)}
      />

      {/* 5-slot 对称底部导航栏，+ 号绝对居中 */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenLog={() => {
          setTargetMealType('lunch');
          setIsLogOpen(true);
        }}
      />
    </div>
  );
}
