<script setup lang="ts">
import { reactive, computed, watch } from 'vue'
import {
  calculateDiet,
  TRAINING_LEVEL_LABELS,
  PLAN_TYPE_LABELS,
} from '@/utils/dietCalculator'
import type { Gender, TrainingLevel, PlanType, DietResult } from '@/utils/dietCalculator'
import {
  calculateDietComposition,
  TRAINING_TIME_LABELS,
} from '@/utils/mealComposition'
import type { TrainingTime, DietComposition } from '@/utils/mealComposition'
import {
  CARB_FOODS,
  PROTEIN_FOODS,
  formatCarbOption,
  formatProteinOption,
  emptyFoodSelections,
} from '@/utils/optionalFoods'
import type { FoodSelections, MealFoodSelection } from '@/utils/optionalFoods'

// ---- localStorage 持久化 ----
const STORAGE_KEY = 'fitness-helper:diet-calculator-form'

interface StoredForm {
  gender: Gender
  height: number
  weight: number
  age: number
  trainingLevel: TrainingLevel
  cardioCalories: number
  planType: PlanType
  trainingTime: TrainingTime
}

const DEFAULT_FORM: StoredForm = {
  gender: 'male',
  height: 175,
  weight: 70,
  age: 25,
  trainingLevel: 'intermediate',
  cardioCalories: 0,
  planType: 'cut',
  trainingTime: 'morning_early',
}

function loadForm(): StoredForm {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // 只合并合法字段，保留默认值兜底
      return {
        gender: parsed.gender ?? DEFAULT_FORM.gender,
        height: typeof parsed.height === 'number' ? parsed.height : DEFAULT_FORM.height,
        weight: typeof parsed.weight === 'number' ? parsed.weight : DEFAULT_FORM.weight,
        age: typeof parsed.age === 'number' ? parsed.age : DEFAULT_FORM.age,
        trainingLevel: parsed.trainingLevel ?? DEFAULT_FORM.trainingLevel,
        cardioCalories:
          typeof parsed.cardioCalories === 'number' ? parsed.cardioCalories : DEFAULT_FORM.cardioCalories,
        planType: parsed.planType ?? DEFAULT_FORM.planType,
        trainingTime: parsed.trainingTime ?? DEFAULT_FORM.trainingTime,
      }
    }
  } catch {
    // localStorage 数据损坏，使用默认值
  }
  return { ...DEFAULT_FORM }
}

// ---- 表单状态 ----
const saved = loadForm()
const form = reactive<StoredForm>({ ...saved })

// 表单变化时自动保存
watch(
  () => ({ ...form }),
  (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  },
)

// ---- 计算结果 ----
const result = computed<DietResult>(() => calculateDiet(form))

// ---- 可选食物选择状态 ----
const FOOD_STORAGE_KEY = 'fitness-helper:food-selections'

function loadFoodSelections(): FoodSelections {
  try {
    const raw = localStorage.getItem(FOOD_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        trainingDay: parsed.trainingDay ?? {},
        restDay: parsed.restDay ?? {},
      }
    }
  } catch {
    // 数据损坏，使用空选择
  }
  return emptyFoodSelections()
}

const savedFoods = loadFoodSelections()
const foodSelections = reactive<FoodSelections>({ ...savedFoods })

// 食物选择变化时自动保存
watch(
  () => JSON.parse(JSON.stringify(foodSelections)),
  (val) => {
    localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(val))
  },
)

/** 更新单餐食物选择 */
function updateFoodSelection(
  day: 'trainingDay' | 'restDay',
  mealIndex: number,
  patch: Partial<MealFoodSelection>,
) {
  if (!foodSelections[day][mealIndex]) {
    foodSelections[day][mealIndex] = {}
  }
  Object.assign(foodSelections[day][mealIndex], patch)
}

/** 获取单餐食物选择 */
function getFoodSelection(day: 'trainingDay' | 'restDay', mealIndex: number): MealFoodSelection {
  return foodSelections[day][mealIndex] ?? {}
}

/** 根据餐食克数生成碳水食物选项 */
function getCarbOptions(carbGrams: number): { value: string; label: string }[] {
  if (carbGrams <= 0) return []
  return CARB_FOODS.map((f) => ({
    value: f.id,
    label: formatCarbOption(f, carbGrams),
  }))
}

