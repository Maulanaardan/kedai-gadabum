export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000"
export const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = sessionStorage.getItem("token");

  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
};