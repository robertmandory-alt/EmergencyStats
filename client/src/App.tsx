import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/lib/auth";

import LoginPage from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import UserManagement from "@/pages/user-management";
import PersonnelManagement from "@/pages/personnel-management";
import ShiftsManagement from "@/pages/shifts-management";
import BaseProfileSetup from "@/pages/base-profile-setup";
import NotFound from "@/pages/not-found";

// Regular user pages
import UserHome from "@/pages/user-home";
import BaseInfo from "@/pages/base-info";
import BaseMembers from "@/pages/base-members";
import Performance from "@/pages/performance";
import Reports from "@/pages/reports";

// Protected route component with role-based access control
function ProtectedRoute({ 
  component: Component, 
  adminOnly = false,
  userOnly = false,
  ...props 
}: { 
  component: React.ComponentType;
  adminOnly?: boolean;
  userOnly?: boolean;
}) {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }
  
  // Role-based access control with appropriate redirects
  if (adminOnly && user?.role !== 'admin') {
    // Regular users trying to access admin routes should go to their dashboard
    return <Redirect to="/dashboard" />;
  }
  
  if (userOnly && user?.role !== 'user') {
    // Admins trying to access user-only routes should go to admin dashboard
    return <Redirect to="/dashboard" />;
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
          <Route path="/" component={() => {
            return <Redirect to="/dashboard" />;
          }} />
          
          {/* Base Profile Setup - all users */}
          <Route path="/base-profile-setup" component={BaseProfileSetup} />
          
          {/* Admin dashboard - protected */}
          <Route path="/dashboard" component={(props) => {
            const { user } = useAuth();
            if (user?.role === 'admin') {
              return <ProtectedRoute component={AdminDashboard} adminOnly {...props} />;
            } else {
              return <ProtectedRoute component={UserHome} userOnly {...props} />;
            }
          }} />
          
          {/* User section routes */}
          <Route path="/base-info">
            <ProtectedRoute component={BaseInfo} userOnly />
          </Route>
          <Route path="/base-members">
            <ProtectedRoute component={BaseMembers} userOnly />
          </Route>
          <Route path="/performance">
            <ProtectedRoute component={Performance} userOnly />
          </Route>
          <Route path="/reports">
            <ProtectedRoute component={Reports} userOnly />
          </Route>
          
          {/* Admin-only routes */}
          <Route path="/users" component={(props) => <ProtectedRoute component={UserManagement} adminOnly {...props} />} />
          <Route path="/personnel" component={(props) => <ProtectedRoute component={PersonnelManagement} adminOnly {...props} />} />
          <Route path="/shifts" component={(props) => <ProtectedRoute component={ShiftsManagement} adminOnly {...props} />} />
          
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
