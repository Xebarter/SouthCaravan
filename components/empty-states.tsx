import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, MessageSquare, BarChart3, Inbox, FileText, Users } from 'lucide-react';

export function NoOrdersState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Orders Yet</h3>
      <p className="text-muted-foreground mb-6">Start browsing products and place your first order</p>
      <Link href="/catalog">
        <Button>Browse Products</Button>
      </Link>
    </div>
  );
}

export function NoMessagesState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Messages</h3>
      <p className="text-muted-foreground mb-6">Start a conversation with a vendor</p>
      <Link href="/public/vendors">
        <Button>Find Vendors</Button>
      </Link>
    </div>
  );
}

export function NoAnalyticsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Analytics Data</h3>
      <p className="text-muted-foreground">Data will appear once you complete your first transaction</p>
    </div>
  );
}

export function NoQuotesState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Quotes Requested</h3>
      <p className="text-muted-foreground mb-6">Request quotes from vendors for bulk orders</p>
      <Link href="/catalog">
        <Button>Request Quote</Button>
      </Link>
    </div>
  );
}

export function NoProductsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <ShoppingCart className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Products Found</h3>
      <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
      <Button variant="outline">Clear Filters</Button>
    </div>
  );
}

export function NoVendorsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Users className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">No Vendors Found</h3>
      <p className="text-muted-foreground">Check back soon for new vendors in your category</p>
    </div>
  );
}

export function EmptyInboxState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="w-16 h-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold text-foreground mb-2">Inbox Empty</h3>
      <p className="text-muted-foreground">You're all caught up! No new notifications</p>
    </div>
  );
}
