import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { SessionBootstrap } from '@/components/SessionBootstrap';
import { LoadingState } from '@/components/Status';
import { CatalogPage } from '@/pages/CatalogPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { OrderPage } from '@/pages/OrderPage';
import { PayPage } from '@/pages/PayPage';
import { persistor, store } from '@/store';
import '@/index.css';

function App() {
  return (
    <Provider store={store}>
      <PersistGate
        persistor={persistor}
        loading={
          <div className="flex min-h-svh items-center justify-center">
            <LoadingState label="Восстанавливаем сессию…" />
          </div>
        }
      >
        <SessionBootstrap>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<CatalogPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/orders/:orderId/pay" element={<PayPage />} />
                <Route path="/orders/:orderId" element={<OrderPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SessionBootstrap>
      </PersistGate>
    </Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
