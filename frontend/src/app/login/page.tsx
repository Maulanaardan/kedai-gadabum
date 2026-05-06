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
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  console.log("LOGIN RESPONSE:", data);

  if (!res.ok) {
    alert(data.error || "Login gagal");
    return;
  }

  // ✅ FIX DI SINI
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);

  // ✅ redirect
  if (data.role === "admin") {
    router.push("/dashboard");
  } else if (data.role === "kitchen") {
    router.push("/dashboardkitchen");
  } else if (data.role === "cashier") {
    router.push("/orderlists");
  }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>

      <input
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br /><br />

      <button onClick={handleLogin}>Login</button>
    </div>
  );
}