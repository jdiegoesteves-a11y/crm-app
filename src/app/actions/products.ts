'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { dbManager, generateId } from '@/lib/db';
import { getSession } from '@/lib/auth/session';
import { Product } from '@/types/database';

const productSchema = z.object({
  sku: z.string().min(2, 'El código o SKU es obligatorio'),
  name: z.string().min(2, 'El nombre del producto es obligatorio'),
  description: z.string().optional(),
  category: z.string().min(1, 'La categoría es obligatoria'),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  unit_price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  tax_rate: z.coerce.number().min(0).max(100).default(15.00),
  is_active: z.boolean().default(true),
});

export async function createProductAction(prevState: unknown, formData: FormData) {
  try {
    const session = await getSession();
    if (!session) return { success: false, error: 'Sesión no iniciada' };
    if (!['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'Solo Administradores y Gerentes pueden agregar productos al catálogo.' };
    }

    const rawData = {
      sku: (formData.get('sku') as string).toUpperCase().trim(),
      name: formData.get('name') as string,
      description: (formData.get('description') as string) || undefined,
      category: formData.get('category') as string,
      unit: (formData.get('unit') as string) || 'unidad',
      unit_price: formData.get('unit_price') || 0,
      tax_rate: formData.get('tax_rate') || 15.00,
      is_active: true,
    };

    const parsed = productSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || 'Datos del producto inválidos' };
    }

    const db = dbManager.getDb();

    // Validar duplicado de SKU en la misma organización
    const exists = db.products.some(
      (p) =>
        p.organization_id === session.organization_id &&
        p.sku.toLowerCase() === parsed.data.sku.toLowerCase()
    );

    if (exists) {
      return { success: false, error: 'Ya existe un producto registrado con este código SKU.' };
    }

    const now = new Date().toISOString();
    const newProduct: Product = {
      id: generateId(),
      organization_id: session.organization_id,
      sku: parsed.data.sku,
      name: parsed.data.name,
      description: parsed.data.description,
      category: parsed.data.category,
      unit: parsed.data.unit,
      unit_price: parsed.data.unit_price,
      tax_rate: parsed.data.tax_rate,
      is_active: parsed.data.is_active,
      created_at: now,
      updated_at: now,
    };

    db.products.unshift(newProduct);
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'CREAR_PRODUCTO',
      'product',
      newProduct.id,
      `Producto [${newProduct.sku}] ${newProduct.name} ($${newProduct.unit_price} USD) agregado al catálogo por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/catalogo');
    revalidatePath('/cotizaciones');
    return { success: true, message: 'Producto registrado en el catálogo.', productId: newProduct.id };
  } catch (error) {
    console.error('Error en createProductAction:', error);
    return { success: false, error: 'Ocurrió un error inesperado al guardar el producto.' };
  }
}

export async function toggleProductStatusAction(productId: string) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'gerente'].includes(session.role)) {
      return { success: false, error: 'No autorizado' };
    }

    const db = dbManager.getDb();
    const product = db.products.find((p) => p.id === productId && p.organization_id === session.organization_id);
    if (!product) return { success: false, error: 'Producto no encontrado' };

    product.is_active = !product.is_active;
    product.updated_at = new Date().toISOString();
    dbManager.saveDb(db);

    revalidatePath('/catalogo');
    return { success: true, isActive: product.is_active };
  } catch {
    return { success: false, error: 'Error al cambiar estado del producto.' };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return { success: false, error: 'Solo Administradores pueden eliminar productos del catálogo.' };
    }

    const db = dbManager.getDb();
    const index = db.products.findIndex((p) => p.id === productId && p.organization_id === session.organization_id);
    if (index === -1) return { success: false, error: 'Producto no encontrado' };

    // Validar si está siendo utilizado en cotizaciones existentes
    const isUsed = db.quote_items.some((item) => item.product_id === productId);
    if (isUsed) {
      // En lugar de borrar físicamente, desactivar para preservar integridad histórica
      const p = db.products[index];
      p.is_active = false;
      dbManager.saveDb(db);
      return {
        success: true,
        message: 'El producto está asociado a cotizaciones históricas. Se ha desactivado en su lugar para mantener la integridad.',
      };
    }

    const deleted = db.products.splice(index, 1)[0];
    dbManager.saveDb(db);

    dbManager.logAudit(
      session.organization_id,
      'ELIMINAR_PRODUCTO',
      'product',
      productId,
      `Producto [${deleted.sku}] ${deleted.name} eliminado por ${session.email}`,
      { id: session.id, email: session.email }
    );

    revalidatePath('/catalogo');
    return { success: true };
  } catch {
    return { success: false, error: 'Error al eliminar producto.' };
  }
}
