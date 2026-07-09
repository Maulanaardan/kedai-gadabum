import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthGuard(requiredRole: string) {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading]       = useState(true);
  const router                      = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    const roles = JSON.parse(sessionStorage.getItem("roles") || "[]");
    if (!token || !roles.includes(requiredRole)) {
      router.push("/login");
      return;
    }
    setAuthorized(true);
    setLoading(false);
  }, [requiredRole, router]);

  return { authorized, loading };
}