/** 根据餐食克数生成蛋白质食物选项 */
function getProteinOptions(proteinGrams: number): { value: string; label: string }[] {
  if (proteinGrams <= 0) return []
  return PROTEIN_FOODS.map((f) => ({
    value: f.id,
    label: formatProteinOption(f, proteinGrams),
  }))
}

// ---- BMI 分类样式 ----
const bmiCategoryClass = computed(() => {
  const map: Record<string, string> = {
    underweight: 'bmi--underweight',
    normal: 'bmi--normal',
    overweight: 'bmi--overweight',
    obese: 'bmi--obese',
  }
  return map[result.value.bodyMetrics.bmiCategory] || ''
})

/** BMI 建议方向 */
const bmiRecommendation = computed(() => {
  const threshold = form.gender === 'male' ? 23 : 21
  const bmi = result.value.bodyMetrics.bmi
  if (bmi > threshold) {
    return { action: '减脂', className: 'bmi-tip--cut' }
  }
  return { action: '增肌', className: 'bmi-tip--bulk' }
})

// ---- 饮食组成 ----
const dietComposition = computed<DietComposition>(() =>
  calculateDietComposition(form.trainingTime, result.value.macroPlan),
)

// ---- 帮组方法 ----
const genderOptions: { value: Gender; label: string }[] = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
]

const trainingLevelOptions = (
  Object.entries(TRAINING_LEVEL_LABELS) as [TrainingLevel, string][]
).map(([value, label]) => ({ value, label }))

const planTypeOptions = (
  Object.entries(PLAN_TYPE_LABELS) as [PlanType, string][]
).map(([value, label]) => ({ value, label }))

const trainingTimeOptions = (
  Object.entries(TRAINING_TIME_LABELS) as [TrainingTime, string][]
).map(([value, label]) => ({ value, label }))
</script>

