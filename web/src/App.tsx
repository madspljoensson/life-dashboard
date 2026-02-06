import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Sleep from './pages/Sleep'
import Daily from './pages/Daily'
import Nutrition from './pages/Nutrition'
import Habits from './pages/Habits'
import Inventory from './pages/Inventory'
import Fitness from './pages/Fitness'
import Finance from './pages/Finance'
import Goals from './pages/Goals'
import Subscriptions from './pages/Subscriptions'
import Settings from './pages/Settings'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: '220px',
          padding: '40px 48px',
          maxWidth: '1100px',
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/daily" element={<Daily />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/fitness" element={<Fitness />} />
            <Route path="/finance" element={<Finance />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
