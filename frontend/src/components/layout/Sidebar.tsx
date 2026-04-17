import { NavLink, useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { authService } from "@/services/authService"
import {
  LayoutDashboard, FileText, Users, UserCog, Activity,
  Bot, ClipboardList, Search, LogOut, Shield, Sparkles,
} from "lucide-react"

const navItems = [
  { to: "/dashboard",          icon: LayoutDashboard, label: "Dashboard",   roles: ["Client","Advisor","Supervisor","Admin"] },
  { to: "/quotations",         icon: FileText,         label: "Cotizaciones",roles: ["Client","Advisor","Supervisor","Admin"] },
  { to: "/clients",            icon: Users,            label: "Clientes",    roles: ["Advisor","Supervisor","Admin"] },
  { to: "/chat",               icon: Bot,              label: "ORION AI",    roles: ["Client","Advisor","Supervisor","Admin"], badge: "AI" },
  { to: "/users",              icon: UserCog,          label: "Usuarios",    roles: ["Admin"] },
  { to: "/monitoring",         icon: Activity,         label: "Monitoreo",   roles: ["Admin","Supervisor"] },
  { to: "/monitoring/scraping",icon: Search,           label: "Scraping",    roles: ["Admin","Supervisor"] },
  { to: "/audit",              icon: ClipboardList,    label: "Auditoría",   roles: ["Admin"] },
]

const roleColors: Record<string, { text: string; bg: string; dot: string }> = {
  Admin:      { text: "text-red-400",     bg: "bg-red-500/10",     dot: "bg-red-400" },
  Supervisor: { text: "text-amber-400",   bg: "bg-amber-500/10",   dot: "bg-amber-400" },
  Advisor:    { text: "text-blue-400",    bg: "bg-blue-500/10",    dot: "bg-blue-400" },
  Client:     { text: "text-emerald-400", bg: "bg-emerald-500/10", dot: "bg-emerald-400" },
}

const sidebarVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] } },
}

const navItemVariants = {
  hidden:  { x: -12, opacity: 0 },
  visible: (i: number) => ({
    x: 0, opacity: 1,
    transition: { delay: 0.05 + i * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number,number,number,number] },
  }),
}

export default function Sidebar() {
  const { user } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleLogout = async () => {
    await authService.logout()
    navigate("/login")
  }

  const visibleItems = navItems.filter(
    item => !item.roles || (user && item.roles.includes(user.role))
  )

  const roleStyle = user ? (roleColors[user.role] ?? { text: "text-orion-text-muted", bg: "bg-white/5", dot: "bg-slate-400" }) : null

  return (
    <motion.aside
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
      className="w-64 h-full flex flex-col relative z-20 flex-shrink-0"
      style={{
        background: "linear-gradient(180deg, rgba(13,18,32,0.95) 0%, rgba(8,11,20,0.98) 100%)",
        backdropFilter: "blur(20px)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.4)",
      }}
    >
      {/* Top inner glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      {/* Logo */}
      <div className="p-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="flex items-center gap-3"
          whileHover={{ x: 2 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <div className="relative">
            <motion.div
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-orion-primary via-orion-accent to-orion-nebula flex items-center justify-center shadow-glow-blue flex-shrink-0"
              animate={{ boxShadow: ["0 0 15px rgba(59,130,246,0.3)", "0 0 25px rgba(59,130,246,0.5)", "0 0 15px rgba(59,130,246,0.3)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            {/* Sparkle */}
            <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-orion-gold opacity-70" />
          </div>
          <div>
            <h1 className="font-black text-orion-text-primary text-sm tracking-tight leading-none">LOCKTON</h1>
            <p className="text-gold-gradient text-xs font-bold tracking-widest mt-0.5">ORION</p>
          </div>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label, badge }, i) => {
          const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to))
          return (
            <motion.div
              key={to}
              custom={i}
              variants={navItemVariants}
              initial="hidden"
              animate="visible"
            >
              <NavLink
                to={to}
                className="block"
              >
                <motion.div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 relative overflow-hidden group ${
                    isActive
                      ? "text-white"
                      : "text-orion-text-muted hover:text-orion-text-primary"
                  }`}
                  style={isActive ? {
                    background: "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(99,102,241,0.15) 100%)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 20px rgba(59,130,246,0.1)",
                    border: "1px solid rgba(59,130,246,0.25)",
                  } : {}}
                  whileHover={isActive ? {} : {
                    backgroundColor: "rgba(255,255,255,0.04)",
                    x: 2,
                  }}
                  transition={{ duration: 0.15 }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-gradient-to-b from-orion-primary to-orion-accent"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-orion-primary" : "text-orion-text-muted group-hover:text-orion-text-secondary"}`} />
                  <span className="flex-1">{label}</span>
                  {badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orion-primary to-orion-accent text-white tracking-wider">
                      {badge}
                    </span>
                  )}
                </motion.div>
              </NavLink>
            </motion.div>
          )
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <AnimatePresence>
          {user && roleStyle && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-2 px-3 py-3 rounded-xl"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${roleStyle.bg}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-orion-text-primary truncate">{user.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${roleStyle.dot}`} />
                    <p className={`text-xs font-medium ${roleStyle.text}`}>{user.role}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-orion-text-muted transition-colors duration-200"
          whileHover={{ backgroundColor: "rgba(239,68,68,0.08)", color: "#f87171", x: 2 }}
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.15 }}
        >
          <LogOut className="w-4 h-4" />
          Cerrar Sesión
        </motion.button>
      </div>

      {/* Bottom glow accent */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/15 to-transparent" />
    </motion.aside>
  )
}
