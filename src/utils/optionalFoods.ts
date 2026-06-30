// ===== 类型定义 =====

/** 碳水食物 */
export interface CarbFood {
  id: string
  name: string
  percentage: number // e.g., 75 means 75%
}

/** 常规蛋白质食物（按百分比） */
export interface PercentProteinFood {
  id: string
  name: string
  percentage: number
}

/** 特殊蛋白质食物（按固定克数/单位） */
export interface SpecialProteinFood {
  id: string
  name: string
  proteinPerUnit: number
  unitName: string
  unitAmount?: number // 如 250 表示 250ml
}

export type ProteinFood = PercentProteinFood | SpecialProteinFood

/** 帮助判断特殊蛋白质 */
export function isSpecialProtein(food: ProteinFood): food is SpecialProteinFood {
  return 'proteinPerUnit' in food
}

// ===== 食物数据 =====

export const CARB_FOODS: CarbFood[] = [
  { id: 'raw_rice', name: '生米', percentage: 75 },
  { id: 'cooked_rice_soft', name: '熟米饭（软）', percentage: 25 },
  { id: 'cooked_rice_medium', name: '熟米饭（中）', percentage: 30 },
  { id: 'cooked_rice_hard', name: '熟米饭（硬）', percentage: 35 },
  { id: 'rice_porridge', name: '米粥', percentage: 15 },
  { id: 'rice_noodle_dry', name: '米线（干）', percentage: 75 },
  { id: 'rice_noodle_wet', name: '米线（湿）', percentage: 33 },
  { id: 'rice_roll', name: '肠粉', percentage: 20 },
  { id: 'toast', name: '吐司面包', percentage: 50 },
  { id: 'steamed_bun', name: '馒头花卷', percentage: 50 },
  { id: 'noodle_dry', name: '挂面（生）', percentage: 70 },
  { id: 'pasta_dry', name: '意面（生）', percentage: 70 },
  { id: 'fresh_noodle', name: '鲜面（生）', percentage: 65 },
  { id: 'noodle_cooked', name: '面条（熟）', percentage: 23 },
  { id: 'oatmeal_dry', name: '燕麦片（干）', percentage: 60 },
  { id: 'oat_bran_dry', name: '燕麦麸片（干）', percentage: 45 },
  { id: 'lotus_root_powder', name: '藕粉（干）', percentage: 90 },
  { id: 'waxy_corn', name: '糯玉米', percentage: 33 },
  { id: 'sweet_corn', name: '甜玉米', percentage: 18 },
  { id: 'potato', name: '土豆', percentage: 18 },
  { id: 'sweet_potato', name: '红薯', percentage: 20 },
]

export const PROTEIN_FOODS: ProteinFood[] = [
  { id: 'lean_meat_raw', name: '瘦肉（生）', percentage: 20 },
  { id: 'lean_meat_cooked', name: '瘦肉（熟）', percentage: 25 },
  { id: 'organ_meat_cooked', name: '肝肾肚血（熟）', percentage: 20 },
  { id: 'protein_powder', name: '蛋白粉', percentage: 75 },
  { id: 'egg', name: '鸡蛋', proteinPerUnit: 6, unitName: '个' },
  { id: 'milk', name: '牛奶', proteinPerUnit: 9, unitName: 'ml', unitAmount: 250 },
  { id: 'egg1_milk', name: '鸡蛋+牛奶', proteinPerUnit: 14, unitName: '份' },
  { id: 'egg2_milk', name: '2个鸡蛋+牛奶', proteinPerUnit: 21, unitName: '份' },
  { id: 'egg3_milk', name: '3个鸡蛋+牛奶', proteinPerUnit: 27, unitName: '份' },
  { id: 'egg3_milk2', name: '3个鸡蛋+2盒牛奶', proteinPerUnit: 36, unitName: '份' },
]

// ===== 格式化帮助函数 =====

/** 计算碳水食物克数并返回格式化字符串 */
export function formatCarbOption(food: CarbFood, carbGrams: number): string {
  const foodGrams = Math.round(carbGrams / (food.percentage / 100))
  return `${food.name}（${food.percentage}%）：${foodGrams}g`
}

/** 计算蛋白质食物克数并返回格式化字符串 */
export function formatProteinOption(food: ProteinFood, proteinGrams: number): string {
  if (isSpecialProtein(food)) {
    const rawUnits = proteinGrams / food.proteinPerUnit
    if (food.id === 'milk') {
      // 牛奶：每250ml含9g蛋白质
      const ml = Math.round(rawUnits * (food.unitAmount ?? 250))
      return `${food.name}（${food.proteinPerUnit}g/${food.unitAmount}${food.unitName}）：${ml}${food.unitName}`
    }
    if (food.unitName === '份') {
      // 鸡蛋+牛奶组合：每份含固定克数
      const servings = Math.round(rawUnits * 10) / 10
      return `${food.name}（${food.proteinPerUnit}g/${food.unitName}）：${servings}${food.unitName}`
    }
    // 鸡蛋：每个含6g蛋白质
    const eggs = Math.round(rawUnits * 10) / 10
    return `${food.name}（${food.proteinPerUnit}g/${food.unitName}）：${eggs}${food.unitName}`
  }
  const foodGrams = Math.round(proteinGrams / (food.percentage / 100))
  return `${food.name}（${food.percentage}%）：${foodGrams}g`
}

// ===== localStorage 食物选择类型 =====

/** 单餐食物选择 */
export interface MealFoodSelection {
  carb?: string // carb food id
  protein?: string // protein food id
}

/** 所有餐食的食物选择 */
export interface FoodSelections {
  trainingDay: Record<string, MealFoodSelection> // key = meal index
  restDay: Record<string, MealFoodSelection>
}

/** 默认空选择 */
export function emptyFoodSelections(): FoodSelections {
  return { trainingDay: {}, restDay: {} }
}
