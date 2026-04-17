import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import type { ChangeEvent } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Eye, EyeOff, AlertCircle, Zap, ChevronRight } from "lucide-react"
import { authService } from "@/services/authService"
import StarField from "@/components/ui/StarField"
import { APP_VERSION } from "@/version"

const EASE: [number,number,number,number] = [0.22, 1, 0.36, 1]

const TEST_USERS = [
  { role: "Admin",      email: "admin@locktonorion.com",      password: "Admin@1234",   color: "text-red-400",    ring: "hover:ring-red-500/30",    dot: "bg-red-400" },
  { role: "Supervisor", email: "supervisor@locktonorion.com", password: "Super@1234",   color: "text-amber-400",  ring: "hover:ring-amber-500/30",  dot: "bg-amber-400" },
  { role: "Asesor",     email: "asesor@locktonorion.com",     password: "Asesor@1234",  color: "text-blue-400",   ring: "hover:ring-blue-500/30",   dot: "bg-blue-400" },
  { role: "Cliente",    email: "cliente@locktonorion.com",    password: "Cliente@1234", color: "text-emerald-400",ring: "hover:ring-emerald-500/30",dot: "bg-emerald-400" },
]

const schema = z.object({
  email:    z.string().email("Correo inválido"),
  password: z.string().min(1, "Contraseña requerida"),
})
type FormData = z.infer<typeof schema>

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const itemVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError]         = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) })

  const emailField    = register("email")
  const passwordField = register("password")

  const fillCredentials = (email: string, password: string) => {
    setValue("email",    email,    { shouldValidate: true })
    setValue("password", password, { shouldValidate: true })
    setApiError("")
  }

  const onSubmit = async (data: FormData) => {
    setApiError("")
    try {
      await authService.login(data.email, data.password)
      navigate("/dashboard")
    } catch {
      setApiError("Credenciales inválidas. Verifica tu correo y contraseña.")
    }
  }

  return (
    <div className="min-h-screen bg-orion-deep-space flex items-center justify-center relative overflow-hidden">
      <StarField />

      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-orion-primary/8 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-orion-nebula/6 rounded-full blur-[80px] animate-pulse-slow" style={{ animationDelay: "1.5s" }} />
      </div>

      {/* Orion Belt top-right decoration */}
      <div className="absolute top-12 right-16 flex items-end gap-6 opacity-40 pointer-events-none">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-blue-200 shadow-glow-blue"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
            style={{ marginBottom: i === 1 ? "6px" : "0" }}
          />
        ))}
      </div>

      {/* Card */}
      <motion.div
        className="relative z-10 w-full max-w-md px-4"
        initial={{ opacity: 0, scale: 0.97, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {/* Gradient border glow */}
        <div className="relative rounded-3xl p-[1px]"
             style={{ background: "linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(99,102,241,0.3) 50%, rgba(124,58,237,0.2) 100%)" }}>
          <div className="relative rounded-3xl overflow-hidden"
               style={{ background: "linear-gradient(160deg, rgba(13,18,32,0.97) 0%, rgba(8,11,20,0.98) 100%)", backdropFilter: "blur(24px)" }}>

            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
            <div className="absolute top-0 left-1/4 w-1/2 h-16 bg-orion-primary/5 blur-2xl rounded-full" />

            <motion.div
              className="p-8 sm:p-10"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Logo */}
              <motion.div variants={itemVariants} className="flex flex-col items-center mb-10">
                <motion.div
                  className="relative mb-5"
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <motion.div
                    className="absolute inset-[-8px] rounded-full border border-orion-primary/30"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.div
                    className="absolute inset-[-16px] rounded-full border border-orion-accent/15"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="w-[72px] h-[72px] rounded-2xl bg-gradient-to-br from-orion-primary via-orion-accent to-orion-nebula
                                  flex items-center justify-center shadow-glow-blue-lg relative">
                    <Shield className="w-9 h-9 text-white drop-shadow-lg" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
                  </div>
                </motion.div>

                <h1 className="text-3xl font-black tracking-tight mb-1">
                  <span className="text-orion-text-primary">LOCKTON </span>
                  <span className="text-cosmic glow-text-blue">ORION</span>
                </h1>
                <p className="text-sm text-orion-text-muted font-medium tracking-widest uppercase">
                  Sistema de Cotización Inteligente
                </p>
              </motion.div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Email */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold text-orion-text-secondary uppercase tracking-wider mb-2">
                    Correo electrónico
                  </label>
                  <motion.div
                    animate={focusedField === "email" ? { scale: 1.01 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <input
                      type="email"
                      autoComplete="email"
                      placeholder="usuario@lockton.com"
                      className="input-premium"
                      {...emailField}
                      onFocus={() => setFocusedField("email")}
                      onBlur={(e: ChangeEvent<HTMLInputElement>) => {
                        emailField.onBlur(e)
                        setFocusedField(null)
                      }}
                    />
                    <AnimatePresence>
                      {focusedField === "email" && (
                        <motion.div
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-orion-primary to-orion-accent origin-left"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.email.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Password */}
                <motion.div variants={itemVariants}>
                  <label className="block text-xs font-semibold text-orion-text-secondary uppercase tracking-wider mb-2">
                    Contraseña
                  </label>
                  <motion.div
                    animate={focusedField === "password" ? { scale: 1.01 } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="relative"
                  >
                    <input
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="input-premium pr-12"
                      {...passwordField}
                      onFocus={() => setFocusedField("password")}
                      onBlur={(e: ChangeEvent<HTMLInputElement>) => {
                        passwordField.onBlur(e)
                        setFocusedField(null)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(s => !s)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-orion-text-muted hover:text-orion-text-primary transition-colors p-1.5 rounded-lg hover:bg-white/5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                      {focusedField === "password" && (
                        <motion.div
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="absolute bottom-0 left-4 right-4 h-[1px] bg-gradient-to-r from-orion-accent to-orion-nebula origin-left"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                  <AnimatePresence>
                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.password.message}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* API Error */}
                <AnimatePresence>
                  {apiError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {apiError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <motion.div variants={itemVariants} className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-cosmic w-full flex items-center justify-center gap-2.5 text-base"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                        Iniciando sesión...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Iniciar Sesión
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </form>

              <motion.p variants={itemVariants} className="text-center text-xs text-orion-text-muted mt-6">
                ¿Primera vez?{" "}
                <a href="/register" className="text-orion-primary hover:text-blue-300 transition-colors font-medium">
                  Crear cuenta
                </a>
              </motion.p>

              {/* Test credentials */}
              <motion.div
                variants={itemVariants}
                className="mt-6 rounded-2xl p-4 border border-dashed border-white/10"
                style={{ background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-orion-primary animate-pulse" />
                  <span className="text-xs font-semibold text-orion-text-muted uppercase tracking-widest">
                    Usuarios de prueba
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TEST_USERS.map((u, i) => (
                    <motion.button
                      key={u.role}
                      type="button"
                      onClick={() => fillCredentials(u.email, u.password)}
                      className={`text-left rounded-xl px-3 py-2.5 ${u.ring} ring-1 ring-white/5 transition-all duration-200 group`}
                      style={{ background: "rgba(255,255,255,0.03)" }}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0, x: i % 2 === 0 ? -8 : 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + i * 0.06, duration: 0.3 }}
                    >
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.dot}`} />
                        <span className={`text-xs font-bold ${u.color}`}>{u.role}</span>
                      </div>
                      <span className="text-xs text-orion-text-muted group-hover:text-orion-text-secondary transition-colors font-mono">
                        {u.password}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Version */}
        <div className="text-center mt-3">
          <span className="text-[11px] text-orion-text-muted/50 font-mono tracking-widest">
            v{APP_VERSION}
          </span>
        </div>

        {/* Reflection */}
        <div className="mt-1 mx-8 h-4 rounded-b-full opacity-20"
             style={{ background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), rgba(99,102,241,0.3), transparent)", filter: "blur(8px)" }} />
      </motion.div>
    </div>
  )
}
