import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Bell, Settings } from "lucide-react";
import { getCurrentJalaliDate, formatJalaliDateLong } from "@/lib/jalali-utils";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const currentDate = getCurrentJalaliDate();
  
  return (
    <div className="flex min-h-screen" dir="rtl">
      <Sidebar />
      
      <main className="flex-1 bg-muted/30">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-muted-foreground">
                {formatJalaliDateLong(currentDate, true)}
              </p>
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