<template>
  <div class="calculator">
    <h1 class="calculator__title">生活化健身计算器</h1>

    <!-- 表单区域 -->
    <section class="card form-card">
      <h2 class="card__title">基本信息</h2>

      <div class="form-grid">
        <!-- 性别 -->
        <div class="field">
          <label class="field__label">性别</label>
          <div class="radio-group">
            <label
              v-for="opt in genderOptions"
              :key="opt.value"
              class="radio-btn"
              :class="{ 'radio-btn--active': form.gender === opt.value }"
            >
              <input
                v-model="form.gender"
                type="radio"
                :value="opt.value"
                class="radio-btn__input"
              />
              <span class="radio-btn__label">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 身高 -->
        <div class="field">
          <label class="field__label" for="height">身高 (cm)</label>
          <input
            id="height"
            v-model.number="form.height"
            type="number"
            class="field__input"
            min="100"
            max="250"
            placeholder="例如：175"
          />
        </div>

        <!-- 体重 -->
        <div class="field">
          <label class="field__label" for="weight">体重 (kg)</label>
          <input
            id="weight"
            v-model.number="form.weight"
            type="number"
            class="field__input"
            min="30"
            max="300"
            step="0.1"
            placeholder="例如：70"
          />
        </div>

        <!-- 年龄 -->
        <div class="field">
          <label class="field__label" for="age">年龄</label>
          <input
            id="age"
            v-model.number="form.age"
            type="number"
            class="field__input"
            min="10"
            max="100"
            placeholder="例如：25"
          />
        </div>

        <!-- 训练方案 -->
        <div class="field">
          <label class="field__label">训练方案</label>
          <div class="radio-group">
            <label
              v-for="opt in planTypeOptions"
              :key="opt.value"
              class="radio-btn"
              :class="{ 'radio-btn--active': form.planType === opt.value }"
            >
              <input
                v-model="form.planType"
                type="radio"
                :value="opt.value"
                class="radio-btn__input"
              />
              <span class="radio-btn__label">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 训练时间 -->
        <div class="field">
          <label class="field__label" for="trainingTime">训练时间</label>
          <select
            id="trainingTime"
            v-model="form.trainingTime"
            class="field__input field__select"
          >
            <option
              v-for="opt in trainingTimeOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- 力训熟练度 -->
        <div class="field">
          <label class="field__label">力训熟练度</label>
          <div class="radio-group">
            <label
              v-for="opt in trainingLevelOptions"
              :key="opt.value"
              class="radio-btn"
              :class="{ 'radio-btn--active': form.trainingLevel === opt.value }"
            >
              <input
                v-model="form.trainingLevel"
                type="radio"
                :value="opt.value"
                class="radio-btn__input"
              />
              <span class="radio-btn__label">{{ opt.label }}</span>
            </label>
          </div>
        </div>

        <!-- 有氧消耗 -->
        <div class="field">
          <label class="field__label" for="cardio">每日有氧消耗 (大卡)</label>
          <input
            id="cardio"
            v-model.number="form.cardioCalories"
            type="number"
            class="field__input"
            min="0"
            max="2000"
            placeholder="例如：100"
          />
          <span class="field__hint">无有氧运动则填 0</span>
        </div>
      </div>
    </section>

    <!-- 结果区域 -->
    <section class="results">
      <!-- 身体数值 -->
      <div class="card result-card">
        <h2 class="card__title">身体数值</h2>
        <div class="result-card__body">
          <div class="bmi-display">
            <span class="bmi-display__label">BMI 指数</span>
            <span class="bmi-display__value" :class="bmiCategoryClass">
              {{ result.bodyMetrics.bmi }}
            </span>
            <div class="bmi-display__tags">
              <span class="bmi-display__tag" :class="bmiCategoryClass">
                {{ result.bodyMetrics.bmiLabel }}
              </span>
              <span class="bmi-display__tip" :class="bmiRecommendation.className">
                建议{{ bmiRecommendation.action }}
              </span>
            </div>
          </div>
          <div class="bmi-legend">
            <div class="bmi-legend__item">
              <span class="bmi-legend__dot bmi-legend__dot--underweight"></span>
              &lt; 18.5 偏瘦
            </div>
            <div class="bmi-legend__item">
              <span class="bmi-legend__dot bmi-legend__dot--normal"></span>
              18.5–23.9 正常
            </div>
            <div class="bmi-legend__item">
              <span class="bmi-legend__dot bmi-legend__dot--overweight"></span>
              24–28 超重
            </div>
            <div class="bmi-legend__item">
              <span class="bmi-legend__dot bmi-legend__dot--obese"></span>
              &gt; 28 肥胖
            </div>
          </div>
        </div>
      </div>

      <!-- 热量设计 -->
      <div class="card result-card">
        <h2 class="card__title">热量设计</h2>
        <div class="result-card__body">
          <div class="calorie-columns">
            <!-- 左栏：基础数据 -->
            <div class="calorie-column">
              <h3 class="calorie-column__title">基础数据</h3>
              <dl class="calorie-list">
                <div class="calorie-list__item">
                  <dt>基础代谢 (a)</dt>
                  <dd>{{ result.calorieDesign.bmr }} <span class="unit">大卡</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>无运动总消耗 (b = a÷0.7)</dt>
                  <dd>{{ result.calorieDesign.noExerciseTdee }} <span class="unit">大卡</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>力训消耗 (c)</dt>
                  <dd>{{ result.calorieDesign.trainingCalories }} <span class="unit">大卡</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>有氧消耗 (d)</dt>
                  <dd>{{ result.calorieDesign.cardioCalories }} <span class="unit">大卡</span></dd>
                </div>
              </dl>
            </div>

            <!-- 右栏：平衡热量 + 应吃热量 -->
            <div class="calorie-column">
              <h3 class="calorie-column__title">平衡热量</h3>
              <dl class="calorie-list">
                <div class="calorie-list__item calorie-list__item--highlight">
                  <dt>力训日 (e1 = b+c+d)</dt>
                  <dd>
                    {{ result.calorieDesign.trainingDayBalanced }}
                    <span class="unit">大卡</span>
                  </dd>
                </div>
                <div class="calorie-list__item calorie-list__item--highlight">
                  <dt>休息日 (e2 = b+d)</dt>
                  <dd>
                    {{ result.calorieDesign.restDayBalanced }}
                    <span class="unit">大卡</span>
                  </dd>
                </div>
              </dl>

              <h3 class="calorie-column__title calorie-column__title--spaced">应吃热量</h3>
              <dl class="calorie-list">
                <div class="calorie-list__item calorie-list__item--target">
                  <dt>力训日 (f1 = e1×0.64)</dt>
                  <dd>
                    {{ result.calorieDesign.trainingDayTarget }}
                    <span class="unit">大卡</span>
                  </dd>
                </div>
                <div class="calorie-list__item calorie-list__item--target">
                  <dt>休息日 (f2 = e2×0.64)</dt>
                  <dd>
                    {{ result.calorieDesign.restDayTarget }}
                    <span class="unit">大卡</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 饮食总览 -->
      <div class="card result-card result-card--full">
        <h2 class="card__title">饮食总览</h2>
        <div class="result-card__body">
          <div class="macro-columns">
            <!-- 力训日 -->
            <div class="macro-column">
              <h3 class="macro-column__title">力训日</h3>
              <dl class="calorie-list">
                <div class="calorie-list__item">
                  <dt>碳水</dt>
                  <dd>{{ result.macroPlan.trainingDay.carbs }} <span class="unit">g</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>蛋白质</dt>
                  <dd>{{ result.macroPlan.trainingDay.protein }} <span class="unit">g</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>脂肪</dt>
                  <dd>{{ result.macroPlan.trainingDay.fat }} <span class="unit">g</span></dd>
                </div>
              </dl>
            </div>
            <!-- 休息日 -->
            <div class="macro-column">
              <h3 class="macro-column__title">休息日</h3>
              <dl class="calorie-list">
                <div class="calorie-list__item">
                  <dt>碳水</dt>
                  <dd>{{ result.macroPlan.restDay.carbs }} <span class="unit">g</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>蛋白质</dt>
                  <dd>{{ result.macroPlan.restDay.protein }} <span class="unit">g</span></dd>
                </div>
                <div class="calorie-list__item">
                  <dt>脂肪</dt>
                  <dd>{{ result.macroPlan.restDay.fat }} <span class="unit">g</span></dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- 饮食组成 -->
      <div class="card result-card result-card--full">
        <h2 class="card__title">饮食组成</h2>
        <div class="result-card__body">
          <div class="macro-columns">
            <!-- 力训日饮食 -->
            <div class="macro-column">
              <h3 class="macro-column__title">力训日饮食</h3>
              <div class="meal-table">
                <div class="meal-table__header">
                  <span class="meal-table__col meal-table__col--name">餐食</span>
                  <span class="meal-table__col meal-table__col--num">碳水(g)</span>
                  <span class="meal-table__col meal-table__col--num">蛋白质(g)</span>
                </div>
                <div
                  v-for="(meal, idx) in dietComposition.trainingDay"
                  :key="idx"
                >
                  <div class="meal-table__row">
                    <span class="meal-table__col meal-table__col--name">{{ meal.label }}</span>
                    <span class="meal-table__col meal-table__col--num">{{ meal.carbs }}</span>
                    <span class="meal-table__col meal-table__col--num">{{ meal.protein }}</span>
                  </div>
                  <div
                    v-if="!meal.label.includes('零食/夜宵')"
                    class="meal-table__food-row"
                  >
                    <span class="meal-table__col meal-table__col--name">
                      <select
                        class="food-select"
                        :value="getFoodSelection('trainingDay', idx).carb ?? ''"
                        @change="updateFoodSelection('trainingDay', idx, { carb: ($event.target as HTMLSelectElement).value || undefined })"
                      >
                        <option value="">—</option>
                        <option
                          v-for="opt in getCarbOptions(meal.carbs)"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </span>
                    <span class="meal-table__col meal-table__col--num">
                      <select
                        v-if="meal.protein > 0"
                        class="food-select"
                        :value="getFoodSelection('trainingDay', idx).protein ?? ''"
                        @change="updateFoodSelection('trainingDay', idx, { protein: ($event.target as HTMLSelectElement).value || undefined })"
                      >
                        <option value="">—</option>
                        <option
                          v-for="opt in getProteinOptions(meal.protein)"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 休息日饮食 -->
            <div class="macro-column">
              <h3 class="macro-column__title">休息日饮食</h3>
              <div class="meal-table">
                <div class="meal-table__header">
                  <span class="meal-table__col meal-table__col--name">餐食</span>
                  <span class="meal-table__col meal-table__col--num">碳水(g)</span>
                  <span class="meal-table__col meal-table__col--num">蛋白质(g)</span>
                </div>
                <div
                  v-for="(meal, idx) in dietComposition.restDay"
                  :key="idx"
                >
                  <div class="meal-table__row">
                    <span class="meal-table__col meal-table__col--name">{{ meal.label }}</span>
                    <span class="meal-table__col meal-table__col--num">{{ meal.carbs }}</span>
                    <span class="meal-table__col meal-table__col--num">{{ meal.protein }}</span>
                  </div>
                  <div
                    v-if="!meal.label.includes('零食/夜宵')"
                    class="meal-table__food-row"
                  >
                    <span class="meal-table__col meal-table__col--name">
                      <select
                        class="food-select"
                        :value="getFoodSelection('restDay', idx).carb ?? ''"
                        @change="updateFoodSelection('restDay', idx, { carb: ($event.target as HTMLSelectElement).value || undefined })"
                      >
                        <option value="">—</option>
                        <option
                          v-for="opt in getCarbOptions(meal.carbs)"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </span>
                    <span class="meal-table__col meal-table__col--num">
                      <select
                        v-if="meal.protein > 0"
                        class="food-select"
                        :value="getFoodSelection('restDay', idx).protein ?? ''"
                        @change="updateFoodSelection('restDay', idx, { protein: ($event.target as HTMLSelectElement).value || undefined })"
                      >
                        <option value="">—</option>
                        <option
                          v-for="opt in getProteinOptions(meal.protein)"
                          :key="opt.value"
                          :value="opt.value"
                        >
                          {{ opt.label }}
                        </option>
                      </select>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <p class="meal-table__note">
            脂肪为全天固定值：力训日 {{ result.macroPlan.trainingDay.fat }}g，休息日 {{ result.macroPlan.restDay.fat }}g，不按餐分配。
          </p>
        </div>
      </div>
    </section>

    <footer class="attribution">
      计算公式来源于 B站 <a href="https://www.bilibili.com/video/BV1zu4m1N76R" target="_blank" rel="noopener">@好人松松</a>
    </footer>
  </div>
