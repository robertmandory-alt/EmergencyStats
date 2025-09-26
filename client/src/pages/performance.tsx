import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Calendar, Users, Clock } from "lucide-react";

export default function Performance() {
  return (
    <UserLayout title="ثبت آمار کارکرد">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ثبت آمار کارکرد پرسنل</h1>
            <p className="text-muted-foreground">
              ماژول اصلی برای ثبت شیفت‌ها، تعداد ماموریت‌ها و وعده‌های غذایی
            </p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6" />
              در حال توسعه
            </CardTitle>
            <CardDescription>
              این بخش به زودی در دسترس خواهد بود
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-medium text-muted-foreground mb-4">
                ماژول ثبت آمار کارکرد
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                این بخش شامل امکانات زیر خواهد بود:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">ثبت شیفت‌ها</h4>
                  <p className="text-sm text-muted-foreground">
                    مدیریت شیفت‌های کاری پرسنل
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">ثبت ماموریت‌ها</h4>
                  <p className="text-sm text-muted-foreground">
                    تعداد ماموریت‌های انجام شده
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">وعده‌های غذایی</h4>
                  <p className="text-sm text-muted-foreground">
                    ثبت تعداد وعده‌های غذایی
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                جزئیات کامل عملکرد و طراحی این بخش در آینده ارائه خواهد شد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}