/** Shared limit for admin product image uploads (must match API validation). */
export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

export function productImageMaxSizeLabel(): string {
  return `${MAX_PRODUCT_IMAGE_BYTES / 1024 / 1024}MB`;
}
