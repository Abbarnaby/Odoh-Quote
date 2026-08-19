import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardHome from "./components/admin/DashboardHome";
import PaperCosts from "./components/admin/PaperCosts";
import TonerCosts from "./components/admin/TonerCosts";
import CoverCosts from "./components/admin/CoverCosts";
import FinishingCosts from "./components/admin/FinishingCosts";
import PackagingCosts from "./components/admin/PackagingCosts";
import BHRSettings from "./components/admin/BHRSettings";
import AdditionalServices from "./components/admin/AdditionalServices";
import ProfitMargins from "./components/admin/ProfitMargins";
import ResetDefaults from "./components/admin/ResetDefaults";
import { AdminProvider } from "./contexts/AdminContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AdminProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="paper-costs" element={<PaperCosts />} />
              <Route path="toner-costs" element={<TonerCosts />} />
              <Route path="cover-costs" element={<CoverCosts />} />
              <Route path="finishing-costs" element={<FinishingCosts />} />
              <Route path="packaging-costs" element={<PackagingCosts />} />
              <Route path="bhr-settings" element={<BHRSettings />} />
              <Route path="additional-services" element={<AdditionalServices />} />
              <Route path="profit-margins" element={<ProfitMargins />} />
              <Route path="reset-defaults" element={<ResetDefaults />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AdminProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
