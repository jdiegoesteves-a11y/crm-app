'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, Lock, Mail, Eye, EyeOff, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);

      const res = await loginAction(null, formData);

      if (res?.success) {
        router.push('/dashboard');
        router.refresh();
      } else {
        setErrorMessage(res?.error || 'Error al iniciar sesión.');
      }
    } catch {
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#0B1118] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Luces sutiles de fondo (Glow corporativo) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#28B8AA]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#202C39]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Cabecera del Sistema */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#28B8AA]/20 border border-[#28B8AA]/40 mb-4 shadow-xl shadow-[#28B8AA]/10">
            <TrendingUp className="w-8 h-8 text-[#28B8AA]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F4F7FA] tracking-tight">EXECUTIVE DARK 2.0</h1>
          <p className="text-xs text-[#A5B2C1] mt-1">Sistema Comercial y CRM Empresarial</p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="crm-card p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#F4F7FA]">Ingreso Seguro al Sistema</h2>
            <p className="text-xs text-[#A5B2C1] mt-1">Ingrese sus credenciales corporativas autorizadas.</p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-lg bg-[#F17474]/15 border border-[#F17474]/40 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#F17474] shrink-0 mt-0.5" />
              <p className="text-xs text-[#F17474] leading-relaxed">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A5B2C1] mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="crm-input pl-9 text-xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-[#A5B2C1]">Contraseña</label>
                <a
                  href="/recuperar-password"
                  className="text-xs text-[#28B8AA] hover:underline transition-all"
                >
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="crm-input pl-9 pr-10 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A5B2C1] hover:text-[#F4F7FA]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full crm-button-primary mt-2 text-xs py-2.5 font-bold cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Validando credenciales...</span>
              ) : (
                <>
                  <span>Ingresar a la Plataforma</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Selector de Acceso Rápido para Pruebas QA de Roles */}
          <div className="mt-8 pt-6 border-t border-[#30404E]">
            <div className="flex items-center gap-1.5 text-xs text-[#A5B2C1] mb-3">
              <ShieldCheck className="w-4 h-4 text-[#28B8AA]" />
              <span className="font-semibold text-[#F4F7FA]">Acceso Rápido para Pruebas (Roles)</span>
            </div>
            <p className="text-[11px] text-[#A5B2C1] mb-3">
              Seleccione un perfil para autocompletar credenciales y probar permisos:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@crmexecutive.com')}
                className="px-2.5 py-2 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] hover:border-[#28B8AA] text-left transition-all group"
              >
                <div className="font-bold text-[#28B8AA] group-hover:text-[#28B8AA] text-[11px]">Administrador</div>
                <div className="text-[10px] text-[#A5B2C1] truncate">admin@crmexecutive.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('gerente@crmexecutive.com')}
                className="px-2.5 py-2 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] hover:border-[#34C48A] text-left transition-all group"
              >
                <div className="font-bold text-[#34C48A] group-hover:text-[#34C48A] text-[11px]">Gerente</div>
                <div className="text-[10px] text-[#A5B2C1] truncate">gerente@crmexecutive.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('vendedor@crmexecutive.com')}
                className="px-2.5 py-2 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] hover:border-[#F0B454] text-left transition-all group"
              >
                <div className="font-bold text-[#F0B454] group-hover:text-[#F0B454] text-[11px]">Vendedor</div>
                <div className="text-[10px] text-[#A5B2C1] truncate">vendedor@crmexecutive.com</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('consulta@crmexecutive.com')}
                className="px-2.5 py-2 rounded-lg bg-[#202C39] hover:bg-[#202C39]/80 border border-[#30404E] hover:border-[#A5B2C1] text-left transition-all group"
              >
                <div className="font-bold text-[#A5B2C1] text-[11px]">Consulta</div>
                <div className="text-[10px] text-[#A5B2C1] truncate">consulta@crmexecutive.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer de Seguridad */}
        <div className="text-center mt-6 text-[11px] text-[#A5B2C1]/70">
          Protección con cifrado HttpOnly, JWT y aislamiento de datos PostgreSQL RLS.
        </div>
      </div>
    </div>
  );
}
