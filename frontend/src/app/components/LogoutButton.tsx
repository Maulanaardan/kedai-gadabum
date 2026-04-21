"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: "10px 16px",
        background: "#ef4444",
        color: "#fff",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      Logout
    </button>
  );
}