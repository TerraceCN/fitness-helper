import type { MacroPlan } from './dietCalculator'

// ===== 类型定义 =====

/** 训练时间选项 */
export type TrainingTime =
  | 'morning_early'   // 早饭后练（早起）
  | 'morning_late'    // 早饭后练（晚起）
  | 'before_lunch'    // 午饭前练
  | 'after_lunch'     // 午饭后练
  | 'before_dinner'   // 晚饭前练
  | 'after_dinner'    // 晚饭后练
  | 'night'           // 夜里练

/** 训练时间标签 */
export const TRAINING_TIME_LABELS: Record<TrainingTime, string> = {
  morning_early: '早饭后练（早起）',
  morning_late: '早饭后练（晚起）',
  before_lunch: '午饭前练',
  after_lunch: '午饭后练',
  before_dinner: '晚饭前练',
  after_dinner: '晚饭后练',
  night: '夜里练',
}

/** 餐食槽位定义 */
export interface MealSlotDef {
  label: string
  carbPct: number   // 碳水占全天配额百分比
  proteinPct: number // 蛋白质占全天配额百分比
}

/** 单日餐食计划 */
export interface DayMealDef {
  meals: MealSlotDef[]
}

/** 力训日各训练时间的餐食计划 */
export const TRAINING_DAY_MEALS: Record<TrainingTime, DayMealDef> = {
  morning_early: {
    meals: [
      { label: '早饭（练前餐）', carbPct: 15, proteinPct: 20 },
      { label: '练后餐', carbPct: 35, proteinPct: 20 },
      { label: '午饭（其他餐）', carbPct: 20, proteinPct: 20 },
      { label: '晚饭（其他餐）', carbPct: 20, proteinPct: 20 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  morning_late: {
    meals: [
      { label: '早饭（练前餐）', carbPct: 20, proteinPct: 20 },
      { label: '午饭（练后餐）', carbPct: 40, proteinPct: 30 },
      { label: '晚饭（其他餐）', carbPct: 30, proteinPct: 30 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  before_lunch: {
    meals: [
      { label: '早饭', carbPct: 20, proteinPct: 20 },
      { label: '练前餐', carbPct: 15, proteinPct: 0 },
      { label: '午饭（练后餐）', carbPct: 35, proteinPct: 0 },
      { label: '晚饭（其他餐）', carbPct: 20, proteinPct: 30 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  after_lunch: {
    meals: [
      { label: '早饭', carbPct: 20, proteinPct: 20 },
      { label: '午饭（练前餐）', carbPct: 15, proteinPct: 0 },
      { label: '练后餐', carbPct: 35, proteinPct: 30 },
      { label: '晚饭（其他餐）', carbPct: 20, proteinPct: 30 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  before_dinner: {
    meals: [
      { label: '早饭', carbPct: 20, proteinPct: 20 },
      { label: '午饭（其他餐）', carbPct: 20, proteinPct: 30 },
      { label: '练前餐', carbPct: 15, proteinPct: 0 },
      { label: '晚饭（练后餐）', carbPct: 35, proteinPct: 30 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  after_dinner: {
    meals: [
      { label: '早饭', carbPct: 20, proteinPct: 20 },
      { label: '午饭（其他餐）', carbPct: 20, proteinPct: 30 },
      { label: '晚饭（练前餐）', carbPct: 15, proteinPct: 0 },
      { label: '练后餐', carbPct: 35, proteinPct: 30 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
  night: {
    meals: [
      { label: '早饭', carbPct: 20, proteinPct: 20 },
      { label: '午饭（其他餐）', carbPct: 20, proteinPct: 20 },
      { label: '晚饭（其他餐）', carbPct: 20, proteinPct: 20 },
      { label: '练后餐', carbPct: 30, proteinPct: 20 },
      { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
    ],
  },
}

/** 休息日餐食计划 */
export const REST_DAY_MEALS: DayMealDef = {
  meals: [
    { label: '早饭', carbPct: 20, proteinPct: 20 },
    { label: '午饭', carbPct: 35, proteinPct: 30 },
    { label: '晚饭', carbPct: 35, proteinPct: 30 },
    { label: '零食/夜宵', carbPct: 10, proteinPct: 20 },
  ],
}

// ===== 计算结果类型 =====

/** 单餐计算结果 */
export interface MealResult {
  label: string
  carbs: number   // 碳水克数
  protein: number // 蛋白质克数
}

/** 饮食组成计算结果 */
export interface DietComposition {
  trainingDay: MealResult[]
  restDay: MealResult[]
}

// ===== 计算函数 =====

/**
 * 根据配额百分比计算单餐克数
 * 碳水/蛋白质克数 = 全天总克数 × 占比%
 */
function calcMealGrams(totalGrams: number, pct: number): number {
  return Math.round(totalGrams * (pct / 100))
}

/**
 * 将餐食槽位定义转换为带克数的计算结果
 * 蛋白质占比为0代表该餐不吃蛋白质
 */
function buildMealResults(defs: MealSlotDef[], macro: { carbs: number; protein: number }): MealResult[] {
  return defs.map((def) => ({
    label: def.label,
    carbs: calcMealGrams(macro.carbs, def.carbPct),
    protein: def.proteinPct === 0 ? 0 : calcMealGrams(macro.protein, def.proteinPct),
  }))
}

/**
 * 计算完整的饮食组成方案
 */
export function calculateDietComposition(
  trainingTime: TrainingTime,
  macroPlan: MacroPlan,
): DietComposition {
  const trainingDayDef = TRAINING_DAY_MEALS[trainingTime]

  return {
    trainingDay: buildMealResults(trainingDayDef.meals, macroPlan.trainingDay),
    restDay: buildMealResults(REST_DAY_MEALS.meals, macroPlan.restDay),
  }
}
