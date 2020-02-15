import { useRouter } from 'next/router';
import useAxios from 'axios-hooks'

export default function useRequest(request) {
  if (typeof window === 'undefined') {
    // SSR
    return { loading: true, refetch: () => {} };
  }

  const router = useRouter();
  const [{ data, loading, error }, refetch] = useAxios(request, { useCache: false });

  if (error) {
    const { redirect, error: errorMsg } = error.response.data || {};

    if (redirect) {
      router.push(redirect);
      return { refetch };
    }

    return { error: errorMsg || error.message, refetch };
  }

  return { data, loading, error, refetch };
}
