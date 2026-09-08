# @checkout/web

Фронтенд магазина на Vite, React, TypeScript, Redux Toolkit и shadcn/ui.

Условия: [задание](../../docs/ASSIGNMENT.md). API: [интеграция](../../docs/INTEGRATION.md). [Критерии](../../docs/EVALUATION.md).

## Команды

Из корня репозитория:

```sh
npm run dev          # API и фронтенд
npm run dev:web      # только фронтенд, API уже должен быть запущен
npm run build        # контракты, API и фронтенд
npm run preview -w @checkout/web
```

Из `apps/web`:

```sh
npm run dev
npm run build
npm run preview
```

Адрес API: `VITE_API_URL` (по умолчанию `http://localhost:4000`).

## Где что лежит

- HTTP: `src/api/baseQuery.ts` — заголовки, отправка, разбор ответа.
- Ошибки: `src/lib/apiError.ts` — код и поля → текст для UI.
- Методы API: `src/api/checkoutApi.ts`.
- Сессия и черновик оформления: `src/store/sessionSlice.ts`, `src/store/checkoutSlice.ts`.
