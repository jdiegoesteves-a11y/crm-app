'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TrendingUp, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestPasswordResetAction } from '@/app/actions/auth';

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('email', email);
      const res = await requestPasswordResetAction(null, formData);

      if (res?.success) {
        setSuccessMessage(res.message || 'Se ha enviado un correo con las instrucciones.');
      } else {
        setErrorMessage(res?.error || 'No se pudo procesar la solicitud.');
      }
    } catch {
      setErrorMessage('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1118] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#28B8AA]/20 border border-[#28B8AA]/40 mb-4 shadow-xl shadow-[#28B8AA]/10">
            <TrendingUp className="w-8 h-8 text-[#28B8AA]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F4F7FA]">Recuperar Contraseña</h1>
          <p className="text-xs text-[#A5B2C1] mt-1">EXECUTIVE DARK 2.0</p>
        </div>

        <div className="crm-card p-8 shadow-2xl">
          {successMessage ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#34C48A]/20 text-[#34C48A] flex items-center justify-center mx-auto mb-4 border border-[#34C48A]/40">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#F4F7FA]">Solicitud Procesada</h3>
              <p className="text-xs text-[#A5B2C1] mt-2 leading-relaxed">{successMessage}</p>
              <Link
                href="/login"
                className="crm-button-primary mt-6 text-xs inline-flex w-full"
              >
                Volver al Inicio de Sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-[#A5B2C1] leading-relaxed mb-4">
                Ingrese el correo electrónico vinculado a su cuenta. Le enviaremos un enlace seguro para restablecer su acceso.
              </p>

              {errorMessage && (
                <div className="p-3 rounded-lg bg-[#F17474]/15 border border-[#F17474]/40 flex items-center gap-2 text-xs text-[#F17474]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {errorMessage}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="w-full crm-button-primary text-xs py-2.5 font-bold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Enviando solicitud...' : 'Enviar Instrucciones'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-[#A5B2C1] hover:text-[#28B8AA] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Regresar al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
