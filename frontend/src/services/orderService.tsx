const API = process.env.NEXT_PUBLIC_API_URL;

export const getPaidOrders = async (token: string) => {
  const res = await fetch(`${API}/orders/paid`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.json();
};

export const completeOrder = async (
  id: number,
  token: string
) => {
  const res = await fetch(
    `${API}/orders/${id}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        status: "completed",
      }),
    }
  );

  return res.json();
};