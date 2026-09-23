/**
 * 权威中国食物成分库与外卖烹饪用油校准引擎
 * 严格遵循技术决策：大模型不输出数值，数值由权威查表与用油参数化模型换算
 */

// 1. 烹饪用油梯度档位模型（解决中餐/外卖脂肪与热量最大变量）
export const COOKING_OIL_LEVELS = [
  { id: 'boiled', label: '水煮/清蒸/凉拌', desc: '无油或微量油', oilGrams: 2, cals: 18 },
  { id: 'home_light', label: '家常清淡少油', desc: '微量润锅翻炒', oilGrams: 8, cals: 72 },
  { id: 'home_normal', label: '家常正常炒菜', desc: '家庭标准用油', oilGrams: 14, cals: 126 },
  { id: 'takeaway_standard', label: '外卖商用标准', desc: '商用灶出餐宽油', oilGrams: 25, cals: 225 },
  { id: 'takeaway_heavy', label: '重油/干锅/油炸/红烧', desc: '重油浸润/复炸裹油', oilGrams: 38, cals: 342 }
];

// 2. 日常量词到标准克重（熟重）的转换基准
export const UNIT_GRAM_MAP = {
  '平碗': 150,
  '碗': 180,
  '大碗': 260,
  '小半碗': 80,
  '份': 150,
  '小份': 100,
  '大份': 250,
  '个': 50, // 鸡蛋基准
  '根': 60, // 油条基准
  '杯': 250, // 毫升/克
  '盒': 250,
  '勺': 10,
  '片': 35,
  '块': 80,
  '把': 50,
  '两': 50,
  '斤': 500
};