</template>

<style scoped>
/* ===== 变量 ===== */
.calculator {
  --color-bg: #111827;
  --color-card: #1f2937;
  --color-text: #e5e7eb;
  --color-text-secondary: #9ca3af;
  --color-text-muted: #6b7280;
  --color-border: #374151;
  --color-primary: #60a5fa;
  --color-primary-bg: rgba(96, 165, 250, 0.12);
  --color-target-bg: rgba(248, 113, 113, 0.12);
  --color-target-text: #fca5a5;
  --radius: 12px;
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* ===== 页面容器 ===== */
.calculator {
  max-width: 85vw;
  margin: 0 auto;
  padding: 24px 16px 48px;
}

@media (max-width: 639px) {
  .calculator {
    max-width: 95vw;
  }
}

.calculator__title {
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
  color: #f3f4f6;
}

/* ===== 卡片 ===== */
.card {
  background: var(--color-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  border: 1px solid var(--color-border);
  padding: 20px 24px;
  margin-bottom: 20px;
}

.card__title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px;
  color: #f3f4f6;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
}

/* ===== 表单 ===== */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field--wide {
  grid-column: 1 / -1;
}

.field__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

.field__input {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 15px;
  color: var(--color-text);
  background: #111827;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  width: 100%;
}

.field__input::placeholder {
  color: var(--color-text-muted);
}

.field__input:focus {
  border-color: var(--color-primary);
}

.field__hint {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* ===== 单选按钮组 ===== */
.radio-group {
  display: flex;
  gap: 8px;
}

.radio-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  background: #111827;
}

.radio-btn:hover {
  border-color: var(--color-primary);
}

.radio-btn--active {
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.radio-btn--active .radio-btn__label {
  color: #111827;
  font-weight: 600;
}

.radio-btn__input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-btn__label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

/* ===== 结果区域 ===== */
.results {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

@media (max-width: 639px) {
  .results {
    grid-template-columns: 1fr;
  }
}

.result-card {
  display: flex;
  flex-direction: column;
}

.result-card__body {
  flex: 1;
}

.result-card--full {
  grid-column: 1 / -1;
}

/* ===== 饮食总览双栏 ===== */
.macro-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 639px) {
  .macro-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.macro-column {
  min-width: 0;
}

.macro-column__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

/* ===== BMI 展示 ===== */
.bmi-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
}

.bmi-display__label {
  font-size: 13px;
  color: var(--color-text-secondary);
}

.bmi-display__value {
  font-size: 48px;
  font-weight: 700;
  line-height: 1;
}

.bmi-display__tag {
  font-size: 14px;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 20px;
}

/* BMI 分类颜色 — 深色背景上调亮 */
.bmi--underweight {
  color: #fbbf24;
}

.bmi--normal {
  color: #4ade80;
}

.bmi--overweight {
  color: #fb923c;
}

.bmi--obese {
  color: #f87171;
}

.bmi-display__tag.bmi--underweight {
  background: rgba(251, 191, 36, 0.15);
  color: #fbbf24;
}

.bmi-display__tag.bmi--normal {
  background: rgba(74, 222, 128, 0.15);
  color: #4ade80;
}

.bmi-display__tag.bmi--overweight {
  background: rgba(251, 146, 60, 0.15);
  color: #fb923c;
}

.bmi-display__tag.bmi--obese {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

.bmi-display__tags {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bmi-display__tip {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 16px;
  border-radius: 20px;
}

.bmi-display__tip.bmi-tip--cut {
  background: rgba(248, 113, 113, 0.12);
  color: #fca5a5;
}

.bmi-display__tip.bmi-tip--bulk {
  background: rgba(96, 165, 250, 0.12);
  color: #93c5fd;
}

/* BMI 图例 */
.bmi-legend {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border);
}

.bmi-legend__item {
  font-size: 12px;
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.bmi-legend__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.bmi-legend__dot--underweight {
  background: #fbbf24;
}

.bmi-legend__dot--normal {
  background: #4ade80;
}

.bmi-legend__dot--overweight {
  background: #fb923c;
}

.bmi-legend__dot--obese {
  background: #f87171;
}

/* ===== 热量双栏布局 ===== */
.calorie-columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 639px) {
  .calorie-columns {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

.calorie-column {
  min-width: 0;
}

.calorie-column__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-border);
}

.calorie-column__title--spaced {
  margin-top: 16px;
}

/* ===== 热量列表 ===== */
.calorie-list {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.calorie-list__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
}

.calorie-list__item dt {
  font-size: 13px;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.calorie-list__item dd {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  white-space: nowrap;
}

.calorie-list__item .unit {
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-muted);
  margin-left: 2px;
}

.calorie-list__item--sub {
  padding-left: 16px;
}

.calorie-list__item--sub dt {
  font-size: 12px;
  color: var(--color-text-muted);
}

.calorie-list__item--highlight {
  background: var(--color-primary-bg);
}

.calorie-list__item--highlight dt {
  font-weight: 500;
  color: var(--color-primary);
}

.calorie-list__item--target {
  background: var(--color-target-bg);
}

.calorie-list__item--target dt {
  font-weight: 500;
  color: var(--color-target-text);
}

.calorie-list__item--target dd {
  color: var(--color-target-text);
}

.calorie-list__divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

/* ===== 底部署名 ===== */
.attribution {
  text-align: center;
  padding: 16px 0 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.attribution a {
  color: var(--color-primary);
  text-decoration: none;
}

.attribution a:hover {
  text-decoration: underline;
}

/* ===== Select 下拉框 ===== */
.field__select {
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
}

/* ===== 饮食组成餐食表格 ===== */
.meal-table {
  display: flex;
  flex-direction: column;
}

.meal-table__header {
  display: flex;
  padding: 6px 8px;
  border-bottom: 1px solid var(--color-border);
}

.meal-table__header .meal-table__col {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-muted);
}

.meal-table__row {
  display: flex;
  padding: 7px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.meal-table__row:hover {
  background: rgba(255, 255, 255, 0.03);
}

.meal-table__row + .meal-table__row {
  border-top: 1px solid rgba(55, 65, 81, 0.4);
}

.meal-table__col {
  display: flex;
  align-items: center;
}

.meal-table__col--name {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.meal-table__col--num {
  width: 72px;
  justify-content: flex-end;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.meal-table__note {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
  text-align: center;
}

/* ===== 可选食物下拉行 ===== */
.meal-table__food-row {
  display: flex;
  flex-wrap: wrap;
  padding: 4px 8px 8px;
  border-top: 1px solid rgba(55, 65, 81, 0.2);
  gap: 8px;
}

.meal-table__food-row .meal-table__col {
  flex: 1;
  min-width: 0;
}

.meal-table__food-row .meal-table__col--num {
  justify-content: flex-start;
  width: auto;
}

@media (max-width: 639px) {
  .meal-table__food-row .meal-table__col {
    flex: 1 1 100%;
  }
}

.food-select {
  width: 100%;
  height: 30px;
  padding: 0 8px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: #111827;
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%236b7280' d='M5 6.5L1.5 3h7z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 6px center;
  padding-right: 22px;
  transition: border-color 0.2s;
}

.food-select:hover {
  border-color: var(--color-primary);
}

.food-select:focus {
  border-color: var(--color-primary);
}

.food-select option {
  color: var(--color-text);
  background: #1f2937;
}
</style>
