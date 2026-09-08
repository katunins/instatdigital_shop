import { useEffect, type ReactNode } from 'react';
import { useCreateSessionMutation, useGetSessionQuery } from '@/api/checkoutApi';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/Status';
import { isAppApiError } from '@/lib/apiError';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearSession, setSession } from '@/store/sessionSlice';

export function SessionBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.session.token);
  const sessionId = useAppSelector((state) => state.session.sessionId);
  const [createSession, createState] = useCreateSessionMutation();
  const sessionQuery = useGetSessionQuery(sessionId ?? '', { skip: !token || !sessionId });

  useEffect(() => {
    if (token && sessionId) return;
    if (createState.isLoading || createState.isError) return;
    void createSession()
      .unwrap()
      .then((session) => {
        dispatch(setSession({ token: session.token, sessionId: session.id }));
      });
  }, [token, sessionId, createState.isLoading, createSession, dispatch]);

  useEffect(() => {
    const error = sessionQuery.error;
    if (!isAppApiError(error)) return;
    if (error.status !== 401 && error.status !== 404 && error.code !== 'SESSION_NOT_FOUND') return;
    dispatch(clearSession());
  }, [sessionQuery.error, dispatch]);

  if (!token || !sessionId) {
    if (createState.isError && isAppApiError(createState.error)) {
      return (
        <div className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-3 px-4">
          <p>{createState.error.message}</p>
          <Button
            type="button"
            className="w-fit"
            onClick={() => {
              void createSession()
                .unwrap()
                .then((session) =>
                  dispatch(setSession({ token: session.token, sessionId: session.id })),
                );
            }}
          >
            Создать сессию снова
          </Button>
        </div>
      );
    }
    return (
      <div className="flex min-h-svh items-center justify-center">
        <LoadingState label="Открываем сессию…" />
      </div>
    );
  }

  return children;
}
