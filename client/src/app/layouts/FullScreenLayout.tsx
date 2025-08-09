import { Outlet } from 'react-router-dom'

export default function FullScreenLayout() {
  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-black">
      <Outlet />
    </div>
  )
}


