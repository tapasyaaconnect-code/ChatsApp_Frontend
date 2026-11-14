import { MessageCircle, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

export const MobileNav = () => (
  <nav className="mobile-bottom-nav" aria-label="Primary navigation">
    <NavLink to="/chat"><MessageCircle size={21} /><span>Chats</span></NavLink>
    <NavLink to="/groups"><Users size={21} /><span>Groups</span></NavLink>
  </nav>
);
