import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  MessageCircle,
  Moon,
  Sun,
  Shield,
  Zap,
  Globe,
  Users,
  Send,
  Heart,
  ArrowRight,
  CheckCircle,
  Phone,
} from "lucide-react";

import { toggleTheme } from "../../redux/slices/uiSlice";
import "./LandingPage.css";

export const LandingPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  const features = [
    {
      icon: Zap,
      title: "Lightning Fast",
      desc: "Real-time messaging powered by WebSockets.",
    },
    {
      icon: Shield,
      title: "Private & Secure",
      desc: "Your conversations remain encrypted and protected.",
    },
    {
      icon: Users,
      title: "Group Chats",
      desc: "Create unlimited groups and communities.",
    },
    {
      icon: Send,
      title: "Media Sharing",
      desc: "Photos, videos, files and voice notes instantly.",
    },
    {
      icon: Heart,
      title: "Reactions",
      desc: "Express yourself using emojis and reactions.",
    },
    {
      icon: Globe,
      title: "Global",
      desc: "Stay connected anywhere in the world.",
    },
  ];

  const stats = [
    { value: "10K+", label: "Users" },
    { value: "1M+", label: "Messages" },
    { value: "150+", label: "Countries" },
    { value: "99.99%", label: "Uptime" },
  ];

  const scrollToFeatures = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      <div className="landing-atmosphere" aria-hidden="true">
        <span className="orb orb-a" />
        <span className="orb orb-b" />
        <span className="orb orb-c" />
      </div>

      <header className="landing-navbar">
        <div className="nav-container">
          <a href="/" className="logo" aria-label="ChatApp home">
            <span className="logo-mark">
              <MessageCircle size={22} />
            </span>
            <span className="logo-text">ChatApp</span>
          </a>

          <div className="nav-links">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => dispatch(toggleTheme())}
              aria-label={
                theme === "light" ? "Switch to dark mode" : "Switch to light mode"
              }
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              className="btn-nav-ghost hide-sm"
              onClick={() => navigate("/email")}
            >
              Sign in
            </button>

            <button
              type="button"
              className="btn-nav-primary"
              onClick={() => navigate("/email")}
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="hero-brand">ChatApp</p>

            <h1>
              Connect with friends
              <span> instantly.</span>
            </h1>

            <p className="hero-lead">
              Fast messaging, voice notes, and secure chats — built for everyday
              conversations.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="btn-hero-primary"
                onClick={() => navigate("/email")}
              >
                <Phone size={18} />
                Continue with Email
              </button>

              <button
                type="button"
                className="btn-hero-secondary"
                onClick={scrollToFeatures}
              >
                Learn More
              </button>
            </div>

            <ul className="hero-trust">
              <li>
                <CheckCircle size={16} />
                OTP Login
              </li>
              <li>
                <CheckCircle size={16} />
                Encrypted chats
              </li>
              <li>
                <CheckCircle size={16} />
                Voice & video
              </li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="phone">
              <div className="phone-notch" />
              <div className="phone-header">
                <img src="https://i.pravatar.cc/50?img=5" alt="" />
                <div>
                  <strong>Sarah</strong>
                  <span>Online</span>
                </div>
              </div>

              <div className="chat-body">
                <div className="message left">Hey</div>
                <div className="message right">Hello</div>
                <div className="message left">Are we meeting today?</div>
                <div className="message right">Sure</div>
                <div className="typing">Typing…</div>
              </div>
            </div>
          </div>
        </section>

        <section className="stats" aria-label="Product stats">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </section>

        <section className="features" id="features">
          <div className="features-heading">
            <p className="eyebrow">Features</p>
            <h2>Everything you need for modern communication</h2>
          </div>

          <div className="feature-grid">
            {features.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="feature-card">
                  <div className="feature-icon">
                    <Icon size={28} />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="cta">
          <h2>Ready to start chatting?</h2>
          <p>Join thousands of people messaging every day.</p>
          <button
            type="button"
            className="cta-btn"
            onClick={() => navigate("/email")}
          >
            Continue with Email
            <ArrowRight size={18} />
          </button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-brand">
          <MessageCircle size={20} />
          ChatApp
        </div>
        <p>© 2026 ChatApp</p>
      </footer>
    </div>
  );
};
