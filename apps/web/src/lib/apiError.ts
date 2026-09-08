import type { ApiError } from '@checkout/contracts';

export type AppApiError = {
  status: number;
  code: string;
  message: string;
  fields?: { path: string; message: string }[];
  requestId?: string;
};

const CODE_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Нет связи с сервером. Проверьте подключение и повторите.',
  ABORTED: 'Запрос отменён.',
  VALIDATION_ERROR: 'Проверьте поля формы.',
  CART_VERSION_CONFLICT: 'Корзина изменилась. Данные обновлены — можно продолжить.',
  QUOTE_EXPIRED: 'Расчёт доставки устарел. Считаем заново.',
  CART_EMPTY: 'В корзине нет товаров.',
  INSUFFICIENT_STOCK: 'Такого количества нет в наличии.',
  PRODUCT_NOT_FOUND: 'Товар не найден.',
  SESSION_NOT_FOUND: 'Сессия истекла. Создаём новую.',
  IDEMPOTENCY_CONFLICT: 'Этот запрос уже отправляли с другими данными. Повторите действие.',
  PAYMENT_IN_PROGRESS: 'Оплата этого заказа уже обрабатывается.',
  ORDER_ALREADY_PAID: 'Заказ уже оплачен.',
  PAYMENT_NOT_REQUIRED: 'Этот заказ оплачивается при получении.',
  PAYMENT_FINALIZED: 'Для этой попытки сценарий уже выбран. Создайте новую попытку.',
  UNAUTHORIZED: 'Нужно войти заново. Создаём сессию.',
};

const FIELD_MESSAGES: Record<string, string> = {
  name: 'Укажите имя — не меньше двух символов.',
  email: 'Укажите корректный email.',
  phone: 'Телефон в формате +79990000000.',
  city: 'Укажите город.',
  street: 'Укажите улицу.',
  house: 'Укажите дом.',
  pickupPointId: 'Выберите пункт выдачи.',
};

export function mapApiError(status: number, json: unknown): AppApiError {
  if (json && typeof json === 'object' && 'error' in json) {
    const body = json as ApiError;
    return {
      status,
      code: body.error.code,
      message: CODE_MESSAGES[body.error.code] ?? body.error.message,
      fields: body.error.fields,
      requestId: body.meta?.requestId,
    };
  }
  if (status === 401) {
    return { status, code: 'UNAUTHORIZED', message: CODE_MESSAGES.UNAUTHORIZED };
  }
  return {
    status,
    code: 'UNKNOWN_ERROR',
    message: 'Не удалось выполнить запрос. Попробуйте ещё раз.',
  };
}

export function isAppApiError(error: unknown): error is AppApiError {
  return Boolean(error && typeof error === 'object' && 'code' in error && 'message' in error);
}

export function fieldKeyFromPath(path: string) {
  const parts = path.split('/');
  return parts[parts.length - 1] ?? path;
}

export function fieldErrorsFromApi(error: AppApiError | undefined) {
  const result: Record<string, string> = {};
  for (const field of error?.fields ?? []) {
    const key = fieldKeyFromPath(field.path);
    result[key] = FIELD_MESSAGES[key] ?? 'Проверьте это поле.';
  }
  return result;
}

export { FIELD_MESSAGES };
