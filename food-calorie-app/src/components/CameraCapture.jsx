import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Sparkles, RefreshCw, AlertCircle, Edit3 } from 'lucide-react';

export default function CameraCapture({
  onImageSelected,
  isLoading,
  previewImage,
  onReset,
  errorMessage,
  hasApiKey,
  onOpenSettings
}) {
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [userNote, setUserNote] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file, userNote);
    }
  };

  const sampleMeals = [
    {
      title: '减脂鸡胸沙拉',
      note: '无沙拉酱，纯橄榄油醋汁',
      url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: '健康三文鱼谷物碗',
      note: '底下有约100克糙米饭',
      url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80'
    },
    {
      title: '番茄牛腩面',
      note: '汤喝了一半，面条正常分量',
      url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80'
    }
  ];

  const handleSelectSample = async (sample) => {
    try {
      const res = await fetch(sample.url);
      const blob = await res.blob();
      const file = new File([blob], 'sample.jpg', { type: 'image/jpeg' });
      onImageSelected(file, userNote || sample.note);
    } catch (err) {
      console.error('Failed to load sample image', err);
    }
  };

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={cameraInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <input
        type="file"
        accept="image/*"
        ref={galleryInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {!hasApiKey && (
        <div
          onClick={onOpenSettings}
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--warning-surface)',
            border: '1px solid #fde68a',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontSize: '13px' }}>
            <AlertCircle size={16} />
            <span>尚未填入 DeepSeek API Key，点击立即配置</span>
          </div>
          <span style={{ fontSize: '12px', fontWeight: '600', color: '#d97706' }}>去设置 →</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'var(--danger-surface)',
          border: '1px solid #fecaca',
          borderRadius: '14px',
          color: '#b91c1c',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {previewImage ? (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '260px',
          borderRadius: '20px',
          overflow: 'hidden',
          backgroundColor: '#0f172a',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }}>
          <img
            src={previewImage}
            alt="餐食照片"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isLoading ? 'brightness(0.6)' : 'none',
              transition: 'filter 0.3s'
            }}
          />

          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              gap: '12px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '44px',
                height: '44px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: '#10b981',
                borderRadius: '50%'
              }} className="animate-spin" />
              <div style={{ fontWeight: '600', fontSize: '15px' }}>
                AI 正在极速计算热量...
              </div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>
                正在由 DeepSeek 分析食材组成与营养配比
              </div>
            </div>
          )}

          {!isLoading && (
            <button
              onClick={onReset}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                padding: '8px 12px',
                borderRadius: '20px',
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>重新拍摄</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{
          border: '2px dashed var(--border-color)',
          borderRadius: '24px',
          padding: '28px 18px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          textAlign: 'center'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-surface)',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Camera size={28} />
          </div>

          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
            拍摄或上传餐盘
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '280px', marginBottom: '16px' }}>
            可拍入餐具/手掌作为比例尺，识别更准
          </p>

          {/* 辅助补充说明输入框（大幅提升准确度） */}
          <div style={{ width: '100%', maxWidth: '340px', marginBottom: '16px', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <Edit3 size={13} color="#10b981" />
              <span>给 AI 的补充小提示（可选，精准度翻倍）：</span>
            </div>
            <input
              type="text"
              placeholder="例如：少油炒、底下有半碗米饭、去皮鸡腿..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                fontSize: '13px',
                outline: 'none',
                backgroundColor: 'var(--surface)'
              }}
            />
          </div>

          {/* 拍照与相册按钮 */}
          <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '340px' }}>
            <button
              onClick={() => cameraInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '13px 16px',
                borderRadius: '14px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                border: 'none',
                fontWeight: '600',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
              }}
            >
              <Camera size={18} />
              <span>拍照测热量</span>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              style={{
                padding: '13px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontWeight: '600',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer'
              }}
            >
              <ImageIcon size={18} color="#64748b" />
              <span>相册</span>
            </button>
          </div>
        </div>
      )}

      {!previewImage && (
        <div style={{ marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <Sparkles size={14} color="#f59e0b" />
            <span>无餐食在手？点击直接测试样例：</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {sampleMeals.map((sample, idx) => (
              <div
                key={idx}
                onClick={() => handleSelectSample(sample)}
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--surface)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  textAlign: 'center'
                }}
              >
                <img
                  src={sample.url}
                  alt={sample.title}
                  style={{ width: '100%', height: '65px', objectFit: 'cover' }}
                />
                <div style={{ padding: '6px 4px', fontSize: '11px', fontWeight: '500', color: 'var(--text-secondary)' }}>
                  {sample.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
