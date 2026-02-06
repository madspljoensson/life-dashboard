import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { nutrition as nutritionApi } from '../lib/api'
import type { MealEntry, WaterIntake, DailyTotals, NutritionTrend } from '../types'

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const

export default function Nutrition() {
  const today = format(new Date(), 'yyyy-MM-dd')

  const [meals, setMeals] = useState<MealEntry[]>([])
  const [totals, setTotals] = useState<DailyTotals | null>(null)
  const [trends, setTrends] = useState<NutritionTrend[]>([])
  const [water, setWater] = useState<WaterIntake | null>(null)
  const [loading, setLoading] = useState(true)
  const [chartDays, setChartDays] = useState<7 | 30>(7)

  // Form state
  const [mealType, setMealType] = useState('Breakfast')
  const [description, setDescription] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchData = async () => {
    try {
      const [mealsData, totalsData, trendsData, waterData] = await Promise.allSettled([
        nutritionApi.getMeals(today),
        nutritionApi.getDailyTotals(today),
        nutritionApi.getTrends(chartDays),
        nutritionApi.getWater(today),
      ])

      if (mealsData.status === 'fulfilled') setMeals(mealsData.value)
      if (totalsData.status === 'fulfilled') setTotals(totalsData.value)
      if (trendsData.status === 'fulfilled') setTrends(trendsData.value)
      if (waterData.status === 'fulfilled') setWater(waterData.value)
    } catch (err) {
      console.error('Failed to fetch nutrition data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    nutritionApi.getTrends(chartDays).then(setTrends).catch(() => {})
  }, [chartDays])

  const handleLogMeal = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      const data: Record<string, unknown> = {
        date: today,
        meal_type: mealType,
        description: description.trim(),
      }
      if (calories) data.calories = parseInt(calories)
      if (protein) data.protein_g = parseFloat(protein)
      if (carbs) data.carbs_g = parseFloat(carbs)
      if (fat) data.fat_g = parseFloat(fat)

      await nutritionApi.logMeal(data)
      setDescription('')
      setCalories('')
      setProtein('')
      setCarbs('')
      setFat('')
      fetchData()
    } catch (err) {
      console.error('Failed to log meal:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWaterChange = async (delta: number) => {
    const current = water?.glasses ?? 0
    const next = Math.max(0, current + delta)
    try {
      if (water?.id) {
        const result = await nutritionApi.updateWater(today, { glasses: next })
        setWater(result)
      } else {
        const result = await nutritionApi.logWater({ date: today, glasses: next, target: 8 })
        setWater(result)
      }
    } catch (err) {
      console.error('Failed to update water:', err)
    }
  }

  // Group meals by type
  const mealsByType = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = meals.filter(m => m.meal_type === type)
    return acc
  }, {} as Record<string, MealEntry[]>)

  const formattedTrends = trends.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'MMM d'),
  }))

  const waterGlasses = water?.glasses ?? 0
  const waterTarget = water?.target ?? 8

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #1a1a24',
    backgroundColor: '#0f0f13',
    color: '#f0f0f2',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    color: '#5a5a66',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
    display: 'block',
    marginBottom: '6px',
  }

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%235a5a66'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 10px center',
    backgroundSize: '16px',
    paddingRight: '36px',
  }

  const toggleButtonStyle = (active: boolean): React.CSSProperties => ({
    padding: '6px 12px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: active ? '#8b7cf6' : '#0f0f13',
    color: active ? '#fff' : '#5a5a66',
  })

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontSize: '13px', color: '#5a5a66' }}>Loading</span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Nutrition</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Fuel tracking</p>
      </div>

      {/* Daily Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Calories" value={totals?.total_calories ?? 0} subtitle="Today" accent="#8b7cf6" />
        <StatCard label="Protein" value={totals?.total_protein ? `${Math.round(totals.total_protein)}g` : '0g'} subtitle="Today" accent="#4ade80" />
        <StatCard label="Carbs" value={totals?.total_carbs ? `${Math.round(totals.total_carbs)}g` : '0g'} subtitle="Today" accent="#60a5fa" />
        <StatCard label="Fat" value={totals?.total_fat ? `${Math.round(totals.total_fat)}g` : '0g'} subtitle="Today" accent="#fbbf24" />
      </div>

      {/* Meal Logging Form */}
      <Card title="Log Meal">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Meal Type</label>
            <select value={mealType} onChange={e => setMealType(e.target.value)} style={selectStyle}>
              {MEAL_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What did you eat?"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end', marginTop: '16px' }}>
          <div>
            <label style={labelStyle}>Calories</label>
            <input
              type="number"
              value={calories}
              onChange={e => setCalories(e.target.value)}
              placeholder="kcal"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Protein (g)</label>
            <input
              type="number"
              value={protein}
              onChange={e => setProtein(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Carbs (g)</label>
            <input
              type="number"
              value={carbs}
              onChange={e => setCarbs(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Fat (g)</label>
            <input
              type="number"
              value={fat}
              onChange={e => setFat(e.target.value)}
              placeholder="0"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleLogMeal}
            disabled={submitting || !description.trim()}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: submitting || !description.trim() ? 'not-allowed' : 'pointer',
              backgroundColor: submitting || !description.trim() ? '#1a1a24' : '#8b7cf6',
              color: submitting || !description.trim() ? '#5a5a66' : '#fff',
            }}
          >
            {submitting ? 'Adding...' : 'Add'}
          </button>
        </div>
      </Card>

      {/* Today's Meals */}
      <Card title="Today's Meals">
        {meals.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            No meals logged today. Add one above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {MEAL_TYPES.map(type => {
              const typeMeals = mealsByType[type]
              if (!typeMeals || typeMeals.length === 0) return null
              return (
                <div key={type}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#5a5a66',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                  }}>
                    {type}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {typeMeals.map(meal => (
                      <div
                        key={meal.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          backgroundColor: '#0f0f13',
                        }}
                      >
                        <span style={{ flex: 1, fontSize: '13px', color: '#f0f0f2' }}>
                          {meal.description}
                        </span>
                        {meal.calories != null && (
                          <span style={{ fontSize: '12px', color: '#94949e', fontFamily: 'monospace' }}>
                            {meal.calories} kcal
                          </span>
                        )}
                        {meal.protein_g != null && (
                          <span style={{ fontSize: '11px', color: '#5a5a66', fontFamily: 'monospace' }}>
                            P:{meal.protein_g}g
                          </span>
                        )}
                        {meal.carbs_g != null && (
                          <span style={{ fontSize: '11px', color: '#5a5a66', fontFamily: 'monospace' }}>
                            C:{meal.carbs_g}g
                          </span>
                        )}
                        {meal.fat_g != null && (
                          <span style={{ fontSize: '11px', color: '#5a5a66', fontFamily: 'monospace' }}>
                            F:{meal.fat_g}g
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Calorie Trend Chart */}
      <div style={{
        backgroundColor: '#111116',
        border: '1px solid #1a1a24',
        borderRadius: '12px',
        padding: '20px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2' }}>Calorie Trends</h3>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setChartDays(7)} style={toggleButtonStyle(chartDays === 7)}>7 DAYS</button>
            <button onClick={() => setChartDays(30)} style={toggleButtonStyle(chartDays === 30)}>30 DAYS</button>
          </div>
        </div>
        <div style={{ width: '100%', height: 280, minWidth: '200px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={formattedTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis
                dataKey="dateLabel"
                tick={{ fill: '#5a5a66', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a24' }}
                tickLine={{ stroke: '#1a1a24' }}
              />
              <YAxis
                tick={{ fill: '#5a5a66', fontSize: 11 }}
                axisLine={{ stroke: '#1a1a24' }}
                tickLine={{ stroke: '#1a1a24' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f0f13',
                  border: '1px solid #1a1a24',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#f0f0f2' }}
                itemStyle={{ color: '#94949e' }}
              />
              <Line
                type="monotone"
                dataKey="avg_calories"
                name="Calories"
                stroke="#8b7cf6"
                strokeWidth={2}
                dot={{ fill: '#8b7cf6', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Water Intake */}
      <Card title="Water Intake">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
          <button
            onClick={() => handleWaterChange(-1)}
            disabled={waterGlasses <= 0}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '18px',
              fontWeight: 600,
              cursor: waterGlasses <= 0 ? 'not-allowed' : 'pointer',
              backgroundColor: waterGlasses <= 0 ? '#1a1a24' : '#0f0f13',
              color: waterGlasses <= 0 ? '#33333f' : '#f0f0f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            -
          </button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '28px', fontWeight: 600, color: '#f0f0f2', lineHeight: 1 }}>
              {waterGlasses}
            </div>
            <div style={{ fontSize: '11px', color: '#5a5a66', marginTop: '4px' }}>
              of {waterTarget} glasses
            </div>
          </div>
          <button
            onClick={() => handleWaterChange(1)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '18px',
              fontWeight: 600,
              cursor: 'pointer',
              backgroundColor: '#8b7cf6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {Array.from({ length: waterTarget }).map((_, i) => (
            <div
              key={i}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: i < waterGlasses ? '#8b7cf6' : '#1a1a24',
                border: i < waterGlasses ? 'none' : '1px solid #33333f',
                transition: 'background-color 0.2s ease',
              }}
            />
          ))}
        </div>
      </Card>

      {/* Macro Breakdown */}
      {totals && (totals.total_protein > 0 || totals.total_carbs > 0 || totals.total_fat > 0) && (
        <Card title="Macro Breakdown">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MacroBar label="Protein" value={totals.total_protein} color="#4ade80" total={totals.total_protein + totals.total_carbs + totals.total_fat} />
            <MacroBar label="Carbs" value={totals.total_carbs} color="#60a5fa" total={totals.total_protein + totals.total_carbs + totals.total_fat} />
            <MacroBar label="Fat" value={totals.total_fat} color="#fbbf24" total={totals.total_protein + totals.total_carbs + totals.total_fat} />
          </div>
        </Card>
      )}
    </div>
  )
}

function MacroBar({ label, value, color, total }: { label: string; value: number; color: string; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '12px', color: '#94949e', width: '60px' }}>{label}</span>
      <div style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: '3px',
          transition: 'width 0.5s ease',
        }} />
      </div>
      <span style={{ fontSize: '12px', color: '#5a5a66', width: '48px', textAlign: 'right', fontFamily: 'monospace' }}>
        {Math.round(value)}g
      </span>
      <span style={{ fontSize: '11px', color: '#33333f', width: '36px', textAlign: 'right' }}>
        {Math.round(pct)}%
      </span>
    </div>
  )
}