// 3. 权威食材级标准成分库（每 100g 食用部分）
export const INGREDIENT_DB = [
  // 主食类
  { name: '米饭', alias: ['大米饭', '白米饭', '米饭(蒸)'], per100g: { cal: 116, pro: 2.6, fat: 0.3, carb: 25.9 }, defaultUnit: '碗', defaultGrams: 180 },
  { name: '面条', alias: ['拉面', '挂面', '切面', '汤面'], per100g: { cal: 138, pro: 4.5, fat: 0.5, carb: 28.5 }, defaultUnit: '碗', defaultGrams: 200 },
  { name: '馒头', alias: ['白馒头'], per100g: { cal: 223, pro: 7.0, fat: 1.1, carb: 47.0 }, defaultUnit: '个', defaultGrams: 100 },
  { name: '包子', alias: ['肉包', '菜包'], per100g: { cal: 227, pro: 7.5, fat: 7.2, carb: 33.5 }, defaultUnit: '个', defaultGrams: 80 },
  { name: '糙米饭', alias: ['杂粮饭'], per100g: { cal: 111, pro: 2.7, fat: 0.8, carb: 23.5 }, defaultUnit: '碗', defaultGrams: 180 },
  { name: '燕麦片', alias: ['燕麦'], per100g: { cal: 367, pro: 15.0, fat: 6.7, carb: 61.6 }, defaultUnit: '勺', defaultGrams: 40 },
  { name: '油条', alias: ['炸油条'], per100g: { cal: 386, pro: 6.9, fat: 17.6, carb: 51.0 }, defaultUnit: '根', defaultGrams: 60 },
  { name: '红薯', alias: ['地瓜', '烤红薯'], per100g: { cal: 86, pro: 1.6, fat: 0.2, carb: 20.1 }, defaultUnit: '个', defaultGrams: 150 },
  { name: '玉米', alias: ['水煮玉米', '甜玉米'], per100g: { cal: 112, pro: 4.0, fat: 1.2, carb: 22.8 }, defaultUnit: '根', defaultGrams: 180 },

  // 肉禽蛋类
  { name: '鸡蛋', alias: ['煮鸡蛋', '水煮蛋'], per100g: { cal: 143, pro: 12.6, fat: 9.5, carb: 1.5 }, defaultUnit: '个', defaultGrams: 50 },
  { name: '煎蛋', alias: ['荷包蛋'], per100g: { cal: 196, pro: 12.0, fat: 15.0, carb: 2.0 }, defaultUnit: '个', defaultGrams: 55 },
  { name: '鸡胸肉', alias: ['鸡胸'], per100g: { cal: 133, pro: 31.0, fat: 2.5, carb: 0.0 }, defaultUnit: '份', defaultGrams: 120 },
  { name: '鸡腿肉', alias: ['鸡腿', '琵琶腿'], per100g: { cal: 181, pro: 20.0, fat: 11.0, carb: 0.0 }, defaultUnit: '个', defaultGrams: 120 },
  { name: '瘦猪肉', alias: ['猪肉', '里脊肉'], per100g: { cal: 143, pro: 20.3, fat: 6.2, carb: 1.5 }, defaultUnit: '份', defaultGrams: 100 },
  { name: '牛肉', alias: ['瘦牛肉', '牛里脊'], per100g: { cal: 106, pro: 22.2, fat: 1.8, carb: 0.0 }, defaultUnit: '份', defaultGrams: 100 },
  { name: '肥牛/牛腩', alias: ['牛腩', '肥牛'], per100g: { cal: 240, pro: 16.0, fat: 19.5, carb: 0.5 }, defaultUnit: '份', defaultGrams: 100 },
  { name: '虾仁', alias: ['虾', '鲜虾'], per100g: { cal: 93, pro: 18.0, fat: 1.0, carb: 2.0 }, defaultUnit: '份', defaultGrams: 100 },
  { name: '鱼肉', alias: ['草鱼', '鲈鱼', '罗非鱼'], per100g: { cal: 110, pro: 18.6, fat: 3.8, carb: 0.0 }, defaultUnit: '份', defaultGrams: 150 },
  { name: '三文鱼', alias: ['大西洋鲑'], per100g: { cal: 139, pro: 19.8, fat: 6.3, carb: 0.0 }, defaultUnit: '份', defaultGrams: 120 },

  // 豆类与蔬菜
  { name: '豆腐', alias: ['北豆腐', '老豆腐'], per100g: { cal: 98, pro: 12.2, fat: 4.8, carb: 1.5 }, defaultUnit: '块', defaultGrams: 120 },
  { name: '嫩豆腐', alias: ['内酯豆腐'], per100g: { cal: 50, pro: 5.0, fat: 2.5, carb: 2.0 }, defaultUnit: '块', defaultGrams: 150 },
  { name: '西兰花', alias: ['青花菜'], per100g: { cal: 34, pro: 2.8, fat: 0.4, carb: 4.7 }, defaultUnit: '份', defaultGrams: 120 },
  { name: '青菜/生菜', alias: ['生菜', '小油菜', '菠菜', '油麦菜'], per100g: { cal: 20, pro: 1.8, fat: 0.3, carb: 3.2 }, defaultUnit: '份', defaultGrams: 150 },
  { name: '西红柿', alias: ['番茄'], per100g: { cal: 19, pro: 0.9, fat: 0.2, carb: 3.5 }, defaultUnit: '个', defaultGrams: 150 },
  { name: '黄瓜', alias: ['青瓜'], per100g: { cal: 16, pro: 0.8, fat: 0.2, carb: 2.9 }, defaultUnit: '根', defaultGrams: 150 },

  // 饮品与奶制品
  { name: '纯牛奶', alias: ['牛奶'], per100g: { cal: 54, pro: 3.0, fat: 3.2, carb: 4.7 }, defaultUnit: '杯', defaultGrams: 250 },
  { name: '无糖豆浆', alias: ['豆浆'], per100g: { cal: 31, pro: 3.0, fat: 1.6, carb: 1.2 }, defaultUnit: '杯', defaultGrams: 300 },
  { name: '美式咖啡/无糖可乐', alias: ['黑咖啡', '无糖可乐', '零度可乐'], per100g: { cal: 2, pro: 0.1, fat: 0.0, carb: 0.4 }, defaultUnit: '杯', defaultGrams: 330 },

  // 水果类
  { name: '苹果', alias: ['红富士'], per100g: { cal: 52, pro: 0.3, fat: 0.2, carb: 13.8 }, defaultUnit: '个', defaultGrams: 180 },
  { name: '香蕉', alias: ['大蕉'], per100g: { cal: 89, pro: 1.1, fat: 0.3, carb: 22.8 }, defaultUnit: '根', defaultGrams: 120 }
];

