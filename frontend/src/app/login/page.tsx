"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (
      email === "admin@gmail.com" &&
      password === "admin123"
    ) {
      localStorage.setItem("isAdmin", "true");
      router.push("/dashboard");
    } else {
      alert("Email atau password salah");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#0f172a",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: 350,
          background: "#1e293b",
          padding: 30,
          borderRadius: 20,
          display: "flex",
          flexDirection: "column",
          gap: 15,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
        }}
      >
        <h1
          style={{
            color: "white",
            textAlign: "center",
            fontSize: 28,
            fontWeight: "bold",
          }}
        >
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "white",
          }}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #334155",
            background: "#0f172a",
            color: "white",
          }}
        />

        <button
          type="submit"
          style={{
            padding: 12,
            border: "none",
            borderRadius: 10,
            background: "#22c55e",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}