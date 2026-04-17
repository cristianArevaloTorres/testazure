import { Bell, Search } from "lucide-react"
import { motion } from "framer-motion"
import { useAuthStore } from "@/store/authStore"
import { useState } from "react"

export default function TopBar() {
  const { user } = useAuthStore()
  const [searchFocused, setSearchFocused] = useState(false)

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return "Buenos días"
    if (h < 18) return "Buenas tardes"
    return "Buenas noches"
  }

  return (
    <motion.header
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="h-16 flex items-center justify-between px-6 relative z-20 flex-shrink-0"
      style={{
        background: "linear-gradient(90deg, rgba(13,18,32,0.9) 0%, rgba(8,11,20,0.95) 100%)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Top glare */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

      {/* Search */}
      <div className="flex-1 max-w-sm">
        <motion.div
          animate={searchFocused ? { scale: 1.01 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-orion-text-muted transition-colors" />
          <input
            type="text"
            placeholder="Buscar cotizaciones, clientes..."
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-4 py-2 text-sm text-orion-text-primary placeholder-orion-text-muted rounded-xl transition-all duration-300 focus:outline-none"
            style={{
              background: searchFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
              border: searchFocused ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              boxShadow: searchFocused ? "0 0 0 3px rgba(59,130,246,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
            }}
          />
        </motion.div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Notifications bell */}
        <motion.button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl text-orion-text-muted transition-colors"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.08)", color: "#F1F5F9", scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Bell className="w-4 h-4" />
          <motion.span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orion-primary rounded-full"
            animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.button>

        {/* Divider */}
        <div className="w-px h-6 bg-white/8 mx-1" />

        {/* User avatar */}
        {user && (
          <motion.div
            className="flex items-center gap-2.5 pl-1"
            whileHover={{ x: -1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <motion.div
              className="w-8 h-8 rounded-xl bg-gradient-to-br from-orion-primary to-orion-accent flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              animate={{ boxShadow: ["0 0 10px rgba(59,130,246,0.2)", "0 0 18px rgba(59,130,246,0.4)", "0 0 10px rgba(59,130,246,0.2)"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </motion.div>
            <div className="hidden sm:block">
              <p className="text-xs font-semibold text-orion-text-primary leading-none">{greeting()}, {user.name.split(" ")[0]}</p>
              <p className="text-[11px] text-orion-text-muted mt-0.5">{user.email}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.header>
  )
}
