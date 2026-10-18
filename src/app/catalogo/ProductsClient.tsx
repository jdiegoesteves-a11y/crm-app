'use client';

import React, { useState } from 'react';
import { Product, SessionUser } from '@/types/database';
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Tag,
  DollarSign,
  Percent,
  Trash2,
  Power,
  Package,
} from 'lucide-react';
import {
  createProductAction,
  toggleProductStatusAction,
  deleteProductAction,
} from '@/app/actions/products';

interface ProductsClientProps {
  initialProducts: Product[];
  currentUser: SessionUser;
}

export function ProductsClient({ initialProducts, currentUser }: ProductsClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todas');
  const [statusFilter, setStatusFilter] = useState('todos');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Nuevo Producto
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Software');
  const [unit, setUnit] = useState('licencia');
  const [unitPrice, setUnitPrice] = useState<number>(1000);
  const [taxRate, setTaxRate] = useState<number>(15.00);

  const categories = Array.from(new Set(products.map((p) => p.category)));

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(term) ||
      p.sku.toLowerCase().includes(term) ||
      (p.description && p.description.toLowerCase().includes(term));

    const matchesCategory = categoryFilter === 'todas' || p.category === categoryFilter;
    const matchesStatus =
      statusFilter === 'todos' ||
      (statusFilter === 'activos' && p.is_active) ||
      (statusFilter === 'inactivos' && !p.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleStatus = async (productId: string) => {
    const res = await toggleProductStatusAction(productId);
    if (res?.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_active: res.isActive ?? !p.is_active } : p))
      );
      setFeedback({ type: 'success', text: 'Estado del producto actualizado.' });
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('¿Confirma que desea eliminar este producto del catálogo?')) return;
    const res = await deleteProductAction(productId);
    if (res?.success) {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setFeedback({ type: 'success', text: res.message || 'Producto eliminado.' });
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al eliminar.' });
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('sku', sku);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('unit', unit);
    formData.append('unit_price', unitPrice.toString());
    formData.append('tax_rate', taxRate.toString());

    const res = await createProductAction(null, formData);
    if (res?.success) {
      setIsModalOpen(false);
      setSku('');
      setName('');
      setDescription('');
      setFeedback({ type: 'success', text: res.message || 'Producto registrado exitosamente.' });
      window.location.reload();
    } else {
      setFeedback({ type: 'error', text: res?.error || 'Error al guardar el producto.' });
    }
    setLoading(false);
  };

  const canManage = ['admin', 'gerente'].includes(currentUser.role);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#F4F7FA]">Catálogo de Productos y Servicios</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#28B8AA]/15 text-[#28B8AA] border border-[#28B8AA]/30">
              {products.length} Ítems
            </span>
          </div>
          <p className="text-xs text-[#A5B2C1] mt-1">
            Gestión comercial de bienes, licencias y servicios con precios unitarios en USD e IVA configurable.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="crm-button-primary text-xs py-2 px-4 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        )}
      </div>

      {/* Alerta */}
      {feedback && (
        <div
          className={`p-3.5 rounded-lg border flex items-center gap-2.5 text-xs ${
            feedback.type === 'success'
              ? 'bg-[#34C48A]/15 border-[#34C48A]/40 text-[#34C48A]'
              : 'bg-[#F17474]/15 border-[#F17474]/40 text-[#F17474]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Filtros */}
      <div className="crm-card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#A5B2C1] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código SKU, nombre o descripción..."
            className="w-full bg-[#202C39] border border-[#30404E] rounded-lg pl-9 pr-4 py-2 text-xs text-[#F4F7FA] placeholder-[#64748B] focus:outline-none focus:border-[#28B8AA]"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
          >
            <option value="todas">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#202C39] border border-[#30404E] text-[#F4F7FA] rounded-lg px-2.5 py-1.5 focus:border-[#28B8AA] focus:outline-none"
          >
            <option value="todos">Todos los estados</option>
            <option value="activos">Solo activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Tabla del Catálogo */}
      <div className="crm-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#202C39] border-b border-[#30404E] text-[#A5B2C1] uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código SKU</th>
                <th className="py-3 px-4">Nombre / Categoría</th>
                <th className="py-3 px-4">Unidad</th>
                <th className="py-3 px-4">Precio Unitario (USD)</th>
                <th className="py-3 px-4">IVA</th>
                <th className="py-3 px-4">Estado</th>
                {canManage && <th className="py-3 px-4 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30404E]/50">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#A5B2C1]">
                    No se encontraron productos en el catálogo.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#202C39]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#28B8AA]">
                      {p.sku}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#F4F7FA]">{p.name}</div>
                      <div className="text-[11px] text-[#A5B2C1] flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-[#202C39] text-[#A5B2C1] border border-[#30404E]">
                          {p.category}
                        </span>
                        {p.description && <span className="truncate max-w-xs">{p.description}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-[#A5B2C1] capitalize">
                      {p.unit}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-sm text-[#F4F7FA]">
                      ${Number(p.unit_price).toFixed(2)} USD
                    </td>

                    <td className="py-3.5 px-4 text-[#A5B2C1]">
                      {p.tax_rate}%
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                          p.is_active
                            ? 'bg-[#34C48A]/15 border-[#34C48A]/30 text-[#34C48A]'
                            : 'bg-[#F17474]/15 border-[#F17474]/30 text-[#F17474]'
                        }`}
                      >
                        {p.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    {canManage && (
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleStatus(p.id)}
                            className={`p-1.5 rounded text-xs font-semibold border transition-colors ${
                              p.is_active
                                ? 'border-[#30404E] text-[#A5B2C1] hover:text-[#F0B454]'
                                : 'border-[#34C48A]/40 text-[#34C48A]'
                            }`}
                            title={p.is_active ? 'Desactivar producto' : 'Activar producto'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded text-[#A5B2C1] hover:text-[#F17474] transition-colors"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Crear Nuevo Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="crm-card max-w-md w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-[#30404E] mb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-[#28B8AA]" />
                <h3 className="text-base font-bold text-[#F4F7FA]">Agregar Producto / Servicio</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#A5B2C1] hover:text-[#F4F7FA] text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ej. SFT-CLOUD-01"
                    className="crm-input font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Categoría</label>
                  <input
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Software, Soporte..."
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Nombre Comercial *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Licencia ERP Enterprise Anual"
                  className="crm-input"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Precio ($ USD) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value))}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">IVA (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="crm-input"
                  />
                </div>
                <div>
                  <label className="block text-[#A5B2C1] font-medium mb-1">Unidad</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="licencia, hora..."
                    className="crm-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A5B2C1] font-medium mb-1">Descripción / Alcance</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalles técnicos o alcance del servicio..."
                  className="crm-input"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#30404E]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="crm-button-secondary text-xs">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="crm-button-primary text-xs">
                  {loading ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
