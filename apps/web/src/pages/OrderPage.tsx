import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useGetOrderQuery, useGetPaymentQuery, useGetPaymentsQuery } from '@/api/checkoutApi';
import { ErrorState, LoadingState, PageSkeleton } from '@/components/Status';
import { deliveryLabel, Totals } from '@/components/Totals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { isAppApiError } from '@/lib/apiError';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/store';

export function OrderPage() {
  const { orderId = '' } = useParams();
  const storedPaymentId = useAppSelector((state) => state.checkout.paymentId);
  const [orderPoll, setOrderPoll] = useState(800);
  const orderQuery = useGetOrderQuery(orderId, {
    skip: !orderId,
    pollingInterval: orderPoll,
  });
  const paymentsQuery = useGetPaymentsQuery(orderId, { skip: !orderId });
  const latest = paymentsQuery.data?.[0];
  const paymentId = latest?.id ?? storedPaymentId;
  const inProgress = latest?.status === 'pending' || latest?.status === 'processing';
  const paymentQuery = useGetPaymentQuery(paymentId ?? '', {
    skip: !paymentId || !inProgress,
    pollingInterval: inProgress ? 800 : 0,
  });

  const order = orderQuery.data;
  const payment = (paymentId && inProgress ? paymentQuery.currentData : undefined) ?? latest;

  useEffect(() => {
    if (!order) return;
    setOrderPoll(order.paymentStatus === 'pending' ? 800 : 0);
  }, [order]);

  if (orderQuery.isLoading) return <PageSkeleton />;
  if (orderQuery.isError) {
    return (
      <ErrorState
        message={isAppApiError(orderQuery.error) ? orderQuery.error.message : 'Заказ не найден.'}
        onRetry={() => void orderQuery.refetch()}
      />
    );
  }
  if (!order) return <PageSkeleton />;

  const paid = order.status === 'paid' && order.paymentStatus === 'succeeded';
  const cash = order.paymentMethod === 'cash_on_delivery' && order.status === 'confirmed';
  const waiting =
    order.paymentMethod === 'card' && (inProgress || order.paymentStatus === 'pending');
  const failed = payment?.status === 'failed' || order.paymentStatus === 'failed';
  const cancelled = payment?.status === 'cancelled' || order.paymentStatus === 'cancelled';

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Заказ {order.number}</h1>

      {waiting ? (
        <Alert>
          <AlertTitle>Оплата ещё обрабатывается</AlertTitle>
          <AlertDescription>
            <LoadingState label="Уточняем статус заказа на сервере…" />
          </AlertDescription>
        </Alert>
      ) : null}

      {paid ? (
        <Alert>
          <AlertTitle>Оплата прошла</AlertTitle>
          <AlertDescription>
            Заказ подтверждён. Ниже состав, доставка и сумма с сервера.
          </AlertDescription>
        </Alert>
      ) : null}

      {cash ? (
        <Alert>
          <AlertTitle>Заказ оформлен, оплата при получении</AlertTitle>
          <AlertDescription>Онлайн-оплата не требуется.</AlertDescription>
        </Alert>
      ) : null}

      {failed && !waiting && !paid ? (
        <Alert variant="destructive">
          <AlertTitle>Банк отказал в оплате</AlertTitle>
          <AlertDescription>Можно повторить оплату этого заказа.</AlertDescription>
        </Alert>
      ) : null}

      {cancelled && !waiting && !paid && !failed ? (
        <Alert>
          <AlertTitle>Оплата отменена</AlertTitle>
          <AlertDescription>Списания не было. Можно оплатить заказ ещё раз.</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Состав</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <ul className="grid gap-2 text-sm">
            {order.items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span>{formatMoney(item.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm">{deliveryLabel(order.delivery)}</p>
          <Totals subtotal={order.subtotal} shipping={order.shipping} total={order.total} />
        </CardContent>
      </Card>

      {order.paymentMethod === 'card' && !paid ? (
        <Link to={`/orders/${order.id}/pay`} className={cn(buttonVariants(), 'w-fit')}>
          {waiting ? 'К статусу оплаты' : 'Оплатить заказ'}
        </Link>
      ) : null}

      <Link to="/" className={cn(buttonVariants({ variant: 'outline' }), 'w-fit')}>
        В каталог
      </Link>
    </div>
  );
}
