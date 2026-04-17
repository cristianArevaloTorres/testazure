import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Shield, AlertCircle, CheckCircle } from 'lucide-react'
import { authService } from '@/services/authService'
import StarField from '@/components/ui/StarField'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

const schema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(
    /^(?=.*[A-Z])(?=.*[0-9])/,
    'Debe incluir al menos una mayúscula y un número'
  ),
  confirmPassword: z.string(),
  phone: z.string().optional(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [apiError, setApiError] = useState('')
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setApiError('')
    try {
      await authService.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        phone: data.phone,
      })
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setApiError('Error al crear la cuenta. Es posible que el correo ya esté registrado.')
    }
  }

  return (
    <div className="min-h-screen bg-orion-bg flex items-center justify-center relative overflow-hidden">
      <StarField />
      <div className="absolute inset-0 bg-gradient-to-br from-orion-bg via-orion-bg to-orion-primary/5 pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg px-4 py-8">
        <div className="bg-orion-surface/90 backdrop-blur-md border border-orion-border rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orion-primary to-orion-accent flex items-center justify-center shadow-glow-blue mb-3">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-orion-text-primary">Crear Cuenta</h1>
            <p className="text-sm text-orion-text-muted mt-1">LOCKTON ORION</p>
          </div>

          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <p className="text-sm text-orion-text-primary font-medium">¡Cuenta creada correctamente!</p>
              <p className="text-xs text-orion-text-muted">Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nombre" error={errors.firstName?.message} {...register('firstName')} />
                <Input label="Apellido" error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <Input label="Correo" type="email" error={errors.email?.message} {...register('email')} />
              <Input label="Teléfono (opcional)" type="tel" {...register('phone')} />
              <Input label="Contraseña" type="password" error={errors.password?.message} {...register('password')} />
              <Input label="Confirmar Contraseña" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />

              {apiError && (
                <div className="flex items-center gap-2.5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {apiError}
                </div>
              )}

              <Button type="submit" fullWidth size="lg" isLoading={isSubmitting} className="mt-2">
                Crear Cuenta
              </Button>
            </form>
          )}

          <p className="text-center text-xs text-orion-text-muted mt-5">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-orion-primary hover:underline">Iniciar sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
