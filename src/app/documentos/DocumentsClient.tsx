'use client';

import React, { useState } from 'react';
import {
  DocumentAttachment,
  Client,
  Quote,
  SessionUser,
  DocumentEntityType,
} from '@/types/database';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FolderArchive,
  HardDrive,
  Building2,
  FileCheck,
} from 'lucide-react';
import { uploadDocumentAction, deleteDocumentAction } from '@/app/actions/documents';

interface DocumentsClientProps {
  documents: DocumentAttachment[];
  clients: Client[];
  quotes: Quote[];
  currentUser: SessionUser;
}

export function DocumentsClient({
  documents: initialDocuments,
  clients,
  quotes,
  currentUser,
}: DocumentsClientProps) {
  const [documents, setDocuments] = useState<DocumentAttachment[]>(initialDocuments);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('todos');

  // Modal de subida
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [entityType, setEntityType] = useState<DocumentEntityType>('general');
  const [entityId, setEntityId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Métricas
  const totalFiles = documents.length;
  const totalSizeBytes = documents.reduce((acc, d) => acc + (d.file_size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);
  const pdfCount = documents.filter((d) => d.mime_type.includes('pdf')).length;

  // Filtrado
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'todos' || doc.entity_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (mime: string) => {
    if (mime.includes('pdf')) return <FileText className="w-5 h-5 text-[#F17474]" />;
    if (mime.includes('sheet') || mime.includes('excel'))
      return <FileSpreadsheet className="w-5 h-5 text-[#34C48A]" />;
    if (mime.includes('image')) return <ImageIcon className="w-5 h-5 text-[#28B8AA]" />;
    return <File className="w-5 h-5 text-[#A5B2C1]" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setFeedback({ type: 'error', text: 'Por favor seleccione un archivo.' });
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setFeedback({ type: 'error', text: 'El archivo excede el tamaño máximo permitido de 5 MB.' });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('entity_type', entityType);
      if (entityId) formData.append('entity_id', entityId);

      const res = await uploadDocumentAction(formData);
      if (res.success && res.document) {
        setDocuments((prev) => [res.document!, ...prev]);
        setFeedback({ type: 'success', text: `Archivo "${selectedFile.name}" subido con éxito.` });
        setIsUploadOpen(false);
        setSelectedFile(null);
        setEntityType('general');
        setEntityId('');
      } else {
        setFeedback({ type: 'error', text: res.error || 'Error al subir el archivo.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error de conexión al cargar archivo.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileName: string) => {
    if (!confirm(`¿Eliminar definitivamente el archivo "${fileName}"?`)) return;
    setLoadingId(docId);
    setFeedback(null);
    try {
      const res = await deleteDocumentAction(docId);
      if (res.success) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
        setFeedback({ type: 'success', text: `Archivo "${fileName}" eliminado correctamente.` });
      } else {
        setFeedback({ type: 'error', text: res.error || 'No se pudo eliminar el archivo.' });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Error al procesar la eliminación.' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Gestor de Documentos</h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              Almacenamiento Privado
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Repositorio corporativo de propuestas, contratos, actas y comprobantes vinculados a cuentas comerciales.
          </p>
        </div>

        {currentUser.role !== 'consulta' && (
          <button
            onClick={() => setIsUploadOpen(true)}
            className="crm-button-primary text-xs py-2 px-3.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Subir Documento</span>
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-[#34C48A]/10 text-[#34C48A] border-[#34C48A]/30'
              : 'bg-[#F17474]/10 text-[#F17474] border-[#F17474]/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="ml-auto text-xs opacity-70">
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#28B8AA]/15 border border-[#28B8AA]/30 flex items-center justify-center shrink-0">
            <FolderArchive className="w-5 h-5 text-[#28B8AA]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Total Documentos</p>
            <p className="text-lg font-bold text-[#F4F7FA]">{totalFiles} archivos</p>
          </div>
        </div>

        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#34C48A]/15 border border-[#34C48A]/30 flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5 text-[#34C48A]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Espacio Utilizado</p>
            <p className="text-lg font-bold text-[#34C48A]">
              {totalSizeMB} MB <span className="text-[10px] text-[#A5B2C1] font-normal">/ 1,024 MB (Plan Free Tier)</span>
            </p>
          </div>
        </div>

        <div className="crm-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F17474]/15 border border-[#F17474]/30 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-[#F17474]" />
          </div>
          <div>
            <p className="text-[11px] text-[#A5B2C1] font-medium">Archivos PDF Oficiales</p>
            <p className="text-lg font-bold text-[#F4F7FA]">{pdfCount} cotizaciones / actas</p>
          </div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="crm-card p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre de archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="crm-input pl-9 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] text-[#A5B2C1] font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Vinculado a:
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'client', label: 'Clientes' },
            { id: 'quote', label: 'Cotizaciones' },
            { id: 'opportunity', label: 'Oportunidades' },
            { id: 'general', label: 'General' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTypeFilter(item.id)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shrink-0 ${
                typeFilter === item.id
                  ? 'bg-[#28B8AA] text-[#0B1118]'
                  : 'bg-[#202C39] text-[#A5B2C1] hover:text-[#F4F7FA] border border-[#30404E]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Archivos */}
      <div className="crm-card overflow-hidden">
        <div className="p-4 border-b border-[#30404E] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#F4F7FA]">
            Archivos Registrados ({filteredDocs.length})
          </h2>
          <span className="text-[11px] text-[#A5B2C1]">Límite por archivo: 5 MB</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] text-[10px] uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Vinculación</th>
                <th className="py-3 px-4">Tamaño</th>
                <th className="py-3 px-4">Fecha Subida</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A5B2C1]">
                    <FolderArchive className="w-8 h-8 mx-auto text-[#30404E] mb-2" />
                    <p className="font-medium">No hay documentos registrados.</p>
                    <p className="text-[11px] mt-1 text-[#A5B2C1]/70">
                      Sube contratos, propuestas firmadas o anexos técnicos para mantener todo centralizado.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  let linkedLabel = 'General';
                  if (doc.entity_type === 'client' && doc.entity_id) {
                    const c = clients.find((x) => x.id === doc.entity_id);
                    linkedLabel = c ? `Cliente: ${c.name}` : 'Cliente';
                  } else if (doc.entity_type === 'quote' && doc.entity_id) {
                    const q = quotes.find((x) => x.id === doc.entity_id);
                    linkedLabel = q ? `Cotización: ${q.quote_number}` : 'Cotización';
                  }

                  return (
                    <tr key={doc.id} className="hover:bg-[#202C39]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-[#202C39] border border-[#30404E] shrink-0">
                            {getFileIcon(doc.mime_type)}
                          </div>
                          <div>
                            <span className="font-semibold text-[#F4F7FA] block line-clamp-1">
                              {doc.file_name}
                            </span>
                            <span className="text-[10px] text-[#A5B2C1]">{doc.mime_type}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="text-[11px] font-medium text-[#28B8AA] bg-[#28B8AA]/10 px-2 py-0.5 rounded border border-[#28B8AA]/20 inline-block">
                          {linkedLabel}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-[#A5B2C1]">
                        {formatFileSize(doc.file_size)}
                      </td>

                      <td className="py-3 px-4 text-[#A5B2C1]">
                        {new Date(doc.created_at).toLocaleDateString('es-EC', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/documents/${doc.id}`}
                            className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#34C48A] transition-colors"
                            title="Descargar Archivo"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          {['admin', 'gerente'].includes(currentUser.role) && (
                            <button
                              onClick={() => handleDelete(doc.id, doc.file_name)}
                              disabled={loadingId === doc.id}
                              className="p-1.5 rounded hover:bg-[#202C39] text-[#A5B2C1] hover:text-[#F17474] transition-colors"
                              title="Eliminar Archivo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Subir Archivo */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1118]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="crm-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E]">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="font-bold text-sm text-[#F4F7FA]">Subir Documento Adjunto</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                className="text-[#A5B2C1] hover:text-[#F4F7FA] text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#A5B2C1] mb-1.5">
                  Seleccionar Archivo (Máx. 5 MB) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.txt"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="crm-input w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-[#28B8AA] file:text-[#0B1118] hover:file:bg-[#28B8AA]/90 cursor-pointer"
                />
                <p className="text-[10px] text-[#A5B2C1] mt-1">
                  Formatos permitidos: PDF, JPG, PNG, WEBP, XLSX, DOCX, TXT.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#A5B2C1] mb-1.5">
                  Vincular a *
                </label>
                <select
                  value={entityType}
                  onChange={(e) => {
                    setEntityType(e.target.value as DocumentEntityType);
                    setEntityId('');
                  }}
                  className="crm-input w-full text-xs"
                >
                  <option value="general">Depósito General (Sin vínculo específico)</option>
                  <option value="client">Cliente Registrado</option>
                  <option value="quote">Cotización Comercial</option>
                </select>
              </div>

              {entityType === 'client' && (
                <div>
                  <label className="block font-semibold text-[#A5B2C1] mb-1.5">
                    Seleccionar Cliente
                  </label>
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    required
                    className="crm-input w-full text-xs"
                  >
                    <option value="">Seleccione el cliente correspondiente...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {entityType === 'quote' && (
                <div>
                  <label className="block font-semibold text-[#A5B2C1] mb-1.5">
                    Seleccionar Cotización
                  </label>
                  <select
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    required
                    className="crm-input w-full text-xs"
                  >
                    <option value="">Seleccione la cotización correspondiente...</option>
                    {quotes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.quote_number} (${Number(q.grand_total).toLocaleString()} USD)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 border-t border-[#30404E] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="crm-button-secondary py-2 px-4"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="crm-button-primary py-2 px-4 flex items-center gap-1.5"
                >
                  {uploading ? (
                    <div className="w-3.5 h-3.5 border-2 border-t-transparent border-[#0B1118] rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{uploading ? 'Cargando...' : 'Subir Archivo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
