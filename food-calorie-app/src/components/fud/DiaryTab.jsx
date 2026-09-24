import React, { useState } from 'react';
import {
  BookOpen,
  Trash2,
  Clock,
  Utensils,
  ChevronLeft,
  ChevronRight,
  Calendar,
  X,
  Plus,
  Flame,
  ZoomIn
} from 'lucide-react';
import { formatFriendlyDate, getTodayDateString } from '../../utils/storage';
import { formatMealTitle } from '../../utils/nutritionCalculator';

export default function DiaryTab({
  selectedDate,
  onSelectDate,
  todayMeals = [],
  targetCalories = 2000,
  onDeleteMeal,
  onClearHistory,
  onOpenLogWithMeal
}) {
  const [previewImage, setPreviewImage] = useState(null);

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  // 切换上一天
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    onSelectDate(getTodayDateString(date));
  };

  // 切换下一天
  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    onSelectDate(getTodayDateString(date));
  };

  const handleGoToday = () => {
    onSelectDate(todayStr);
  };

  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const totalProtein = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalFat || 0), 0) * 10) / 10;

  const mealTypeLabels = {
    breakfast: '🌅 早餐',
    lunch: '☀️ 午餐',
    dinner: '🌙 晚餐',
    snack: '🍎 加餐/零食'
  };

  return (
    <div style={{ padding: '20px 16px 100px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 顶部标题与清空 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>
            DIARY · 饮食时光轴
          </span>
          <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
            饮食日记与照片
          </h1>
        </div>

        {todayMeals.length > 0 && (
          <button
            onClick={() => onClearHistory(selectedDate)}
            style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
          >
            清空当日
          </button>
        )}
      </div>

      {/* 日期选择导航条 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '18px',
        padding: '8px 12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <button
          onClick={handlePrevDay}
          style={{
            border: 'none',
            background: 'var(--bg-main)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
          title="前一天"
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>
              {formatFriendlyDate(selectedDate)}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && onSelectDate(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '11px',
                color: 'var(--text-soft)',
                cursor: 'pointer',
                outline: 'none',
                textAlign: 'center'
              }}
            />
          </div>

          {!isToday && (
            <button
              onClick={handleGoToday}
              style={{
                border: 'none',
                background: 'var(--accent-surface)',
                color: '#10b981',
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              今
            </button>
          )}
        </div>

        <button
          onClick={handleNextDay}
          style={{
            border: 'none',
            background: 'var(--bg-main)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)'
          }}
          title="后一天"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 当日小计卡片 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '20px',
        padding: '16px 18px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--accent-surface)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen size={20} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
              共记 {todayMeals.length} 餐
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
              蛋 {totalProtein}g · 碳 {totalCarbs}g · 脂 {totalFat}g
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: '900', color: '#ef4444' }}>
            {totalCalories} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-soft)' }}>kcal</span>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-soft)' }}>
            占目标 {Math.min(100, Math.round((totalCalories / targetCalories) * 100))}%
          </div>
        </div>
      </div>

      {/* 记录流水列表 */}
      {todayMeals.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-soft)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--surface)',
          borderRadius: '22px',
          border: '1px dashed var(--border-color)'
        }}>
          <Utensils size={36} color="#cbd5e1" />
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>
            {isToday ? '今天还没有进食记录' : '该日期无进食打卡记录'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-soft)', maxWidth: '240px' }}>
            点击底部绿色的“+”按钮，拍下餐盘即可智能识别保存！
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {todayMeals.map(meal => (
            <div
              key={meal.id}
              style={{
                background: 'var(--surface)',
                borderRadius: '18px',
                padding: '14px 16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              {/* 主体信息 */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                {/* 食物照片缩略图 */}
                {meal.image ? (
                  <div
                    onClick={() => setPreviewImage(meal.image)}
                    style={{
                      position: 'relative',
                      width: '64px',
                      height: '64px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    <img
                      src={meal.image}
                      alt={meal.dishName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.5)',
                      borderRadius: '4px',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ZoomIn size={10} color="#ffffff" />
                    </div>
                  </div>
                ) : (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'var(--bg-main)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: 'var(--text-faint)',
                    border: '1px solid #f1f5f9'
                  }}>
                    <Utensils size={24} />
                  </div>
                )}

                {/* 详情与热量 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: '1 1 0%', minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', fontWeight: '700', padding: '1px 6px', borderRadius: '6px', background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                          {mealTypeLabels[meal.mealType] || '午餐'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>
                          {meal.time}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.45 }}>
                        {formatMealTitle(meal.dishName, meal.foods)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: '#ef4444', whiteSpace: 'nowrap' }}>
                        +{meal.totalCalories} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-soft)' }}>kcal</span>
                      </span>
                      <button
                        onClick={() => onDeleteMeal(meal.id, selectedDate)}
                        style={{ border: 'none', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '4px' }}
                        title="删除记录"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    蛋 {meal.totalProtein}g · 碳 {meal.totalCarbs}g · 脂 {meal.totalFat}g
                  </div>
                </div>
              </div>

              {/* 拆解食材明细标签 */}
              {meal.foods && meal.foods.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '8px', borderTop: '1px dashed #f1f5f9' }}>
                  {meal.foods.map((f, i) => (
                    <span key={i} style={{ fontSize: '11px', background: 'var(--bg-main)', padding: '3px 8px', borderRadius: '6px', color: 'var(--text-secondary)', maxWidth: '100%', whiteSpace: 'normal', overflowWrap: 'anywhere' }}>
                      {f.name} {f.portion && `(${f.portion})`} {f.calories ? `${f.calories}kcal` : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 照片大图弹窗 Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', maxWidth: '90%', maxHeight: '80%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
            <img
              src={previewImage}
              alt="大图预览"
              style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '16px', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
