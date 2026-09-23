/**
 * 营养学核心测算工具 (基于国际公认 Mifflin-St Jeor 权威公式)
 */

export const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: '久坐不动', desc: '办公室工作，极少或无运动', multiplier: 1.2 },
  { id: 'light', label: '轻度运动', desc: '每周运动 1-3 天', multiplier: 1.375 },
  { id: 'moderate', label: '中度运动', desc: '每周运动 3-5 天', multiplier: 1.55 },
  { id: 'active', label: '高强运动', desc: '每周高强度训练 6-7 天', multiplier: 1.725 },
  { id: 'extra', label: '重度体力', desc: '重体力劳动或专业运动员', multiplier: 1.9 }
];

export const GOALS = [
  { id: 'lose', label: '减脂瘦身', desc: '健康温和缺口 -400 kcal/天', adjustment: -400 },
  { id: 'maintain', label: '保持体重', desc: '摄入平衡，维持活力', adjustment: 0 },
  { id: 'gain', label: '增肌塑形', desc: '温和能量盈余 +350 kcal/天', adjustment: 350 }
];

/**
 * 计算 BMI
 */
export function calculateBMI(heightCm, weightKg) {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return { bmi: 0, status: '未知', color: '#64748b' };
  const heightM = heightCm / 100;
  const bmi = Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  
  let status = '正常';
  let color = '#10b981';
  if (bmi < 18.5) {
    status = '偏瘦';
    color = '#3b82f6';
  } else if (bmi >= 24 && bmi < 28) {
    status = '超重';
    color = '#f59e0b';
  } else if (bmi >= 28) {
    status = '肥胖';
    color = '#ef4444';
  }
  return { bmi, status, color };
}

/**
 * 计算基础代谢率 (BMR) - Mifflin-St Jeor 公式
 * 男: 10 * 体重(kg) + 6.25 * 身高(cm) - 5 * 年龄 + 5
 * 女: 10 * 体重(kg) + 6.25 * 身高(cm) - 5 * 年龄 - 161
 */
export function calculateBMR({ gender = 'male', age = 28, height = 175, weight = 70 }) {
  const w = Number(weight) || 70;
  const h = Number(height) || 175;
  const a = Number(age) || 28;

  let bmr = 10 * w + 6.25 * h - 5 * a;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5;
  }
  return Math.round(bmr);
}

/**
 * 计算每日总能量消耗 (TDEE)
 */
export function calculateTDEE(bmr, activityLevel = 'light') {
  const level = ACTIVITY_LEVELS.find(l => l.id === activityLevel) || ACTIVITY_LEVELS[1];
  return Math.round(bmr * level.multiplier);
}

/**
 * 计算推荐每日热量预算与三大宏量营养素 (碳水、蛋白质、脂肪)
 */
export function calculateDietPlan(profile) {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel || 'light');
  const goalObj = GOALS.find(g => g.id === (profile.goal || 'lose')) || GOALS[0];
  
  // 推荐热量：不能低于女性 1200 / 男性 1400 的安全生理底线
  const minSafe = profile.gender === 'female' ? 1200 : 1400;
  let targetCalories = Math.max(minSafe, tdee + goalObj.adjustment);
  targetCalories = Math.round(targetCalories / 10) * 10; // 取整到十位

  const weight = Number(profile.weight) || 70;

  // 蛋白质分配：减脂 1.8~2.0g/kg，增肌 2.0g/kg，维持 1.4~1.6g/kg
  let proteinPerKg = 1.6;
  if (profile.goal === 'lose') proteinPerKg = 1.8;
  else if (profile.goal === 'gain') proteinPerKg = 2.0;
  else proteinPerKg = 1.5;

  const proteinGrams = Math.round(weight * proteinPerKg);
  const proteinCals = proteinGrams * 4;

  // 脂肪分配：占总热量约 25%~30% (健康内分泌与脂溶性维生素必需，9 kcal/g)
  const fatCalories = targetCalories * 0.28;
  const fatGrams = Math.round(fatCalories / 9);

  // 碳水分配：剩余热量由碳水化合物补足 (4 kcal/g)
  const remainingCals = Math.max(0, targetCalories - proteinCals - (fatGrams * 9));
  const carbsGrams = Math.round(remainingCals / 4);

  return {
    bmr,
    tdee,
    targetCalories,
    macros: {
      protein: proteinGrams,
      carbs: carbsGrams,
      fat: fatGrams
    }
  };
}

/**
 * 从份量描述文本中提取克数数值
 * 例如："约150克" -> 150，"200g" -> 200，"半碗 (120克)" -> 120
 */
export function parseGrams(portionStr) {
  if (typeof portionStr === 'number') return Math.max(1, Math.round(portionStr));
  if (!portionStr) return 100;
  
  // 匹配千克/kg
  const kgMatch = String(portionStr).match(/(\d+(?:\.\d+)?)\s*(?:千克|kg|公斤)/i);
  if (kgMatch) return Math.round(parseFloat(kgMatch[1]) * 1000);
  
  // 匹配克/g/毫升/ml
  const gramMatch = String(portionStr).match(/(\d+(?:\.\d+)?)\s*(?:克|g|毫升|ml)/i);
  if (gramMatch) return Math.round(parseFloat(gramMatch[1]));
  
  // 纯数字匹配
  const numMatch = String(portionStr).match(/(\d+(?:\.\d+)?)/);
  if (numMatch) return Math.round(parseFloat(numMatch[1]));
  
  return 100;
}

