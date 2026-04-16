import { useEffect, useState } from "react";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
export default function useFetch<TResponse>({ path }: { path: string }) {
  const [data, setData] = useState<TResponse>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`${API_BASE_URL}${path}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Gagal mengambil data dari backend.");
        }

        const result: TResponse = await response.json();

        setData(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memuat data produk.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [path]);

  return {
    data,
    isLoading,
    errorMessage,
  };
}
