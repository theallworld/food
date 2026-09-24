import React, { useState, useRef } from 'react';
import {
  Camera,
  Image as ImageIcon,
  Type,
  Sparkles,
  X,
  AlertCircle,
  ArrowRight,
  ShoppingBag,
  Flame,
  ChevronRight,
  Check,
  RotateCw,
  Info
} from 'lucide-react';
import NutritionReview from './NutritionReview';
import { compressImage, analyzeFoodWithDeepSeek, analyzeFoodTextWithDeepSeek } from '../../services/deepseek';
import { TAKEAWAY_PRESETS, COOKING_OIL_LEVELS } from '../../utils/foodDatabase';

export default function LogModal(props) {
  if (!props.isOpen) return null;
  return <OpenLogModal {...props} />;
}

function OpenLogModal({
  isOpen,
  initialMealType = 'lunch',
  settings,
  onSaveMeal,
  onClose
}) {
  // 严格执行技术决策：默认将【文字/口述】设为主输入模式，外卖点选为高频专用流，照片作为辅助记录
  const [mode, setMode] = useState('text'); // 'text' | 'takeaway' | 'camera'
  const [mealType, setMealType] = useState(initialMealType);
  const [textInput, setTextInput] = useState('');
  const [userNote, setUserNote] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);

  // 外卖点选流状态
  const [selectedTakeaway, setSelectedTakeaway] = useState(TAKEAWAY_PRESETS[0]);
  const [takeawaySize, setTakeawaySize] = useState('normal'); // 'small' | 'normal' | 'large'
  const [takeawayOil, setTakeawayOil] = useState('takeaway_standard');

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // 高频口述推荐胶囊
  const quickTextPrompts = [
    '一碗牛肉拉面加一个煎蛋微辣少油',
    '黄焖鸡米饭标准份加无糖可乐',
    '两根油条一碗热豆浆',
    '轻食鸡胸肉糙米沙拉',
    '番茄炒蛋盖浇饭米饭减半',
    '一份隆江猪脚饭少汁'
  ];

  // 1. 文字/口述自然语言解析（主输入流）
  const handleTextSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isLoading) return;

    setErrorMessage('');
    setIsLoading(true);
    try {
      const res = await analyzeFoodTextWithDeepSeek({
        textDescription: textInput.trim(),
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model
      });

      setAnalysisResult(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '文字解析遇到波动，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. 外卖快捷点选流：秒级生成结构化外卖卡片
  const handleConfirmTakeaway = () => {
    const sizeConfig = selectedTakeaway.sizes[takeawaySize] || selectedTakeaway.sizes.normal;
    const oilConfig = COOKING_OIL_LEVELS.find(o => o.id === takeawayOil) || COOKING_OIL_LEVELS[3];

    // 计算总热量与宏量营养素
    const baseCals = sizeConfig.baseCal;
    const oilDiff = oilConfig.cals - COOKING_OIL_LEVELS[3].cals; // 相对外卖基准的增减
    const finalCals = Math.max(200, baseCals + oilDiff);

    // 结构化食材拆解（使用菜品专属宏量比例，确保蛋白/脂肪/碳水符合实际菜品特征）
    const ratio = selectedTakeaway.macroRatio || { pro: 0.22, fat: 0.35, carb: 0.43 };
    const foods = [
      {
        id: `takeaway-main-${Date.now()}`,
        name: selectedTakeaway.title,
        portion: `${sizeConfig.label} (约${sizeConfig.grams}克)`,
        grams: sizeConfig.grams,
        baseGrams: sizeConfig.grams,
        calories: finalCals,
        protein: Math.round(finalCals * ratio.pro / 4),
        fat: Math.round(finalCals * ratio.fat / 9),
        carbs: Math.round(finalCals * ratio.carb / 4)
      }
    ];


    setAnalysisResult({
      dishName: selectedTakeaway.title,
      isFood: true,
      totalCalories: finalCals,
      totalProtein: foods[0].protein,
      totalFat: foods[0].fat,
      totalCarbs: foods[0].carbs,
      foods,
      healthComment: `外卖典型菜品。已按【${sizeConfig.label}】与【${oilConfig.label}】自动换算，可根据实际进食微调。`,
      cookingOil: takeawayOil
    });
  };

  // 3. 拍照/选图辅助记录
  const handleImageFile = async (file) => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const { base64, dataUrl } = await compressImage(file);
      setPreviewImage(dataUrl);

      const res = await analyzeFoodWithDeepSeek({
        imageBase64: base64,
        apiKey: settings.apiKey,
        userNote,
        baseUrl: settings.baseUrl,
        model: settings.model
      });

      setAnalysisResult(res);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || '识别遇到波动，请重试或改用口述输入');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNutrition = (finalData) => {
    onSaveMeal(finalData);
    onClose();
  };

  return (
    <div className="log-modal-backdrop" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div className={`log-modal-sheet${analysisResult ? ' log-modal-sheet-review' : ''}`} style={{
        background: 'var(--surface)',
        width: '100%',
        maxWidth: '480px',
        borderTopLeftRadius: '28px',
        borderTopRightRadius: '28px',
        padding: '20px 20px 32px 20px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.1)',
        position: 'relative'
      }}>
        {/* 如果已有分析结果，展示核对面板 */}
        {analysisResult ? (
          <NutritionReview
            result={analysisResult}
            mealType={mealType}
            previewImage={previewImage}
            settings={settings}
            onSave={handleSaveNutrition}
            onCancel={() => {
              setAnalysisResult(null);
              setPreviewImage(null);
            }}
          />
        ) : (
          <div>
            {/* 顶部标题与关闭 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', letterSpacing: '0.04em' }}>
                  FUD NUTRITION · 科学记餐
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)' }}>
                  记录今日进食
                </h2>
              </div>
              <button
                onClick={onClose}
                style={{ border: 'none', background: 'var(--surface-muted)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* 隐藏的 File Inputs */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={cameraInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />
            <input
              type="file"
              accept="image/*"
              ref={galleryInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files?.[0] && handleImageFile(e.target.files[0])}
            />

            {/* 核心模式切换器：口述为主、外卖点选、实拍辅助 */}
            <div style={{
              display: 'flex',
              background: 'var(--surface-muted)',
              padding: '4px',
              borderRadius: '16px',
              marginBottom: '16px'
            }}>
              <button
                onClick={() => setMode('text')}
                style={{
                  flex: 1.2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'text' ? '800' : '600',
                  backgroundColor: mode === 'text' ? '#ffffff' : 'transparent',
                  color: mode === 'text' ? '#0f172a' : '#64748b',
                  boxShadow: mode === 'text' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Type size={16} color={mode === 'text' ? '#10b981' : '#64748b'} />
                <span>口述/文字</span>
              </button>

              <button
                onClick={() => setMode('takeaway')}
                style={{
                  flex: 1.1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'takeaway' ? '800' : '600',
                  backgroundColor: mode === 'takeaway' ? '#ffffff' : 'transparent',
                  color: mode === 'takeaway' ? '#0f172a' : '#64748b',
                  boxShadow: mode === 'takeaway' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <ShoppingBag size={16} color={mode === 'takeaway' ? '#f59e0b' : '#64748b'} />
                <span>外卖快选</span>
              </button>

              <button
                onClick={() => setMode('camera')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 0',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'camera' ? '800' : '600',
                  backgroundColor: mode === 'camera' ? '#ffffff' : 'transparent',
                  color: mode === 'camera' ? '#0f172a' : '#64748b',
                  boxShadow: mode === 'camera' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <Camera size={16} color={mode === 'camera' ? '#3b82f6' : '#64748b'} />
                <span>实拍存档</span>
              </button>
            </div>

            {/* 错误提示 */}
            {errorMessage && (
              <div style={{
                background: 'var(--danger-surface)',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '14px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 模式 1：口述 / 文字自然语言智能记餐（主输入模式） */}
            {mode === 'text' && (
              <form onSubmit={handleTextSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ position: 'relative' }}>
                  <textarea
                    rows={3}
                    placeholder="输入或口述今天吃了什么...&#10;如：中午一碗牛肉拉面加一个煎蛋微辣少油"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '16px',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      outline: 'none',
                      resize: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={12} color="#10b981" />
                    <span>遵循决策：大模型仅负责实体抽取，卡路里由国家成分表查表换算</span>
                  </div>
                </div>

                {/* 快捷示例 */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>常见快记搭配：</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {quickTextPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setTextInput(prompt);
                        }}
                        style={{
                          background: 'var(--bg-main)',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          border: '1px solid var(--border-color)'
                        }}
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !textInput.trim()}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: isLoading || !textInput.trim() ? '#94a3b8' : '#10b981',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '15px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: isLoading || !textInput.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.25)'
                  }}
                >
                  {isLoading ? (
                    <>
                      <RotateCw size={18} className="animate-spin" />
                      <span>正在结构化查表测算...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>结构化解析并计算能量</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* 模式 2：外卖快选点选流（解决外卖大变量） */}
            {mode === 'takeaway' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '11px', color: '#b45309', background: 'var(--warning-surface)', padding: '8px 12px', borderRadius: '10px' }}>
                  🥡 <b>外卖场景特化</b>：实测一份外卖达 1000~2200 kcal。点选份量与油量，消除 50% 核心误差。
                </div>

                {/* 常见外卖菜品列表 */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>
                    选择外卖菜品：
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                    {TAKEAWAY_PRESETS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedTakeaway(item)}
                        style={{
                          textAlign: 'left',
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: selectedTakeaway.id === item.id ? '2px solid #10b981' : '1px solid #e2e8f0',
                          background: selectedTakeaway.id === item.id ? '#f0fdf4' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)' }}>{item.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.category}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 份量规格选择 */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    份量规格：
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.entries(selectedTakeaway.sizes).map(([key, config]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setTakeawaySize(key)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '10px',
                          border: takeawaySize === key ? '1.5px solid #10b981' : '1px solid #e2e8f0',
                          background: takeawaySize === key ? '#f0fdf4' : '#ffffff',
                          color: takeawaySize === key ? '#047857' : '#475569',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {config.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 用油程度选择（最大变量） */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '6px' }}>
                    烹饪用油档位（决定性变量）：
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {[
                      { id: 'home_light', label: '轻油少汁' },
                      { id: 'takeaway_standard', label: '标准外卖宽油' },
                      { id: 'takeaway_heavy', label: '重油/干锅油炸' }
                    ].map(oil => (
                      <button
                        key={oil.id}
                        type="button"
                        onClick={() => setTakeawayOil(oil.id)}
                        style={{
                          padding: '7px 4px',
                          borderRadius: '8px',
                          border: takeawayOil === oil.id ? '1.5px solid #f59e0b' : '1px solid #e2e8f0',
                          background: takeawayOil === oil.id ? '#fffbeb' : '#ffffff',
                          color: takeawayOil === oil.id ? '#b45309' : '#64748b',
                          fontSize: '11px',
                          fontWeight: '700',
                          cursor: 'pointer'
                        }}
                      >
                        {oil.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 载入外卖单按钮 */}
                <button
                  type="button"
                  onClick={handleConfirmTakeaway}
                  style={{
                    padding: '13px',
                    borderRadius: '16px',
                    background: '#0f172a',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                  }}
                >
                  <Check size={16} />
                  <span>确定载入并核对成分</span>
                </button>
              </div>
            )}

            {/* 模式 3：实拍辅助存档与容器锚定 */}
            {mode === 'camera' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{
                  background: 'var(--bg-main)',
                  border: '1px dashed var(--border-color)',
                  borderRadius: '16px',
                  padding: '16px',
                  textAlign: 'center'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '14px',
                        background: '#10b981',
                        color: '#ffffff',
                        border: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <Camera size={24} />
                      <span>打开相机实拍</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      style={{
                        flex: 1,
                        padding: '14px',
                        borderRadius: '14px',
                        background: 'var(--surface)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '700'
                      }}
                    >
                      <ImageIcon size={24} color="#64748b" />
                      <span>从相册选择</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.5, textAlign: 'left' }}>
                    <b>💡 科学说明</b>：实测照片由于透视与隐藏烹饪油，误差约为 33~55%。拍照主要用于日记存根与容器刻度校准，建议拍照后在下一步核对中确认具体用油与克重。
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
