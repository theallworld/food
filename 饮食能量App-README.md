# 饮食能量记录 App — 技术决策 README

> 版本：v0.1（决策稿）
> 日期：2026-09-23
> 状态：**已决策 —— 放弃照片识别作为主输入，改为文字/语音录入 + 大模型结构化 + 权威数据查表**

---

## 0. 结论摘要

1. **"识别是什么食物"已经不是问题**（中餐 top-1 76–86%，top-5 94–98%），**"算准能量"仍是问题**，瓶颈在**份量估计**与**烹饪用油**，不在识别模型。
2. 照片识别的热量误差高达 **33%**，脂肪误差高达 **54.9%**。减重目标缺口通常只有 300–500 kcal/天，而 2000 kcal 日摄入上的 33% 误差 = **±660 kcal**。**测量误差大于被测量本身**，该数字不具备作为控制信号的能力。
3. 照片是一条**信息量更差的信道**：份量信息存在于用户脑中，不在像素里。让用户拍照，等于主动丢弃他手上的精确信息，再用误差 33–55% 的算法猜回来。
4. **外卖是决定性场景**：一份中式外卖实测 **1,000–2,200 kcal**，占成人每日需求 50–100%。**外卖估不准，整个 App 就不准。**
5. 现行方案：**文字/语音 → DeepSeek 结构化抽取 → 权威成分表查表计算**。铁律：**大模型不输出任何营养数值。**

---

## 1. 为什么放弃照片识别

### 1.1 误差分层：问题出在哪一环

