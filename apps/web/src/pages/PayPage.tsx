import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useCreatePaymentMutation,
  useGetOrderQuery,
  useGetPaymentQuery,
  useGetPaymentsQuery,
  useGetSandboxQuery,
  useSimulatePaymentMutation,
} from '@/api/checkoutApi';
import { ErrorState, LoadingState, PageSkeleton } from '@/components/Status';
import { deliveryLabel, Totals } from '@/components/Totals';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { isAppApiError } from '@/lib/apiError';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearPaymentAttempt, savePaymentAttempt, setPaymentId } from '@/store/checkoutSlice';

const FINAL = new Set(['succeeded', 'failed', 'cancelled']);

export function PayPage() {
  const { orderId = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const storedPaymentId = useAppSelector((state) => state.checkout.paymentId);
  const storedPaymentKey = useAppSelector((state) => state.checkout.paymentKey);
  const [orderPoll, setOrderPoll] = useState(1000);
  const orderQuery = useGetOrderQuery(orderId, { skip: !orderId, pollingInterval: orderPoll });
  const sandboxQuery = useGetSandboxQuery();
  const paymentsQuery = useGetPaymentsQuery(orderId, { skip: !orderId });
  const [createPayment] = useCreatePaymentMutation();
  const [simulatePayment] = useSimulatePaymentMutation();
  const [cardId, setCardId] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAttempt, setNewAttempt] = useState(false);

  const inFlight = paymentsQuery.data?.find(
    (item) => item.status === 'pending' || item.status === 'processing',
  );
  const storedPayment = storedPaymentId
    ? paymentsQuery.data?.find((item) => item.id === storedPaymentId)
    : undefined;
  const activePayment = inFlight ?? (newAttempt ? undefined : storedPayment);
  const paymentId = activePayment?.id ?? (newAttempt ? null : storedPaymentId);
  const paymentQuery = useGetPaymentQuery(paymentId ?? '', {
    skip: !paymentId,
    pollingInterval: paymentId && (!activePayment || !FINAL.has(activePayment.status)) ? 800 : 0,
  });
  const payment = (paymentId ? paymentQuery.currentData : undefined) ?? activePayment;

  useEffect(() => {
    if (payment?.id && (payment.status === 'pending' || payment.status === 'processing')) {
      dispatch(setPaymentId(payment.id));
    }
  }, [payment, dispatch]);

  useEffect(() => {
    if (inFlight) setNewAttempt(false);
  }, [inFlight]);

  useEffect(() => {
    setOrderPoll(payment && !FINAL.has(payment.status) ? 1000 : 0);
  }, [payment]);

  useEffect(() => {
    const order = orderQuery.data;
    if (!order) return;
    if (order.status === 'paid' && order.paymentStatus === 'succeeded') {
      navigate(`/orders/${order.id}`, { replace: true });
    }
    if (order.paymentMethod === 'cash_on_delivery') {
      navigate(`/orders/${order.id}`, { replace: true });
    }
  }, [orderQuery.data, navigate]);

  useEffect(() => {
    if (!payment) return;
    if (FINAL.has(payment.status)) {
      void orderQuery.refetch().then((result) => {
        if (result.data?.status === 'paid') navigate(`/orders/${orderId}`, { replace: true });
      });
    }
  }, [payment, orderId, navigate, orderQuery]);

  if (orderQuery.isLoading || sandboxQuery.isLoading) return <PageSkeleton />;
  if (orderQuery.isError) {
    return (
      <ErrorState
        message={isAppApiError(orderQuery.error) ? orderQuery.error.message : 'Заказ не найден.'}
        onRetry={() => void orderQuery.refetch()}
      />
    );
  }

  const order = orderQuery.data;
  if (!order) return <PageSkeleton />;

  const waiting = payment?.status === 'pending' || payment?.status === 'processing';
  const declined = !newAttempt && payment?.status === 'failed';
  const cancelled = !newAttempt && payment?.status === 'cancelled';
  const selected =
    sandboxQuery.data?.cards.find((card) => card.id === cardId) ?? sandboxQuery.data?.cards[0];

  async function ensurePayment() {
    const key = storedPaymentKey ?? crypto.randomUUID();
    if (!storedPaymentKey) dispatch(savePaymentAttempt({ key }));
    const created = await createPayment({ orderId, key }).unwrap();
    dispatch(savePaymentAttempt({ key, paymentId: created.id }));
    return created;
  }

  async function pay() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      const current = await ensurePayment();
      await simulatePayment({ paymentId: current.id, scenario: selected.scenario }).unwrap();
    } catch (caught) {
      if (isAppApiError(caught) && caught.code === 'PAYMENT_IN_PROGRESS') {
        void paymentsQuery.refetch();
        setError(caught.message);
      } else {
        setError(isAppApiError(caught) ? caught.message : 'Не удалось начать оплату.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setError(null);
    try {
      const current = await ensurePayment();
      await simulatePayment({ paymentId: current.id, scenario: 'cancel' }).unwrap();
    } catch (caught) {
      setError(isAppApiError(caught) ? caught.message : 'Не удалось отменить оплату.');
    } finally {
      setBusy(false);
    }
  }

  function retry() {
    dispatch(clearPaymentAttempt());
    setNewAttempt(true);
    setError(null);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="grid gap-4">
        <div className="rounded-sm bg-white px-4 py-3">
          <h1 className="text-2xl font-bold">Оплата картой</h1>
          <p className="text-sm text-muted-foreground">
            Тестовая форма: выберите карту по названию и маске. Номер и CVC не нужны.
          </p>
        </div>
        {error ? <ErrorState title="Оплата" message={error} /> : null}
        {waiting ? (
          <Alert>
            <AlertTitle>Ожидаем ответ банка</AlertTitle>
            <AlertDescription>
              <LoadingState label="Проверяем статус оплаты на сервере…" />
            </AlertDescription>
          </Alert>
        ) : null}
        {declined ? (
          <Alert variant="destructive">
            <AlertTitle>Банк отказал в оплате</AlertTitle>
            <AlertDescription>
              Карта отклонена. Можно оплатить этот же заказ ещё раз.
            </AlertDescription>
          </Alert>
        ) : null}
        {cancelled ? (
          <Alert>
            <AlertTitle>Оплата отменена</AlertTitle>
            <AlertDescription>
              Вы закрыли форму без списания. Можно попробовать снова.
            </AlertDescription>
          </Alert>
        ) : null}

        {declined || cancelled ? (
          <Button type="button" variant="outline" className="w-fit" onClick={retry}>
            Новая попытка оплаты
          </Button>
        ) : null}

        {!waiting && !declined && !cancelled ? (
          <Card>
            <CardHeader>
              <CardTitle>Тестовая карта</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <RadioGroup
                value={selected?.id ?? ''}
                onValueChange={setCardId}
                className="grid gap-2"
              >
                {sandboxQuery.data?.cards.map((card) => (
                  <label
                    key={card.id}
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-sm border p-3',
                      (selected?.id ?? sandboxQuery.data?.cards[0]?.id) === card.id
                        ? 'border-[#c45500] bg-[#fcf5ee]'
                        : 'border-[#d5d9d9]',
                    )}
                  >
                    <RadioGroupItem value={card.id} id={card.id} />
                    <span>
                      <span className="block font-bold">{card.title}</span>
                      <span className="text-sm text-muted-foreground">{card.maskedNumber}</span>
                    </span>
                  </label>
                ))}
              </RadioGroup>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" size="lg" disabled={busy || !selected} onClick={() => void pay()}>
                  {busy ? 'Отправляем…' : 'Оплатить'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void cancel()}
                >
                  Отменить
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
      <aside className="h-fit lg:sticky lg:top-24">
        <Card>
          <CardHeader>
            <CardTitle>Заказ {order.number}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
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
            <p className="text-sm text-muted-foreground">{deliveryLabel(order.delivery)}</p>
            <Totals subtotal={order.subtotal} shipping={order.shipping} total={order.total} />
            <Link to={`/orders/${order.id}`} className="amazon-link text-sm">
              К заказу
            </Link>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
