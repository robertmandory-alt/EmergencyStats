import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, Send, AlertTriangle } from "lucide-react";

// Placeholder component for Performance Logging (Regular Users)
export default function PerformanceLog() {
  return (
    <AdminLayout title="ثبت عملکرد">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">ثبت عملکرد</h1>
              <p className="text-muted-foreground">ثبت ماموریت‌ها و وعده‌های غذایی ماهانه</p>
            </div>
          </div>
          <Badge variant="secondary">
            ثبت بر اساس شیفت و تاریخ
          </Badge>
        </div>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">در حال توسعه</CardTitle>
              </div>
              <CardDescription>
                این صفحه هنوز در حال توسعه است. در نسخه نهایی، شما قادر خواهید بود:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">قابلیت‌های در نظر گرفته شده:</h3>
                <ul className="text-sm text-muted-foreground space-y-1 mr-4">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    مشاهده جدول ماهانه عملکرد
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    کلیک بر روی هر سلول برای ورود اطلاعات
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    انتخاب نوع شیفت از لیست مدیر
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    ورود تعداد ماموریت‌ها
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    ورود تعداد وعده‌های غذایی
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    نهایی کردن و ارسال اطلاعات ماهانه
                  </li>
                </ul>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button disabled className="gap-2" data-testid="button-view-calendar">
                  <Calendar className="h-4 w-4" />
                  مشاهده تقویم عملکرد
                </Button>
                <Button disabled variant="outline" className="gap-2" data-testid="button-finalize-submit">
                  <Send className="h-4 w-4" />
                  نهایی کردن و ارسال
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}