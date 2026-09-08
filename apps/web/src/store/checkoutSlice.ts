import type { CreateOrder } from '@checkout/contracts';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type DeliveryMethod = 'pickup' | 'courier';
export type PaymentMethod = CreateOrder['paymentMethod'];

export type CheckoutDraft = {
  name: string;
  email: string;
  phone: string;
  deliveryMethod: DeliveryMethod;
  pickupPointId: 'point-center' | 'point-north';
  city: string;
  street: string;
  house: string;
  apartment: string;
  paymentMethod: PaymentMethod;
};

export type CheckoutState = {
  draft: CheckoutDraft;
  quoteId: string | null;
  orderId: string | null;
  paymentId: string | null;
  orderKey: string | null;
  orderBody: CreateOrder | null;
  paymentKey: string | null;
};

export const emptyDraft: CheckoutDraft = {
  name: '',
  email: '',
  phone: '',
  deliveryMethod: 'pickup',
  pickupPointId: 'point-center',
  city: '',
  street: '',
  house: '',
  apartment: '',
  paymentMethod: 'card',
};

const initialState: CheckoutState = {
  draft: emptyDraft,
  quoteId: null,
  orderId: null,
  paymentId: null,
  orderKey: null,
  orderBody: null,
  paymentKey: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<CheckoutDraft>>) {
      state.draft = { ...state.draft, ...action.payload };
    },
    setQuoteId(state, action: PayloadAction<string | null>) {
      state.quoteId = action.payload;
    },
    saveOrderAttempt(state, action: PayloadAction<{ key: string; body: CreateOrder }>) {
      state.orderKey = action.payload.key;
      state.orderBody = action.payload.body;
    },
    setOrderId(state, action: PayloadAction<string | null>) {
      state.orderId = action.payload;
    },
    savePaymentAttempt(state, action: PayloadAction<{ key: string; paymentId?: string }>) {
      state.paymentKey = action.payload.key;
      if (action.payload.paymentId) state.paymentId = action.payload.paymentId;
    },
    setPaymentId(state, action: PayloadAction<string | null>) {
      state.paymentId = action.payload;
    },
    clearPaymentAttempt(state) {
      state.paymentKey = null;
      state.paymentId = null;
    },
    clearOrderAttempt(state) {
      state.orderKey = null;
      state.orderBody = null;
      state.quoteId = null;
    },
    startNewCheckout(state) {
      state.quoteId = null;
      state.orderId = null;
      state.paymentId = null;
      state.orderKey = null;
      state.orderBody = null;
      state.paymentKey = null;
    },
  },
});

export const {
  updateDraft,
  setQuoteId,
  saveOrderAttempt,
  setOrderId,
  savePaymentAttempt,
  setPaymentId,
  clearPaymentAttempt,
  clearOrderAttempt,
  startNewCheckout,
} = checkoutSlice.actions;
export const checkoutReducer = checkoutSlice.reducer;
