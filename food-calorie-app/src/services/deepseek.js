import { formatMealTitle } from '../utils/nutritionCalculator';

/**
 * 图像压缩与调整尺寸工具
 */
export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 1024;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve({
          base64,
          dataUrl: base64
        });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 1. 拍照视觉食物分析（DeepSeek-Flash）
 */
export async function analyzeFoodWithDeepSeek({
  imageBase64,
  apiKey,
  userNote = '',
  baseUrl = 'https://api.deepseek.com',
  model = 'deepseek-flash'
}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('请先在【设置】中配置您的 DeepSeek API Key！');
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const apiUrl = cleanBaseUrl.endsWith('/v1') 
    ? `${cleanBaseUrl}/chat/completions` 
    : `${cleanBaseUrl}/chat/completions`;

  const notePrompt = userNote && userNote.trim() 
    ? `\n【用户重点补充提示】：${userNote.trim()}`
    : '';

  const promptText = `你是专业资深的临床注册营养师。请仔细分析这张图片中的所有食物。${notePrompt}

分析准则：
1. 检查图片是否包含食物或饮料。若完全不包含食物，请输出 isFood: false。
2. 结合餐具边缘推测食材真实重量与体积，并估算烹饪吸油率。
3. 详细输出每样食材(name)、分量(portion)、热量(calories)、蛋白质(protein)、脂肪(fat)、碳水化合物(carbs)。
4. 汇总总热量 totalCalories、总蛋白质 totalProtein、总脂肪 totalFat、总碳水 totalCarbs。
5. 给出菜品总称 dishName（注意：如果包含多道食物或饮品，必须使用顿号“、”清晰隔开，例如“麻婆豆腐、青椒肉丝、无糖可乐”，严禁连在一起）、健康评分 healthScore (0-100) 和一段亲切专业的健康点评 healthComment。

请以纯 JSON 格式输出：
{
  "isFood": true,
  "dishName": "菜品名称（多样请用顿号隔开）",
  "foods": [
    {
      "name": "具体食材名称",
      "portion": "约150克",
      "calories": 240,
      "protein": 30.5,
      "fat": 5.2,
      "carbs": 0.5
    }
  ],
  "totalCalories": 240,
  "totalProtein": 30.5,
  "totalFat": 5.2,
  "totalCarbs": 0.5,
  "healthScore": 90,
  "healthComment": "营养点评..."
}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-flash',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: promptText },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ]
        }
      ],
      thinking: { type: 'disabled' },
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000
    })
  });

  return parseNutritionResponse(response);
}

/**
 * 2. 文字自然语言食物识别（Fud-AI 特色 NLP 记账）
 * 例如用户输入：“中午吃了两根油条一碗豆浆和一个茶叶蛋”
 */
export async function analyzeFoodTextWithDeepSeek({
  textDescription,
  apiKey,
  baseUrl = 'https://api.deepseek.com',
  model = 'deepseek-flash'
}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('请先在【设置】中配置您的 DeepSeek API Key！');
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const apiUrl = cleanBaseUrl.endsWith('/v1') 
    ? `${cleanBaseUrl}/chat/completions` 
    : `${cleanBaseUrl}/chat/completions`;

  const promptText = `你是专业资深的临床注册营养师。用户口述了他吃下的餐食内容如下：
“${textDescription}”

请根据权威中国食物成分表：
1. 智能拆解出用户提到的每一道菜品/具体食材。
2. 预估常见的标准分量（如油条约60g一根，豆浆约250ml一碗），计算单项卡路里(calories)、蛋白质(protein)、脂肪(fat)、碳水化合物(carbs)。
3. 汇总整餐总热量 totalCalories、总蛋白质 totalProtein、总脂肪 totalFat、总碳水 totalCarbs。
4. 给出菜品总称 dishName（注意：如果包含多道食物或饮品，必须使用顿号“、”清晰隔开，例如“麻婆豆腐、青椒肉丝、无糖可乐”，严禁连在一起）、健康评分 healthScore (0-100) 和一段简短的健康点评 healthComment。

请以纯 JSON 格式输出：
{
  "isFood": true,
  "dishName": "菜品名称（多样请用顿号隔开）",
  "foods": [
    {
      "name": "具体食材名称",
      "portion": "分量说明",
      "calories": 180,
      "protein": 6.5,
      "fat": 8.0,
      "carbs": 20.0
    }
  ],
  "totalCalories": 180,
  "totalProtein": 6.5,
  "totalFat": 8.0,
  "totalCarbs": 20.0,
  "healthScore": 85,
  "healthComment": "营养分析建议..."
}`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-flash',
      messages: [{ role: 'user', content: promptText }],
      thinking: { type: 'disabled' },
      reasoning_effort: 'none',
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 2000
    })
  });

  return parseNutritionResponse(response);
}

/**
 * 3. AI 营养教练对话（带有今日真实饮食上下文）
 */
export async function askAICoachWithDeepSeek({
  messages,
  todayContext,
  apiKey,
  baseUrl = 'https://api.deepseek.com',
  model = 'deepseek-flash'
}) {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('请先在【设置】中配置您的 DeepSeek API Key！');
  }

  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const apiUrl = cleanBaseUrl.endsWith('/v1') 
    ? `${cleanBaseUrl}/chat/completions` 
    : `${cleanBaseUrl}/chat/completions`;

  const profile = todayContext.userProfile || {};
  const goalNames = { lose: '健康减脂', maintain: '维持体重', gain: '增肌塑形' };
  const profileInfo = profile.height ? `
【用户个人身体档案】：
- 身高：${profile.height} cm，体重：${profile.weight} kg (性别: ${profile.gender === 'female' ? '女' : '男'}, 年龄: ${profile.age || 26}岁)
- 健身目标：${goalNames[profile.goal] || '健康饮食管理'}
` : '';

  const systemPrompt = `你是一位专业、鼓励人且亲切的 AI 私人营养教练（风格对标 Fud-AI Coach）。
你非常熟悉现代科学减脂、增肌、控糖和地中海/低碳饮食原则。
${profileInfo}
【用户今日实时饮食档案】：
- 目标摄入：${todayContext.targetCalories} kcal
- 今日已摄入总热量：${todayContext.totalCalories} kcal (剩余 ${todayContext.remainingCalories} kcal)
- 蛋白质：已摄入 ${todayContext.totalProtein}g / 目标 ${todayContext.targetProtein}g
- 碳水化合物：已摄入 ${todayContext.totalCarbs}g / 目标 ${todayContext.targetCarbs}g
- 脂肪：已摄入 ${todayContext.totalFat}g / 目标 ${todayContext.targetFat}g
- 今日已吃餐食清单：${todayContext.mealsSummary || '今日暂未打卡餐食'}

请结合用户的身体数据（身高、体重、目标）与今日真实的摄入进度，给出具体、可行、鼓励性的营养饮食指导。回答要清晰、精炼，多用列表和重点提示，语气阳光温暖。`;

  const fullMessages = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify({
      model: model || 'deepseek-flash',
      messages: fullMessages,
      thinking: { type: 'disabled' },
      reasoning_effort: 'none',
      temperature: 0.7,
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`AI 教练思考失败 (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '教练正在整理建议，请稍后再试。';
}

/**
 * 内部通用的营养分析 JSON 清洗与格式归一化函数
 */
async function parseNutritionResponse(response) {
  if (!response.ok) {
    const errText = await response.text();
    let errorMsg = `接口请求失败 (${response.status})`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) errorMsg = errJson.error.message;
    } catch (e) {
      errorMsg = errText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content;
  if (!rawContent) throw new Error('未返回有效结果');

  let jsonStr = rawContent.trim();
  if (jsonStr.startsWith('```json')) jsonStr = jsonStr.substring(7);
  else if (jsonStr.startsWith('```')) jsonStr = jsonStr.substring(3);
  if (jsonStr.endsWith('```')) jsonStr = jsonStr.substring(0, jsonStr.length - 3);
  jsonStr = jsonStr.trim();

  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonStr);
  if (parsed.isFood === false) {
    throw new Error(parsed.message || '未检测到具体的食物内容，请重新描述或拍摄。');
  }

  const rawFoods = parsed.foods || parsed.food_items || [];
  const normalizedFoods = rawFoods.map((f, index) => ({
    id: `food-${Date.now()}-${index}`,
    name: f.name || f.food_name || '食材',
    portion: f.portion || (f.estimated_weight_g ? `约${f.estimated_weight_g}克` : '适量'),
    calories: Math.round(Number(f.calories || f.estimated_calories || f.estimated_calories_kcal || 0)),
    protein: Math.round(Number(f.protein || f.protein_g || 0) * 10) / 10,
    fat: Math.round(Number(f.fat || f.fat_g || 0) * 10) / 10,
    carbs: Math.round(Number(f.carbs || f.carbs_g || 0) * 10) / 10
  }));

  const totalCalories = Math.round(Number(
    parsed.totalCalories ||
    parsed.total_calories ||
    normalizedFoods.reduce((acc, f) => acc + f.calories, 0)
  ));

  const totalProtein = Math.round(Number(
    parsed.totalProtein ||
    parsed.total_protein ||
    normalizedFoods.reduce((acc, f) => acc + f.protein, 0)
  ) * 10) / 10;

  const totalFat = Math.round(Number(
    parsed.totalFat ||
    parsed.total_fat ||
    normalizedFoods.reduce((acc, f) => acc + f.fat, 0)
  ) * 10) / 10;

  const totalCarbs = Math.round(Number(
    parsed.totalCarbs ||
    parsed.total_carbs ||
    normalizedFoods.reduce((acc, f) => acc + f.carbs, 0)
  ) * 10) / 10;

  const rawDishName = parsed.dishName || parsed.dish_name || '';
  const dishName = formatMealTitle(rawDishName, normalizedFoods);

  return {
    dishName,
    foods: normalizedFoods,
    totalCalories,
    totalProtein,
    totalFat,
    totalCarbs,
    healthScore: Math.round(Number(parsed.healthScore || parsed.health_score || 88)),
    healthComment: parsed.healthComment || parsed.health_comment || '营养搭配均衡！'
  };
}
