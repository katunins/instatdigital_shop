import { AlertCircle, LoaderCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function PageSkeleton() {
  return (
    <div className="grid gap-3">
      <Skeleton className="h-16 w-full rounded-sm bg-white" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-72 rounded-sm bg-white" />
        <Skeleton className="h-72 rounded-sm bg-white" />
        <Skeleton className="h-72 rounded-sm bg-white" />
        <Skeleton className="h-72 rounded-sm bg-white" />
      </div>
    </div>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground" role="status">
      <LoaderCircle className="size-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({
  title = 'Не получилось загрузить данные',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="size-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex flex-col gap-3">
        <p>{message}</p>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" className="w-fit" onClick={onRetry}>
            Повторить
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
