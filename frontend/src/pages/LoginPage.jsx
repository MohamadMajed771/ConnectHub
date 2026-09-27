import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", form);

      localStorage.setItem("connecthub_token", data.token);
      localStorage.setItem("connecthub_user", JSON.stringify(data.user));

      navigate("/dashboard");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="brand-panel">
        <p className="eyebrow">CONNECTHUB</p>
        <h1>Conversations that feel closer.</h1>
        <p>
          Find friends, start private chats, and stay connected in real time.
        </p>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to ConnectHub</h2>

          {location.state?.notice && (
            <p className="form-notice">{location.state.notice}</p>
          )}

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm({ ...form, email: event.target.value })
              }
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
              required
            />
          </label>

          {error && <p className="form-error">{error}</p>}

          <button className="primary-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="form-footer">
            New to ConnectHub? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}