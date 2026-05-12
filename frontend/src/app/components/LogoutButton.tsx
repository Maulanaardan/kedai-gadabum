"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("roles");
    router.push("/login");
  };

  return (
    <>
      <style>{`
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 18px;
          background: transparent;
          border: 1px solid #2a2825;
          border-radius: 50px;
          color: #7a7260;
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, background 0.2s;
        }
        .logout-btn:hover {
          border-color: #f8717144;
          color: #f87171;
          background: #f8717108;
        }
        .logout-btn:active {
          opacity: 0.8;
        }
        .logout-icon {
          font-size: 13px;
          line-height: 1;
        }
      `}</style>

      <button className="logout-btn" onClick={handleLogout}>
        <span className="logout-icon">⎋</span>
        Keluar
      </button>
    </>
  );
}