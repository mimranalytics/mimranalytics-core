import { useState } from "react";
import Navbar from "../components/Navbar";
import { useApp } from "../context/AppContext";

const INITIAL_FORM = { name: "", company: "", email: "", password: "" };

export default function AuthPage() {
  const { authMode, setAuthMode, navigate } = useApp();
  const [form, setForm]       = useState(INITIAL_FORM);
  const [submitted, setSubmitted] = useState(false);

  const switchMode = (mode) => {
    setAuthMode(mode);
    setSubmitted(false);
    setForm(INITIAL_FORM);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page">
      <div className="grid-bg" />
      <Navbar />

      <div className="auth-page">
        <div style={{ width: "100%", maxWidth: 460 }}>

          {/* Brand lockup */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
              MIMR <span style={{ color: "var(--gold)" }}>Analytics</span>
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.15em", color: "var(--text-2)", textTransform: "uppercase" }}>
              Corporate Intelligence Platform
            </div>
          </div>

          <div className="auth-card">

            {/* Header + tabs */}
            <div className="auth-header">
              <div className="auth-tabs">
                <button
                  className={`auth-tab${authMode === "signin" ? " active" : ""}`}
                  onClick={() => switchMode("signin")}
                >
                  Sign In
                </button>
                <button
                  className={`auth-tab${authMode === "signup" ? " active" : ""}`}
                  onClick={() => switchMode("signup")}
                >
                  Sign Up
                </button>
              </div>
              <div className="auth-title">
                {authMode === "signin" ? "Welcome back." : "Get started."}
              </div>
              <div className="auth-sub">
                {authMode === "signin"
                  ? "Access your intelligence dashboard."
                  : "Create your MIMR Analytics account."}
              </div>
            </div>

            {/* Body */}
            <div className="auth-body">
              {submitted ? (
                <SuccessState authMode={authMode} />
              ) : (
                <form onSubmit={handleSubmit}>
                  {authMode === "signup" && (
                    <>
                      <div className="field">
                        <label className="field-label">Full Name</label>
                        <input
                          className="field-input"
                          type="text"
                          placeholder="Jane Smith"
                          required
                          value={form.name}
                          onChange={update("name")}
                        />
                      </div>
                      <div className="field">
                        <label className="field-label">Organisation</label>
                        <input
                          className="field-input"
                          type="text"
                          placeholder="Your company"
                          value={form.company}
                          onChange={update("company")}
                        />
                      </div>
                    </>
                  )}

                  <div className="field">
                    <label className="field-label">Email Address</label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="you@organisation.com"
                      required
                      value={form.email}
                      onChange={update("email")}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">Password</label>
                    <input
                      className="field-input"
                      type="password"
                      placeholder="••••••••••"
                      required
                      value={form.password}
                      onChange={update("password")}
                    />
                  </div>

                  {authMode === "signin" && (
                    <div style={{ textAlign: "right", marginBottom: 16, marginTop: -8 }}>
                      <span style={{ fontSize: 12, color: "var(--gold)", cursor: "pointer", fontFamily: "var(--mono)" }}>
                        Forgot password?
                      </span>
                    </div>
                  )}

                  <button type="submit" className="auth-submit">
                    {authMode === "signin" ? "Access Dashboard →" : "Create Account →"}
                  </button>

                  <p style={{ fontSize: 12, color: "var(--text-3)", textAlign: "center", marginTop: 20 }}>
                    {authMode === "signin" ? (
                      <>No account?{" "}
                        <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => switchMode("signup")}>
                          Sign up free
                        </span>
                      </>
                    ) : (
                      <>Already registered?{" "}
                        <span style={{ color: "var(--gold)", cursor: "pointer" }} onClick={() => switchMode("signin")}>
                          Sign in
                        </span>
                      </>
                    )}
                  </p>
                </form>
              )}
            </div>
          </div>

          {/* Trust badges */}
          <div style={{ textAlign: "center", marginTop: 24, fontFamily: "var(--mono)", fontSize: 11, color: "var(--text-3)", letterSpacing: "0.08em" }}>
            GDPR COMPLIANT · SOC 2 TYPE II · ISO 27001
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessState({ authMode }) {
  return (
    <div style={{
      background: "var(--gold-dim)",
      border: "1px solid rgba(201,168,76,0.3)",
      borderRadius: 8,
      padding: "24px 20px",
      textAlign: "center",
    }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>✓</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 20, fontWeight: 700, color: "var(--gold)", marginBottom: 6 }}>
        {authMode === "signup" ? "Account created!" : "Welcome back!"}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-2)" }}>
        Redirecting to your dashboard…
      </div>
    </div>
  );
}
