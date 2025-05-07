import { useSession } from "next-auth/react";

export function useApi() {
  const { data: session } = useSession();

  const fetchWithLicense = async (input: RequestInfo, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const licenseKey = localStorage.getItem("licenseKey");

    if (licenseKey) {
      headers.set("x-licenca", licenseKey);
    }

    const response = await fetch(input, {
      ...init,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Erro na requisição: ${response.statusText}`);
    }

    return response;
  };

  return { fetchWithLicense };
} 