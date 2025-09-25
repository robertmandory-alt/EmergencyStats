import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Clock,
  FileText,
  LogOut,
  Hospital,
} from "lucide-react";

// Navigation item type
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  description?: string;
}

// Admin navigation (full access)
const adminNavigation: NavigationItem[] = [
  {
    name: "داشبورد و نظارت عملکرد",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "مدیریت کاربران",
    href: "/users",
    icon: Users,
  },
  {
    name: "مدیریت پرسنل",
    href: "/personnel",
    icon: UserCheck,
  },
  {
    name: "مدیریت شیفت‌ها",
    href: "/shifts",
    icon: Clock,
  },
  // Removing reports route as it's not implemented yet
  // {
  //   name: "گزارشات و خروجی", 
  //   href: "/reports",
  //   icon: FileText,
  // },
];

// Regular user navigation (restricted to 2 modules)
const userNavigation: NavigationItem[] = [
  {
    name: "مدیریت اطلاعات پرسنل",
    href: "/personnel-info",
    icon: UserCheck,
    description: "ویرایش وضعیت بهره‌وری پرسنل"
  },
  {
    name: "ثبت عملکرد",
    href: "/performance-log",
    icon: FileText,
    description: "ثبت ماموریت‌ها و وعده‌های غذایی"
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };
  
  // Determine navigation based on user role
  const navigation = user?.role === 'admin' ? adminNavigation : userNavigation;
  const isAdmin = user?.role === 'admin';

  return (
    <aside className="w-64 bg-card border-l border-border shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Hospital className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">سیستم مدیریت اورژانس</h2>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "پنل مدیریت" : "پنل سرپرست پایگاه"}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <p className="font-medium" data-testid="text-username">
              {user?.fullName || user?.username || (isAdmin ? "مدیر سیستم" : "سرپرست پایگاه")}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAdmin ? "مدیر سیستم" : "سرپرست پایگاه"} • آنلاین
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="p-2">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  )}
                  data-testid={`link-${item.href.replace('/', '')}`}
                >
                  <item.icon className="h-5 w-5" />
                  <div className="flex-1">
                    <div>{item.name}</div>
                    {item.description && (
                      <div className="text-xs opacity-75 mt-0.5">
                        {item.description}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
          
          <li className="pt-4 border-t border-border">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
              خروج از سیستم
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