// 4. 外卖高频大项参数化配方模板（解决外卖菜品无国家成分表问题）
export const TAKEAWAY_PRESETS = [
  {
    id: 'huangmenji',
    title: '黄焖鸡米饭',
    category: '快餐盖饭',
    sizes: {
      small: { label: '小份', grams: 380, baseCal: 650, riceG: 220, meatG: 120, oilLevel: 'takeaway_standard' },
      normal: { label: '标准份', grams: 460, baseCal: 820, riceG: 280, meatG: 150, oilLevel: 'takeaway_standard' },
      large: { label: '大份/加肉', grams: 560, baseCal: 1050, riceG: 320, meatG: 200, oilLevel: 'takeaway_heavy' }
    },
    defaultSize: 'normal',
    desc: '鸡腿肉、香菇青椒、米饭与卤汁宽油'
  },
  {
    id: 'malatang',
    title: '麻辣烫 / 麻辣香锅',
    category: '热辣烫菜',
    sizes: {
      small: { label: '轻量蔬菜多', grams: 400, baseCal: 580, oilLevel: 'home_normal' },
      normal: { label: '经典荤素搭配', grams: 550, baseCal: 880, oilLevel: 'takeaway_standard' },
      large: { label: '大份红油/炸蛋宽粉', grams: 700, baseCal: 1260, oilLevel: 'takeaway_heavy' }
    },
    defaultSize: 'normal',
    desc: '各色荤素涮煮，红油底料是热量最大变量'
  },
  {
    id: 'lanzhou_lamian',
    title: '兰州牛肉拉面',
    category: '粉面小吃',
    sizes: {
      small: { label: '细面小碗', grams: 350, baseCal: 480, oilLevel: 'home_light' },
      normal: { label: '二细标准碗', grams: 450, baseCal: 650, oilLevel: 'home_normal' },
      large: { label: '大碗加肉加蛋', grams: 580, baseCal: 860, oilLevel: 'takeaway_standard' }
    },
    defaultSize: 'normal',
    desc: '拉面、牛骨汤、清真牛肉与油泼辣子'
  },
  {
    id: 'zhujiaofan',
    title: '隆江猪脚饭',
    category: '快餐盖饭',
    sizes: {
      small: { label: '瘦肉多小份', grams: 400, baseCal: 750, oilLevel: 'takeaway_standard' },
      normal: { label: '半肥半瘦标准', grams: 500, baseCal: 1020, oilLevel: 'takeaway_standard' },
      large: { label: '多肉多汁大份', grams: 620, baseCal: 1350, oilLevel: 'takeaway_heavy' }
    },
    defaultSize: 'normal',
    desc: '软糯猪蹄、卤肉、米饭与卤汁裹油'
  },
  {
    id: 'fried_chicken_burger',
    title: '炸鸡腿汉堡薯条套餐',
    category: '西式快餐',
    sizes: {
      small: { label: '单汉堡', grams: 220, baseCal: 520, oilLevel: 'takeaway_standard' },
      normal: { label: '汉堡+无糖饮', grams: 500, baseCal: 580, oilLevel: 'takeaway_standard' },
      large: { label: '汉堡+薯条+含糖饮', grams: 650, baseCal: 1150, oilLevel: 'takeaway_heavy' }
    },
    defaultSize: 'normal',
    desc: '油炸裹粉鸡排、面包与蛋黄酱'
  },
  {
    id: 'light_salad',
    title: '轻食鸡胸肉糙米沙拉',
    category: '健康轻食',
    sizes: {
      small: { label: '小份', grams: 300, baseCal: 340, oilLevel: 'boiled' },
      normal: { label: '标准份', grams: 420, baseCal: 460, oilLevel: 'home_light' },
      large: { label: '大份双份肉', grams: 520, baseCal: 620, oilLevel: 'home_light' }
    },
    defaultSize: 'normal',
    desc: '鸡胸肉、杂粮饭、新鲜蔬菜与油醋汁'
  },
  {
    id: 'mapo_tofu_rice',
    title: '麻婆豆腐盖浇饭',
    category: '快餐盖饭',
    sizes: {
      small: { label: '少饭小份', grams: 380, baseCal: 580, oilLevel: 'takeaway_standard' },
      normal: { label: '标准盖饭', grams: 480, baseCal: 780, oilLevel: 'takeaway_standard' },
      large: { label: '大份多酱', grams: 580, baseCal: 1020, oilLevel: 'takeaway_heavy' }
    },
    defaultSize: 'normal',
    desc: '嫩豆腐、牛肉末、豆瓣酱与红油芡汁'
  }
];

