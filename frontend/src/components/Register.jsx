import React, { useState } from "react";

export default function Register({ setShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  async function handleRegister(e) {
    e.preventDefault();
    setMsg("");
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.message) {
        setMsg("Registered! Now login.");
        setTimeout(() => setShowRegister(false), 1100);
      } else {
        setMsg(data.error || "Register failed");
      }
    } catch {
      setMsg("Network error");
    }
  }

  return (
    <form className="auth-card" onSubmit={handleRegister}>
      <h2 className="auth-title">Register</h2>
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
      <button className="auth-btn" type="submit">Register</button>
      <div className="switcher-row">
        <span
          className="switcher-link"
          onClick={() => setShowRegister(false)}
          tabIndex={0}
          role="button"
        >
          Already have an account? Login
        </span>
      </div>
      {msg && <div className={`error${msg.startsWith("Registered") ? " success" : ""}`}>{msg}</div>}
    </form>
  );
}
