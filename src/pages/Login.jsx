import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/http";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registrationNotice, setRegistrationNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password, remember);
      nav(redirectTo, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401 || err.status === 403
            ? "Invalid email or password."
            : err.message
          : "Unable to reach the login API. Check the NestJS URL and CORS settings.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAccountPreview = (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setRegistrationNotice("Passwords do not match.");
      return;
    }
    const accountEmail = email.trim();
    switchForm(false);
    setEmail(accountEmail);
    setRegistrationNotice("Account creation is not connected yet, so this account has not been created. The registration API will be added after UI approval.");
  };

  const switchForm = (showRegistration) => {
    setCreatingAccount(showRegistration);
    setError("");
    setRegistrationNotice("");
    setShow(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <main className={`login-page${creatingAccount ? " is-registering" : ""}`}>
      <div className={`login-container${creatingAccount ? " is-registering" : ""}`}>
        <section className="brand-panel">
          <div className="brand">
            <div className="brand-logo">
              <div className="logo-shape">P</div>
            </div>
            <div className="brand-text">
              <h1>PCH</h1>
              <span>PINAKA COMMERCE HUB</span>
            </div>
          </div>
          <div className="brand-content">
            <h2>Super Admin Console</h2>
            <div className="brand-line" />
            <p>
              Centralized platform to manage merchants, stores, operations and
              integrations across all regions.
            </p>
          </div>
          <div className="dashboard-visual">
            <div className="monitor">
              <div className="monitor-header">
                <span />
                <span />
                <span />
              </div>
              <div className="monitor-content">
                <div className="mini-title">PCH Platform Overview</div>
                <div className="mini-cards">
                  <div />
                  <div />
                  <div />
                  <div />
                </div>
                <div className="mini-chart">
                  <div className="chart-line" />
                </div>
              </div>
            </div>
            <div className="monitor-stand" />
          </div>
          <div className="brand-features">
            {[
              [
                "✓",
                "Secure & Reliable",
                "Enterprise grade security and data protection",
              ],
              [
                "◎",
                "Centralized Control",
                "Manage everything from one powerful console",
              ],
              [
                "↗",
                "Real-time Insights",
                "Live dashboards and actionable analytics",
              ],
            ].map((item) => (
              <div className="brand-feature" key={item[1]}>
                <div className="feature-icon">{item[0]}</div>
                <div>
                  <h3>{item[1]}</h3>
                  <p>{item[2]}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="login-panel">
          <div className="login-content">
            <div className="welcome-icon">{creatingAccount ? "＋" : "✓"}</div>
            <div className="login-heading">
              <h2>{creatingAccount ? "Create your account" : "Welcome Back!"}</h2>
              <p>{creatingAccount ? "Enter your details to get started" : "Sign in to continue to Super Admin Console"}</p>
            </div>

            <form className={creatingAccount ? "register-form" : ""} onSubmit={creatingAccount ? handleCreateAccountPreview : handleSubmit}>
              {error && !creatingAccount ? <div className="login-error">{error}</div> : null}
              {registrationNotice ? <div className="login-notice" role="status">{registrationNotice}</div> : null}

              {creatingAccount ? <div className="register-fields-grid">
                <div className="form-group">
                  <label htmlFor="register-first-name">First Name</label>
                  <div className="input-container"><input id="register-first-name" type="text" autoComplete="given-name" maxLength={100} value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Enter first name" required /></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-last-name">Last Name</label>
                  <div className="input-container"><input id="register-last-name" type="text" autoComplete="family-name" maxLength={100} value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Enter last name" required /></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-username">Username</label>
                  <div className="input-container"><input id="register-username" type="text" autoComplete="username" maxLength={100} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" required /></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-phone">Phone Number</label>
                  <div className="input-container"><input id="register-phone" type="tel" autoComplete="tel" maxLength={30} value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} placeholder="Enter phone number" required /></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-email">Email Address</label>
                  <div className="input-container"><input id="register-email" type="email" autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Enter your email address" required /></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-role">Role</label>
                  <div className="input-container">
                    <select id="register-role" className="register-select" value={role} onChange={(event) => setRole(event.target.value)} required>
                      <option value="" disabled>Select a role</option>
                      <option value="Merchant">Merchant</option>
                      <option value="Manager">Manager</option>
                      <option value="Cashier">Cashier</option>
                      <option value="Shopkeeper">Shopkeeper</option>
                      <option value="Super-visor">Super-visor</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-password">Password</label>
                  <div className="input-container"><input className="register-password-input" id="register-password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Create a password" required /><button type="button" className="password-toggle" onClick={() => setShow((current) => !current)}>{show ? "Hide" : "Show"}</button></div>
                </div>
                <div className="form-group">
                  <label htmlFor="register-confirm-password">Confirm Password</label>
                  <div className="input-container"><input className="register-password-input" id="register-confirm-password" type={show ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirm password" required /></div>
                </div>
              </div> : <>

              <div className="form-group">
                <label htmlFor="login-email">Email Address</label>
                <div className="input-container">
                  <span className="input-icon">✉</span>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    id="login-password"
                    type={show ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShow((current) => !current)}
                  >
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="login-options">
                <label className="remember">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button type="button" className="link-button">
                  Forgot Password?
                </button>
              </div>

              </>}

              <button
                type="submit"
                className="signin-button"
                disabled={creatingAccount ? false : submitting}
              >
                {creatingAccount ? "Create Account" : submitting ? "Signing in..." : "→  Sign In"}
              </button>

              {!creatingAccount && <><div className="divider">
                <span />
                <p>OR</p>
                <span />
              </div>
              <button type="button" className="sso-button" disabled>
                Sign in with SSO
              </button></>}
            </form>

            <div className="login-mode-switch">
              {creatingAccount ? <>Already have an account? <button type="button" onClick={() => switchForm(false)}>Sign in</button></> : <>New to PCH? <button type="button" onClick={() => switchForm(true)}>Create account</button></>}
            </div>

            <div className="support-text">
              Need help?{" "}
              <a href="mailto:support@pinakach.com">
                Contact support@pinakach.com
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="login-footer">
        <p>© 2026 Pinaka Commerce Hub. All rights reserved.</p>
        <div>
          <button className="link-button" onClick={() => nav("/privacy")}>
            Privacy Policy
          </button>
          <span>|</span>
          <button className="link-button" onClick={() => nav("/terms")}>
            Terms of Service
          </button>
        </div>
      </footer>
    </main>
  );
}
