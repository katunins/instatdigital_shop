import type {
  Cart,
  CreateOrder,
  Order,
  Payment,
  Product,
  Quote,
  Simulation,
} from '@checkout/contracts';
import { createApi } from '@reduxjs/toolkit/query/react';
import { apiBaseQuery } from '@/api/baseQuery';
import type { QuoteInput } from '@/lib/checkout';

type CartItem = Cart['items'][number];
type CheckoutOptions = {
  cart: Cart;
  deliveryMethods: Array<{
    id: 'pickup' | 'courier';
    title: string;
    price: number;
    freeFrom: number | null;
    pickupPoints: Array<{ id: string; title: string; address: string }>;
  }>;
  paymentMethods: Array<{ id: CreateOrder['paymentMethod']; title: string }>;
};
type Sandbox = {
  settlementDelayMs: number;
  cards: Array<{
    id: string;
    title: string;
    maskedNumber: string;
    scenario: 'success' | 'decline';
  }>;
};
type Session = { id: string; token: string; cart: Cart };
type SessionInfo = { id: string; cartId: string };

export const checkoutApi = createApi({
  reducerPath: 'checkoutApi',
  baseQuery: apiBaseQuery,
  tagTypes: ['Cart', 'Order', 'Payment', 'Products', 'Session'],
  endpoints: (build) => ({
    createSession: build.mutation<Session, void>({
      query: () => ({ url: '/api/sessions', method: 'POST', body: {}, auth: false }),
    }),
    getSession: build.query<SessionInfo, string>({
      query: (sessionId) => ({ url: `/api/sessions/${sessionId}` }),
      providesTags: ['Session'],
    }),
    getProducts: build.query<Product[], void>({
      query: () => ({ url: '/api/products', auth: false }),
      providesTags: ['Products'],
    }),
    getSandbox: build.query<Sandbox, void>({
      query: () => ({ url: '/api/sandbox', auth: false }),
    }),
    getCart: build.query<Cart, void>({
      query: () => ({ url: '/api/cart' }),
      providesTags: ['Cart'],
    }),
    setCartItem: build.mutation<CartItem, { productId: string; quantity: number }>({
      query: ({ productId, quantity }) => ({
        url: `/api/cart/items/${productId}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),
    deleteCartItem: build.mutation<void, string>({
      query: (productId) => ({
        url: `/api/cart/items/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
    getCheckoutOptions: build.query<CheckoutOptions, void>({
      query: () => ({ url: '/api/checkout/options' }),
      providesTags: ['Cart'],
    }),
    createQuote: build.mutation<Quote, QuoteInput>({
      query: (body) => ({ url: '/api/quotes', method: 'POST', body }),
    }),
    getQuote: build.query<Quote, string>({
      query: (quoteId) => ({ url: `/api/quotes/${quoteId}` }),
    }),
    createOrder: build.mutation<Order, { body: CreateOrder; key: string }>({
      query: ({ body, key }) => ({
        url: '/api/orders',
        method: 'POST',
        body,
        idempotencyKey: key,
      }),
      invalidatesTags: ['Cart', 'Order'],
    }),
    getOrder: build.query<Order, string>({
      query: (orderId) => ({ url: `/api/orders/${orderId}` }),
      providesTags: (_result, _error, orderId) => [{ type: 'Order', id: orderId }],
    }),
    getOrders: build.query<Order[], void>({
      query: () => ({ url: '/api/orders' }),
      providesTags: ['Order'],
    }),
    createPayment: build.mutation<Payment, { orderId: string; key: string }>({
      query: ({ orderId, key }) => ({
        url: `/api/orders/${orderId}/payments`,
        method: 'POST',
        body: {},
        idempotencyKey: key,
      }),
      invalidatesTags: (_result, _error, { orderId }) => [
        { type: 'Order', id: orderId },
        'Payment',
      ],
    }),
    getPayment: build.query<Payment, string>({
      query: (paymentId) => ({ url: `/api/payments/${paymentId}` }),
      providesTags: (_result, _error, paymentId) => [{ type: 'Payment', id: paymentId }],
    }),
    getPayments: build.query<Payment[], string>({
      query: (orderId) => ({ url: `/api/orders/${orderId}/payments` }),
      providesTags: ['Payment'],
    }),
    simulatePayment: build.mutation<
      Simulation,
      { paymentId: string; scenario: 'success' | 'decline' | 'cancel' }
    >({
      query: ({ paymentId, scenario }) => ({
        url: `/api/payments/${paymentId}/simulations`,
        method: 'POST',
        body: { scenario },
      }),
      invalidatesTags: (_result, _error, { paymentId }) => [{ type: 'Payment', id: paymentId }],
    }),
  }),
});

export const {
  useCreateSessionMutation,
  useGetSessionQuery,
  useGetProductsQuery,
  useGetSandboxQuery,
  useGetCartQuery,
  useSetCartItemMutation,
  useDeleteCartItemMutation,
  useGetCheckoutOptionsQuery,
  useCreateQuoteMutation,
  useGetQuoteQuery,
  useCreateOrderMutation,
  useGetOrderQuery,
  useCreatePaymentMutation,
  useGetPaymentQuery,
  useGetPaymentsQuery,
  useSimulatePaymentMutation,
} = checkoutApi;
