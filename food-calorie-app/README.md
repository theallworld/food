# 🥗 饭时记 (Meal Journal)

> **极简 · 智能 · 科学闭环 · 本地优先** —— 深度融合自然语言实体抽取、权威中餐成分库查表、用油梯度校准与诚实能量区间的现代化饮食与热量管理 Android 应用。

[![GitHub release](https://img.shields.io/badge/release-v1.8.4-10b981.svg)](https://github.com/theallworld/food)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Web-0284c7.svg)](#)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-DeepSeek--Flash-6366f1.svg)](#)

---

## 📑 目录 (Table of Contents)
- [0. 核心架构技术决策](#0-核心架构技术决策)
- [1. 为什么放弃照片识别作为主输入](#1-为什么放弃照片识别作为主输入)
- [2. 外卖场景：能量为什么无法凭照片估量](#2-外卖场景能量为什么无法凭照片估量)
- [3. 现行工程落地方案](#3-现行工程落地方案)
- [4. 数据源与知识工程](#4-数据源与知识工程)
- [5. App 核心功能与使用体验](#5-app-核心功能与使用体验)
- [6. 安装与体验 (v1.8.4)](#6-安装与体验-v184)
- [7. 本地开发与构建](#7-本地开发与构建)
- [8. 权威参考文献与学术出处](#8-权威参考文献与学术出处)

---

## 0. 核心架构技术决策

> **核心原则：大模型不输出任何营养数值，所有数值均由权威食物成分表查表与用油参数化模型换算。**

1. **"识别是什么食物"已经不是问题**（中餐 top-1 76–86%，top-5 94–98%），**"算准能量"仍是问题**，瓶颈在**份量估计**与**烹饪用油**，不在识别模型。
2. 照片识别的热量误差高达 **33%**，脂肪误差高达 **54.9%**。减重目标缺口通常只有 300–500 kcal/天，而 2000 kcal 日摄入上的 33% 误差 = **±660 kcal**。**测量误差大于被测量本身**，该数值不具备作为控制信号的能力。
3. 照片是一条**信息量更差的信道**：份量信息存在于用户脑中，不在像素里。让用户拍照，等于主动丢弃他手上的精确信息，再用误差 33–55% 的算法猜回来。
4. **外卖是决定性场景**：一份中式外卖实测 **1,000–2,200 kcal**，占成人每日需求 50–100%。**外卖估不准，整个 App 就不准。**
5. **现行方案**：**文字/语音口述 ➔ DeepSeek 结构化抽取 ➔ 权威成分表查表换算 ➔ 烹饪用油梯度校准**。照片降级为**辅助记录与容器校准器**。

---

## 1. 为什么放弃照片识别作为主输入

### 1.1 误差分层：问题出在哪一环

图像化膳食评估是一条多级流水线：**检测 → 分割 → 分类 → 份量估计 → 营养查表**。每一级的误差都会向下累积（[MDPI Nutrients 2026](https://www.mdpi.com/2072-6643/18/6/980)）。

逐级看实际水平：

| 环节 | 成熟度 | 实测性能 |
|---|---|---|
| 食物**分类识别** | ✅ 已可用 | 中餐 top-1 **76.6%**、top-5 **94.4%**（[DFoodTJ](https://www.nature.com/articles/s41597-026-07334-9)）；另一中餐集 top-1 **86.3%**、top-5 **98.5%**（[CNFOOD-241](https://doi.org/10.1016/j.jafr.2025.101733)） |
| 食物**份量估计** | ❌ 主要瓶颈 | 旗舰多模态模型普遍偏弱，是公认的**主要卡点**（[arXiv 2607.16514](https://arxiv.org/html/2607.16514)）；份量分级准确率：小份 86.7%、中份 85%、**大份仅 68.4%**（[DietAI24](https://doi.org/10.1038/s43856-025-01159-0)） |
| **营养/热量**换算 | ❌ 不可用于精确控制 | 中餐单盘误差：碳水 21.1%、蛋白 40.6%、纤维 39.4%、**热量 33.0%**、**脂肪 54.9%**（[DFoodTJ](https://www.nature.com/articles/s41597-026-07334-9)） |

> **核心判断：AI 能认出菜，但不知道有多少，更不知道放了多少油。**

### 1.2 与专业人类对比的差距

一项覆盖 **40 个视觉语言模型、8 家供应商**、以 Nutrition5k 为基准的研究，将模型与专业营养师直接对比（[Scientific Reports 2026](https://www.nature.com/articles/s41598-026-58755-w)）：

| 指标 | 专业营养师 | 最好的 AI 模型 |
|---|---|---|
| RMSLE（越低越好） | **0.176** | 0.443 |
| 差距 | — | **落后 152%** |
| 蛋白质单项 | — | **落后 672%** |

> 结论原文：*"Current VLMs suit consumer calorie tracking applications; achieving clinical-grade macronutrient profiling will require advances in model architecture rather than deployment optimization."*  
> 即：**消费级随便记记可以，真正精确不行，而且不是调参能解决的，必须等待底层架构进步。**

### 1.3 三个“反直觉但已被验证”的结论

同一项研究给出三个已被统计检验的否定结论，在工程实现上严禁再做无用功：

| 尝试 | 结果 | 显著性 |
|---|---|---|
| **多角度拍照** | **无效**（RMSLE 0.627 vs 0.623） | p = 0.182 |
| **Prompt 工程调优** | **全部无效** | 所有 p > 0.05 |
| **实验室标准打光拍摄** | **反而更差**（0.616 vs 手机随手拍 0.548） | p = 0.020 |

模型架构选择占据了 **99.6%** 的性能方差。唯一有正收益的是**补充食材文字描述**（0.548 → 0.516，p = 0.039）。  
**推论**：与其耗费精力在拍照流程上做文章，不如直接更换输入模态为文字/口述。

### 1.4 误差的致命之处：它大于信号

减重场景中，用户要控制的是**每日 300–500 kcal 的缺口**。  
而照片估算在 2000 kcal 日摄入上带来 **±660 kcal** 的噪声，且该误差**系统性偏高**——一项 36 名受试者、连续 10 天的实测显示 AI 平均**多算 154 kcal/天**（1,856 ± 505 vs 称重法 1,702 ± 260），蛋白质 +8.9 g、脂肪 +10.4 g、碳水 +33.8 g（[MDPI Nutrients 2026](https://www.mdpi.com/2072-6643/18/6/980)）。

**噪声幅度超过信号幅度，且方向稳定偏错。** 用户据此做减脂增肌决策，就是被系统性推向反方向。

---

## 2. 外卖场景：能量为什么无法凭照片估量

### 2.1 实验室实测数据（非估算）

爱尔兰食品安全局采购 **220 份中式外卖样品**、覆盖 35 家门店，实验室直接测定（[Safefood 研究报告](https://www.safefood.net/professional/research/pizza-burgers-chinese)）：

| 项目 | 能量 | 脂肪 | 盐 |
|---|---|---|---|
| **完整套餐**（春卷 + 咕咾肉 + 蛋炒饭） | **2,184 kcal** | 74 g | 10 g |
| 咕咾肉 单份 | **1,106 kcal** | 41 g | — |
| 蛋炒饭 单份（≈359 g） | **727 kcal** | 14 g | **4 g** |
| 白饭 单份（≈323 g） | 比蛋炒饭少 **160 kcal** | 少 12 g | 几乎无 |
| 虾片 单份 | 608 kcal | 39 g | — |

英国覆盖 5 类外卖的研究（[Jaworowska et al., 2014](https://doi.org/10.1108/nfs-08-2013-0093)）：
- 单餐能量 **1,125 – 1,820 kcal**（25–75 百分位），中餐单份均值：**821 g / 1,161 kcal（932–1,452）**。
- **中餐在外卖各类别中脂肪密度其实偏低，核心问题出在份量极大（821 g）。**
- **一顿外卖吃掉一整天推荐热量，是常态而非极端情况。**

### 2.2 无法凭空估算的七个结构性原因

```
外卖单份能量拆解：
主食   米饭 250–350 g   ➔  290–400 kcal
肉类   100–150 g        ➔  150–300 kcal
烹饪油 15–35 g          ➔  135–315 kcal   ← 最大变量
酱料糖 20–40 g          ➔   40–160 kcal   ← 第二变量
──────────────────────────────────────
总计                      700–1,200 kcal
```

1. **菜品级权威数据不存在**：《中国食物成分表》只覆盖食材级数据，“黄焖鸡米饭”、“螺蛳粉”在官方成分表中无条目。
2. **本土实验室公开实测稀缺**：国内外卖缺乏同等规模的权威实验室测定公开库。
3. **烹饪用油不可见，且是最大变量**：油 + 酱料 = **200–480 kcal**，占总热量 25–40%，中餐脂肪误差 54.9% 的根源就在于此。
4. **份量基准不统一，门店差异可达 5 倍**：外卖单份常按 1.5–2 人份出餐，门店间离散度极大。
5. **外卖做法 ≠ 家庭做法 ≠ 美食博主配方**：博主配方为镜头好看采用宽油、足量肉；外卖商家为控成本出餐快，多用料理包、商用灶润锅、勾芡与垫菜充体积。
6. **料理包与预制菜让成分对外不透明**：即使炒鸡蛋、卤肉都有工业料理包，外界无法仅从外观判断。
7. **无强制营养标注，无 Ground Truth**：没有标准真值，误差只能由模型层层猜测累加。

---

## 3. 现行工程落地方案

### 3.1 总体处理流水线

```
用户输入（文字/口述/外卖点选）
        ↓
自然语言实体抽取（DeepSeek-Flash，温度 0.1）
        ↓
权威成分库查表换算（《中国食物成分表》）
        ↓
5档烹饪用油梯度修正（+2g ~ +38g 油）
        ↓
诚实呈现：能量置信区间（如 约 700 ~ 850 kcal）
        ↓
交互核对：单项克数微调 +【更新重算】
        ↓
本地优先持久化（IndexedDB）
```

### 3.2 铁律：大模型不输出任何营养数值

**DeepSeek 的职责边界严格限定为「自然语言 ➔ 食材/菜品/规格结构化」，所有数值由客户端代码查表得出。**

- **杜绝幻觉**：外接权威数据库消除 LLM 凭空捏造数值的失效模式（降低误差 63%）。
- **可审计解释**：每一项卡路里均能向上溯源至《中国食物成分表》克重换算。
- **无模型漂移**：大模型升级不影响历史记录的可比性与数值稳定性。

### 3.3 外卖与家常双轨制输入

| 场景 | 输入方式 | 工程考量 |
|---|---|---|
| **外卖点选流** | 菜品选择 + 规格（小/标准/大）+ 用油偏好 | 用户点外卖时自带标准规格与菜名，点两下比自由输入快 3 倍且无噪声 |
| **家常/杂食流** | 自然语言文字/语音口述 | 处理非标准化自制餐食，通过 DeepSeek 拆解为标准食材组合 |
| **实拍辅助** | 拍照取景 | 降级为餐食时光轴留念与未来容器体积校准器，不承担数值推导主力 |

### 3.4 5 档烹饪用油梯度参数化模型

针对中餐最大变量——“油”，App 在核对面板与外卖选择中直接提供 5 档参数化开关：

| 档位 | 描述 | 吸油量 | 额外热量 |
|---|---|---|---|
| **水煮/清蒸/凉拌** | 无油或微量润滑 | 2 g | +18 kcal |
| **家常清淡少油** | 微量润锅翻炒 | 8 g | +72 kcal |
| **家常正常炒菜** | 家庭标准油温烹调 | 14 g | +126 kcal |
| **外卖商用标准** | 商用大火宽油快炒 | 25 g | +225 kcal |
| **重油/干锅/油炸/红烧** | 重油浸润或复炸挂汁 | 38 g | +342 kcal |

用户只需轻轻一点，即可消除高达 **324 kcal**（相当于一碗半米饭）的用油盲区。

### 3.5 诚实呈现原则 (Honest Presentation)

**杜绝虚假伪精度。**
- ❌ 显示 `672.4 kcal`（模型和算法给不出这种置信度，且会误导用户对自身缺口产生虚假控制感）。
- ✅ 菜品级显示 **`约 600 ~ 750 kcal`** 置信区间；实秤厨房秤录入时标明 `精确实称`。
- ✅ 算法提供长尾能量密度保底（轻度 300–500 kcal，中度 500–800 kcal，重度 800–1400 kcal）。

---

## 4. 数据源与知识工程

1. **《中国食物成分表标准版（第6版）》**：中国疾控中心营养与健康所权威编著，覆盖常用粮谷、蔬菜、肉禽、蛋乳的标准成分数据（能量、蛋白、脂肪、碳水化合物、膳食纤维）。
2. **参数化外卖菜品模板库**：针对外卖 Top 菜品（黄焖鸡米饭、麻辣烫、兰州牛肉面、隆江猪脚饭、汉堡薯条套餐、轻食沙拉等）构建基于真实用料的标准化份量模型。
3. **日常量词克重映射表**：建立平碗 (150g)、大碗 (260g)、个 (50g)、份 (150g)、勺 (10g) 的基准换算，抹平用户自然语言表达差异。

---

## 5. App 核心功能与使用体验

### 1. ⚡ 多模态高效记餐
- **自然口述速记**：输入“一碗红烧牛肉面加个荷包蛋”，秒级拆解。
- **食材明细与顿号优雅排版**：菜品食材智能以正统中文顿号（`、`）排布。
- **克数调整与【更新重算】**：任意食材克数均可微调，一键重算整餐宏量占比。
- **外卖极速点选**：预置高频外卖菜谱，份量与油水一触即达。

### 2. ⚖️ 临床医学级身体档案 (Mifflin-St Jeor)
- 依据性别、年龄、身高、体重、活力水平，精准计算 **BMR**、**TDEE** 与 **BMI**。
- 支持“健康减脂 (-400 kcal) / 维持体重 / 增肌塑形 (+350 kcal)”目标，自动换算三大宏量营养素克数预算。

### 3. 📅 饮食时光轴与本地照片归档
- 顶部日期无缝切换历史任意一天的饮食摄入。
- 照片 Canvas 高保真压缩存储于手机本地沙盒（IndexedDB），隐私 100% 自主掌控。

### 4. 🤖 AI 私人营养教练
- 实时联动当日摄入进度与身体目标，解答减脂增肌疑难问题。

### 5. 📱 沉浸式全面屏设计
- Edge-to-Edge 沉浸融合状态栏与底部导航栏，黄金居中悬浮记餐按钮。

---

## 6. 安装与体验 (v1.8.4)

当前版本为 **v1.8.4**，桌面名称为「饭时记」，现支持 Android 今日营养桌面小组件，外观跟随系统日夜模式。

* 📥 [**`饭时记_v1.8.4.apk`**](../饭时记_v1.8.4.apk)（Android 安装包）

安装 v1.8.4 后，可在手机桌面长按空白处，打开“小组件”列表并添加「今日营养」。

---

## 7. 本地开发与构建

```bash
# 1. 克隆代码库
git clone https://github.com/theallworld/food.git
cd food

# 2. 启动前端开发调试
cd food-calorie-app
npm install
npm run dev

# 3. 生产打包并同步 Android 原生工程
npm run build
npx cap sync android

# 4. 构建 Android Debug APK
cd android
export JAVA_HOME=/opt/homebrew/opt/openjdk@17
export ANDROID_HOME=$HOME/Library/Android/sdk
./gradlew assembleDebug
```

---

## 8. 权威参考文献与学术出处

### 照片识别能力与瓶颈
1. Shonkoff E, et al. *AI-based digital image dietary assessment methods compared to humans and ground truth: a systematic review.* 2023. [PMC10836267](https://pmc.ncbi.nlm.nih.gov/articles/PMC10836267/)
2. Vedovelli L, et al. *Model architecture dominates nutritional estimation accuracy in vision-language systems.* Scientific Reports, 2026. [Nature s41598-026-58755-w](https://www.nature.com/articles/s41598-026-58755-w)
3. *Chinese Food Images for Full-cycle Nutrition Analysis Towards Diabetes Management* (DFood-TJ). Scientific Data, 2026. [Nature s41597-026-07334-9](https://www.nature.com/articles/s41597-026-07334-9)
4. Yan R, et al. *DietAI24 as a framework for comprehensive nutrition estimation using multimodal large language models.* Communications Medicine, 2025. [Nature s43856-025-01159-0](https://doi.org/10.1038/s43856-025-01159-0)
5. *Geometry-Enhanced Portion Estimation for Multimodal LLMs.* arXiv, 2026. [arXiv:2607.16514](https://arxiv.org/html/2607.16514)
6. Feng Y, et al. *Large-scale image classification and nutrient estimation for Chinese dishes* (CNFOOD-241). 2025. [ScienceDirect](https://doi.org/10.1016/j.jafr.2025.101733)
7. Ye L, et al. *Seeing What's on the Plate: Composition-Aware Fine-Grained Food Recognition for Dietary Analysis.* Foods, 2026. [MDPI Foods](https://doi.org/10.3390/foods15050931)
8. *Agreement Between an AI-Based Meal Image Recognition System and the Weighed Dietary Record.* Nutrients, 2026. [MDPI Nutrients](https://www.mdpi.com/2072-6643/18/6/980)

### 外卖营养实测
9. Safefood. *Nutrition Take Out Series – Pizza, Burgers and Chinese Takeaways.* [Safefood Research](https://www.safefood.net/professional/research/pizza-burgers-chinese)
10. Safefood. *What's in your Chinese Takeaway?*（220 份样品实验室实测全文 PDF）[Safefood Report PDF](https://www.safefood.net/getmedia/d2b645c3-49ed-4f20-9f8e-d228ee2e8b95/Safefood-What-s-in-your-Chinese-Takeaway.pdf)
11. Jaworowska A, et al. *Nutritional composition of takeaway food in the UK.* Nutrition & Food Science, 2014. [DOI: 10.1108/nfs-08-2013-0093](https://doi.org/10.1108/nfs-08-2013-0093)

### 数据源与工程标准
12. 中国疾病预防控制中心营养与健康所. 《中国食物成分表标准版（第6版）》.
13. OpenNutrition 数据库与开源实现. [GitHub deadletterq/mcp-opennutrition](https://github.com/deadletterq/mcp-opennutrition)
14. DeepSeek Function Calling 官方规范. [DeepSeek Docs](https://api-docs.deepseek.com/guides/function_calling)
15. 央广网. 食物中的“隐藏油”与烹饪吸油率调查. [CNR Health](https://health.cnr.cn/yg/20250511/t20250511_527165952.shtml)

---

## 📄 开源许可证

本项目基于 [MIT 许可证](LICENSE) 开源。欢迎 Star 与 Pull Request！
