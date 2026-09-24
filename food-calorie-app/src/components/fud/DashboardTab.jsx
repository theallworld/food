import React from 'react';
import { Flame, Plus, Sunrise, Sun, Sunset, Apple, Trash2, ChevronRight, Zap } from 'lucide-react';
import { formatMealTitle } from '../../utils/nutritionCalculator';

export default function DashboardTab({
  todayMeals = [],
  targetCalories = 2000,
  targetMacros = { protein: 130, carbs: 220, fat: 65 },
  userProfile = {},
  onOpenLogWithMeal,
  onDeleteMeal
}) {
  // 统计计算
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const remainingCalories = Math.max(0, targetCalories - totalCalories);
  const totalProtein = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalFat || 0), 0) * 10) / 10;

  const calPercent = Math.min(100, Math.round((totalCalories / targetCalories) * 100));
  const proPercent = Math.min(100, Math.round((totalProtein / targetMacros.protein) * 100));
  const carbPercent = Math.min(100, Math.round((totalCarbs / targetMacros.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / targetMacros.fat) * 100));

  // 餐次分类
  const mealSections = [
    { type: 'breakfast', name: '早餐', icon: Sunrise, color: '#f59e0b', desc: '推荐热量 ~450 kcal' },
    { type: 'lunch', name: '午餐', icon: Sun, color: '#10b981', desc: '推荐热量 ~700 kcal' },
    { type: 'dinner', name: '晚餐', icon: Sunset, color: '#6366f1', desc: '推荐热量 ~550 kcal' },
    { type: 'snack', name: '加餐/零食', icon: Apple, color: '#ec4899', desc: '健康坚果、水果或饮品' }
  ];

  const todayDateStr = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });

  const goalLabels = {
    lose: '健康减脂中',
    maintain: '保持体重中',
    gain: '增肌塑形中'
  };

  return (
    <div style={{ padding: '20px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 顶部日期与状态 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8', letterSpacing: '0.04em' }}>
              TODAY · 饮食总览
            </span>
            <span style={{ fontSize: '10px', fontWeight: '700', padding: '1px 6px', background: '#ecfdf5', color: '#047857', borderRadius: '6px' }}>
              v1.8
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', marginTop: '2px' }}>
            {todayDateStr}
          </h1>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '6px 12px',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '20px',
          color: '#059669',
          fontSize: '12px',
          fontWeight: '700'
        }}>
          <Zap size={14} fill="#10b981" />
          <span>{goalLabels[userProfile.goal] || '健康管理中'}</span>
        </div>
      </div>

      {/* Fud-AI 风格热量核心卡片 */}
      <div style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '26px',
        padding: '24px 20px',
        color: '#ffffff',
        boxShadow: '0 12px 24px -6px rgba(15, 23, 42, 0.3)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: '500' }}>剩余可摄入</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '4px' }}>
                <span style={{ fontSize: '48px', fontWeight: '900', letterSpacing: '-0.04em', lineHeight: 1 }}>
                  {remainingCalories}
                </span>
                <span style={{ fontSize: '16px', color: '#94a3b8', fontWeight: '600' }}>kcal</span>
              </div>
            </div>

            {/* 环形/百分比角标 */}
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: 'rgba(255, 255, 255, 0.12)',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '700'
              }}>
                <Flame size={14} color="#f87171" fill="#f87171" />
                <span>已摄入 {totalCalories}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                目标: {targetCalories} kcal
              </div>
            </div>
          </div>

          {/* 总热量进度条 */}
          <div style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            margin: '18px 0 20px 0'
          }}>
            <div style={{
              width: `${calPercent}%`,
              height: '100%',
              background: calPercent > 100 ? '#ef4444' : 'linear-gradient(90deg, #10b981, #34d399)',
              borderRadius: '4px',
              transition: 'width 0.4s ease'
            }} />
          </div>

          {/* 三大宏量营养素条 (Fud-AI 标志设计) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {/* 蛋白质 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#f87171', fontWeight: '600' }}>
                <span>蛋白质</span>
                <span>{proPercent}%</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px' }}>
                {totalProtein}<span style={{ fontSize: '11px', color: '#94a3b8' }}>/{targetMacros.protein}g</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                <div style={{ width: `${proPercent}%`, height: '100%', background: '#ef4444', borderRadius: '2px' }} />
              </div>
            </div>

            {/* 碳水 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#60a5fa', fontWeight: '600' }}>
                <span>碳水</span>
                <span>{carbPercent}%</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px' }}>
                {totalCarbs}<span style={{ fontSize: '11px', color: '#94a3b8' }}>/{targetMacros.carbs}g</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                <div style={{ width: `${carbPercent}%`, height: '100%', background: '#3b82f6', borderRadius: '2px' }} />
              </div>
            </div>

            {/* 脂肪 */}
            <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '10px 12px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#fbbf24', fontWeight: '600' }}>
                <span>脂肪</span>
                <span>{fatPercent}%</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '800', marginTop: '2px' }}>
                {totalFat}<span style={{ fontSize: '11px', color: '#94a3b8' }}>/{targetMacros.fat}g</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px' }}>
                <div style={{ width: `${fatPercent}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 餐次时间轴 (Meal Timeline) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
            今日餐食安排
          </h2>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>已记录 {todayMeals.length} 次</span>
        </div>

        {mealSections.map((sec) => {
          const Icon = sec.icon;
          const sectionMeals = todayMeals.filter(m => (m.mealType || 'lunch') === sec.type);
          const secCalories = sectionMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);

          return (
            <div
              key={sec.type}
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              {/* 餐次头部 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: sectionMeals.length > 0 ? '12px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '12px',
                    backgroundColor: `${sec.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: sec.color
                  }}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e293b' }}>{sec.name}</span>
                      {secCalories > 0 && (
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#ef4444' }}>
                          {secCalories} <span style={{ fontSize: '10px', color: '#94a3b8' }}>kcal</span>
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{sec.desc}</span>
                  </div>
                </div>

                {/* 添加食物按钮 */}
                <button
                  onClick={() => onOpenLogWithMeal(sec.type)}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#0f172a',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>添加</span>
                </button>
              </div>

              {/* 该餐次已记录的具体菜品列表 */}
              {sectionMeals.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed #f1f5f9', paddingTop: '10px' }}>
                  {sectionMeals.map((meal) => (
                    <div
                      key={meal.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {meal.image && (
                          <img
                            src={meal.image}
                            alt=""
                            style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }}
                          />
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>
                            {formatMealTitle(meal.dishName, meal.foods)}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {meal.time} · 蛋{meal.totalProtein}g 碳{meal.totalCarbs}g 脂{meal.totalFat}g
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444' }}>
                          +{meal.totalCalories}
                        </span>
                        <button
                          onClick={() => onDeleteMeal(meal.id)}
                          style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '2px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
