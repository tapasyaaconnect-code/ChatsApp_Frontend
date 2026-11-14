import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import "./Splash.css";

const Splash = () => {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(isAuthenticated ? "/chat" : "/email", { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="splash">
      <div className="splash-content">

        <img
          src="/chat-logo.png"
          alt="ChatApp"
          className="logo"
        />

        <h1>ChatApp</h1>

        <p>Simple. Secure. Fast Messaging.</p>

      </div>
    </div>
  );
};

export default Splash;
