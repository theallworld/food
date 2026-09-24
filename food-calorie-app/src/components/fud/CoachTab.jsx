import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Flame, RefreshCw } from 'lucide-react';
import { askAICoachWithDeepSeek } from '../../services/deepseek';

const CHAT_STORAGE_KEY = 'food_ai_coach_messages';
const INITIAL_MESSAGE = {
  role: 'assistant',
  content: '你好！我是你的专属 AI 私人营养教练。我已经同步了你今天的饮食数据与身体目标，无论是想咨询晚餐推荐、蛋白质补充、还是减脂调整，随时问我！'
};

function loadSavedMessages() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) || 'null');
    if (Array.isArray(saved) && saved.length > 0 && saved.every(message =>
      (message?.role === 'user' || message?.role === 'assistant') && typeof message.content === 'string'
    )) return saved;
  } catch { /* Ignore malformed or unavailable local storage. */ }
  return [INITIAL_MESSAGE];
}

function saveMessages(messages) {
  try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)); }
  catch (error) { console.warn('AI 聊天记录无法保存到本机', error); }
}

export default function CoachTab({
  todayMeals = [],
  targetCalories = 2000,
  targetMacros = { protein: 130, carbs: 220, fat: 65 },
  settings,
  userProfile = {}
}) {
  const [messages, setMessages] = useState(loadSavedMessages);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef(null);

  // 统计今日实时数据
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
  const remainingCalories = Math.max(0, targetCalories - totalCalories);
  const totalProtein = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalProtein || 0), 0) * 10) / 10;
  const totalCarbs = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalCarbs || 0), 0) * 10) / 10;
  const totalFat = Math.round(todayMeals.reduce((sum, m) => sum + (m.totalFat || 0), 0) * 10) / 10;

  const mealsSummary = todayMeals.map(m => `${m.dishName || '餐食'}(${m.totalCalories}kcal)`).join('、');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputVal).trim();
    if (!text || isThinking) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    saveMessages(newMessages);
    setMessages(newMessages);
    setInputVal('');
    setIsThinking(true);

    try {
      const todayContext = {
        targetCalories,
        totalCalories,
        remainingCalories,
        targetProtein: targetMacros.protein,
        totalProtein,
        targetCarbs: targetMacros.carbs,
        totalCarbs,
        targetFat: targetMacros.fat,
        totalFat,
        mealsSummary,
        userProfile
      };

      const reply = await askAICoachWithDeepSeek({
        messages: newMessages.slice(-6), // 保留最近上下文
        todayContext,
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
        model: settings.model
      });

      const completedMessages = [...newMessages, { role: 'assistant', content: reply }];
      saveMessages(completedMessages);
      setMessages(completedMessages);
    } catch (err) {
      console.error(err);
      const failedMessages = [...newMessages, { role: 'assistant', content: `教练暂时掉线了: ${err.message || '请检查网络'}` }];
      saveMessages(failedMessages);
      setMessages(failedMessages);
    } finally {
      setIsThinking(false);
    }
  };

  const quickPrompts = [
    '我今天的蛋白质摄入达标了吗？',
    `还剩 ${remainingCalories} 大卡，晚餐建议吃什么？`,
    '分析一下我今天的三餐搭配健不健康',
    '今天如果想吃一顿宵夜怎么选择低卡的？'
  ];

  return (
    <div className="screen-enter" style={{ padding: '16px 16px 90px 16px', display: 'flex', flexDirection: 'column', height: '100vh', boxSizing: 'border-box' }}>
      {/* 顶部教练状态与今日饮食缩影 */}
      <div style={{
        background: 'var(--surface)',
        borderRadius: '20px',
        border: '1px solid var(--border-color)',
        padding: '14px 16px',
        marginBottom: '12px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Bot size={22} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-main)' }}>Fud AI 营养私教</div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>● 已同步今日饮食档案</div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-main)' }}>{totalCalories} / {targetCalories} kcal</div>
            <div style={{ fontSize: '10px', color: 'var(--text-soft)' }}>蛋白 {totalProtein}/{targetMacros.protein}g</div>
          </div>
        </div>
      </div>

      {/* 聊天消息滚动区 */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '8px'
            }}
          >
            {m.role === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: '2px' }}>
                <Bot size={16} />
              </div>
            )}

            <div style={{
              maxWidth: '82%',
              padding: '12px 14px',
              borderRadius: '18px',
              fontSize: '13px',
              lineHeight: 1.6,
              background: m.role === 'user' ? '#10b981' : '#ffffff',
              color: m.role === 'user' ? '#ffffff' : '#1e293b',
              border: m.role === 'user' ? 'none' : '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
              whiteSpace: 'pre-wrap'
            }}>
              {m.content}
            </div>

            {m.role === 'user' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: '2px' }}>
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-soft)', fontSize: '12px', paddingLeft: '36px' }}>
            <div style={{ width: '16px', height: '16px', border: '2px solid var(--border-color)', borderTopColor: '#10b981', borderRadius: '50%' }} className="animate-spin" />
            <span>教练正在阅读你的饮食数据并思考建议...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 快捷推荐提问胶囊 */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            style={{
              flexShrink: 0,
              border: '1px solid var(--border-color)',
              background: 'var(--surface)',
              padding: '6px 10px',
              borderRadius: '16px',
              fontSize: '11px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 输入框 */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="问问 AI 营养师..."
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{
            flex: 1,
            padding: '12px 14px',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            fontSize: '14px',
            outline: 'none',
            background: 'var(--surface)'
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputVal.trim() || isThinking}
          style={{
            border: 'none',
            background: inputVal.trim() && !isThinking ? '#10b981' : '#cbd5e1',
            color: '#fff',
            width: '46px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputVal.trim() && !isThinking ? 'pointer' : 'default'
          }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
