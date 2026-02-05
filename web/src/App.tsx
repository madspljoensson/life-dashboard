import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Sleep from './pages/Sleep'
import Daily from './pages/Daily'
import Nutrition from './pages/Nutrition'
import Habits from './pages/Habits'

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
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
