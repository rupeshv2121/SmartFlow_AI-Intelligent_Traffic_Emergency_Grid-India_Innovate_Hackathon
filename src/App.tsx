import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Switch, Router as WouterRouter } from "wouter";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { SettingsProvider } from "./context/SettingsContext";
import { TrafficSimProvider } from "./context/TrafficSimContext";

import Analytics from "./pages/analytics";
import Dashboard from "./pages/dashboard";
import Dataset from "./pages/dataset";
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/not-found";
import Settings from "./pages/settings";
import Signals from "./pages/signals";
import Traffic from "./pages/traffic";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/traffic" component={Traffic} />
      <Route path="/signals" component={Signals} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/dataset" component={Dataset} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TrafficSimProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") }>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
        </TrafficSimProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
