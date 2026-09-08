import type { Product } from '@checkout/contracts';
import { useState } from 'react';
import { useGetCartQuery, useGetProductsQuery, useSetCartItemMutation } from '@/api/checkoutApi';
import { ErrorState, PageSkeleton } from '@/components/Status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { isAppApiError } from '@/lib/apiError';
import { formatMoney } from '@/lib/money';

export function CatalogPage() {
  const products = useGetProductsQuery();
  const cart = useGetCartQuery();
  const [setItem] = useSetCartItemMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (products.isLoading) return <PageSkeleton />;
  if (products.isError) {
    return (
      <ErrorState
        message={isAppApiError(products.error) ? products.error.message : 'Каталог недоступен.'}
        onRetry={() => void products.refetch()}
      />
    );
  }

  async function add(product: Product) {
    const current = cart.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
    const quantity = current + 1;
    setPendingId(product.id);
    setError(null);
    try {
      await setItem({ productId: product.id, quantity }).unwrap();
    } catch (caught) {
      setError(isAppApiError(caught) ? caught.message : 'Не удалось добавить товар.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
        <p className="text-muted-foreground">Выберите товар и добавьте его в корзину.</p>
      </div>
      {error ? <ErrorState title="Корзина" message={error} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {products.data?.map((product) => {
          const available = product.stock > 0;
          const inCart =
            cart.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
          return (
            <Card key={product.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-2">
                  <span>{product.title}</span>
                  {!available ? <Badge variant="outline">Нет в наличии</Badge> : null}
                </CardTitle>
                <CardDescription>{product.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <p className="text-lg font-semibold">{formatMoney(product.price)}</p>
                {available ? (
                  <p className="text-sm text-muted-foreground">В наличии: {product.stock} шт.</p>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button
                  type="button"
                  disabled={!available || pendingId === product.id || inCart >= product.stock}
                  onClick={() => void add(product)}
                >
                  {pendingId === product.id
                    ? 'Добавляем…'
                    : inCart > 0
                      ? `Ещё одна · в корзине ${inCart}`
                      : 'В корзину'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
