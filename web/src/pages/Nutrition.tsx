import Card from '../components/Card'

export default function Nutrition() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#f0f0f2', letterSpacing: '-0.02em' }}>Nutrition</h1>
        <p style={{ fontSize: '13px', color: '#5a5a66', marginTop: '4px' }}>Fuel tracking</p>
      </div>
      <Card>
        <div style={{ padding: '48px 0', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#5a5a66' }}>Coming soon</p>
          <p style={{ fontSize: '11px', color: '#33333f', marginTop: '4px' }}>Meal logging and macro tracking</p>
        </div>
      </Card>
    </div>
  )
}
