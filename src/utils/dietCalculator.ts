// 类型定义

export type Gender = 'male' | 'female'

export type TrainingLevel = 'beginner' | 'intermediate' | 'advanced'

export type PlanType = 'cut' | 'bulk'

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export interface UserInput {
  gender: Gender
  height: number // cm
  weight: number // kg
  age: number
  trainingLevel: TrainingLevel
  cardioCalories: number // 每日平均有氧消耗(大卡)
  planType: PlanType
}

export interface BodyMetrics {
  bmi: number
  bmiCategory: BmiCategory
  bmiLabel: string
}

export interface CalorieDesign {
  bmr: number // 基础代谢 a
  noExerciseTdee: number // 无运动总消耗 b
  trainingCalories: number // 力训消耗 c
  cardioCalories: number // 有氧消耗 d
  trainingDayBalanced: number // 力训日平衡热量 e1
  restDayBalanced: number // 休息日平衡热量 e2
  trainingDayTarget: number // 力训日应吃热量 f1
  restDayTarget: number // 休息日应吃热量 f2
}

/** 配额表单元格：力训日碳水/休息日碳水/蛋白质 (g/kg) */
export interface QuotaEntry {
  trainingDayCarbs: number
  restDayCarbs: number
  protein: number
}

/** 每日宏量营养素克数 */
export interface MacroDay {
  carbs: number
  protein: number
  fat: number
}

/** 饮食总览 */
export interface MacroPlan {
  trainingDay: MacroDay
  restDay: MacroDay
}

export interface DietResult {
  bodyMetrics: BodyMetrics
  calorieDesign: CalorieDesign
  macroPlan: MacroPlan
}

// BMI 分类标签映射
const BMI_LABELS: Record<BmiCategory, string> = {
  underweight: '偏瘦',
  normal: '正常',
  overweight: '超重',
  obese: '肥胖',
}

// 力训消耗映射
const TRAINING_CALORIES: Record<Gender, Record<TrainingLevel, number>> = {
  male: { beginner: 150, intermediate: 200, advanced: 250 },
  female: { beginner: 100, intermediate: 150, advanced: 200 },
}

// 力训熟练度标签
export const TRAINING_LEVEL_LABELS: Record<TrainingLevel, string> = {
  beginner: '新手',
  intermediate: '有基础',
  advanced: '老手',
}

// 训练方案标签
export const PLAN_TYPE_LABELS: Record<PlanType, string> = {
  cut: '减脂',
  bulk: '增肌',
}

// ===== 配额查找 =====

import { QUOTA_TABLES } from './quotaTables'

/**
 * 找到数组中与目标值最接近的元素的索引
 */
function closestIndex(arr: number[], target: number): number {
  let best = 0
  let bestDist = Math.abs(arr[0]! - target)
  for (let i = 1; i < arr.length; i++) {
    const dist = Math.abs(arr[i]! - target)
    if (dist < bestDist) {
      bestDist = dist
      best = i
    }
  }
  return best
}

/**
 * 从配额表中查找最近似身高体重的配额条目。
 * 如果精确匹配单元格为 null，则螺旋向外搜索最近的非空单元格。
 */
function lookupQuota(
  gender: Gender,
  planType: PlanType,
  weight: number,
  height: number,
): QuotaEntry {
  const table = QUOTA_TABLES[gender][planType]
  const wi = closestIndex(table.weights, weight)
  const hi = closestIndex(table.heights, height)

  // 直接命中
  const cell = table.data[wi]![hi]!
  if (cell !== null) {
    return cell
  }

  // 螺旋向外搜索最近的非空单元格
  const maxR = Math.max(table.weights.length, table.heights.length)
  for (let r = 1; r <= maxR; r++) {
    let bestEntry: QuotaEntry | null = null
    let bestManhattan = Infinity

    for (let dw = -r; dw <= r; dw++) {
      for (let dh = -r; dh <= r; dh++) {
        if (Math.abs(dw) + Math.abs(dh) !== r) continue
        const nw = wi + dw
        const nh = hi + dh
        if (nw < 0 || nw >= table.weights.length) continue
        if (nh < 0 || nh >= table.heights.length) continue
        const entry = table.data[nw]![nh]!
        if (entry !== null) {
          // 权重：体重距离更重要（每kg vs 每cm），给体重大约2倍权重
          const weightDist = Math.abs(table.weights[nw]! - weight) * 2
          const heightDist = Math.abs(table.heights[nh]! - height)
          const dist = weightDist + heightDist
          if (dist < bestManhattan) {
            bestManhattan = dist
            bestEntry = entry
          }
        }
      }
    }

    if (bestEntry !== null) {
      return bestEntry
    }
  }

  // 极端情况：整个表都是 null，返回默认值
  return { trainingDayCarbs: 0, restDayCarbs: 0, protein: 0 }
}

