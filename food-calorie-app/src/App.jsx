import React, { useState, useEffect } from 'react';
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

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
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
