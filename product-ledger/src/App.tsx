import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Verify from "./pages/Verify";
import ManufacturerDashboard from "./pages/ManufacturerDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import ConsumerDashboard from "./pages/ConsumerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import PendingApproval from "./pages/PendingApproval";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import ProfilePage from "./pages/ProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/v/:childID" element={<Verify />} />
            <Route path="/verify/:childID" element={<Verify />} />
            <Route path="/verify" element={<Verify />} />

            {/* Protected routes with layout */}
            <Route element={<AppLayout />}>
              <Route path="/pending-approval" element={
                <ProtectedRoute>
                  <PendingApproval />
                </ProtectedRoute>
              } />
              
              {/* Profile page - accessible by all authenticated users */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              
              <Route path="/manufacturer" element={
                <ProtectedRoute allowedRoles={['manufacturer']} requireApproval>
                  <ManufacturerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/retailer" element={
                <ProtectedRoute allowedRoles={['retailer']} requireApproval>
                  <RetailerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/consumer" element={
                <ProtectedRoute allowedRoles={['consumer']}>
                  <ConsumerDashboard />
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
