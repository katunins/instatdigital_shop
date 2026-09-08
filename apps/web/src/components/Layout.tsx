import { ShoppingBag } from 'lucide-react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useGetCartQuery } from '@/api/checkoutApi';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Layout() {
  const { data: cart } = useGetCartQuery();
  const count = cart?.quantity ?? 0;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link to="/" className="font-semibold tracking-tight">
            Учебный магазин
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(buttonVariants({ variant: 'ghost', size: 'sm' }), isActive && 'bg-accent')
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                cn(buttonVariants({ variant: 'ghost', size: 'sm' }), isActive && 'bg-accent')
              }
            >
              <ShoppingBag className="size-4" />
              Корзина
              {count > 0 ? <Badge variant="secondary">{count}</Badge> : null}
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