图像化膳食评估是一条多级流水线：**检测 → 分割 → 分类 → 份量估计 → 营养查表**。每一级的误差都会向下累积（[MDPI Nutrients 2026](https://www.mdpi.com/2072-6643/18/6/980)）。

逐级看实际水平：

| 环节 | 成熟度 | 实测性能 |
|---|---|---|
| 食物**分类识别** | ✅ 已可用 | 中餐 top-1 **76.6%**、top-5 **94.4%**（[DFoodTJ](https://www.nature.com/articles/s41597-026-07334-9)）；另一中餐集 top-1 **86.3%**、top-5 **98.5%**（[CNFOOD-241](https://doi.org/10.1016/j.jafr.2025.101733)） |
| 食物**份量估计** | ❌ 主要瓶颈 | 旗舰多模态模型普遍偏弱，是公认的**主要卡点**（[arXiv 2607.16514](https://arxiv.org/html/2607.16514)）；份量分级准确率：小份 86.7%、中份 85%、**大份仅 68.4%**（[DietAI24](https://doi.org/10.1038/s43856-025-01159-0)） |
| **营养/热量**换算 | ❌ 不可用于精确控制 | 中餐单盘误差：碳水 21.1%、蛋白 40.6%、纤维 39.4%、**热量 33.0%**、**脂肪 54.9%**（[DFoodTJ](https://www.nature.com/articles/s41597-026-07334-9)） |

**核心判断：能认出菜，但不知道有多少，更不知道放了多少油。**

### 1.2 与专业人类对比的差距

一项覆盖 **40 个视觉语言模型、8 家供应商**、以 Nutrition5k 为基准的研究，将模型与专业营养师直接对比（[Scientific Reports 2026](https://www.nature.com/articles/s41598-026-58755-w)）：

| 指标 | 专业营养师 | 最好的 AI 模型 |
|---|---|---|
| RMSLE（越低越好） | **0.176** | 0.443 |
| 差距 | — | **落后 152%** |
| 蛋白质单项 | — | **落后 672%** |

结论原文：**"Current VLMs suit consumer calorie tracking applications; achieving clinical-grade macronutrient profiling will require advances in model architecture rather than deployment optimization."**

即：**消费级记录可以，临床级精确不行，而且不是调参能解决的，要等架构进步。**

### 1.3 三个"反直觉但已验证"的结论（省下无用功）

同一项研究给出三个已经被统计验证的否定结论，**不要再在这上面投入**：

| 尝试 | 结果 | 显著性 |
|---|---|---|
| **多角度拍照** | **无效**（RMSLE 0.627 vs 0.623） | p = 0.182 |
| **Prompt 工程调优** | **全部无效** | 所有 p > 0.05 |
| 实验室标准打光拍摄 | **反而更差**（0.616 vs 手机随手拍 0.548） | p = 0.020 |

而**模型架构选择占据了 99.6% 的性能方差**。唯一有小幅正收益的是补充食材描述（0.548 → 0.516，p = 0.039）。

> **推论**：与其优化拍照流程，不如换输入模态。这直接支持了本项目的决策。

### 1.4 误差的致命之处：它大于信号

减重场景中，用户要控制的是**每日 300–500 kcal 的缺口**。

而照片估算在 2000 kcal 日摄入上带来 **±660 kcal** 的噪声，且该误差**不是随机的，而是系统性偏高**——一项 36 名受试者、连续 10 天的实测显示 AI 平均**多算 154 kcal/天**（1,856 ± 505 vs 称重法 1,702 ± 260），蛋白质 +8.9 g、脂肪 +10.4 g、碳水 +33.8 g（[MDPI Nutrients 2026](https://www.mdpi.com/2072-6643/18/6/980)）。

**噪声幅度超过信号幅度，且方向稳定偏错。** 用户据此决策，就是被系统性地推向错误方向。该研究明确提醒：*"caution is warranted when precise individual-level nutrient quantification is required"*，只能用于**趋势观察**。

此外，盐、铁、维生素 B1、钠这些对**高血压/贫血人群最关键**的指标，由于强依赖调料与烹饪细节，照片法基本不可用。

### 1.5 文献纵向对比

系统性综述（52 篇论文，2010–2023）汇总的卡路里相对误差区间为 **0.10% – 38.3%**，份量 0.09% – 33%，并明确指出：**单一/简单食物误差小，混合菜（如咖喱）与重叠摆放的食物误差显著增大**（[PMC10836267](https://pmc.ncbi.nlm.nih.gov/articles/PMC10836267/)）。

中餐恰恰以混合菜、炒制、勾芡为主，属于最难的一类。

---

## 2. 外卖：能量为什么无法估量

### 2.1 先看实测数据（实验室分析，非估算）

爱尔兰食品安全局采购 **220 份中式外卖样品**、覆盖 35 家门店，实验室直接测定（[Safefood 研究报告](https://www.safefood.net/professional/research/pizza-burgers-chinese) / [报告 PDF](https://www.safefood.net/getmedia/d2b645c3-49ed-4f20-9f8e-d228ee2e8b95/Safefood-What-s-in-your-Chinese-Takeaway.pdf)）：

| 项目 | 能量 | 脂肪 | 盐 |
|---|---|---|---|
| **完整套餐**（春卷 + 咕咾肉 + 蛋炒饭） | **2,184 kcal** | 74 g | 10 g |
| 咕咾肉 单份 | **1,106 kcal** | 41 g | — |
| 蛋炒饭 单份（≈359 g） | **727 kcal** | 14 g | **4 g** |
| 白饭 单份（≈323 g） | 比蛋炒饭少 **160 kcal** | 少 12 g | 几乎无 |
| 虾片 单份 | 608 kcal | 39 g | — |

英国一项覆盖 5 类外卖的研究（[Jaworowska et al., 2014](https://doi.org/10.1108/nfs-08-2013-0093)）：

- 单餐能量 **1,125 – 1,820 kcal**（25–75 百分位），能量密度 140–283 kcal/100 g
- 中餐单份均值：**821 g / 1,161 kcal（932–1,452）**，含脂肪 36.9 g、盐 6.43 g
- **中餐在外卖各类别中脂肪密度其实偏低，问题出在份量最大（821 g）**

> **结论：一份外卖 = 1,000–2,200 kcal，占成人每日需求 50–100%。一顿外卖吃掉一整天，是常态而非极端情况。**

### 2.2 无法估量的七个结构性原因

**① 菜品级权威数据不存在**

《中国食物成分表》只覆盖**食材级**数据。"黄焖鸡米饭"、"麻辣烫"、"螺蛳粉"这类外卖菜品，在权威表中没有条目。这不是数据没整理好，是**类别本身不在覆盖范围内**。

**② 连"外卖能量是多少"这个基础问题，本土实测数据都稀缺**

上表最扎实的数据来自**英国/爱尔兰的中式外卖**研究——属于西化改良版中餐，与国内外卖并非同一对象。国内缺乏同等规模、同等级别的实验室实测公开数据。**这意味着你的基准值本身就带有一层不可消除的不确定性。**

**③ 烹饪用油不可见，且是最大变量**

外卖单份能量构成拆解：

```
主食   米饭 250–350 g   →  290–400 kcal
肉类   100–150 g        →  150–300 kcal
油     15–35 g          →  135–315 kcal   ← 最大变量
酱料糖 20–40 g          →   40–160 kcal   ← 第二变量
                        ─────────────
                        总计  700–1,200 kcal
```

**油 + 酱料 = 200–480 kcal，占 25–40%**，而这部分在任何照片、任何文字里都最难拿准。中餐脂肪误差 **54.9%** 的根源就在这里（见 [隐藏油相关报道](https://health.cnr.cn/yg/20250511/t20250511_527165952.shtml)）。

**④ 份量基准不统一，且商家间差异极大**

- 研究发现外卖份量普遍**按两人份给出**，不同门店之间差异可达 **5 倍**（虾片份量）
- 单份牛肉咖喱超出推荐份量 **195 g**
- 中餐"份"与成分表里的"份"是两套完全不同的定义

**⑤ 外卖做法 ≠ 家庭做法 ≠ 博主配方**

这是最容易犯错的一处。美食博主与外卖商家是**两种不同的产品目标**：

| | 美食博主 | 外卖商家 |
|---|---|---|
| 目标 | 好吃、上镜、可复现 | 成本低、出餐快、口味稳定 |
| 肉类 | 足量、讲究部位 | 减量，多用料理包 |
| 用油 | 宽油（镜头好看、味冲） | 商用灶宽油 + 可能复用油 |
| 体积 | 实打实 | **勾芡、加水、垫配菜充体积** |
| 份量 | 2–3 人份一盘 | 单人份，但常按 1.5–2 人份给 |

**博主配方（哪怕精确到克）回答的是"这道菜家庭做法有多少能量"，不是"你点的那份外卖有多少能量"。** 且偏差方向不单一（油偏多、肉偏少），比有已知偏差更难校正。

**⑥ 料理包 / 预制菜让配方变得不可知**

外卖大量使用料理包（[连炒鸡蛋、茶叶蛋都有料理包](https://zhuanlan.zhihu.com/p/645251175)）。这意味着**"这道菜用了什么、放了多少"在商家侧是标准化但对外不透明的**，用户和你的 App 都无法从外观或描述推断。

**⑦ 无强制营养标注，无 ground truth**

国内外卖平台未强制标注营养信息。**没有权威标注，就没有校准基准**；没有基准，误差只能靠猜测传播。

> **一句话总结：外卖能量的不可估量，不是算法能力问题，而是①数据类别缺失 ②关键变量（油/份量）不可观测 ③商业供给端不透明 三者叠加的结果。换任何模型都解决不了。**

---

## 3. 现行方案

### 3.1 架构原则

```
用户输入（文字/语音）
        ↓
   ASR（语音场景）
        ↓
自然语言 → 结构化抽取（DeepSeek）
        ↓
   权威数据表查表计算
        ↓
  可编辑的"食物卡片" → 用户确认/修正
        ↓
      落库 + 个人化校准
```

### 3.2 铁律：大模型不输出任何营养数值

**DeepSeek 的职责边界严格限定为「自然语言 → 结构化」，所有数值由代码查表得出。**

理由：

1. LLM 会**编造**营养值（已被反复验证的失效模式）。外接权威数据库做 RAG 可把营养估计 MAE 降低 **63%**（[DietAI24, Nature Communications Medicine](https://doi.org/10.1038/s43856-025-01159-0)）
2. 数值必须**可审计**——用户问"为什么是 672 kcal"要能回答
3. 换模型版本不应导致全站数值漂移，历史数据必须保持可比性

### 3.3 用 `enum` 把模型关进笼子

DeepSeek 支持 Function Calling，beta 端点的 `strict` 模式支持 **`enum`**、`$ref/$def` 等约束（[官方文档](https://api-docs.deepseek.com/guides/function_calling)）。

采用**先检索、后选择**两步走：

1. 用词典/向量检索，从用户文本取出 top-20 候选食物
2. 把这 20 个 ID 作为 `enum` 注入 schema，模型**只能从中选择**

```json
{
  "name": "log_meal",
  "strict": true,
  "parameters": {
    "type": "object",
    "properties": {
      "items": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "food_id":    { "type": "integer", "enum": [101, 205, 337] },
            "quantity":   { "type": "number" },
            "unit":       { "type": "string", "enum": ["碗","份","个","根","杯","勺","克","把","片"] },
            "cooking":    { "type": "string", "enum": ["水煮","清蒸","少油","正常","偏油","油炸","红烧","未知"] },
            "confidence": { "type": "number" }
          },
          "required": ["food_id","quantity","unit","cooking","confidence"],
          "additionalProperties": false
        }
      }
    },
    "required": ["items"],
    "additionalProperties": false
  }
}
```

> **`strict` 模式硬性要求**：每个 object 的所有属性必须全部列入 `required`，且 `additionalProperties` 必须为 `false`，否则服务端直接报错。

**收益：模型不可能生成库里不存在的食物，整条"生成后模糊匹配"的链路可以删掉。**

其他工程要点：

- 使用 `deepseek-chat`，**不使用 reasoner**——这是抽取任务而非推理任务，reasoner 更慢更贵，且历史上不支持 function calling
- 温度设 **0–0.3**
- **锁死模型版本并建立回归集**：已有真实案例，Volcengine 上 DeepSeek 由 v3.1 升至 v3.2 后结构化输出直接抛异常（[dify #29973](https://github.com/langgenius/dify/issues/29973)）。模型静默升级会打穿解析层

### 3.4 外卖与家常：两套流程必须分开

| 场景 | 输入方式 | 理由 |
|---|---|---|
| **外卖** | **点选式**：选菜 + 选规格（小/中/大份）+ 选备注（少油/正常/多油） | 用户点餐时**信息本就是结构化且精确的**，点两下比说话更快更准 |
| **家常/杂食** | 文字/语音 + LLM 解析 | 此处无"菜单"，才需要解析自由文本 |

**试图用一套语音输入吃下所有场景，外卖这块将永远估不准。**

关键洞察：用户点外卖时平台已提供"规格"字段，这个信号价值**可能高于精确估油**（因为份量差异可达 5 倍，见 §2.2④）。

### 3.5 照片降级复用：一次性份量校准器

照片不再作为主输入，但可在**一处**保留价值：用户首次遇到某个量词（"一碗"）时，**拍一次容器**以确定容量，此后该用户所有的"一碗"都有了锚点锚定。

> 这是照片在这个架构里的正确位置：**校准容器，而非识别食物。**

### 3.6 诚实呈现原则

**不显示假精度。**

- ❌ `672 kcal`（四位有效数字，模型给不出这个置信度）
- ✅ `约 600–750 kcal`、`1.2 份`
- ✅ 食材级给精确值；菜品级明确标注"估算"并给区间

**依据**：一旦用户用厨房秤验证过一次发现偏差 40%，整个 App 的信任即告失效。

### 3.7 长尾兜底：能量密度档位

对未覆盖菜品，不给点估计，给档位 + 区间：

| 档位 | 特征 | 估算 |
|---|---|---|
| 轻 | 清蒸/水煮/凉拌/粥/汤面 | 300–500 kcal |
| 中 | 家常炒菜/盖饭/简餐 | 500–800 kcal |
| 重 | 红烧/油炸/干锅/麻辣/烧烤/水煮鱼 | 800–1,400 kcal |

### 3.8 成本优化：两级漏斗

**词典/规则先命中，命中不了才调用 LLM。** 高频词（"米饭""鸡蛋"）直接命中词表，预计 90% 请求不出网；再加常见短语结果缓存。

---

## 4. 数据源清单

### 4.1 可直接使用的开源数据

| 数据源 | 覆盖 | 链接 |
|---|---|---|
| 《中国食物成分表标准版（第6版）》JSON 版 | 食材级；含能量/蛋白/脂肪/碳水/纤维/胆固醇/**GI** | [Sanotsu/china-food-composition-data](https://github.com/Sanotsu/china-food-composition-data) |
| OpenNutrition | 30 万+ 条目，支持条码查询 | [deadletterq/mcp-opennutrition](https://github.com/deadletterq/mcp-opennutrition) |
| 膳食推荐算法参考实现 | 参考用 | [liuba1223/super-nutrition-calculator](https://github.com/liuba1223/super-nutrition-calculator) |
| 中餐菜品分类与营养估计 | 参考用（拍照路线） | [yih-f/Chinese-dish-image-classification-and-nutrient-estimation](https://github.com/yih-f/Chinese-dish-image-classification-and-nutrient-estimation) |

### 4.2 菜品级数据（需自建，这是核心资产）

**路 A · 料理包标签反推**

料理包属于**预包装食品，法规强制标注营养成分表**。建立"菜品 → 常见料理包配方"映射，可获得**唯一有法规背书**的可靠先验。这是优先级最高的一条。

**路 B · 参数化配方模板 + LLM 生成 + 人工抽检**

为每个菜品建立**参数化**配方：

```
黄焖鸡米饭 = 鸡腿肉 150 g + 米饭 280 g + 油 18 g + 酱料 25 g
```

- 用 DeepSeek 批量生成外卖 top 500 菜品初版配方
- 人工抽检 10–20%，只修正**系统性偏差**
- **硬性要求：油量与份量必须是变量，可被用户覆盖，不得写死**

覆盖 top 500 菜品，预计可吃到 80%+ 的订单量。

**路 C · 博主配方作为「先验分布采样」（非数据库）**

博主配方**不能**直接当数据库（见 §2.2⑤），但可以这样使用：

1. **聚合出配料构成的合理范围**：如宫保鸡丁油量 P10–P90 = 10–30 g，取中位数作默认值 + 给区间。**博主配方至少是真人写的、可复现的；LLM 凭空生成的是幻觉。**
2. **作为 DeepSeek 的 few-shot 上下文**：检索真实配方注入 prompt，让模型基于真实配方拆解
3. **作为异常检测基准**：若算出某菜 2,000 kcal 而配方分布为 600–900，说明链路有 bug

> **定位：定义"合理范围"，不提供"精确值"。**

### 4.3 平台获取可行性（实测约束）

| 平台 | 可行性 | 约束 |
|---|---|---|
| 小红书 | 可搜索 + 读正文 | ① 强制 `xsec_token`，**不能裸 note_id 读**，须先搜索再取 URL；② 必须登录态；③ **高频批量请求会触发验证码，平台限制无法绕过**，建议每次间隔 2–3 秒 |
| 抖音 | **无现成后端** | agent-reach 当前支持小红书/X/B站/V2EX/Reddit/Facebook/Instagram，**不含抖音** |

> **结论：规模化爬取受平台风控硬约束，"扫一遍"在工程上不成立。建议改为小样本验证 + 定向采样。**

---

## 5. 待验证问题与下一步

### 5.1 半天试点：先验证数据可用性，再谈投入

**不要先建爬虫。** 先采样 50–100 篇（目标 top 20 菜品 × 每菜 3–5 篇），统计四个指标：

| 指标 | 判据 |
|---|---|
| 配方完整率（主料 + 油 + 主要调料是否列全） | 多数博主只写主料、不写油 |
| **克重标注率**（标数 vs "适量/少许"） | **< 50% 则可用性大打折扣，规模化无意义** |
| **份量标注率**（是否标注几人份） | **< 50% 则无法归一化到单人份** |
| **同菜方差**（不同博主油量/总能量差异倍数） | **> 2 倍则只能做区间，不能做点估计** |

### 5.2 决定性一测

**点一份可称重的外卖（或到店称重），按"博主配方聚合值"计算总能量，再与实际称重结果对比。**

> **这个偏差有多大，就是整个数据战略的答案。**

### 5.3 其他待办

- [ ] 建立 100–200 条真实用户表达的评测集（含人工标注克重）
- [ ] 评测指标：**每餐能量误差的中位数与 P90**、**偏差方向**（是否系统性偏高）、**未匹配率**
- [ ] 目标：文字/语音路线的误差压缩至 **15–25%**（对比照片路线的 33%）
- [ ] 建立"量词 → 克重"映射表（碗/份/个/根/杯/勺/把/片），这是误差上限的决定因素
- [ ] 评估料理包品牌/型号的可获取性与映射覆盖率
- [ ] 持续关注外卖平台营养标识政策动向

---

## 6. 参考文献

### 照片识别能力与瓶颈

1. Shonkoff E, et al. *AI-based digital image dietary assessment methods compared to humans and ground truth: a systematic review.* 2023. https://pmc.ncbi.nlm.nih.gov/articles/PMC10836267/
2. Vedovelli L, et al. *Model architecture dominates nutritional estimation accuracy in vision-language systems.* Scientific Reports, 2026. https://www.nature.com/articles/s41598-026-58755-w
3. *Chinese Food Images for Full-cycle Nutrition Analysis Towards Diabetes Management* (DFood-TJ). Scientific Data, 2026. https://www.nature.com/articles/s41597-026-07334-9
4. Yan R, et al. *DietAI24 as a framework for comprehensive nutrition estimation using multimodal large language models.* Communications Medicine, 2025. https://doi.org/10.1038/s43856-025-01159-0
5. *Geometry-Enhanced Portion Estimation for Multimodal LLMs.* arXiv, 2026. https://arxiv.org/html/2607.16514
6. Feng Y, et al. *Large-scale image classification and nutrient estimation for Chinese dishes* (CNFOOD-241). 2025. https://doi.org/10.1016/j.jafr.2025.101733
7. Ye L, et al. *Seeing What's on the Plate: Composition-Aware Fine-Grained Food Recognition for Dietary Analysis.* Foods, 2026. https://doi.org/10.3390/foods15050931
8. *Agreement Between an AI-Based Meal Image Recognition System and the Weighed Dietary Record.* Nutrients, 2026. https://www.mdpi.com/2072-6643/18/6/980

### 外卖营养实测

9. Safefood. *Nutrition Take Out Series – Pizza, Burgers and Chinese Takeaways.* https://www.safefood.net/professional/research/pizza-burgers-chinese
10. Safefood. *What's in your Chinese Takeaway?*（全文 PDF）https://www.safefood.net/getmedia/d2b645c3-49ed-4f20-9f8e-d228ee2e8b95/Safefood-What-s-in-your-Chinese-Takeaway.pdf
11. Jaworowska A, et al. *Nutritional composition of takeaway food in the UK.* Nutrition & Food Science, 2014. https://doi.org/10.1108/nfs-08-2013-0093

### 数据源与工程实现

12. 《中国食物成分表标准版（第6版）》JSON 版 https://github.com/Sanotsu/china-food-composition-data
13. OpenNutrition 数据库 https://github.com/deadletterq/mcp-opennutrition
14. DeepSeek Function Calling 文档 https://api-docs.deepseek.com/guides/function_calling
15. DeepSeek 结构化输出兼容性回归案例 https://github.com/langgenius/dify/issues/29973
16. 外卖料理包/预制菜使用情况 https://zhuanlan.zhihu.com/p/645251175
17. 食物中的"隐藏油" https://health.cnr.cn/yg/20250511/t20250511_527165952.shtml
