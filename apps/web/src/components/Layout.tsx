import { useEffect, useState, type FormEvent } from 'react';
import { Search, ShoppingCart } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate, useSearchParams } from 'react-router-dom';
import { useGetCartQuery } from '@/api/checkoutApi';
import { Logo } from '@/components/Logo';
import { useAppSelector } from '@/store';

export function Layout() {
  const { data: cart } = useGetCartQuery();
  const count = cart?.quantity ?? 0;
  const orderId = useAppSelector((state) => state.checkout.orderId);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');

  useEffect(() => {
    setQuery(params.get('q') ?? '');
  }, [params]);

  function search(event: FormEvent) {
    event.preventDefault();
    const next = query.trim();
    navigate(next ? `/?q=${encodeURIComponent(next)}` : '/');
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-20">
        <div className="bg-navy text-white">
          <div className="mx-auto flex max-w-[1500px] flex-wrap items-center gap-2 px-2 py-1.5 sm:gap-3 sm:px-3">
            <Logo className="text-white" />
            <form
              onSubmit={search}
              className="order-last flex w-full min-w-0 flex-1 basis-full sm:order-none sm:w-auto sm:basis-auto"
            >
              <label className="sr-only" htmlFor="store-search">
                Поиск по каталогу
              </label>
              <input
                id="store-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Поиск по каталогу"
                className="h-10 min-w-0 flex-1 rounded-l-md border-0 bg-white px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-[#febd69]"
              />
              <button
                type="submit"
                className="flex h-10 w-11 shrink-0 items-center justify-center rounded-r-md bg-[#febd69] text-navy hover:bg-[#f3a847]"
                aria-label="Найти"
              >
                <Search className="size-5" />
              </button>
            </form>
            {orderId ? (
              <Link
                to={`/orders/${orderId}`}
                className="hidden rounded-sm px-2 py-1 text-xs font-bold hover:outline hover:outline-1 hover:outline-white sm:block"
              >
                Заказ
              </Link>
            ) : null}
            <NavLink
              to="/cart"
              className="relative flex items-end gap-1 rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              <span className="relative">
                <ShoppingCart className="size-8" />
                <span className="absolute -top-1 left-3 min-w-4 text-center text-sm font-bold text-[#f08804]">
                  {count}
                </span>
              </span>
              <span className="mb-0.5 hidden text-xs font-bold sm:inline">Корзина</span>
            </NavLink>
          </div>
        </div>
        <nav className="bg-nav text-white">
          <div className="mx-auto flex max-w-[1500px] items-center gap-1 overflow-x-auto px-2 py-1.5 text-[13px] sm:px-3">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white ${isActive ? 'font-bold' : ''}`
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/cart"
              className="rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              Корзина
            </NavLink>
            <NavLink
              to="/checkout"
              className="rounded-sm px-2 py-1 hover:outline hover:outline-1 hover:outline-white"
            >
              Оформление
            </NavLink>
          </div>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-[1500px] flex-1 px-3 py-4 sm:px-4">
        <Outlet />
      </main>
      <footer className="mt-auto bg-navy py-6 text-center text-white">
        <Logo className="mx-auto inline-flex justify-center" />
      </footer>
    </div>
  );
}
