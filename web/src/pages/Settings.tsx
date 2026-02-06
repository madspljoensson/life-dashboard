import { useState, useEffect } from 'react'
import Card from '../components/Card'
import { settings } from '../lib/api'

interface ModuleToggle {
  key: string
  label: string
  enabled: boolean
  comingSoon?: boolean
}

const defaultModules: ModuleToggle[] = [
  { key: 'sleep', label: 'Sleep Tracking', enabled: true },
  { key: 'habits', label: 'Habits', enabled: true },
  { key: 'journal', label: 'Journal', enabled: true },
  { key: 'nutrition', label: 'Nutrition', enabled: false, comingSoon: true },
  { key: 'fitness', label: 'Fitness', enabled: false, comingSoon: true },
  { key: 'inventory', label: 'Inventory', enabled: true },
]

const timezones = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Copenhagen',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
]

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      style={{
        width: '40px',
        height: '22px',
        borderRadius: '11px',
        border: 'none',
        backgroundColor: checked ? '#8b7cf6' : '#1a1a24',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.15s ease',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '2px',
          left: checked ? '20px' : '2px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: '#f0f0f2',
          transition: 'left 0.15s ease',
        }}
      />
    </button>
  )
}

export default function Settings() {
  const [modules, setModules] = useState<ModuleToggle[]>(defaultModules)
  const [sleepTarget, setSleepTarget] = useState(8.0)
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    settings.get()
      .then(data => {
        if (data.enabled_modules) {
          const enabledList = JSON.parse(data.enabled_modules) as string[]
          setModules(prev => prev.map(m => ({
            ...m,
            enabled: m.comingSoon ? false : enabledList.includes(m.key)
          })))
        }
        if (data.sleep_target_hours) {
          setSleepTarget(parseFloat(data.sleep_target_hours))
        }
        if (data.timezone) {
          setTimezone(data.timezone)
        }
      })
      .catch(() => {
        // Use defaults if settings not found
      })
      .finally(() => setLoading(false))
  }, [])

  const toggleModule = (key: string) => {
    setModules(prev => prev.map(m =>
      m.key === key && !m.comingSoon ? { ...m, enabled: !m.enabled } : m
    ))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const enabledModules = modules.filter(m => m.enabled && !m.comingSoon).map(m => m.key)
      await settings.update({
        enabled_modules: JSON.stringify(enabledModules),
        sleep_target_hours: String(sleepTarget),
        timezone: timezone,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Failed to save settings:', err)
    } finally {
      setSaving(false)
    }
  }

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
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>
          Settings
        </h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>
          Configure your dashboard
        </p>
      </div>

      {/* Module Toggles */}
      <Card title="Modules">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map(module => (
            <div
              key={module.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: '#0f0f13',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '14px', color: '#f0f0f2' }}>
                  {module.label}
                </span>
                {module.comingSoon && (
                  <span style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#1a1a24',
                    color: '#5a5a66',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    Coming Soon
                  </span>
                )}
              </div>
              <Toggle
                checked={module.enabled}
                onChange={() => toggleModule(module.key)}
                disabled={module.comingSoon}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Sleep Target */}
      <Card title="Sleep Target">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '14px', color: '#94949e' }}>
            Target hours per night
          </label>
          <input
            type="number"
            min="4"
            max="12"
            step="0.5"
            value={sleepTarget}
            onChange={e => {
              setSleepTarget(parseFloat(e.target.value))
              setSaved(false)
            }}
            style={{
              width: '80px',
              padding: '8px 12px',
              fontSize: '14px',
              color: '#f0f0f2',
              backgroundColor: '#0f0f13',
              border: '1px solid #1a1a24',
              borderRadius: '6px',
              outline: 'none',
            }}
          />
          <span style={{ fontSize: '13px', color: '#5a5a66' }}>hours</span>
        </div>
      </Card>

      {/* Timezone */}
      <Card title="Timezone">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <label style={{ fontSize: '14px', color: '#94949e' }}>
            Your timezone
          </label>
          <select
            value={timezone}
            onChange={e => {
              setTimezone(e.target.value)
              setSaved(false)
            }}
            style={{
              padding: '8px 12px',
              fontSize: '14px',
              color: '#f0f0f2',
              backgroundColor: '#0f0f13',
              border: '1px solid #1a1a24',
              borderRadius: '6px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Save Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#f0f0f2',
            backgroundColor: '#8b7cf6',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.15s ease',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
        {saved && (
          <span style={{ fontSize: '13px', color: '#4ade80' }}>
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  )
}
