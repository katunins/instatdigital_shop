import type { Delivery, Quote } from '@checkout/contracts';
import { Price } from '@/components/Price';
import { formatMoney } from '@/lib/money';

export function deliveryLabel(delivery: Delivery) {
  if (delivery.method === 'pickup') {
    return delivery.pickupPointId === 'point-north'
      ? 'Самовывоз: Северный пункт'
      : 'Самовывоз: Центральный пункт';
  }
  const { city, street, house, apartment } = delivery.address;
  return `Курьер: ${city}, ${street}, ${house}${apartment ? `, кв. ${apartment}` : ''}`;
}

export function Totals({
  subtotal,
  shipping,
  total,
}: {
  subtotal: number;
  shipping: number;
  total: number;
}) {
  return (
    <dl className="grid gap-2 border-t border-[#d5d9d9] pt-3 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Товары</dt>
        <dd>{formatMoney(subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Доставка</dt>
        <dd>{shipping === 0 ? 'Бесплатно' : formatMoney(shipping)}</dd>
      </div>
      <div className="flex justify-between gap-4 text-lg font-bold">
        <dt>Итого к оплате</dt>
        <dd>
          <Price kopecks={total} size="sm" />
        </dd>
      </div>
    </dl>
  );
}

export function QuoteTotals({ quote }: { quote: Quote }) {
  return <Totals subtotal={quote.subtotal} shipping={quote.shipping} total={quote.total} />;
}
