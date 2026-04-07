import { sanitizeProductHtml } from '@/lib/sanitize-product-html';

type Props = {
  html: string;
  className?: string;
};

export function ProductRichText({ html, className }: Props) {
  const safe = sanitizeProductHtml(html);
  if (!safe.trim()) return null;

  return (
    <div
      className={['product-rich-text text-sm leading-relaxed text-slate-600', className].filter(Boolean).join(' ')}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
