import { useState } from "react";

import { useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";

import { ShieldCheck } from "lucide-react";

import { verifyOTP } from "../redux/actions/authActions";

import Loader from "../components/Loader";

import "./OtpVerification.css";

export const OtpVerification = () => {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const { loading } = useSelector((state) => state.auth);

  const email = localStorage.getItem("email");

  const [otp, setOtp] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (otp.length !== 6) {
      alert("Invalid OTP");

      return;
    }

    try {
      const result = await dispatch(
        verifyOTP({
          email,

          otp,
        }),
      ).unwrap();

      navigate(result.isNewUser ? "/profile" : "/chat", { replace: true });
    } catch (error) {
      alert(error);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <ShieldCheck className="auth-icon" />

        <h2>OTP Verification</h2>

        <p>
          Code sent to
          <strong>{email}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="otp-input"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
          />

          <button disabled={loading}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>
      </div>
    </div>
  );
};
