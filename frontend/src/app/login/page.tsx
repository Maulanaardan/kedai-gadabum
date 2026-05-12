"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      alert(data.error || "Login gagal");
      return;
    }

    const roles = Array.isArray(data.roles) ? data.roles : [data.roles];
    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("roles", JSON.stringify(roles));
    router.push(data.redirect);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0f0e0c; }

        .lp-root {
          min-height: 100vh;
          background: #0f0e0c;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'DM Sans', sans-serif;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }

        /* subtle radial glow behind card */
        .lp-root::before {
          content: '';
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, #e8c97a08 0%, transparent 70%);
          pointer-events: none;
        }

        .lp-card {
          width: 100%;
          max-width: 400px;
          background: #161410;
          border: 1px solid #2a2825;
          border-radius: 20px;
          padding: 48px 40px;
          position: relative;
          z-index: 1;
        }

        /* top accent line */
        .lp-card::before {
          content: '';
          position: absolute;
          top: 0; left: 40px; right: 40px;
          height: 1px;
          background: linear-gradient(90deg, transparent, #e8c97a55, transparent);
        }

        .lp-brand {
          text-align: center;
          margin-bottom: 36px;
        }
        .lp-brand-title {
          font-family: 'Playfair Display', serif;
          font-size: 30px;
          color: #e8c97a;
          letter-spacing: 0.01em;
          line-height: 1.1;
          margin-bottom: 8px;
        }
        .lp-brand-sub {
          font-size: 11px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #3a3628;
        }

        .lp-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, #2a2825, transparent);
          margin-bottom: 32px;
        }

        .lp-field { margin-bottom: 16px; }
        .lp-label {
          display: block;
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #5c5848;
          margin-bottom: 8px;
          font-weight: 500;
        }
        .lp-input {
          width: 100%;
          padding: 12px 16px;
          background: #0f0e0c;
          border: 1px solid #2a2825;
          border-radius: 10px;
          color: #f0ece3;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .lp-input::placeholder { color: #2e2c28; }
        .lp-input:focus {
          border-color: #e8c97a44;
          box-shadow: 0 0 0 3px #e8c97a0c;
        }

        .lp-btn {
          width: 100%;
          margin-top: 28px;
          padding: 14px;
          background: linear-gradient(135deg, #e8c97a, #c9a840);
          color: #0f0e0c;
          border: none;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .lp-btn:hover  { opacity: 0.9; transform: translateY(-1px); }
        .lp-btn:active { transform: translateY(0); opacity: 0.8; }

        .lp-footer {
          text-align: center;
          margin-top: 28px;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #2e2c28;
        }
      `}</style>

      <div className="lp-root">
        <div className="lp-card">
          {/* BRAND */}
          <div className="lp-brand">
            <div className="lp-brand-title">Restoran</div>
            <div className="lp-brand-sub">Staff Portal</div>
          </div>

          <div className="lp-divider" />

          {/* FIELDS */}
          <div className="lp-field">
            <label className="lp-label">Username</label>
            <input
              className="lp-input"
              placeholder="Masukkan username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div className="lp-field">
            <label className="lp-label">Password</label>
            <input
              className="lp-input"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          <button className="lp-btn" onClick={handleLogin}>
            Masuk
          </button>

          <div className="lp-footer">Kedai Gadabum © 2025</div>
        </div>
      </div>
    </>
  );
}