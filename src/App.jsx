import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import { ThemeProvider } from "./components/ThemeProvider";

import Loader from "./components/Loader";

import { AuthLayout } from "./layout/AuthLayout";
import { MainLayout } from "./layout/MainLayout";

import "./App.css";

const LandingPage = lazy(() =>
  import("./page/landing/LandingPage").then((module) => ({ default: module.LandingPage })),
);
const Splash = lazy(() => import("./page/Splash/Splash"));
const EmailLogin = lazy(() =>
  import("./auth/EmailLogin").then((module) => ({ default: module.EmailLogin })),
);
const OtpVerification = lazy(() =>
  import("./auth/OtpVerification").then((module) => ({ default: module.OtpVerification })),
);
const ProfileSetup = lazy(() =>
  import("./auth/ProfileSetup").then((module) => ({ default: module.ProfileSetup })),
);
const ChatPage = lazy(() =>
  import("./page/chat/ChatPage").then((module) => ({ default: module.ChatPage })),
);
const GroupsPage = lazy(() =>
  import("./page/groups/GroupsPage").then((module) => ({ default: module.GroupsPage })),
);

function AppRoutes() {
    const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

    return (

        <BrowserRouter>

            <Suspense fallback={<Loader />}>
              <Routes>

                <Route
                  path="/"
                  element={
                    isAuthenticated ? <Navigate to="/chat" replace /> : <LandingPage />
                  }
                />

                <Route path="/splash" element={<Splash />} />

                <Route element={<AuthLayout />}>

                    <Route
                      path="/email"
                      element={
                        isAuthenticated ? <Navigate to="/chat" replace /> : <EmailLogin />
                      }
                    />

                    <Route
                      path="/verify"
                      element={
                        isAuthenticated ? <Navigate to="/chat" replace /> : <OtpVerification />
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        isAuthenticated ? <ProfileSetup /> : <Navigate to="/email" replace />
                      }
                    />

                </Route>

                <Route
                    path="/chat"
                    element={
                        isAuthenticated ?

                        <MainLayout>

                            <ChatPage />

                        </MainLayout>

                        :

                        <Navigate to="/email" replace />
                    }
                />

                <Route
                    path="/groups"
                    element={isAuthenticated ? <MainLayout><GroupsPage /></MainLayout> : <Navigate to="/email" replace />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

              </Routes>
            </Suspense>

        </BrowserRouter>

    );

}

export default function App() {

    return (

        <ThemeProvider>

            <AppRoutes />

        </ThemeProvider>

    );

}
