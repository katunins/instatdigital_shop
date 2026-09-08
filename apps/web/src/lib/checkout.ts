import type { CreateOrder, Delivery } from '@checkout/contracts';
import { FIELD_MESSAGES } from '@/lib/apiError';
import type { CheckoutDraft } from '@/store/checkoutSlice';

export type QuoteInput = {
  cartVersion: number;
  delivery: Delivery;
};

export function deliveryFromDraft(draft: CheckoutDraft): Delivery {
  if (draft.deliveryMethod === 'pickup') {
    return { method: 'pickup', pickupPointId: draft.pickupPointId };
  }
  return {
    method: 'courier',
    address: {
      city: draft.city.trim(),
      street: draft.street.trim(),
      house: draft.house.trim(),
      ...(draft.apartment.trim() ? { apartment: draft.apartment.trim() } : {}),
    },
  };
}

export function validateDraft(draft: CheckoutDraft) {
  const errors: Record<string, string> = {};
  if (draft.name.trim().length < 2) errors.name = FIELD_MESSAGES.name;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) errors.email = FIELD_MESSAGES.email;
  if (!/^\+[1-9]\d{9,14}$/.test(draft.phone.trim())) errors.phone = FIELD_MESSAGES.phone;
  if (draft.deliveryMethod === 'courier') {
    if (draft.city.trim().length < 2) errors.city = FIELD_MESSAGES.city;
    if (draft.street.trim().length < 2) errors.street = FIELD_MESSAGES.street;
    if (draft.house.trim().length < 1) errors.house = FIELD_MESSAGES.house;
  }
  return errors;
}

export function isDeliveryReady(draft: CheckoutDraft) {
  if (draft.deliveryMethod === 'pickup') return Boolean(draft.pickupPointId);
  return (
    draft.city.trim().length >= 2 &&
    draft.street.trim().length >= 2 &&
    draft.house.trim().length >= 1
  );
}

export function quoteBodyFromDraft(draft: CheckoutDraft, cartVersion: number): QuoteInput {
  return { cartVersion, delivery: deliveryFromDraft(draft) };
}

export function orderBodyFromDraft(draft: CheckoutDraft, quoteId: string): CreateOrder {
  return {
    quoteId,
    paymentMethod: draft.paymentMethod,
    customer: {
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    },
  };
}

export function sameOrderBody(a: CreateOrder | null, b: CreateOrder) {
  return JSON.stringify(a) === JSON.stringify(b);
}
