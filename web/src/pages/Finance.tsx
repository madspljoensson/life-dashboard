import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { finance as financeApi } from '../lib/api'
import type { FinanceTransaction, FinanceBudget, FinanceSummary, FinanceTrend } from '../types'

const CATEGORIES = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Health', 'Other'] as const

export default function Finance() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [trends, setTrends] = useState<FinanceTrend[]>([])
  const [budgets, setBudgets] = useState<FinanceBudget[]>([])
  const [loading, setLoading] = useState(true)

  // Current month for filtering
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filterCategory, setFilterCategory] = useState('')

  // Transaction form state
  const [txDate, setTxDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [txAmount, setTxAmount] = useState('')
  const [txCategory, setTxCategory] = useState('Food')
  const [txDescription, setTxDescription] = useState('')
  const [txType, setTxType] = useState<'income' | 'expense'>('expense')
  const [creating, setCreating] = useState(false)

  // Budget form state
  const [budgetCategory, setBudgetCategory] = useState('Food')
  const [budgetLimit, setBudgetLimit] = useState('')
  const [creatingBudget, setCreatingBudget] = useState(false)

  const fetchData = async () => {
    try {
      const [txList, summaryData, trendsData, budgetList] = await Promise.all([
        financeApi.listTransactions(currentMonth, filterCategory || undefined),
        financeApi.getSummary(currentMonth),
        financeApi.getTrends(6),
        financeApi.listBudgets(),
      ])
      setTransactions(txList)
      setSummary(summaryData)
      setTrends(trendsData)
      setBudgets(budgetList)
    } catch (err) {
      console.error('Failed to fetch finance data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [currentMonth, filterCategory])

  const handleCreateTransaction = async () => {
    const amount = parseFloat(txAmount)
    if (!txAmount || isNaN(amount) || amount <= 0) return
    setCreating(true)
    try {
      await financeApi.createTransaction({
        date: txDate,
        amount,
        category: txCategory,
        description: txDescription || null,
        transaction_type: txType,
      })
      setTxAmount('')
      setTxDescription('')
      setTxDate(format(new Date(), 'yyyy-MM-dd'))
      setTxCategory('Food')
      setTxType('expense')
      fetchData()
    } catch (err) {
      console.error('Failed to create transaction:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTransaction = async (id: number) => {
    try {
      await financeApi.deleteTransaction(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
    }
  }

  const handleCreateBudget = async () => {
    const limit = parseFloat(budgetLimit)
    if (!budgetLimit || isNaN(limit) || limit <= 0) return
    setCreatingBudget(true)
    try {
      await financeApi.createBudget({ category: budgetCategory, monthly_limit: limit })
      setBudgetLimit('')
      setBudgetCategory('Food')
      fetchData()
    } catch (err) {
      console.error('Failed to create budget:', err)
    } finally {
      setCreatingBudget(false)
    }
  }

  const handleDeleteBudget = async (id: number) => {
    try {
      await financeApi.deleteBudget(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete budget:', err)
    }
  }

  const navigateMonth = (direction: -1 | 1) => {
    const [year, month] = currentMonth.split('-').map(Number)
    const d = new Date(year, month - 1 + direction, 1)
    setCurrentMonth(format(d, 'yyyy-MM'))
  }

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
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: active ? '#8b7cf6' : '#0f0f13',
    color: active ? '#fff' : '#5a5a66',
  })

  const formatCurrency = (amount: number) =>
    amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Category breakdown calculation
  const totalExpenses = summary?.expenses ?? 0
  const categoryBreakdown = summary?.by_category
    ? Object.entries(summary.by_category)
        .sort(([, a], [, b]) => b - a)
    : []
  const maxCategoryAmount = categoryBreakdown.length > 0
    ? Math.max(...categoryBreakdown.map(([, v]) => v))
    : 0

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
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Finance</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Income and expenses</p>
      </div>

      {/* Monthly Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard
          label="Income"
          value={summary ? `$${formatCurrency(summary.income)}` : '--'}
          subtitle={currentMonth}
          accent="#4ade80"
        />
        <StatCard
          label="Expenses"
          value={summary ? `$${formatCurrency(summary.expenses)}` : '--'}
          subtitle={currentMonth}
          accent="#f87171"
        />
        <StatCard
          label="Net"
          value={summary ? `$${formatCurrency(summary.net)}` : '--'}
          subtitle={currentMonth}
          accent={(summary?.net ?? 0) >= 0 ? '#4ade80' : '#f87171'}
        />
      </div>

      {/* Transaction Log Form */}
      <Card title="Log Transaction">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              value={txDate}
              onChange={e => setTxDate(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              value={txAmount}
              onChange={e => setTxAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={txCategory} onChange={e => setTxCategory(e.target.value)} style={selectStyle}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input
              type="text"
              value={txDescription}
              onChange={e => setTxDescription(e.target.value)}
              placeholder="Optional"
              style={inputStyle}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={() => setTxType('expense')} style={toggleButtonStyle(txType === 'expense')}>
              Expense
            </button>
            <button onClick={() => setTxType('income')} style={toggleButtonStyle(txType === 'income')}>
              Income
            </button>
          </div>
          <div style={{ flex: 1 }} />
          <button
            onClick={handleCreateTransaction}
            disabled={creating || !txAmount}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: creating || !txAmount ? 'not-allowed' : 'pointer',
              backgroundColor: creating || !txAmount ? '#1a1a24' : '#8b7cf6',
              color: creating || !txAmount ? '#5a5a66' : '#fff',
            }}
          >
            {creating ? 'Adding...' : 'Add'}
          </button>
        </div>
      </Card>

      {/* Transaction List */}
      <Card title="Transactions">
        {/* Month navigation + category filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <button
            onClick={() => navigateMonth(-1)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: '#0f0f13',
              color: '#94949e',
            }}
          >
            Prev
          </button>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2', fontFamily: 'monospace' }}>
            {currentMonth}
          </span>
          <button
            onClick={() => navigateMonth(1)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              backgroundColor: '#0f0f13',
              color: '#94949e',
            }}
          >
            Next
          </button>
          <div style={{ flex: 1 }} />
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            style={{ ...selectStyle, width: '160px' }}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Transaction rows */}
        {transactions.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            No transactions for this period.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[...transactions]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map(tx => (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0f0f13',
                  }}
                >
                  <span style={{ fontSize: '11px', width: '56px', color: '#5a5a66', fontFamily: 'monospace' }}>
                    {format(new Date(tx.date), 'MMM d')}
                  </span>
                  <span style={{ flex: 1, fontSize: '13px', color: '#f0f0f2' }}>
                    {tx.description || '--'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontWeight: 500,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      backgroundColor: '#8b7cf615',
                      color: '#8b7cf6',
                    }}
                  >
                    {tx.category}
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      color: tx.transaction_type === 'income' ? '#4ade80' : '#f87171',
                      width: '90px',
                      textAlign: 'right',
                    }}
                  >
                    {tx.transaction_type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}
                  </span>
                  <button
                    onClick={() => handleDeleteTransaction(tx.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      fontSize: '11px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                      color: '#5a5a66',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
          </div>
        )}
      </Card>

      {/* Category Breakdown */}
      <Card title="Category Breakdown">
        {categoryBreakdown.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No expense data for this month.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {categoryBreakdown.map(([cat, amount]) => {
              const pct = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
              const barWidth = maxCategoryAmount > 0 ? (amount / maxCategoryAmount) * 100 : 0
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#f0f0f2' }}>{cat}</span>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94949e', fontFamily: 'monospace' }}>
                        ${formatCurrency(amount)}
                      </span>
                      <span style={{ fontSize: '12px', color: '#5a5a66', fontFamily: 'monospace', width: '44px', textAlign: 'right' }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        backgroundColor: '#8b7cf6',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Budget Section */}
      <Card title="Budgets">
        {/* Budget form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '16px', alignItems: 'end', marginBottom: '20px' }}>
          <div>
            <label style={labelStyle}>Category</label>
            <select value={budgetCategory} onChange={e => setBudgetCategory(e.target.value)} style={selectStyle}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Monthly Limit</label>
            <input
              type="number"
              value={budgetLimit}
              onChange={e => setBudgetLimit(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleCreateBudget}
            disabled={creatingBudget || !budgetLimit}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: creatingBudget || !budgetLimit ? 'not-allowed' : 'pointer',
              backgroundColor: creatingBudget || !budgetLimit ? '#1a1a24' : '#8b7cf6',
              color: creatingBudget || !budgetLimit ? '#5a5a66' : '#fff',
            }}
          >
            {creatingBudget ? 'Adding...' : 'Add Budget'}
          </button>
        </div>

        {/* Budget list */}
        {budgets.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>No budgets set.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {budgets.map(budget => {
              const spent = summary?.by_category?.[budget.category] ?? 0
              const pct = budget.monthly_limit > 0 ? (spent / budget.monthly_limit) * 100 : 0
              const isOver = pct > 100
              return (
                <div key={budget.id} style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#0f0f13' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#f0f0f2' }}>{budget.category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#94949e', fontFamily: 'monospace' }}>
                        ${formatCurrency(spent)} / ${formatCurrency(budget.monthly_limit)}
                      </span>
                      <button
                        onClick={() => handleDeleteBudget(budget.id)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          border: 'none',
                          fontSize: '11px',
                          cursor: 'pointer',
                          backgroundColor: 'transparent',
                          color: '#5a5a66',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div style={{ height: '6px', borderRadius: '3px', backgroundColor: '#1a1a24', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isOver ? '#f87171' : '#4ade80',
                        borderRadius: '3px',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                  {isOver && (
                    <span style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'block' }}>
                      Over budget by ${formatCurrency(spent - budget.monthly_limit)}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Spending Trend Chart */}
      <Card title="Spending Trends">
        <div style={{ width: '100%', height: 280, minWidth: '200px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
              <XAxis
                dataKey="month"
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
              <Legend
                wrapperStyle={{ paddingTop: '16px' }}
                formatter={(value: string) => <span style={{ color: '#94949e', fontSize: '11px' }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#4ade80"
                strokeWidth={2}
                dot={{ fill: '#4ade80', r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="expenses"
                name="Expenses"
                stroke="#f87171"
                strokeWidth={2}
                dot={{ fill: '#f87171', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  )
}
