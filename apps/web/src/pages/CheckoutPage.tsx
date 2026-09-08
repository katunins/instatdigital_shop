import type { Quote } from '@checkout/contracts';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  useCreateOrderMutation,
  useCreateQuoteMutation,
  useGetCartQuery,
  useGetCheckoutOptionsQuery,
  useGetQuoteQuery,
} from '@/api/checkoutApi';
import { FormField } from '@/components/FormField';
import { ErrorState, LoadingState, PageSkeleton } from '@/components/Status';
import { QuoteTotals } from '@/components/Totals';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { fieldErrorsFromApi, isAppApiError } from '@/lib/apiError';
import {
  isDeliveryReady,
  orderBodyFromDraft,
  quoteBodyFromDraft,
  sameOrderBody,
  validateDraft,
} from '@/lib/checkout';
import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  clearOrderAttempt,
  saveOrderAttempt,
  setOrderId,
  setQuoteId,
  updateDraft,
  type DeliveryMethod,
  type PaymentMethod,
} from '@/store/checkoutSlice';

export function CheckoutPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const draft = useAppSelector((state) => state.checkout.draft);
  const quoteId = useAppSelector((state) => state.checkout.quoteId);
  const orderKey = useAppSelector((state) => state.checkout.orderKey);
  const storedBody = useAppSelector((state) => state.checkout.orderBody);
  const cartQuery = useGetCartQuery();
  const optionsQuery = useGetCheckoutOptionsQuery();
  const quoteQuery = useGetQuoteQuery(quoteId ?? '', { skip: !quoteId });
  const [createQuote, quoteMutation] = useCreateQuoteMutation();
  const [createOrder, orderMutation] = useCreateOrderMutation();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [quoteNotice, setQuoteNotice] = useState<string | null>(null);

  const cart = cartQuery.data;
  const deliverySignature = useMemo(
    () => JSON.stringify(quoteBodyFromDraft(draft, cart?.version ?? -1)),
    [draft, cart?.version],
  );

  useEffect(() => {
    if (!cart || cart.items.length === 0) return;
    if (!isDeliveryReady(draft)) return;
    const body = quoteBodyFromDraft(draft, cart.version);
    let alive = true;
    void createQuote(body)
      .unwrap()
      .then((next) => {
        if (!alive) return;
        dispatch(setQuoteId(next.id));
        dispatch(clearOrderAttempt());
      })
      .catch((caught: unknown) => {
        if (!alive) return;
        if (isAppApiError(caught) && caught.code === 'CART_VERSION_CONFLICT') {
          setQuoteNotice(caught.message);
          void cartQuery.refetch();
          return;
        }
        setFormError(isAppApiError(caught) ? caught.message : 'Не удалось рассчитать доставку.');
      });
    return () => {
      alive = false;
    };
  }, [deliverySignature, cart, draft, createQuote, dispatch, cartQuery]);

  if (cartQuery.isLoading || optionsQuery.isLoading) return <PageSkeleton />;
  if (cartQuery.isError) {
    return (
      <ErrorState
        message={isAppApiError(cartQuery.error) ? cartQuery.error.message : 'Корзина недоступна.'}
        onRetry={() => void cartQuery.refetch()}
      />
    );
  }
  if (!cart || cart.items.length === 0) {
    return (
      <div className="rounded-sm bg-white px-6 py-10">
        <h1 className="text-2xl font-bold">Оформление заказа</h1>
        <p className="mt-2 text-muted-foreground">Пустую корзину оформить нельзя.</p>
        <Link to="/" className={cn(buttonVariants({ size: 'lg' }), 'mt-4 w-fit')}>
          К каталогу
        </Link>
      </div>
    );
  }

  const quote: Quote | undefined = quoteQuery.data;
  const pickup = optionsQuery.data?.deliveryMethods.find((method) => method.id === 'pickup');
  const quoting = quoteMutation.isLoading || (Boolean(quoteId) && quoteQuery.isFetching && !quote);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const local = validateDraft(draft);
    setFieldErrors(local);
    if (Object.keys(local).length > 0) return;
    if (!cart) return;
    setFormError(null);
    try {
      let currentQuote = quote;
      if (!currentQuote || currentQuote.cartVersion !== cart.version) {
        currentQuote = await createQuote(quoteBodyFromDraft(draft, cart.version)).unwrap();
        dispatch(setQuoteId(currentQuote.id));
      }
      const body = orderBodyFromDraft(draft, currentQuote.id);
      const key = orderKey && sameOrderBody(storedBody, body) ? orderKey : crypto.randomUUID();
      if (key !== orderKey) dispatch(saveOrderAttempt({ key, body }));
      const order = await createOrder({ body, key }).unwrap();
      dispatch(setOrderId(order.id));
      if (order.paymentMethod === 'cash_on_delivery') navigate(`/orders/${order.id}`);
      else navigate(`/orders/${order.id}/pay`);
    } catch (caught) {
      if (!isAppApiError(caught)) {
        setFormError('Не удалось оформить заказ. Повторите отправку.');
        return;
      }
      setFieldErrors((current) => ({ ...current, ...fieldErrorsFromApi(caught) }));
      if (caught.code === 'CART_VERSION_CONFLICT' || caught.code === 'QUOTE_EXPIRED') {
        dispatch(clearOrderAttempt());
        dispatch(setQuoteId(null));
        setQuoteNotice(caught.message);
        void cartQuery.refetch();
        return;
      }
      if (caught.code === 'CART_EMPTY') {
        setFormError(caught.message);
        return;
      }
      setFormError(caught.message);
    }
  }

  return (
    <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]" onSubmit={submit} noValidate>
      <div className="grid gap-4">
        <div className="rounded-sm bg-white px-4 py-3">
          <h1 className="text-2xl font-bold">Оформление заказа</h1>
          <p className="text-sm text-muted-foreground">Контакты, доставка и способ оплаты.</p>
        </div>
        {formError ? <ErrorState title="Оформление" message={formError} /> : null}
        {quoteNotice ? <ErrorState title="Данные обновились" message={quoteNotice} /> : null}

        <Card>
          <CardHeader>
            <CardTitle>1. Контакты</CardTitle>
          </CardHeader>
          <CardContent className="grid max-w-md gap-3">
            <FormField id="name" label="Имя" error={fieldErrors.name}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                value={draft.name}
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                onChange={(event) => dispatch(updateDraft({ name: event.target.value }))}
              />
            </FormField>
            <FormField id="email" label="Email" error={fieldErrors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={draft.email}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                onChange={(event) => dispatch(updateDraft({ email: event.target.value }))}
              />
            </FormField>
            <FormField id="phone" label="Телефон" error={fieldErrors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+79990000000"
                className="max-w-48"
                value={draft.phone}
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                onChange={(event) => dispatch(updateDraft({ phone: event.target.value }))}
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Доставка</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <RadioGroup
              value={draft.deliveryMethod}
              onValueChange={(value) =>
                dispatch(updateDraft({ deliveryMethod: value as DeliveryMethod }))
              }
              className="grid max-w-md gap-2"
            >
              {optionsQuery.data?.deliveryMethods.map((method) => (
                <label
                  key={method.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-sm border p-3',
                    draft.deliveryMethod === method.id
                      ? 'border-[#c45500] bg-[#fcf5ee]'
                      : 'border-[#d5d9d9]',
                  )}
                >
                  <RadioGroupItem value={method.id} id={`delivery-${method.id}`} />
                  <span>
                    <span className="block font-medium">{method.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {method.price === 0
                        ? 'Бесплатно'
                        : method.freeFrom
                          ? `${formatMoney(method.price)}, бесплатно от ${formatMoney(method.freeFrom)}`
                          : formatMoney(method.price)}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>

            {draft.deliveryMethod === 'pickup' ? (
              <FormField id="pickupPointId" label="Пункт выдачи" error={fieldErrors.pickupPointId}>
                <select
                  id="pickupPointId"
                  className="flex h-8 w-full max-w-md rounded-sm border border-[#888c8c] bg-white px-2 py-1 text-sm shadow-[0_1px_2px_rgba(15,17,17,.15)_inset] focus-visible:border-[#e77600] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(228,121,17,.5)]"
                  value={draft.pickupPointId}
                  onChange={(event) =>
                    dispatch(
                      updateDraft({
                        pickupPointId: event.target.value as 'point-center' | 'point-north',
                      }),
                    )
                  }
                >
                  {pickup?.pickupPoints.map((point) => (
                    <option key={point.id} value={point.id}>
                      {point.title} — {point.address}
                    </option>
                  ))}
                </select>
              </FormField>
            ) : (
              <div className="grid max-w-md gap-4">
                <FormField id="city" label="Город" error={fieldErrors.city}>
                  <Input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    className="max-w-56"
                    value={draft.city}
                    aria-invalid={Boolean(fieldErrors.city)}
                    onChange={(event) => dispatch(updateDraft({ city: event.target.value }))}
                  />
                </FormField>
                <FormField id="street" label="Улица" error={fieldErrors.street}>
                  <Input
                    id="street"
                    name="street"
                    autoComplete="address-line1"
                    value={draft.street}
                    aria-invalid={Boolean(fieldErrors.street)}
                    onChange={(event) => dispatch(updateDraft({ street: event.target.value }))}
                  />
                </FormField>
                <div className="grid grid-cols-2 gap-4 max-w-56">
                  <FormField id="house" label="Дом" error={fieldErrors.house}>
                    <Input
                      id="house"
                      name="house"
                      value={draft.house}
                      aria-invalid={Boolean(fieldErrors.house)}
                      onChange={(event) => dispatch(updateDraft({ house: event.target.value }))}
                    />
                  </FormField>
                  <FormField id="apartment" label="Квартира" error={fieldErrors.apartment}>
                    <Input
                      id="apartment"
                      name="apartment"
                      value={draft.apartment}
                      onChange={(event) => dispatch(updateDraft({ apartment: event.target.value }))}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Оплата</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={draft.paymentMethod}
              onValueChange={(value) =>
                dispatch(updateDraft({ paymentMethod: value as PaymentMethod }))
              }
              className="grid max-w-md gap-2"
            >
              {optionsQuery.data?.paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-sm border p-3',
                    draft.paymentMethod === method.id
                      ? 'border-[#c45500] bg-[#fcf5ee]'
                      : 'border-[#d5d9d9]',
                  )}
                >
                  <RadioGroupItem value={method.id} id={`pay-${method.id}`} />
                  <span className="font-medium">{method.title}</span>
                </label>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>
      </div>

      <aside className="h-fit lg:sticky lg:top-24">
        <Card>
          <CardHeader>
            <CardTitle>Сумма заказа</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={orderMutation.isLoading || quoting}
            >
              {orderMutation.isLoading
                ? 'Оформляем…'
                : draft.paymentMethod === 'card'
                  ? 'Оформить и перейти к оплате'
                  : 'Оформить заказ'}
            </Button>
            {quoting ? <LoadingState label="Считаем доставку…" /> : null}
            {quote && quote.cartVersion === cart.version ? <QuoteTotals quote={quote} /> : null}
            {!quoting && !quote ? (
              <p className="text-sm text-muted-foreground">
                Заполните адрес, чтобы получить стоимость доставки с сервера.
              </p>
            ) : null}
            <Link to="/cart" className="amazon-link text-center text-sm">
              Вернуться в корзину
            </Link>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}
