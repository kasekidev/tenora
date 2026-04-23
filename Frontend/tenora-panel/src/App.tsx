import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PanelLayout } from "@/components/panel/PanelLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Categories from "@/pages/Categories";
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Imports from "@/pages/Imports";
import Users from "@/pages/Users";
import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";

// ──────────────────────────────────────────────────────────────────────────────
// Panel admin — defaults plus courts que la boutique :
// l'admin a besoin de fraîcheur (commandes, imports en cours), mais pas de
// refetch sauvage à chaque changement d'onglet.
//   • staleTime 30s : équilibre entre fraîcheur et nb d'appels.
//   • refetchOnWindowFocus: true : utile pour l'admin qui jongle entre apps.
//   • refetchOnReconnect: "always".
// ──────────────────────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner theme="dark" position="top-right" toastOptions={{ className: "mono" }} />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<PanelLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="categories" element={<Categories />} />
            <Route path="products" element={<Products />} />
            <Route path="orders" element={<Orders />} />
            <Route path="imports" element={<Imports />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
