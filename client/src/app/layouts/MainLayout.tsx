import { Outlet } from 'react-router-dom'
import Navbar from '@/widgets/Navbar/Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}


