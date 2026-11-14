import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export const AuthLayout = () => {
  const theme = useSelector((state) => state.ui.theme);
  
  return (
    <div className={`auth-layout ${theme}`}>
      <Outlet />
    </div>
  );
};