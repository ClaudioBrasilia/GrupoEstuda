import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { useState, useCallback, lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "./components/ErrorBoundary";
import { TimerProvider } from "./context/TimerContext";
import Home from "./pages/Home";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import NotFound from "./pages/NotFound";
import SplashScreen from "./components/SplashScreen";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./i18n";

// Rotas carregadas sob demanda para reduzir o bundle inicial
const Groups = lazy(() => import("./pages/Groups"));
const GroupDetail = lazy(() => import("./pages/GroupDetail"));
const Progress = lazy(() => import("./pages/Progress"));
const Timer = lazy(() => import("./pages/Timer"));
const Water = lazy(() => import("./pages/Water"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const SeasonDashboard = lazy(() => import("./pages/SeasonDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const Plans = lazy(() => import("./pages/subscription/Plans"));
const MyPlan = lazy(() => import("./pages/subscription/MyPlan"));
const TestGenerator = lazy(() => import("./pages/premium/TestGenerator"));
const TrainMistakes = lazy(() => import("./pages/premium/TrainMistakes"));
const TermsOfUse = lazy(() => import("./pages/TermsOfUse"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const ProfileSettings = lazy(() => import("./components/profile/ProfileSettings"));
const Invitations = lazy(() => import("./pages/Invitations"));
const Notifications = lazy(() => import("./pages/Notifications"));

const RouteFallback = () => (
  <div className="flex h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

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
          <TimerProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              {showingSplash ? (
                <SplashScreen onFinished={handleSplashFinished} />
              ) : (
                <HashRouter>
                  <Suspense fallback={<RouteFallback />}>
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
                    <Route path="/season" element={<ProtectedRoute><SeasonDashboard /></ProtectedRoute>} />
                    <Route path="/season/:seasonId" element={<ProtectedRoute><SeasonDashboard /></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                    <Route path="/profile/settings" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
                    <Route path="/plans" element={<ProtectedRoute><Plans /></ProtectedRoute>} />
                    <Route path="/my-plan" element={<ProtectedRoute><MyPlan /></ProtectedRoute>} />
                    <Route path="/generate-test" element={<ProtectedRoute><TestGenerator /></ProtectedRoute>} />
                    <Route path="/train-mistakes" element={<ProtectedRoute><TrainMistakes /></ProtectedRoute>} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </HashRouter>
              )}
            </TooltipProvider>
          </TimerProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
