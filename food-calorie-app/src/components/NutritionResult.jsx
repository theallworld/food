import React, { useState } from 'react';
import { Flame, Check, Plus, MessageSquare, Award, Trash2, Edit2, PlusCircle, CheckCircle } from 'lucide-react';

export default function NutritionResult({ result, onSaveToDiary, isSaved }) {
  if (!result) return null;

  // 将结果中的 foods 存入本地可编辑状态
  const [foods, setFoods] = useState(result.foods || []);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', portion: '', calories: 0, protein: 0, fat: 0, carbs: 0 });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newFood, setNewFood] = useState({ name: '', portion: '100克', calories: 120, protein: 5, fat: 2, carbs: 20 });
  const [portionScale, setPortionScale] = useState(1);

  // 动态根据当前的 foods 列表重新计算总热量及营养素
  const totalCalories = Math.round(foods.reduce((sum, f) => sum + (Number(f.calories) || 0), 0) * portionScale);
  const totalProtein = Math.round(foods.reduce((sum, f) => sum + (Number(f.protein) || 0), 0) * portionScale * 10) / 10;
  const totalFat = Math.round(foods.reduce((sum, f) => sum + (Number(f.fat) || 0), 0) * portionScale * 10) / 10;
  const totalCarbs = Math.round(foods.reduce((sum, f) => sum + (Number(f.carbs) || 0), 0) * portionScale * 10) / 10;

  // 宏量占比
  const proteinKcal = totalProtein * 4;
  const carbsKcal = totalCarbs * 4;
  const fatKcal = totalFat * 9;
  const sumKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / sumKcal) * 100);
  const carbsPct = Math.round((carbsKcal / sumKcal) * 100);
  const fatPct = Math.round((fatKcal / sumKcal) * 100);

  // 删除单项食材
  const handleDeleteFood = (index) => {
    const updated = foods.filter((_, i) => i !== index);
    setFoods(updated);
  };

  // 开始编辑某一项
  const handleStartEdit = (index) => {
    setEditingIndex(index);
    setEditForm({ ...foods[index] });
  };

  // 保存单项编辑
  const handleSaveEdit = (index) => {
    const updated = [...foods];
    updated[index] = {
      ...editForm,
      calories: Number(editForm.calories) || 0,
      protein: Number(editForm.protein) || 0,
      fat: Number(editForm.fat) || 0,
      carbs: Number(editForm.carbs) || 0
    };
    setFoods(updated);
    setEditingIndex(null);
  };

  // 添加新菜品
  const handleAddFood = () => {
    if (!newFood.name.trim()) return;
    setFoods([...foods, {
      id: `food-manual-${Date.now()}`,
      name: newFood.name.trim(),
      portion: newFood.portion.trim() || '适量',
      calories: Number(newFood.calories) || 0,
      protein: Number(newFood.protein) || 0,
      fat: Number(newFood.fat) || 0,
      carbs: Number(newFood.carbs) || 0
    }]);
    setNewFood({ name: '', portion: '100克', calories: 120, protein: 5, fat: 2, carbs: 20 });
    setIsAddingNew(false);
  };

  // 快捷整份缩放（例如只吃了大半碗）
  const handleScaleChange = (scale) => {
    setPortionScale(scale);
  };

  const handleSave = () => {
    onSaveToDiary({
      dishName: result.dishName,
      totalCalories,
      totalProtein,
      totalFat,
      totalCarbs,
      foods
    });
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 核心总览卡片 */}
      <div style={{
        background: 'linear-gradient(145deg, #ffffff, #f0fdf4)',
        borderRadius: '24px',
        border: '1px solid #bbf7d0',
        padding: '20px',
        boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.12)'
      }}>
        {/* 标题 & 健康分 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#10b981', letterSpacing: '0.05em' }}>
              识别完成 · 支持手动修正
            </span>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginTop: '2px' }}>
              {result.dishName || '餐食记录'}
            </h2>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--accent-surface)',
            padding: '4px 10px',
            borderRadius: '20px',
            color: '#15803d',
            fontSize: '13px',
            fontWeight: '700'
          }}>
            <Award size={16} />
            <span>{result.healthScore || 88}分</span>
          </div>
        </div>

        {/* 热量巨星数字 */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '14px' }}>
          <Flame size={28} color="#ef4444" style={{ alignSelf: 'center' }} />
          <span style={{ fontSize: '42px', fontWeight: '900', color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
            {totalCalories}
          </span>
          <span style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-muted)' }}>千卡 (kcal)</span>
        </div>

        {/* 快捷分量缩放按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>整体食量：</span>
          {[
            { label: '半份 (0.5x)', scale: 0.5 },
            { label: '正常 (1.0x)', scale: 1 },
            { label: '多吃 (1.3x)', scale: 1.3 }
          ].map((item) => (
            <button
              key={item.scale}
              onClick={() => handleScaleChange(item.scale)}
              style={{
                border: 'none',
                padding: '4px 8px',
                borderRadius: '8px',
                backgroundColor: portionScale === item.scale ? '#10b981' : '#f1f5f9',
                color: portionScale === item.scale ? '#ffffff' : '#475569',
                cursor: 'pointer',
                fontWeight: portionScale === item.scale ? '700' : 'normal'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* 三大营养素条 */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', height: '10px', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'var(--surface-muted)', marginBottom: '10px' }}>
            <div style={{ width: `${proteinPct}%`, backgroundColor: '#ef4444' }} />
            <div style={{ width: `${carbsPct}%`, backgroundColor: '#3b82f6' }} />
            <div style={{ width: `${fatPct}%`, backgroundColor: '#f59e0b' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div style={{ background: 'var(--danger-surface)', padding: '8px 10px', borderRadius: '12px', border: '1px solid #fee2e2' }}>
              <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '600' }}>蛋白质</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#991b1b', marginTop: '2px' }}>{totalProtein}g</div>
              <div style={{ fontSize: '10px', color: '#b91c1c' }}>{proteinPct}%</div>
            </div>
            <div style={{ background: 'var(--info-surface)', padding: '8px 10px', borderRadius: '12px', border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '11px', color: '#2563eb', fontWeight: '600' }}>碳水</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#1e40af', marginTop: '2px' }}>{totalCarbs}g</div>
              <div style={{ fontSize: '10px', color: '#1d4ed8' }}>{carbsPct}%</div>
            </div>
            <div style={{ background: 'var(--warning-surface)', padding: '8px 10px', borderRadius: '12px', border: '1px solid #fef3c7' }}>
              <div style={{ fontSize: '11px', color: '#d97706', fontWeight: '600' }}>脂肪</div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: '#92400e', marginTop: '2px' }}>{totalFat}g</div>
              <div style={{ fontSize: '10px', color: '#b45309' }}>{fatPct}%</div>
            </div>
          </div>
        </div>

        {/* 打卡按钮 */}
        <button
          onClick={handleSave}
          disabled={isSaved}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '14px',
            backgroundColor: isSaved ? '#f1f5f9' : '#10b981',
            color: isSaved ? '#64748b' : '#ffffff',
            border: isSaved ? '1px solid #cbd5e1' : 'none',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: isSaved ? 'default' : 'pointer',
            boxShadow: isSaved ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.25)'
          }}
        >
          {isSaved ? (
            <>
              <Check size={18} color="#10b981" />
              <span>已记录入今日饮食打卡</span>
            </>
          ) : (
            <>
              <Plus size={18} />
              <span>确认无误，记入今日饮食</span>
            </>
          )}
        </button>
      </div>

      {/* 食材明细与手动修改管理区 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        padding: '18px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              🍽️ 盘中食材明细（点击可修改/删除）
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--text-soft)' }}>若估算有出入，可直接点击修改克数与卡路里</span>
          </div>

          <button
            onClick={() => setIsAddingNew(true)}
            style={{
              border: 'none',
              background: 'var(--accent-surface)',
              color: '#15803d',
              padding: '6px 10px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer'
            }}
          >
            <PlusCircle size={14} />
            <span>添加遗漏</span>
          </button>
        </div>

        {/* 添加新食材表单 */}
        {isAddingNew && (
          <div style={{
            background: 'var(--bg-main)',
            border: '1px dashed #10b981',
            borderRadius: '14px',
            padding: '12px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)' }}>添加遗漏的食物/加餐：</div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
              <input
                type="text"
                placeholder="食物名称 (如米饭)"
                value={newFood.name}
                onChange={(e) => setNewFood({ ...newFood, name: e.target.value })}
                style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
              <input
                type="text"
                placeholder="分量 (如150g)"
                value={newFood.portion}
                onChange={(e) => setNewFood({ ...newFood, portion: e.target.value })}
                style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
              <input
                type="number"
                placeholder="热量 (kcal)"
                value={newFood.calories}
                onChange={(e) => setNewFood({ ...newFood, calories: e.target.value })}
                style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '12px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setIsAddingNew(false)}
                style={{ border: 'none', background: 'var(--surface-muted)', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                取消
              </button>
              <button
                onClick={handleAddFood}
                style={{ border: 'none', background: '#10b981', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
              >
                添加食材
              </button>
            </div>
          </div>
        )}

        {/* 食材列表 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {foods.map((food, idx) => (
            <div
              key={food.id || idx}
              style={{
                borderRadius: '12px',
                backgroundColor: editingIndex === idx ? '#f0fdf4' : '#f8fafc',
                border: editingIndex === idx ? '1px solid #86efac' : '1px solid #f1f5f9',
                padding: '10px 12px',
                transition: 'all 0.2s'
              }}
            >
              {editingIndex === idx ? (
                /* 行内编辑表单 */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px' }}>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={editForm.portion}
                      onChange={(e) => setEditForm({ ...editForm, portion: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    />
                    <input
                      type="number"
                      value={editForm.calories}
                      onChange={(e) => setEditForm({ ...editForm, calories: e.target.value })}
                      style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                    <button
                      onClick={() => setEditingIndex(null)}
                      style={{ border: 'none', background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleSaveEdit(idx)}
                      style={{ border: 'none', background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      保存修改
                    </button>
                  </div>
                </div>
              ) : (
                /* 正常展示行 */
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                      {food.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      分量: {food.portion}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#ef4444' }}>
                        {Math.round(food.calories * portionScale)} <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)' }}>kcal</span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-soft)' }}>
                        蛋{food.protein}g / 碳{food.carbs}g / 脂{food.fat}g
                      </div>
                    </div>

                    {/* 操作按钮：编辑与删除 */}
                    <button
                      onClick={() => handleStartEdit(idx)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-soft)', cursor: 'pointer', padding: '4px' }}
                      title="修改分量或热量"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      onClick={() => handleDeleteFood(idx)}
                      style={{ border: 'none', background: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: '4px' }}
                      title="删除此食材"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* AI 营养师建议 */}
      {result.healthComment && (
        <div style={{
          background: 'var(--bg-main)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          padding: '14px 16px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}>
          <MessageSquare size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-main)' }}>AI 营养师分析：</strong>
            {result.healthComment}
          </div>
        </div>
      )}
    </div>
  );
}
