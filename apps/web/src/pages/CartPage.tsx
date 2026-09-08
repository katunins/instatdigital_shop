import { Link } from 'react-router-dom';
import {
  useDeleteCartItemMutation,
  useGetCartQuery,
  useSetCartItemMutation,
} from '@/api/checkoutApi';
import { ErrorState, PageSkeleton } from '@/components/Status';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { isAppApiError } from '@/lib/apiError';
import { formatMoney } from '@/lib/money';
import { useState } from 'react';

export function CartPage() {
  const cart = useGetCartQuery();
  const [setItem] = useSetCartItemMutation();
  const [removeItem] = useDeleteCartItemMutation();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (cart.isLoading) return <PageSkeleton />;
  if (cart.isError) {
    return (
      <ErrorState
        message={isAppApiError(cart.error) ? cart.error.message : 'Корзина недоступна.'}
        onRetry={() => void cart.refetch()}
      />
    );
  }

  const data = cart.data;
  if (!data || data.items.length === 0) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
        <p className="text-muted-foreground">Корзина пустая. Добавьте товар из каталога.</p>
        <Link to="/" className={cn(buttonVariants(), 'w-fit')}>
          К каталогу
        </Link>
      </div>
    );
  }

  async function changeQuantity(productId: string, quantity: number) {
    setBusyId(productId);
    setError(null);
    try {
      if (quantity < 1) await removeItem(productId).unwrap();
      else await setItem({ productId, quantity }).unwrap();
    } catch (caught) {
      setError(isAppApiError(caught) ? caught.message : 'Не удалось изменить корзину.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Корзина</h1>
      {error ? <ErrorState title="Изменение корзины" message={error} /> : null}
      <div className="grid gap-4">
        {data.items.map((item) => (
          <Card key={item.productId}>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
              <CardTitle className="text-base">{item.title}</CardTitle>
              <p className="font-semibold">{formatMoney(item.lineTotal)}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="grid gap-2">
                <Label htmlFor={`qty-${item.productId}`}>Количество</Label>
                <Input
                  id={`qty-${item.productId}`}
                  type="number"
                  min={1}
                  max={99}
                  className="w-24"
                  disabled={busyId === item.productId}
                  value={item.quantity}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    if (Number.isInteger(next) && next >= 1)
                      void changeQuantity(item.productId, next);
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  {formatMoney(item.unitPrice)} за шт.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === item.productId || item.quantity <= 1}
                  onClick={() => void changeQuantity(item.productId, item.quantity - 1)}
                >
                  −
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busyId === item.productId}
                  onClick={() => void changeQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={busyId === item.productId}
                  onClick={() => void changeQuantity(item.productId, 0)}
                >
                  Удалить
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-lg font-semibold">Итого: {formatMoney(data.subtotal)}</p>
          <Link to="/checkout" className={cn(buttonVariants(), 'w-fit')}>
            Перейти к оформлению
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
