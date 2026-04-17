import { Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import StarField from '@/components/ui/StarField'
import MotionPageWrapper from './MotionPageWrapper'

export default function MainLayout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-orion-bg overflow-hidden">
      {/* Animated star background */}
      <StarField />

      {/* Ambient glow layers */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-space-gradient opacity-50" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-orion-primary/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orion-nebula/3 rounded-full blur-[80px]" />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <MotionPageWrapper key={location.pathname} className="h-full">
              <Outlet />
            </MotionPageWrapper>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
