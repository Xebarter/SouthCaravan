import { redirect } from 'next/navigation'

// Services portal is currently backed by the vendor operations surface.
export default function ServicesOrdersPage() {
  redirect('/vendor/orders')
}

