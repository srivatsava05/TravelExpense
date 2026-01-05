import React, { useState } from "react";

export default function Login({ setToken, setIsAdmin, setShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        setIsAdmin(data.isAdmin);
      } else {
        setMsg(data.error || "Login failed");
      }
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <form className="auth-card" onSubmit={handleLogin}>
      <h2 className="auth-title">Login</h2>
      <input
        placeholder="Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
      />
      <button className="auth-btn" type="submit">Login</button>
      <div className="switcher-row">
        <span
          className="switcher-link"
          onClick={() => setShowRegister(true)}
          tabIndex={0}
          role="button"
        >
          No account? Register
        </span>
      </div>
      {msg && <div className="error">{msg}</div>}
    </form>
  );
}
