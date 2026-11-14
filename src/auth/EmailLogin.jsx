import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { Mail } from "lucide-react";

import { sendOTP } from "../redux/actions/authActions";

import Loader from "../components/Loader";

import "./EmailLogin.css";

export const EmailLogin = () => {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      alert("Enter a valid email address");

      return;
    }

    try {
      await dispatch(
        sendOTP(normalizedEmail),
      ).unwrap();

      localStorage.setItem("email", normalizedEmail);

      navigate("/verify");
    } catch {
      // The rejected action also stores the message for inline display.
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <Mail className="auth-icon" />

        <h2>Enter your email</h2>

        <p>ChatApp will send an OTP to verify your email.</p>

        <form onSubmit={handleSubmit}>
          <div className="email-row">
            <input
              type="email"
              placeholder="Enter Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button disabled={loading}>
            {loading ? "Sending OTP..." : "Continue"}
          </button>
          {error && <p role="alert" className="auth-error">{error}</p>}
        </form>
      </div>
    </div>
  );
};
