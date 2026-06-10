"use client";

import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

import type { ApiErrorResponse, ApiSuccessResponse } from "@/lib/types";

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | ApiSuccessResponse<T>
    | ApiErrorResponse
    | null;

  if (!response.ok || !payload || !payload.success) {
    throw new Error(payload?.message ?? "Request gagal");
  }

  return payload.data;
}

type UseApiDataOptions = {
  enabled?: boolean;
};

type UseApiDataReturn<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: (silent?: boolean) => void;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

export function useApiData<T>(
  url: string,
  options?: UseApiDataOptions,
): UseApiDataReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const enabled = options?.enabled ?? true;

  const load = useEffectEvent(async (silent = false) => {
    if (!enabled || !url) {
      setLoading(false);
      return;
    }

    if (!silent) {
      setLoading(true);
    }

    setError(null);

    try {
      const nextData = await fetchJson<T>(url, {
        cache: "no-store",
      });

      setData(nextData);
    } catch (nextError) {
      const message =
        nextError instanceof Error ? nextError.message : "Request gagal";

      setError(message);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  });

  useEffect(() => {
    void load(false);
  }, [nonce, url, enabled]);

  const api = useMemo(
    () => ({
      data,
      error,
      loading,
      reload(silent = false) {
        if (silent) {
          void load(true);
          return;
        }

        startTransition(() => {
          setNonce((current) => current + 1);
        });
      },
      setData,
    }),
    [data, error, loading, load],
  );

  return api;
}