// 常见中国日常食材每 100g 权威营养成分标准库 (兜底/秒级快速推算)
const COMMON_FOOD_DB = [
  { keywords: ['米饭', '大米饭', '白饭'], per100g: { cal: 116, pro: 2.6, fat: 0.3, carb: 25.9 } },
  { keywords: ['面条', '拉面', '挂面', '米粉'], per100g: { cal: 138, pro: 4.5, fat: 0.5, carb: 28.5 } },
  { keywords: ['馒头', '包子', '花卷'], per100g: { cal: 223, pro: 7.0, fat: 1.1, carb: 47.0 } },
  { keywords: ['鸡蛋', '水煮蛋', '荷包蛋', '煎蛋'], per100g: { cal: 143, pro: 12.6, fat: 9.5, carb: 1.5 } },
  { keywords: ['鸡胸肉', '鸡胸', '鸡肉'], per100g: { cal: 133, pro: 31.0, fat: 2.5, carb: 0.0 } },
  { keywords: ['牛肉', '牛腩', '牛排'], per100g: { cal: 180, pro: 26.0, fat: 8.0, carb: 0.0 } },
  { keywords: ['猪肉', '瘦肉', '里脊'], per100g: { cal: 143, pro: 20.3, fat: 6.2, carb: 1.5 } },
  { keywords: ['虾', '虾仁', '基围虾'], per100g: { cal: 93, pro: 18.0, fat: 1.0, carb: 2.0 } },
  { keywords: ['鱼', '三文鱼', '罗非鱼', '鲈鱼'], per100g: { cal: 120, pro: 20.0, fat: 4.5, carb: 0.0 } },
  { keywords: ['西兰花', '花椰菜'], per100g: { cal: 34, pro: 2.8, fat: 0.4, carb: 4.7 } },
  { keywords: ['生菜', '青菜', '菠菜', '油麦菜'], per100g: { cal: 20, pro: 1.8, fat: 0.3, carb: 3.2 } },
  { keywords: ['西红柿', '番茄'], per100g: { cal: 19, pro: 0.9, fat: 0.2, carb: 3.5 } },
  { keywords: ['苹果'], per100g: { cal: 52, pro: 0.3, fat: 0.2, carb: 13.8 } },
  { keywords: ['香蕉'], per100g: { cal: 89, pro: 1.1, fat: 0.3, carb: 22.8 } },
  { keywords: ['牛奶', '纯牛奶'], per100g: { cal: 54, pro: 3.0, fat: 3.2, carb: 4.7 } },
  { keywords: ['豆浆'], per100g: { cal: 31, pro: 3.0, fat: 1.6, carb: 1.2 } },
  { keywords: ['豆腐'], per100g: { cal: 81, pro: 8.1, fat: 3.7, carb: 3.8 } },
  { keywords: ['燕麦', '燕麦片'], per100g: { cal: 367, pro: 15.0, fat: 6.7, carb: 61.6 } },
  { keywords: ['红薯', '地瓜'], per100g: { cal: 86, pro: 1.6, fat: 0.2, carb: 20.1 } },
  { keywords: ['玉米'], per100g: { cal: 112, pro: 4.0, fat: 1.2, carb: 22.8 } },
  { keywords: ['油条'], per100g: { cal: 386, pro: 6.9, fat: 17.6, carb: 51.0 } }
];

/**
 * 根据食材名称和克数快速推导热量与三大营养素
 */
export function estimateNutritionFromCommonDB(foodName, grams = 100) {
  const g = Number(grams) || 100;
  const name = String(foodName || '').trim().toLowerCase();
  
  let match = COMMON_FOOD_DB.find(item => item.keywords.some(k => name.includes(k)));
  
  // 默认泛用基底（每100g 约 120kcal，6g蛋白，4g脂肪，15g碳水）
  const base = match ? match.per100g : { cal: 120, pro: 6, fat: 4, carb: 15 };
  const ratio = g / 100;
  
  return {
    calories: Math.round(base.cal * ratio),
    protein: Math.round(base.pro * ratio * 10) / 10,
    fat: Math.round(base.fat * ratio * 10) / 10,
    carbs: Math.round(base.carb * ratio * 10) / 10
  };
}

/**
 * 格式化餐食与食物标题：使用顿号或空格清晰隔开多个食物
 * 例如："麻婆豆腐青椒肉丝配无糖可乐" -> "麻婆豆腐、青椒肉丝、无糖可乐"
 */
export function formatMealTitle(dishName = '', foods = []) {
  if (!dishName && (!foods || foods.length === 0)) return '餐食记录';

  // 1. 如果有食材明细数组且包含多个食材
  if (foods && Array.isArray(foods) && foods.length > 1) {
    const foodNames = foods.map(f => (f.name || '').trim()).filter(Boolean);
    if (foodNames.length > 1) {
      // 只要有2个以上食材名称出现在 dishName 中，或者 dishName 为空/通用名，直接用顿号连接各食材名
      const matchCount = foodNames.filter(name => name.length >= 2 && dishName.includes(name)).length;
      if (matchCount >= 2 || !dishName || dishName === '餐食记录') {
        return foodNames.join('、');
      }
    }
  }

  let formatted = (dishName || '').trim();

  // 2. 处理常见连词（配、加、和、与、+、空格、逗号），统一转换为美观清晰的顿号（、）
  formatted = formatted
    .replace(/(?<=.)(?:配|加|和|与|\+)(?=.+)/g, '、')
    .replace(/[\s\+,，;；]+/g, '、')
    .replace(/、+/g, '、')
    .replace(/^、|、$/g, '');

  return formatted || dishName || '餐食记录';
}


