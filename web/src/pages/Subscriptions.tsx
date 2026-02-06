import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { subscriptions as subsApi } from '../lib/api'
import type { Subscription, SubscriptionStats } from '../types'

const CYCLE_SHORT: Record<string, string> = {
  monthly: '/mo',
  yearly: '/yr',
  weekly: '/wk',
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export default function Subscriptions() {
  const [subsList, setSubsList] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Form state
  const [newName, setNewName] = useState('')
  const [newCost, setNewCost] = useState('')
  const [newCycle, setNewCycle] = useState('monthly')
  const [newRenewal, setNewRenewal] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [creating, setCreating] = useState(false)

  const fetchData = async () => {
    try {
      const [list, statsData] = await Promise.all([
        subsApi.list(true),
        subsApi.getStats(),
      ])
      setSubsList(list)
      setStats(statsData)
    } catch (err) {
      console.error('Failed to fetch subscriptions data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    if (!newName.trim() || !newCost) return
    setCreating(true)
    try {
      await subsApi.create({
        name: newName.trim(),
        cost: parseFloat(newCost),
        billing_cycle: newCycle,
        next_renewal: newRenewal || format(new Date(), 'yyyy-MM-dd'),
        category: newCategory.trim() || null,
        active: true,
      })
      setNewName('')
      setNewCost('')
      setNewCycle('monthly')
      setNewRenewal('')
      setNewCategory('')
      fetchData()
    } catch (err) {
      console.error('Failed to create subscription:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (sub: Subscription) => {
    try {
      await subsApi.update(sub.id, { active: !sub.active })
      fetchData()
    } catch (err) {
      console.error('Failed to toggle subscription:', err)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await subsApi.delete(id)
      fetchData()
    } catch (err) {
      console.error('Failed to delete subscription:', err)
    }
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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <span style={{ fontSize: '13px', color: '#5a5a66' }}>Loading</span>
      </div>
    )
  }

  const upcomingRenewals = [...(stats?.upcoming_renewals ?? [])]
    .sort((a, b) => new Date(a.next_renewal).getTime() - new Date(b.next_renewal).getTime())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Subscriptions</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Recurring expenses</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        <StatCard label="Monthly Cost" value={`$${(stats?.monthly_total ?? 0).toFixed(2)}`} subtitle="Per month" accent="#8b7cf6" />
        <StatCard label="Yearly Cost" value={`$${(stats?.yearly_total ?? 0).toFixed(2)}`} subtitle="Per year" accent="#6d5ed6" />
        <StatCard label="Active Count" value={stats?.count ?? 0} subtitle="Subscriptions" accent="#4ade80" />
      </div>

      {/* Add Subscription Form */}
      <Card title="New Subscription">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Service name"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Cost ($)</label>
            <input
              type="number"
              value={newCost}
              onChange={e => setNewCost(e.target.value)}
              placeholder="0.00"
              min="0"
              step="0.01"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Billing Cycle</label>
            <select value={newCycle} onChange={e => setNewCycle(e.target.value)} style={selectStyle}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Next Renewal</label>
            <input
              type="date"
              value={newRenewal}
              onChange={e => setNewRenewal(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Category</label>
            <input
              type="text"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="Optional"
              style={inputStyle}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim() || !newCost}
            style={{
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: 500,
              cursor: creating || !newName.trim() || !newCost ? 'not-allowed' : 'pointer',
              backgroundColor: creating || !newName.trim() || !newCost ? '#1a1a24' : '#8b7cf6',
              color: creating || !newName.trim() || !newCost ? '#5a5a66' : '#fff',
            }}
          >
            {creating ? 'Adding...' : 'Add'}
          </button>
        </div>
      </Card>

      {/* Active Subscriptions */}
      <Card title="Active Subscriptions">
        {subsList.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            No subscriptions yet. Add one above.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {subsList.map(sub => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0f0f13',
                }}
              >
                {/* Name */}
                <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{sub.name}</span>

                {/* Cost/cycle */}
                <span style={{ fontSize: '13px', color: '#f0f0f2', fontFamily: 'monospace', fontWeight: 600 }}>
                  ${sub.cost.toFixed(2)}{CYCLE_SHORT[sub.billing_cycle] || ''}
                </span>

                {/* Next renewal */}
                <span style={{ fontSize: '12px', color: '#94949e', minWidth: '90px', textAlign: 'right' }}>
                  {format(new Date(sub.next_renewal), 'MMM d, yyyy')}
                </span>

                {/* Category badge */}
                {sub.category && (
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
                    {sub.category}
                  </span>
                )}

                {/* Toggle active button */}
                <button
                  onClick={() => handleToggleActive(sub)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #1a1a24',
                    backgroundColor: 'transparent',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: sub.active ? '#4ade80' : '#5a5a66',
                    cursor: 'pointer',
                  }}
                >
                  {sub.active ? 'Active' : 'Inactive'}
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(sub.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #1a1a24',
                    backgroundColor: 'transparent',
                    fontSize: '11px',
                    color: '#5a5a66',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Upcoming Renewals */}
      <Card title="Upcoming Renewals">
        {upcomingRenewals.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '12px 0' }}>
            No upcoming renewals.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {upcomingRenewals.map(sub => {
              const days = daysUntil(sub.next_renewal)
              const urgent = days <= 7

              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#0f0f13',
                    border: urgent ? '1px solid #f59e0b33' : '1px solid transparent',
                  }}
                >
                  {/* Urgent indicator */}
                  {urgent && (
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#f59e0b',
                      flexShrink: 0,
                    }} />
                  )}

                  {/* Name */}
                  <span style={{ flex: 1, fontSize: '14px', color: '#f0f0f2' }}>{sub.name}</span>

                  {/* Cost */}
                  <span style={{ fontSize: '13px', color: '#f0f0f2', fontFamily: 'monospace', fontWeight: 600 }}>
                    ${sub.cost.toFixed(2)}
                  </span>

                  {/* Renewal date */}
                  <span style={{ fontSize: '12px', color: '#94949e', minWidth: '90px', textAlign: 'right' }}>
                    {format(new Date(sub.next_renewal), 'MMM d, yyyy')}
                  </span>

                  {/* Days until renewal */}
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    color: urgent ? '#f59e0b' : '#5a5a66',
                    minWidth: '60px',
                    textAlign: 'right',
                  }}>
                    {days <= 0 ? 'Due' : `${days}d`}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
