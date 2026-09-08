import type { Product } from '@checkout/contracts';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGetCartQuery, useGetProductsQuery, useSetCartItemMutation } from '@/api/checkoutApi';
import { Price } from '@/components/Price';
import { ErrorState, PageSkeleton } from '@/components/Status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { isAppApiError } from '@/lib/apiError';

export function CatalogPage() {
  const products = useGetProductsQuery();
  const cart = useGetCartQuery();
  const [setItem] = useSetCartItemMutation();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [params] = useSearchParams();
  const query = params.get('q')?.trim().toLowerCase() ?? '';

  if (products.isLoading) return <PageSkeleton />;
  if (products.isError) {
    return (
      <ErrorState
        message={isAppApiError(products.error) ? products.error.message : 'Каталог недоступен.'}
        onRetry={() => void products.refetch()}
      />
    );
  }

  const items = (products.data ?? []).filter(
    (product) =>
      !query ||
      product.title.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query),
  );

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
    <div className="grid gap-4">
      <div className="rounded-sm bg-white px-4 py-3">
        <h1 className="text-xl font-bold">
          {query ? `Результаты по запросу «${params.get('q')}»` : 'Каталог'}
        </h1>
        {query ? (
          <p className="text-sm text-muted-foreground">{items.length} товар(ов)</p>
        ) : null}
      </div>
      {error ? <ErrorState title="Корзина" message={error} /> : null}
      {items.length === 0 ? (
        <div className="rounded-sm bg-white px-4 py-10 text-center">
          <p className="text-lg font-bold">Нет товаров по этому запросу</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((product) => {
            const available = product.stock > 0;
            const inCart =
              cart.data?.items.find((item) => item.productId === product.id)?.quantity ?? 0;
            return (
              <article key={product.id} className="flex flex-col rounded-sm bg-white p-3">
                <h2 className="amazon-link line-clamp-2 text-[16px] leading-5">{product.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{product.sku}</p>
                <div className="mt-2">
                  <Price kopecks={product.price} />
                </div>
                {available ? (
                  <p className="mt-1 text-xs text-muted-foreground">В наличии: {product.stock} шт.</p>
                ) : (
                  <Badge variant="outline" className="mt-2 w-fit">
                    Нет в наличии
                  </Badge>
                )}
                <Button
                  type="button"
                  className="mt-3 w-full"
                  disabled={!available || pendingId === product.id || inCart >= product.stock}
                  onClick={() => void add(product)}
                >
                  {pendingId === product.id
                    ? 'Добавляем…'
                    : inCart > 0
                      ? `Ещё одна · в корзине ${inCart}`
                      : 'В корзину'}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
