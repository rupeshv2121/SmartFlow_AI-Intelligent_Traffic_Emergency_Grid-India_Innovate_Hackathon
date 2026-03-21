import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TrafficSimProvider } from "@/context/TrafficSimContext";

import Dashboard from "@/pages/dashboard";
import Traffic from "@/pages/traffic";
import Signals from "@/pages/signals";
import Emergency from "@/pages/emergency";
// import Simulations from "@/pages/simulations";
import Analytics from "@/pages/analytics";
import Dataset from "@/pages/dataset";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";

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
      <Route path="/" component={Dashboard} />
      <Route path="/traffic" component={Traffic} />
      <Route path="/signals" component={Signals} />
      <Route path="/emergency" component={Emergency} />
      {/* <Route path="/simulations" component={Simulations} /> */}
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
      <TrafficSimProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "") }>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </TrafficSimProvider>
    </QueryClientProvider>
  );
}

export default App;
