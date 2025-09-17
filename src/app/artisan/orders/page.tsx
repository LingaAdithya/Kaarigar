import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getOrders } from '@/services/artisan-service';

const getStatusBadgeVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case 'delivered':
      return 'default';
    case 'shipped':
      return 'secondary';
    case 'processing':
      return 'outline';
    case 'pending':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default async function ArtisanOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <h1 className="font-headline text-3xl md:text-4xl mb-8 text-center">Your Orders</h1>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id.substring(0, 6).toUpperCase()}</TableCell>
                  <TableCell>{order.customer}</TableCell>
                  <TableCell>{order.item}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)} className={cn(
                        order.status === 'Delivered' && 'bg-green-600/80 text-white',
                        order.status === 'Shipped' && 'bg-blue-500/80 text-white',
                        order.status === 'Processing' && 'bg-yellow-500/80 text-white',
                        order.status === 'Pending' && 'bg-red-500/80 text-white',
                    )}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{order.price}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
