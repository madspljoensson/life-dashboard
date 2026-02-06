import { useEffect, useState } from 'react'
import { Plus, X, Edit2, Package } from 'lucide-react'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { inventory as inventoryApi } from '../lib/api'
import type { InventoryItem, InventoryCategory, InventoryStats } from '../types'

type TabType = 'owned' | 'wishlist' | 'ai_suggested'

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [stats, setStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('owned')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    category: 'tech',
    status: 'owned' as TabType,
    priority: 'medium' as 'low' | 'medium' | 'high',
    price: '',
    currency: 'DKK',
    notes: '',
    ai_reason: '',
    tags: '',
  })

  const fetchData = async () => {
    try {
      const [itemsData, categoriesData, statsData] = await Promise.all([
        inventoryApi.list(),
        inventoryApi.categories(),
        inventoryApi.stats(),
      ])
      setItems(itemsData)
      setCategories(categoriesData)
      setStats(statsData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (!formData.name.trim()) return

    const data = {
      name: formData.name.trim(),
      category: formData.category,
      status: formData.status,
      priority: formData.priority || null,
      price: formData.price ? parseFloat(formData.price) : null,
      currency: formData.currency,
      notes: formData.notes.trim() || null,
      ai_reason: formData.ai_reason.trim() || null,
      tags: formData.tags.trim() || null,
    }

    if (editingItem) {
      await inventoryApi.update(editingItem.id, data)
    } else {
      await inventoryApi.create(data)
    }

    setShowAddForm(false)
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'tech',
      status: 'owned',
      priority: 'medium',
      price: '',
      currency: 'DKK',
      notes: '',
      ai_reason: '',
      tags: '',
    })
    fetchData()
  }

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      status: item.status,
      priority: item.priority || 'medium',
      price: item.price?.toString() || '',
      currency: item.currency,
      notes: item.notes || '',
      ai_reason: item.ai_reason || '',
      tags: item.tags || '',
    })
    setShowAddForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this item?')) return
    await inventoryApi.delete(id)
    fetchData()
  }

  const handleCancelForm = () => {
    setShowAddForm(false)
    setEditingItem(null)
    setFormData({
      name: '',
      category: 'tech',
      status: 'owned',
      priority: 'medium',
      price: '',
      currency: 'DKK',
      notes: '',
      ai_reason: '',
      tags: '',
    })
  }

  // Filter items
  const filteredItems = items
    .filter(item => item.status === activeTab)
    .filter(item => {
      if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (categoryFilter && item.category !== categoryFilter) {
        return false
      }
      return true
    })

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    border: '1px solid #1a1a24',
    backgroundColor: '#0f0f13',
    color: '#f0f0f2',
    outline: 'none',
    width: '100%',
  }

  const buttonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#8b7cf6',
    color: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
  }

  const priorityColors: Record<string, string> = {
    high: '#f87171',
    medium: '#fbbf24',
    low: '#5a5a66',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
            Inventory
          </h1>
          <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>
            Track what you own and what you want
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({ ...formData, status: activeTab })
            setShowAddForm(true)
          }}
          style={buttonStyle}
        >
          <Plus size={15} style={{ marginRight: '6px', display: 'inline', verticalAlign: 'middle' }} />
          Add Item
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <StatCard label="OWNED" value={stats.total_owned} />
          <StatCard label="WISHLIST" value={stats.wishlist_count} />
          <StatCard
            label="WISHLIST VALUE"
            value={stats.total_wishlist_value ? `${Math.round(stats.total_wishlist_value)} DKK` : '—'}
          />
          <StatCard label="CATEGORIES" value={stats.categories_used} />
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card title={editingItem ? 'EDIT ITEM' : 'ADD ITEM'}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Item name"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={inputStyle}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                style={inputStyle}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as TabType })}
                style={inputStyle}
              >
                <option value="owned">Owned</option>
                <option value="wishlist">Wishlist</option>
                <option value="ai_suggested">AI Suggested</option>
              </select>
              <select
                value={formData.priority}
                onChange={e => setFormData({ ...formData, priority: e.target.value as 'low' | 'medium' | 'high' })}
                style={inputStyle}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <input
                type="number"
                placeholder="Price"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Currency"
                value={formData.currency}
                onChange={e => setFormData({ ...formData, currency: e.target.value })}
                style={inputStyle}
              />
            </div>
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              style={inputStyle}
            />
            <textarea
              placeholder="Notes"
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
            {formData.status === 'ai_suggested' && (
              <textarea
                placeholder="AI Reason (why suggested)"
                value={formData.ai_reason}
                onChange={e => setFormData({ ...formData, ai_reason: e.target.value })}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />
            )}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button onClick={handleSubmit} style={buttonStyle}>
                {editingItem ? 'Update' : 'Add'}
              </button>
              <button
                onClick={handleCancelForm}
                style={{
                  ...buttonStyle,
                  backgroundColor: 'transparent',
                  border: '1px solid #1a1a24',
                  color: '#5a5a66',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #1a1a24' }}>
        {[
          { id: 'owned' as TabType, label: 'OWNED' },
          { id: 'wishlist' as TabType, label: 'WISHLIST' },
          { id: 'ai_suggested' as TabType, label: 'AI SUGGESTED' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#8b7cf6' : '#5a5a66',
              borderBottom: activeTab === tab.id ? '2px solid #8b7cf6' : 'none',
              cursor: 'pointer',
              marginBottom: '-1px',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ ...inputStyle, maxWidth: '300px' }}
        />
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ ...inputStyle, maxWidth: '200px' }}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Items List */}
      <Card>
        {loading ? (
          <p style={{ fontSize: '13px', color: '#5a5a66', padding: '20px 0', textAlign: 'center' }}>
            Loading...
          </p>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <Package size={48} style={{ color: '#1a1a24', margin: '0 auto 16px' }} />
            <p style={{ fontSize: '13px', color: '#5a5a66' }}>No items yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#0f0f13',
                  border: '1px solid #1a1a24',
                }}
              >
                {/* Priority indicator */}
                {item.priority && (
                  <div
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: priorityColors[item.priority],
                      marginTop: '6px',
                      flexShrink: 0,
                    }}
                  />
                )}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#f0f0f2' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#1a1a24',
                        color: '#94949e',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                      }}
                    >
                      {item.category}
                    </span>
                    {item.price && (
                      <span style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 500 }}>
                        {item.price} {item.currency}
                      </span>
                    )}
                  </div>

                  {item.tags && (
                    <div style={{ fontSize: '11px', color: '#5a5a66', marginBottom: '4px' }}>
                      {item.tags}
                    </div>
                  )}

                  {item.notes && (
                    <p style={{ fontSize: '12px', color: '#94949e', marginTop: '6px' }}>
                      {item.notes}
                    </p>
                  )}

                  {item.ai_reason && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#8b7cf6',
                        marginTop: '6px',
                        fontStyle: 'italic',
                      }}
                    >
                      AI: {item.ai_reason}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleEdit(item)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#5a5a66',
                      padding: '4px',
                    }}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#5a5a66',
                      padding: '4px',
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
