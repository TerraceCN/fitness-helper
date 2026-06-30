# 🏋️ 生活化健身计算器

基于 Vue 3 的单页应用，帮助健身爱好者根据个人身体数据计算饮食方案。输入性别、身高、体重、年龄、训练方案等信息，自动生成 BMI 分析、热量设计、宏量营养素配额以及每餐饮食组成。

## ✨ 功能

- **身体数值分析** — 根据身高体重计算 BMI 指数，分类展示（偏瘦/正常/超重/肥胖），并根据性别自动给出减脂/增肌建议
- **热量设计** — 基于 Mifflin-St Jeor 方程计算基础代谢，结合力训消耗和有氧消耗，生成力训日与休息日的平衡热量及应吃热量
- **饮食总览** — 通过内置配额表（覆盖男/女各身高体重范围）计算每日碳水、蛋白质、脂肪克数目标
- **饮食组成** — 根据训练时间（早饭后练/午饭前练/晚饭后练/夜里练等 7 种模式）自动分配每餐的碳水和蛋白质克数
- **可选食物** — 提供 21 种碳水资源和 10 种蛋白质资源，自动换算食物重量/数量，支持每餐独立选择
- **表单持久化** — 表单输入和食物选择自动保存至 localStorage，刷新不丢失

## 🖼️ 界面预览

界面采用深色主题设计，响应式布局适配桌面端和移动端：

- 左侧：基本信息表单
- 右侧：计算结果展示（身体数值、热量设计、饮食总览、饮食组成）

## 🚀 快速开始

### 环境要求

- Node.js `^22.18.0` 或 `>=24.12.0`
- npm

### 安装与运行

```sh
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npm run type-check

# 代码检查与格式化
npm run lint
npm run format
```

## 📐 计算规则

详细计算规则见 [`docs/计算规则.md`](docs/计算规则.md)。

## 🛠️ 技术栈

| 类别     | 技术                         |
| -------- | ---------------------------- |
| 框架     | Vue 3 (Composition API)      |
| 语言     | TypeScript                   |
| 构建     | Vite                         |
| UI       | Tailwind CSS（定制深色主题） |
| 状态管理 | Pinia                        |
| 路由     | Vue Router                   |
| 代码质量 | ESLint + oxlint + Prettier   |

## 📁 项目结构

```
src/
├── App.vue                    # 根组件
├── main.ts                    # 应用入口
├── router/index.ts            # 路由配置（/ → /diet-calculator）
├── stores/counter.ts          # Pinia 示例 store
├── utils/
│   ├── dietCalculator.ts      # 核心计算：BMI / BMR / 热量 / 宏量营养素
│   ├── mealComposition.ts     # 餐食分配：训练时间 → 每餐克数
│   ├── optionalFoods.ts       # 可选食物数据与换算
│   └── quotaTables.ts         # 配额表数据（男/女 × 减脂/增肌）
├── views/
│   └── DietCalculator.vue     # 主页面：表单 + 结果展示
└── docs/
    └── 计算规则.md             # 详细的饮食计算规则文档
```

## 📝 致谢

计算公式来源于 B站 [@好人松松](https://www.bilibili.com/video/BV1zu4m1N76R)。

## 📄 许可

本项目基于 [MIT License](LICENSE) 开源。
