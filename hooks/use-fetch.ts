import { useState } from "react";
import { toast } from "sonner";

// A fetch function that can take zero or more arguments and returns TData
type AsyncFn<TData, TArgs extends unknown[]> = (
  ...args: TArgs
) => Promise<TData>;

const useFetch = <TData, TArgs extends unknown[] = []>(
  cb: AsyncFn<TData, TArgs>
) => {
  const [data, setData] = useState<TData | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: TArgs): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      const response = await cb(...args);
      setData(response);
      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err);
        toast.error(err.message);
        throw err;
      } else {
        const errorObj = new Error("An unknown error occurred");
        setError(errorObj);
        toast.error(errorObj.message);
        throw errorObj;
      }
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
