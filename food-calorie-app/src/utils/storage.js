/**
 * 本地持久化存储引擎 (IndexedDB + 自动平滑回退)
 * 支持图片无损压缩存储、多日按日期归档与历史查询
 */

const DB_NAME = 'FoodCalorieAppDB';
const DB_VERSION = 1;
const MEALS_STORE = 'meals';
const PROFILE_STORE = 'profiles';

// 工具：获取 YYYY-MM-DD 格式日期字符串
export function getTodayDateString(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 格式化日期为友好显示，例如 "9月23日 周三"
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  const todayStr = getTodayDateString(today);

  const daysOfWeek = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekDay = daysOfWeek[target.getDay()];

  if (dateStr === todayStr) {
    return `${m}月${d}日 今天 · ${weekDay}`;
  }

  // 计算是否是昨天
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (dateStr === getTodayDateString(yesterday)) {
    return `${m}月${d}日 昨天 · ${weekDay}`;
  }

  return `${m}月${d}日 · ${weekDay}`;
}

// 图片压缩函数：将大图缩放至合适尺寸 (max 800px) 并以 JPEG 0.72 压缩，避免撑爆内存与存储
export async function compressImage(imageDataUrl, maxDimension = 800, quality = 0.72) {
  if (!imageDataUrl || !imageDataUrl.startsWith('data:image')) {
    return imageDataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

// 打开并初始化 IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(MEALS_STORE)) {
        const mealStore = db.createObjectStore(MEALS_STORE, { keyPath: 'id' });
        mealStore.createIndex('date', 'date', { unique: false });
      }
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => {
      console.warn('IndexedDB 打开失败，回退使用 LocalStorage:', e);
      resolve(null);
    };
  });
}

/**
 * 获取指定日期的所有进食记录
 */
export async function getMealsByDate(dateStr) {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEALS_STORE], 'readonly');
        const store = tx.objectStore(MEALS_STORE);
        const index = store.index('date');
        const req = index.getAll(dateStr);
        req.onsuccess = () => {
          const list = req.result || [];
          // 按时间降序排序
          list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          resolve(list);
        };
        req.onerror = () => resolve(fallbackGetMeals(dateStr));
      } catch (err) {
        resolve(fallbackGetMeals(dateStr));
      }
    });
  }
  return fallbackGetMeals(dateStr);
}

/**
 * 保存一条进食记录
 */
export async function saveMealRecord(meal, dateStr = getTodayDateString()) {
  // 确保图片经过压缩
  let processedImage = meal.image;
  if (processedImage) {
    try {
      processedImage = await compressImage(processedImage);
    } catch (e) {
      console.warn('图片压缩失败，使用原图', e);
    }
  }

  const record = {
    ...meal,
    id: meal.id || `meal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    date: dateStr,
    timestamp: meal.timestamp || Date.now(),
    image: processedImage
  };

  const db = await openDB();
  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction([MEALS_STORE], 'readwrite');
        const store = tx.objectStore(MEALS_STORE);
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = () => {
          fallbackSaveMeal(record, dateStr);
          resolve(record);
        };
      } catch (err) {
        fallbackSaveMeal(record, dateStr);
        resolve(record);
      }
    });
  }

  fallbackSaveMeal(record, dateStr);
  return record;
}

/**
 * 删除单条进食记录
 */
export async function deleteMealRecord(mealId, dateStr) {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEALS_STORE], 'readwrite');
        const store = tx.objectStore(MEALS_STORE);
        const req = store.delete(mealId);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }
  fallbackDeleteMeal(mealId, dateStr);
  return true;
}

/**
 * 清空指定日期的所有记录
 */
export async function clearMealsByDate(dateStr) {
  const db = await openDB();
  if (db) {
    const list = await getMealsByDate(dateStr);
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEALS_STORE], 'readwrite');
        const store = tx.objectStore(MEALS_STORE);
        list.forEach((m) => store.delete(m.id));
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      } catch (err) {
        resolve(false);
      }
    });
  }
  fallbackClearMeals(dateStr);
  return true;
}

/**
 * 获取所有有记录的历史日期列表 (格式 ['2026-09-23', '2026-09-22', ...])
 */
export async function getAllLoggedDates() {
  const db = await openDB();
  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([MEALS_STORE], 'readonly');
        const store = tx.objectStore(MEALS_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          const datesSet = new Set(list.map((m) => m.date).filter(Boolean));
          const sorted = Array.from(datesSet).sort().reverse();
          resolve(sorted);
        };
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }
  return [];
}

// ----------------- LocalStorage 兜底处理 -----------------

function getStorageKey(dateStr) {
  return `fud_meals_${dateStr}`;
}

function fallbackGetMeals(dateStr) {
  try {
    const raw = localStorage.getItem(getStorageKey(dateStr));
    if (raw) return JSON.parse(raw);
    // 兼容之前 demo 的今天键
    if (dateStr === getTodayDateString()) {
      const oldRaw = localStorage.getItem('fud_today_meals');
      if (oldRaw) return JSON.parse(oldRaw);
    }
  } catch (e) {
    console.error(e);
  }
  return [];
}

function fallbackSaveMeal(record, dateStr) {
  try {
    const list = fallbackGetMeals(dateStr);
    const existingIndex = list.findIndex((m) => m.id === record.id);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
    } else {
      list.unshift(record);
    }
    localStorage.setItem(getStorageKey(dateStr), JSON.stringify(list));
  } catch (e) {
    console.warn('LocalStorage 写入失败 (可能超出配额):', e);
  }
}

function fallbackDeleteMeal(mealId, dateStr) {
  try {
    const list = fallbackGetMeals(dateStr).filter((m) => m.id !== mealId);
    localStorage.setItem(getStorageKey(dateStr), JSON.stringify(list));
  } catch (e) {}
}

function fallbackClearMeals(dateStr) {
  try {
    localStorage.removeItem(getStorageKey(dateStr));
    if (dateStr === getTodayDateString()) {
      localStorage.removeItem('fud_today_meals');
    }
  } catch (e) {}
}

// ----------------- 用户身体档案存储 -----------------

const PROFILE_KEY = 'fud_user_body_profile';

export function getUserProfile() {
  try {
    const saved = localStorage.getItem(PROFILE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  // 默认初始档案 (标准健康模板)
  return {
    gender: 'male',
    age: 26,
    height: 175,
    weight: 70,
    activityLevel: 'light',
    goal: 'lose'
  };
}

export function saveUserProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error(e);
  }
}
