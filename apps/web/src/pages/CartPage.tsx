import { Link } from 'react-router-dom';
import {
  useDeleteCartItemMutation,
  useGetCartQuery,
  useSetCartItemMutation,
} from '@/api/checkoutApi';
import { Price } from '@/components/Price';
import { ErrorState, PageSkeleton } from '@/components/Status';
import { Button, buttonVariants } from '@/components/ui/button';
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
      <div className="rounded-sm bg-white px-6 py-10">
        <h1 className="text-2xl font-bold">Корзина</h1>
        <p className="mt-2 text-muted-foreground">Корзина пустая. Добавьте товар из каталога.</p>
        <Link to="/" className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-fit')}>
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="rounded-sm bg-white px-4 py-4 sm:px-6">
        <div className="flex items-end justify-between border-b border-[#ddd] pb-2">
          <h1 className="text-2xl font-bold">Корзина</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">Цена</p>
        </div>
        {error ? (
          <div className="pt-4">
            <ErrorState title="Изменение корзины" message={error} />
          </div>
        ) : null}
        <ul>
          {data.items.map((item) => (
            <li
              key={item.productId}
              className="grid gap-4 border-b border-[#ddd] py-4 sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div>
                <p className="text-lg leading-5">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatMoney(item.unitPrice)} за шт.</p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <div className="grid gap-1">
                    <Label htmlFor={`qty-${item.productId}`}>Кол-во</Label>
                    <Input
                      id={`qty-${item.productId}`}
                      type="number"
                      min={1}
                      max={99}
                      className="w-16"
                      disabled={busyId === item.productId}
                      value={item.quantity}
                      onChange={(event) => {
                        const next = Number(event.target.value);
                        if (Number.isInteger(next) && next >= 1)
                          void changeQuantity(item.productId, next);
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={busyId === item.productId || item.quantity <= 1}
                      onClick={() => void changeQuantity(item.productId, item.quantity - 1)}
                    >
                      −
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={busyId === item.productId}
                      onClick={() => void changeQuantity(item.productId, item.quantity + 1)}
                    >
                      +
                    </Button>
                    <button
                      type="button"
                      className="amazon-link text-xs disabled:opacity-50"
                      disabled={busyId === item.productId}
                      onClick={() => void changeQuantity(item.productId, 0)}
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
              <Price kopecks={item.lineTotal} size="sm" className="justify-self-end" />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-right text-lg">
          Итого ({data.quantity} шт.): <Price kopecks={data.subtotal} size="sm" />
        </p>
      </section>
      <aside className="h-fit rounded-sm bg-white p-4 lg:sticky lg:top-24">
        <p className="text-lg">
          Промежуточный итог ({data.quantity} шт.):{' '}
          <span className="font-bold">
            <Price kopecks={data.subtotal} size="sm" />
          </span>
        </p>
        <Link to="/checkout" className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-full')}>
          Перейти к оформлению
        </Link>
      </aside>
    </div>
  );
}
