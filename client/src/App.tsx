import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import UserManagement from "@/pages/user-management";
import PersonnelManagement from "@/pages/personnel-management";
import ShiftsManagement from "@/pages/shifts-management";
import NotFound from "@/pages/not-found";

function ProtectedRoute({ component: Component, ...props }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  return <Component {...props} />;
}

function Router() {
  const { isAuthenticated } = useAuth();
  
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      
      {isAuthenticated && (
        <>
          <Route path="/" component={() => <Redirect to="/dashboard" />} />
          <Route path="/dashboard" component={AdminDashboard} />
          <Route path="/users" component={UserManagement} />
          <Route path="/personnel" component={PersonnelManagement} />
          <Route path="/shifts" component={ShiftsManagement} />
        </>
      )}
      
      {!isAuthenticated && <Route path="/" component={() => <Redirect to="/login" />} />}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