// ===== 脂肪计算 =====

/**
 * 计算每日脂肪配额
 * 男性：60g，120kg以上→70g
 * 女性：50g
 */
export function calculateFat(gender: Gender, weight: number): number {
  if (gender === 'male') {
    return weight >= 120 ? 70 : 60
  }
  return 50
}

// ===== 饮食总览 =====

/**
 * 根据配额表计算完整的宏量营养素方案
 */
function calculateMacroPlan(
  gender: Gender,
  planType: PlanType,
  weight: number,
  height: number,
): MacroPlan {
  const quota = lookupQuota(gender, planType, weight, height)
  const fat = calculateFat(gender, weight)

  return {
    trainingDay: {
      carbs: Math.round(quota.trainingDayCarbs * weight),
      protein: Math.round(quota.protein * weight),
      fat,
    },
    restDay: {
      carbs: Math.round(quota.restDayCarbs * weight),
      protein: Math.round(quota.protein * weight),
      fat,
    },
  }
}

// ===== 已有计算函数 =====

/**
 * 计算 BMI 指数
 * BMI = 体重(kg) / 身高(m)²
 */
export function calculateBMI(weight: number, height: number): BodyMetrics {
  const heightM = height / 100
  const bmi = weight / (heightM * heightM)
  const roundedBmi = Math.round(bmi * 10) / 10

  let category: BmiCategory
  if (bmi < 18.5) {
    category = 'underweight'
  } else if (bmi < 24) {
    category = 'normal'
  } else if (bmi <= 28) {
    category = 'overweight'
  } else {
    category = 'obese'
  }

  return {
    bmi: roundedBmi,
    bmiCategory: category,
    bmiLabel: BMI_LABELS[category],
  }
}

/**
 * 计算基础代谢 (Mifflin-St Jeor 方程)
 * 男: 体重×9.99 + 身高×6.25 - 年龄×4.92 + 5
 * 女: 体重×9.99 + 身高×6.25 - 年龄×4.92 - 161
 */
export function calculateBMR(
  gender: Gender,
  weight: number,
  height: number,
  age: number,
): number {
  const base = weight * 9.99 + height * 6.25 - age * 4.92
  const bmr = gender === 'male' ? base + 5 : base - 161
  return Math.round(bmr)
}

/**
 * 获取力训消耗
 */
export function getTrainingCalories(gender: Gender, level: TrainingLevel): number {
  return TRAINING_CALORIES[gender][level]
}

/**
 * 计算完整的热量设计方案
 */
export function calculateDiet(userInput: UserInput): DietResult {
  const { gender, height, weight, age, trainingLevel, cardioCalories, planType } = userInput

  // 身体数值
  const bodyMetrics = calculateBMI(weight, height)

  // 基础代谢 a
  const bmr = calculateBMR(gender, weight, height, age)

  // 无运动总消耗 b = a / 0.7
  const noExerciseTdee = Math.round(bmr / 0.7)

  // 力训消耗 c
  const trainingCalories = getTrainingCalories(gender, trainingLevel)

  // 有氧消耗 d
  const d = cardioCalories

  // 力训日平衡热量 e1 = b + c + d
  const trainingDayBalanced = noExerciseTdee + trainingCalories + d

  // 休息日平衡热量 e2 = b + d
  const restDayBalanced = noExerciseTdee + d

  // 应吃热量 = 平衡热量 × 0.64
  const trainingDayTarget = Math.round(trainingDayBalanced * 0.64)
  const restDayTarget = Math.round(restDayBalanced * 0.64)

  // 饮食总览
  const macroPlan = calculateMacroPlan(gender, planType, weight, height)

  return {
    bodyMetrics,
    calorieDesign: {
      bmr,
      noExerciseTdee,
      trainingCalories,
      cardioCalories: d,
      trainingDayBalanced,
      restDayBalanced,
      trainingDayTarget,
      restDayTarget,
    },
    macroPlan,
  }
}
