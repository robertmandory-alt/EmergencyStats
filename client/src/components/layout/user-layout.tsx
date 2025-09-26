import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  Menu,
  X,
  Home,
  Building2,
  UserPlus,
  BarChart3,
  FileText,
  LogOut,
  Hospital,
  Bell,
  Settings,
} from "lucide-react";
import { getCurrentJalaliDate, formatJalaliDateLong } from "@/lib/jalali-utils";

interface UserLayoutProps {
  children: React.ReactNode;
  title: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description: string;
}

const userNavigation: NavigationItem[] = [
  {
    name: "خانه",
    href: "/dashboard",
    icon: Home,
    description: "نمای کلی پایگاه"
  },
  {
    name: "ثبت اطلاعات پایگاه",
    href: "/base-info",
    icon: Building2,
    description: "تنظیمات پایگاه و امضا"
  },
  {
    name: "ثبت اعضای پایگاه",
    href: "/base-members",
    icon: UserPlus,
    description: "مدیریت اعضای ثابت"
  },
  {
    name: "ثبت آمار کارکرد",
    href: "/performance",
    icon: BarChart3,
    description: "ماموریت‌ها و وعده‌های غذایی"
  },
  {
    name: "گزارشات",
    href: "/reports",
    icon: FileText,
    description: "گزارش‌های عملکرد"
  },
];

export function UserLayout({ children, title }: UserLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const currentDate = getCurrentJalaliDate();

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-72 bg-card border-l border-border shadow-lg transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary rounded-lg">
                <Hospital className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg">سیستم مدیریت اورژانس</h2>
                <p className="text-sm text-muted-foreground">پنل سرپرست پایگاه</p>
              </div>
            </div>
            {/* Close button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-medium">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || "ک"}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-medium">{user?.fullName || user?.username}</p>
              <Badge variant="secondary" className="text-xs">
                سرپرست پایگاه
              </Badge>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {userNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => setIsSidebarOpen(false)}
                    data-testid={`nav-${item.href.replace('/', '')}`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-5 w-5" />
            خروج از سیستم
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-muted/30 lg:mr-0">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="lg:hidden"
                data-testid="button-toggle-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <div>
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-muted-foreground">
                  {formatJalaliDateLong(currentDate, true)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-notifications"
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                data-testid="button-settings"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}