import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useCallback } from "react";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import { TimerProvider } from "./context/TimerContext";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import Progress from "./pages/Progress";
import Timer from "./pages/Timer";
import Water from "./pages/Water";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Plans from "./pages/subscription/Plans";
import MyPlan from "./pages/subscription/MyPlan";
import TestGenerator from "./pages/premium/TestGenerator";
import TermsOfUse from "./pages/TermsOfUse";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ProfileSettings from "./components/profile/ProfileSettings";
import Invitations from "./pages/Invitations";
import Notifications from "./pages/Notifications";
import SplashScreen from "./components/SplashScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./i18n";

const queryClient = new QueryClient();

const App = () => {
  const [showingSplash, setShowingSplash] = useState(true);
  
  const handleSplashFinished = useCallback(() => {
    setShowingSplash(false);
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <TimerProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {showingSplash ? (
                  <SplashScreen onFinish={handleSplashFinished} />
                ) : (
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      <Route path="/terms" element={<TermsOfUse />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
                      <Route path="/group/:groupId" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
                      <Route path="/invitations" element={<ProtectedRoute><Invitations /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                      <Route path="/group/:groupId/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                      <Route path="/timer" element={<ProtectedRoute><Timer /></ProtectedRoute>} />
                      <Route path="/water" element={<ProtectedRoute><Water /></ProtectedRoute>} />
                      <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                      <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                      <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                      <Route path="/my-plan" element={<ProtectedRoute><MyPlan /></ProtectedRoute>} />
                      <Route path="/generate-test" element={<ProtectedRoute><TestGenerator /></ProtectedRoute>} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                )}
              </TooltipProvider>
            </TimerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