/**
 * 查表算法：根据食材名称、数量、单位、用油档位，精确计算营养（铁律：不依赖大模型直接生成数值）
 */
export function lookupIngredientNutrition({ name, quantity = 1, unit = '份', cooking = 'home_normal' }) {
  const cleanName = String(name || '').trim().toLowerCase();
  
  // 1. 尝试在成分库中匹配
  let match = INGREDIENT_DB.find(item => 
    cleanName.includes(item.name) || (item.alias && item.alias.some(a => cleanName.includes(a)))
  );

  // 2. 计算克重
  let grams = 100;
  const numQty = Number(quantity) || 1;

  if (unit === '克' || unit === 'g' || unit === '毫升' || unit === 'ml') {
    grams = numQty;
  } else if (UNIT_GRAM_MAP[unit]) {
    grams = UNIT_GRAM_MAP[unit] * numQty;
  } else if (match && match.defaultGrams) {
    grams = match.defaultGrams * numQty;
  } else {
    grams = 100 * numQty;
  }

  // 3. 基础宏量换算
  const per100g = match ? match.per100g : { cal: 120, pro: 6, fat: 4, carb: 15 };
  const ratio = grams / 100;

  let calories = Math.round(per100g.cal * ratio);
  let protein = Math.round(per100g.pro * ratio * 10) / 10;
  let fat = Math.round(per100g.fat * ratio * 10) / 10;
  let carbs = Math.round(per100g.carb * ratio * 10) / 10;

  // 4. 叠加烹饪用油修正
  const oilObj = COOKING_OIL_LEVELS.find(o => o.id === cooking) || COOKING_OIL_LEVELS[2];
  if (oilObj && oilObj.oilGrams > 0) {
    fat = Math.round((fat + oilObj.oilGrams) * 10) / 10;
    calories += oilObj.cals;
  }

  return {
    name: match ? match.name : cleanName,
    portion: `${grams}克`,
    grams,
    calories,
    protein,
    fat,
    carbs,
    cooking
  };
}

/**
 * 诚实呈现原则：计算能量置信区间（杜绝伪精度）
 */
export function calculateHonestInterval(totalCalories, isWeighed = false) {
  const c = Math.round(totalCalories) || 0;
  if (isWeighed) {
    // 厨房秤精准称重输入，误差在 ±5% 左右
    return {
      min: Math.round(c * 0.95),
      max: Math.round(c * 1.05),
      label: `${c} kcal (实称精确)`
    };
  }

  // 菜品级/外卖估算，给出客观置信区间（±15% ~ 20%）
  const min = Math.round(Math.max(10, c * 0.85) / 10) * 10;
  const max = Math.round((c * 1.15) / 10) * 10;
  return {
    min,
    max,
    label: `约 ${min} ~ ${max} kcal`
  };
}
