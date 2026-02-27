import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();

function hasAuthParams(href: string): boolean {
  try {
    const url = new URL(href);
    const hash = url.hash ? new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : url.hash) : null;
    if (hash && (hash.has("access_token") || hash.has("code"))) return true;
    if (url.searchParams.has("access_token") || url.searchParams.has("code")) return true;
  } catch {
    // ignore
  }
  return false;
}

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    if (hasAuthParams(window.location.href)) {
      const origin = window.location.origin;
      const search = window.location.search || "";
      const hash = window.location.hash || "";
      window.location.replace(`${origin}/auth/callback${search}${hash}`);
      return;
    }
    navigate("/login", { replace: true });
  }, [navigate]);

  return (
    <div className="h-[100dvh] flex items-center justify-center text-muted-foreground">
      Redirecting...
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Index />} />
          <Route path="/profile" element={<Index />} />
          <Route path="/travel" element={<Index />} />
          <Route path="/swipe" element={<Index />} />
          <Route path="/matches" element={<Index />} />
          <Route path="/chat" element={<Index />} />
          <Route path="/account" element={<Index />} />
          <Route path="/admin" element={<Index />} />
          <Route path="/access" element={<Index />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
