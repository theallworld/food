import React, { useState, useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import BottomNav from './components/fud/BottomNav';
import DashboardTab from './components/fud/DashboardTab';
import DiaryTab from './components/fud/DiaryTab';
import CoachTab from './components/fud/CoachTab';
import SettingsTab from './components/fud/SettingsTab';
import LogModal from './components/fud/LogModal';
import PrivacyCenter, { PrivacyGate, PRIVACY_CONSENT_KEY } from './components/PrivacyCenter';
import { clearApiKey, getApiKey, setApiKey } from './utils/secureStorage';
import {
  getTodayDateString,
  getMealsByDate,
  saveMealRecord,
  deleteMealRecord,
  clearAllMeals,
  clearMealsByDate,
  getUserProfile,
  saveUserProfile
} from './utils/storage';

const FoodWidget = registerPlugin('FoodWidget');
const SystemBars = registerPlugin('SystemBars');

const DEFAULT_SETTINGS = { apiKey: '', baseUrl: 'https://api.deepseek.com', model: 'deepseek-flash', targetCalories: 2000, aiConsent: false };
const DEFAULT_MACROS = { protein: 130, carbs: 220, fat: 65 };
const SWIPE_TAB_ORDER = ['dashboard', 'diary', 'coach', 'settings'];

export default function App() {
  const [privacyAccepted, setPrivacyAccepted] = useState(() => {
    try { return localStorage.getItem(PRIVACY_CONSENT_KEY) === 'accepted'; }
    catch { return false; }
  });

  if (!privacyAccepted) {
    return <PrivacyGate onAccepted={() => setPrivacyAccepted(true)} />;
  }

  return <AppContent onRevokePrivacy={() => {
    localStorage.removeItem(PRIVACY_CONSENT_KEY);
    localStorage.removeItem('food_ai_data_consent');
    setPrivacyAccepted(false);
  }} />;
}

function AppContent({ onRevokePrivacy }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tabDirection, setTabDirection] = useState('forward');
  const tabTouchStart = useRef(null);
  const changeTab = (nextTab) => {
    const currentIndex = SWIPE_TAB_ORDER.indexOf(activeTab);
    const nextIndex = SWIPE_TAB_ORDER.indexOf(nextTab);
    if (nextIndex < 0 || nextTab === activeTab) return;
    setTabDirection(nextIndex > currentIndex ? 'forward' : 'backward');
    setActiveTab(nextTab);
  };
  const handleTabTouchStart = (event) => {
    if (event.touches.length !== 1) { tabTouchStart.current = null; return; }
    const target = event.target;
    if (target.closest('button, a, input, textarea, select, [contenteditable="true"], [role="dialog"], [role="switch"], [data-no-tab-swipe], .bottom-nav-glass')) {
      tabTouchStart.current = null;
      return;
    }
    const touch = event.touches[0];
    tabTouchStart.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  };
  const handleTabTouchEnd = (event) => {
    if (!tabTouchStart.current || event.changedTouches.length !== 1) return;
    const start = tabTouchStart.current;
    tabTouchStart.current = null;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    const duration = Math.max(1, Date.now() - start.time);
    if (Math.abs(deltaX) < 58 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    if (duration > 700 && Math.abs(deltaX) < 100) return;
    const currentIndex = SWIPE_TAB_ORDER.indexOf(activeTab);
    const nextIndex = currentIndex + (deltaX < 0 ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < SWIPE_TAB_ORDER.length) changeTab(SWIPE_TAB_ORDER[nextIndex]);
  };
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem('food_theme_mode');
      return saved === 'dark' || saved === 'light' ? saved : 'system';
    } catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
  const theme = themeMode === 'system' ? (systemDark ? 'dark' : 'light') : themeMode;
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [legalPage, setLegalPage] = useState(null);
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
        return { ...DEFAULT_SETTINGS, ...parsed, apiKey: '', baseUrl: DEFAULT_SETTINGS.baseUrl, model: DEFAULT_SETTINGS.model, aiConsent: localStorage.getItem('food_ai_data_consent') === '1' };
      } catch (e) {
        console.error(e);
      }
    }
    return { ...DEFAULT_SETTINGS, aiConsent: localStorage.getItem('food_ai_data_consent') === '1' };
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
    return DEFAULT_MACROS;
  });

  // 所选日期的饮食记录
  const [meals, setMeals] = useState([]);
  const [todayMeals, setTodayMeals] = useState([]);

  useEffect(() => {
    const root = document.documentElement;
    const isAndroidApp = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
    if (isAndroidApp) root.classList.add('native-android');
    return () => { if (isAndroidApp) root.classList.remove('native-android'); };
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const updateSystemTheme = (event) => setSystemDark(event.matches);
    setSystemDark(media.matches);
    media.addEventListener?.('change', updateSystemTheme);
    return () => media.removeEventListener?.('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    try { localStorage.setItem('food_theme_mode', themeMode); } catch {}
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      FoodWidget.setTheme({ theme: themeMode, effectiveTheme: theme }).catch(() => {});
    }
    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
      SystemBars.setTheme({ theme }).catch(() => {});
    }
  }, [theme, themeMode]);

  useEffect(() => {
    let active = true;
    (async () => {
      const loadingStartedAt = Date.now();
      const legacy = (() => {
        try { return JSON.parse(localStorage.getItem('deepseek_food_settings') || '{}'); }
        catch { return {}; }
      })();
      let apiKey = '';
      try { apiKey = await getApiKey(); } catch { apiKey = legacy.apiKey || ''; }
      if (legacy.apiKey && !apiKey) {
        try {
          await setApiKey(legacy.apiKey);
          apiKey = legacy.apiKey;
        } catch { /* Keep the legacy value available for this session. */ }
      }
      if (legacy.apiKey && apiKey) {
        const safeSettings = { ...legacy };
        delete safeSettings.apiKey;
        localStorage.setItem('deepseek_food_settings', JSON.stringify(safeSettings));
      }
      if (!active) return;
      setSettings(current => ({ ...current, apiKey }));
      setShowApiSetup(!apiKey.trim());
      const loadingDelay = Math.max(0, 520 - (Date.now() - loadingStartedAt));
      if (loadingDelay) await new Promise(resolve => setTimeout(resolve, loadingDelay));
      if (!active) return;
      setIsAppReady(true);
    })();
    return () => { active = false; };
  }, []);

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

  const handleSaveSettings = async (newSettings) => {
    const safeSettings = { ...newSettings };
    const apiKey = safeSettings.apiKey || '';
    delete safeSettings.apiKey;
    safeSettings.baseUrl = DEFAULT_SETTINGS.baseUrl;
    safeSettings.model = DEFAULT_SETTINGS.model;
    try {
      if (apiKey.trim()) await setApiKey(apiKey.trim());
      else await clearApiKey();
    } catch (error) {
      window.alert('无法安全保存 API Key，请稍后重试。');
      return;
    }
    localStorage.setItem('food_ai_data_consent', safeSettings.aiConsent ? '1' : '0');
    localStorage.setItem('deepseek_food_settings', JSON.stringify(safeSettings));
    setSettings({ ...safeSettings, apiKey });
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

  const handleClearAllData = async () => {
    if (!window.confirm('将删除本机全部饮食记录、AI 聊天记录及照片、身体档案、营养目标、API Key 和小组件数据。此操作不可恢复，确定继续吗？')) return;
    try {
      await clearAllMeals();
    } catch {
      window.alert('本机饮食记录未能完整清除，其他资料暂未删除。请稍后重试。');
      return;
    }
    try {
      await clearApiKey();
    } catch {
      window.alert('饮食记录和照片已清除，但 API Key 和其他资料未清除。请重试。');
      return;
    }
    localStorage.removeItem('fud_user_body_profile');
    localStorage.removeItem('fud_target_macros');
    localStorage.removeItem('deepseek_food_settings');
    localStorage.removeItem('food_ai_data_consent');
    localStorage.removeItem('food_ai_coach_messages');
    try { await FoodWidget.clearToday(); } catch { /* Web builds have no widget plugin. */ }
    setSettings({ ...DEFAULT_SETTINGS });
    setTargetMacros(DEFAULT_MACROS);
    setUserProfile(getUserProfile());
    setMeals([]);
    setTodayMeals([]);
    setSelectedDate(getTodayDateString());
    setShowApiSetup(true);
    changeTab('dashboard');
  };

  const handleOpenLogWithMeal = (mealType) => {
    setTargetMealType(mealType);
    setIsLogOpen(true);
  };

  if (!isAppReady) {
    return (
      <div className="app-loading" aria-label="正在打开饭时记">
        <div className="loading-brand">
          <span className="loading-mark">饭</span>
          <strong>饭时记</strong>
          <span className="loading-subtitle">每天认真吃好一点</span>
          <span className="loading-dots" aria-hidden="true"><i /><i /><i /></span>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-root theme-${theme}`} style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      <main
        key={activeTab}
        className={`tab-content-enter tab-content-${tabDirection}`}
        style={{ flex: 1 }}
        onTouchStart={handleTabTouchStart}
        onTouchEnd={handleTabTouchEnd}
        onTouchCancel={() => { tabTouchStart.current = null; }}
      >
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
            onClearAllData={handleClearAllData}
            onOpenPrivacy={() => setLegalPage('privacy')}
            onOpenTerms={() => setLegalPage('terms')}
            onRevokePrivacy={onRevokePrivacy}
            theme={themeMode}
            onThemeChange={setThemeMode}
          />
        )}
      </main>

      {showApiSetup && (
        <div className="modal-scrim" role="dialog" aria-modal="true" aria-labelledby="api-setup-title">
          <section className="modal-surface">
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
            <button onClick={() => { setShowApiSetup(false); changeTab('settings'); }} style={{ width: '100%', border: 0, borderRadius: '14px', padding: '14px', background: '#0f172a', color: '#fff', fontSize: '15px', fontWeight: 700, cursor: 'pointer', marginBottom: '8px' }}>去设置并填写 Key</button>
            <button onClick={() => setShowApiSetup(false)} style={{ width: '100%', border: 0, background: 'transparent', color: 'var(--text-muted)', padding: '10px', fontSize: '14px', cursor: 'pointer' }}>稍后再说</button>
          </section>
        </div>
      )}

      {legalPage && <PrivacyCenter type={legalPage} onClose={() => setLegalPage(null)} />}

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
        theme={theme}
        onTabChange={changeTab}
        onOpenLog={() => {
          setTargetMealType('lunch');
          setIsLogOpen(true);
        }}
      />
    </div>
  );
}
