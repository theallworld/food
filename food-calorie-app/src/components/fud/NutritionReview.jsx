import React, { useState } from 'react';
import {
  Flame,
  Check,
  PlusCircle,
  Trash2,
  Edit2,
  Sparkles,
  X,
  RotateCw,
  Minus,
  Plus,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { parseGrams, estimateNutritionFromCommonDB, formatMealTitle } from '../../utils/nutritionCalculator';
import { COOKING_OIL_LEVELS, calculateHonestInterval } from '../../utils/foodDatabase';
import { analyzeFoodTextWithDeepSeek } from '../../services/deepseek';

export default function NutritionReview({
  result,
  mealType = 'lunch',
  previewImage = null,
  settings = {},
  onSave,
  onCancel
}) {
  // 初始化食材列表，确保每种食材有明确的数值克数和单位基准
  const [foods, setFoods] = useState(() => {
    return (result.foods || []).map((f, i) => {
      const g = parseGrams(f.portion);
      const c = Number(f.calories) || 0;
      const p = Number(f.protein) || 0;
      const cb = Number(f.carbs) || 0;
      const ft = Number(f.fat) || 0;
      return {
        id: f.id || `food-${i}-${Date.now()}`,
        name: f.name || '食材',
        portion: f.portion || `${g}克`,
        grams: g,
        baseGrams: g, // 保持基准克数，防止连续多次调整出现累积舍入误差
        calories: c,
        protein: p,
        carbs: cb,
        fat: ft,
        baseCalories: c,
        baseProtein: p,
        baseCarbs: cb,
        baseFat: ft,
        justUpdated: false
      };
    });
  });

  const [selectedMealType, setSelectedMealType] = useState(mealType);
  const [portionScale, setPortionScale] = useState(1);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', portion: '', calories: 0, protein: 0, fat: 0, carbs: 0 });

  // 添加新食材状态
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    grams: 100,
    calories: 120,
    protein: 6,
    fat: 4,
    carbs: 15,
    calculated: false
  });
  const [isCalculatingNew, setIsCalculatingNew] = useState(false);
  const [cookingOil, setCookingOil] = useState(result.cookingOil || 'home_normal');

  // 计算用油梯度修正（解决中餐/外卖烹饪用油 200~480 kcal 核心波动）
  const initialOilConfig = COOKING_OIL_LEVELS.find(o => o.id === (result.cookingOil || 'home_normal')) || COOKING_OIL_LEVELS[2];
  const currentOilConfig = COOKING_OIL_LEVELS.find(o => o.id === cookingOil) || COOKING_OIL_LEVELS[2];
  const oilCalDiff = currentOilConfig.cals - initialOilConfig.cals;
  const oilFatDiff = currentOilConfig.oilGrams - initialOilConfig.oilGrams;

  // 动态统计整餐热量与营养素
  const baseFoodCalories = Math.round(foods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0) * portionScale);
  const totalCalories = Math.max(10, baseFoodCalories + oilCalDiff);
  const totalProtein = Math.round(foods.reduce((sum, f) => sum + (Number(f.protein) || 0), 0) * portionScale * 10) / 10;
  const totalFat = Math.max(0, Math.round((foods.reduce((sum, f) => sum + (Number(f.fat) || 0), 0) * portionScale + oilFatDiff) * 10) / 10);
  const totalCarbs = Math.round(foods.reduce((sum, f) => sum + (Number(f.carbs) || 0), 0) * portionScale * 10) / 10;

  // 诚实呈现原则：计算能量置信区间
  const honestRange = calculateHonestInterval(totalCalories);

  const proteinKcal = totalProtein * 4;
  const carbsKcal = totalCarbs * 4;
  const fatKcal = totalFat * 9;
  const sumKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / sumKcal) * 100);
  const carbsPct = Math.round((carbsKcal / sumKcal) * 100);
  const fatPct = Math.round((fatKcal / sumKcal) * 100);

  const mealTypes = [
    { id: 'breakfast', label: '早餐' },
    { id: 'lunch', label: '午餐' },
    { id: 'dinner', label: '晚餐' },
    { id: 'snack', label: '加餐' }
  ];

  // 核心功能：调整单项食物克数并点按【更新】重算热量与营养成分
  const handleUpdateGrams = (index, targetGrams) => {
    const g = Math.max(1, Number(targetGrams) || 1);
    setFoods((prev) => {
      const updated = [...prev];
      const item = { ...updated[index] };
      const baseG = item.baseGrams || 100;
      const ratio = g / baseG;

      item.grams = g;
      item.portion = `${g}克`;
      item.calories = Math.round((item.baseCalories || 0) * ratio);
      item.protein = Math.round((item.baseProtein || 0) * ratio * 10) / 10;
      item.fat = Math.round((item.baseFat || 0) * ratio * 10) / 10;
      item.carbs = Math.round((item.baseCarbs || 0) * ratio * 10) / 10;
      item.justUpdated = true;

      updated[index] = item;
      return updated;
    });

    // 1.5 秒后清除高亮更新提示
    setTimeout(() => {
      setFoods((prev) => {
        if (!prev[index]) return prev;
        const copy = [...prev];
        copy[index] = { ...copy[index], justUpdated: false };
        return copy;
      });
    }, 1500);
  };

  // 快捷微调克数 (+/- 步长)
  const handleStepGrams = (index, step) => {
    const current = foods[index].grams || 100;
    const next = Math.max(10, current + step);
    handleUpdateGrams(index, next);
  };

  // 删除单项
  const handleDelete = (index) => {
    setFoods(foods.filter((_, i) => i !== index));
  };

  // 手动编辑完成
  const handleSaveEdit = (index) => {
    const updated = [...foods];
    const g = parseGrams(editForm.portion) || 100;
    const c = Number(editForm.calories) || 0;
    const p = Number(editForm.protein) || 0;
    const f = Number(editForm.fat) || 0;
    const cb = Number(editForm.carbs) || 0;

    updated[index] = {
      ...updated[index],
      name: editForm.name,
      portion: editForm.portion || `${g}克`,
      grams: g,
      baseGrams: g,
      calories: c,
      protein: p,
      fat: f,
      carbs: cb,
      baseCalories: c,
      baseProtein: p,
      baseFat: f,
      baseCarbs: cb
    };
    setFoods(updated);
    setEditingIndex(null);
  };

  // 添加新食材时：点击【更新 / 根据克数测算】按钮重新计算热量与营养成分
  const handleCalculateNewFood = async () => {
    const name = newFood.name.trim();
    if (!name) return;

    setIsCalculatingNew(true);
    const g = Math.max(1, Number(newFood.grams) || 100);

    try {
      // 优先尝试调用 DeepSeek 进行精准推算
      if (settings?.apiKey && settings.apiKey.trim()) {
        const textQuery = `${name} ${g}克`;
        const res = await analyzeFoodTextWithDeepSeek({
          textDescription: textQuery,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model
        });

        if (res.foods && res.foods.length > 0) {
          const item = res.foods[0];
          setNewFood({
            ...newFood,
            grams: g,
            calories: item.calories || 100,
            protein: item.protein || 5,
            fat: item.fat || 2,
            carbs: item.carbs || 15,
            calculated: true
          });
          setIsCalculatingNew(false);
          return;
        }
      }
    } catch (err) {
      console.warn('AI 测算遇到波动，无缝采用权威食物成分库推算:', err);
    }

    // 权威中国食物成分库快速离线测算
    const estimated = estimateNutritionFromCommonDB(name, g);
    setNewFood({
      ...newFood,
      grams: g,
      calories: estimated.calories,
      protein: estimated.protein,
      fat: estimated.fat,
      carbs: estimated.carbs,
      calculated: true
    });
    setIsCalculatingNew(false);
  };

  // 确认添加新食材到列表
  const handleConfirmAddFood = () => {
    if (!newFood.name.trim()) return;
    const g = Math.max(1, Number(newFood.grams) || 100);
    const c = Number(newFood.calories) || 0;
    const p = Number(newFood.protein) || 0;
    const f = Number(newFood.fat) || 0;
    const cb = Number(newFood.carbs) || 0;

    const newItem = {
      id: `food-manual-${Date.now()}`,
      name: newFood.name.trim(),
      portion: `${g}克`,
      grams: g,
      baseGrams: g,
      calories: c,
      protein: p,
      fat: f,
      carbs: cb,
      baseCalories: c,
      baseProtein: p,
      baseFat: f,
      baseCarbs: cb,
      justUpdated: true
    };

    setFoods([...foods, newItem]);
    setNewFood({ name: '', grams: 100, calories: 120, protein: 6, fat: 4, carbs: 15, calculated: false });
    setIsAddingNew(false);
  };

  // 保存记录
  const handleConfirmSave = () => {
    onSave({
      dishName: formatMealTitle(result.dishName, foods),
      mealType: selectedMealType,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
      foods,
      image: previewImage,
      cookingOil,
      honestRange: honestRange.label
    });
  };

  return (
    <div className="nutrition-review-content" style={{
      background: 'var(--surface)',
      borderRadius: '24px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      maxHeight: 'none',
      overflowY: 'visible'
    }}>
      {/* 头部与关闭 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="review-heading-copy">
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>
            NUTRITION REVIEW · 克数与营养核对
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
            {formatMealTitle(result.dishName, foods)}
          </h2>
        </div>
        <button
          className="review-close-button"
          onClick={onCancel}
          style={{ border: 'none', background: 'var(--surface-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* 餐次选择 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {mealTypes.map(m => (
          <button
            key={m.id}
            onClick={() => setSelectedMealType(m.id)}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: selectedMealType === m.id ? '#0f172a' : '#f1f5f9',
              color: selectedMealType === m.id ? '#ffffff' : '#64748b',
              fontSize: '12px',
              fontWeight: selectedMealType === m.id ? '700' : '500',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* 核心大卡总览卡片 */}
      <div className="nutrition-summary-card" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '18px',
        color: '#ffffff',
        boxShadow: '0 8px 20px -4px rgba(15, 23, 42, 0.25)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-soft)' }}>这顿饭总摄入</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
              <span style={{ fontSize: '36px', fontWeight: '900', color: '#ffffff', lineHeight: 1 }}>{totalCalories}</span>
              <span style={{ fontSize: '14px', color: 'var(--text-soft)' }}>kcal</span>
            </div>
            {/* 诚实呈现原则：科学置信区间（杜绝伪精度） */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <span style={{ fontSize: '11px', color: '#34d399', fontWeight: '700' }}>区间</span>
              <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: '600' }}>{honestRange.label}</span>
            </div>
          </div>

          {/* 快捷整餐倍率 */}
          <div className="portion-scale-control" style={{ display: 'flex', gap: '4px' }}>
            {[
              { l: '0.5x', s: 0.5 },
              { l: '1.0x', s: 1 },
              { l: '1.3x', s: 1.3 }
            ].map(item => (
              <button
                key={item.s}
                onClick={() => setPortionScale(item.s)}
                style={{
                  border: portionScale === item.s ? '1px solid rgba(110, 231, 183, 0.72)' : '1px solid rgba(255,255,255,0.08)',
                  padding: '6px 10px',
                  borderRadius: '999px',
                  background: portionScale === item.s ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.09)',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: portionScale === item.s ? '750' : '600',
                  cursor: 'pointer',
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                  boxShadow: portionScale === item.s ? '0 4px 14px rgba(16,185,129,0.28)' : 'none',
                  transition: 'background 180ms ease, box-shadow 180ms ease, transform 180ms ease'
                }}
              >
                {item.l}
              </button>
            ))}
          </div>
        </div>

        {/* 宏量占比长条 */}
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden', margin: '14px 0 10px 0', display: 'flex' }}>
          <div style={{ width: `${proteinPct}%`, background: '#ef4444' }} />
          <div style={{ width: `${carbsPct}%`, background: '#3b82f6' }} />
          <div style={{ width: `${fatPct}%`, background: '#f59e0b' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span style={{ color: '#f87171' }}>蛋白质 {totalProtein}g ({proteinPct}%)</span>
          <span style={{ color: '#60a5fa' }}>碳水 {totalCarbs}g ({carbsPct}%)</span>
          <span style={{ color: '#fbbf24' }}>脂肪 {totalFat}g ({fatPct}%)</span>
        </div>

        {/* 烹饪用油梯度选择（外卖/中餐最大热量变量调节） */}
        <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-soft)', fontWeight: '600' }}>烹饪用油梯度 (中餐核心变量)</span>
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '700' }}>+{currentOilConfig.oilGrams}g油 ({currentOilConfig.cals} kcal)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
            {COOKING_OIL_LEVELS.map(oil => (
              <button
                key={oil.id}
                type="button"
                onClick={() => setCookingOil(oil.id)}
                style={{
                  padding: '6px 2px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '10px',
                  fontWeight: cookingOil === oil.id ? '800' : '500',
                  backgroundColor: cookingOil === oil.id ? '#10b981' : 'rgba(255,255,255,0.08)',
                  color: cookingOil === oil.id ? '#ffffff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'center',
                  lineHeight: '1.2',
                  transition: 'all 0.15s'
                }}
              >
                {oil.label.split('/')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 食材明细与调整克数 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>食材明细</span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>可修改克数并点击“更新”重算</span>
          </div>
          <button
            onClick={() => setIsAddingNew(true)}
            style={{ border: 'none', background: 'none', color: '#10b981', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
          >
            <PlusCircle size={14} />
            <span>添加遗漏</span>
          </button>
        </div>

        {/* 添加新食材面板 */}
        {isAddingNew && (
          <div style={{
            background: 'var(--bg-main)',
            border: '1.5px dashed #10b981',
            borderRadius: '16px',
            padding: '12px 14px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <PlusCircle size={14} color="#10b981" />
              <span>添加新食材（输入名称与克数，点更新自动重算）</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>食材名称</label>
                <input
                  type="text"
                  placeholder="如: 白米饭、水煮蛋"
                  value={newFood.name}
                  onChange={e => setNewFood({ ...newFood, name: e.target.value })}
                  style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>重量 (克)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <input
                    type="number"
                    min="1"
                    placeholder="100"
                    value={newFood.grams}
                    onChange={e => setNewFood({ ...newFood, grams: Math.max(1, Number(e.target.value) || 1) })}
                    style={{ width: '100%', padding: '7px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '13px', fontWeight: '700', outline: 'none' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>g</span>
                </div>
              </div>
            </div>

            {/* 核心亮点：按克数计算的【更新】按钮 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isCalculatingNew ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                    <Loader2 size={12} className="animate-spin" />
                    正在科学测算营养...
                  </span>
                ) : newFood.calculated ? (
                  <span style={{ color: '#047857', fontWeight: '700' }}>
                    已算出: {newFood.calories} kcal (蛋{newFood.protein}g 碳{newFood.carbs}g 脂{newFood.fat}g)
                  </span>
                ) : (
                  <span>输入克数后，点击右侧更新重算</span>
                )}
              </div>

              <button
                type="button"
                onClick={handleCalculateNewFood}
                disabled={isCalculatingNew || !newFood.name.trim()}
                style={{
                  border: 'none',
                  background: '#10b981',
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: isCalculatingNew || !newFood.name.trim() ? 'not-allowed' : 'pointer',
                  opacity: isCalculatingNew || !newFood.name.trim() ? 0.6 : 1
                }}
              >
                <RotateCw size={12} />
                <span>更新测算</span>
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsAddingNew(false)}
                style={{ border: 'none', background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleConfirmAddFood}
                style={{ border: 'none', background: '#0f172a', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                确认添加该食材
              </button>
            </div>
          </div>
        )}

        {/* 食材列表展示与克数调节 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {foods.map((food, idx) => (
            <div
              key={food.id || idx}
              style={{
                background: food.justUpdated ? '#f0fdf4' : editingIndex === idx ? '#f8fafc' : '#ffffff',
                border: food.justUpdated ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '12px 14px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'all 0.25s ease'
              }}
            >
              {editingIndex === idx ? (
                // 完整手动表单编辑模式
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                    />
                    <input
                      type="text"
                      value={editForm.portion}
                      onChange={e => setEditForm({ ...editForm, portion: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                    />
                    <input
                      type="number"
                      value={editForm.calories}
                      onChange={e => setEditForm({ ...editForm, calories: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '12px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button onClick={() => setEditingIndex(null)} style={{ border: 'none', background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>取消</button>
                    <button onClick={() => handleSaveEdit(idx)} style={{ border: 'none', background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>完成</button>
                  </div>
                </div>
              ) : (
                // 默认展示：菜品名、营养素、以及核心克数调整与【更新】按钮
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)' }}>{food.name}</span>
                        {food.justUpdated && (
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#059669', background: 'var(--accent-surface)', padding: '1px 6px', borderRadius: '6px' }}>
                            ✓ 已重算
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        蛋 {food.protein}g · 碳 {food.carbs}g · 脂 {food.fat}g
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: '900', color: '#ef4444' }}>
                        {Math.round(food.calories * portionScale)} <span style={{ fontSize: '10px', color: 'var(--text-soft)' }}>kcal</span>
                      </span>
                      <button
                        onClick={() => {
                          setEditingIndex(idx);
                          setEditForm({ ...food });
                        }}
                        style={{ border: 'none', background: 'none', color: 'var(--text-soft)', cursor: 'pointer', padding: '4px' }}
                        title="自定义编辑"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(idx)}
                        style={{ border: 'none', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '4px' }}
                        title="删除食材"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* 核心功能行：克数输入框与更新按钮 */}
                  <div style={{
                    marginTop: '8px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>分量克数:</span>

                      {/* 减 25g */}
                      <button
                        type="button"
                        onClick={() => handleStepGrams(idx, -25)}
                        style={{
                          border: 'none',
                          background: 'var(--surface-muted)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                        title="减少25克"
                      >
                        <Minus size={12} />
                      </button>

                      {/* 克数直填框 */}
                      <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-main)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '2px 6px' }}>
                        <input
                          type="number"
                          min="1"
                          value={food.grams}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFoods((prev) => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], grams: val === '' ? '' : Number(val) };
                              return copy;
                            });
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateGrams(idx, food.grams);
                            }
                          }}
                          style={{
                            width: '46px',
                            border: 'none',
                            background: 'transparent',
                            fontSize: '13px',
                            fontWeight: '700',
                            color: 'var(--text-main)',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>g</span>
                      </div>

                      {/* 加 25g */}
                      <button
                        type="button"
                        onClick={() => handleStepGrams(idx, 25)}
                        style={{
                          border: 'none',
                          background: 'var(--surface-muted)',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                        title="增加25克"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* 更新按钮 */}
                    <button
                      type="button"
                      onClick={() => handleUpdateGrams(idx, food.grams)}
                      style={{
                        border: 'none',
                        background: 'var(--accent-surface)',
                        color: '#059669',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <RotateCw size={11} />
                      <span>更新重算</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI 点评 */}
      {result.healthComment && (
        <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '14px', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, border: '1px solid #f1f5f9' }}>
          <strong style={{ color: 'var(--text-main)' }}>💡 营养建议：</strong>{result.healthComment}
        </div>
      )}

      {/* 确认打卡保存按钮 */}
      <button
        onClick={handleConfirmSave}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          border: 'none',
          fontSize: '15px',
          fontWeight: '800',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}
      >
        <Check size={18} />
        <span>确认并记入 {mealTypes.find(m => m.id === selectedMealType)?.label}</span>
      </button>
    </div>
  );
}
