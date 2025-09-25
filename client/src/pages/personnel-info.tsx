import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserCheck, Edit, AlertTriangle } from "lucide-react";

// Placeholder component for Personnel Information Management (Regular Users)
export default function PersonnelInfo() {
  return (
    <AdminLayout title="مدیریت اطلاعات پرسنل">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UserCheck className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">مدیریت اطلاعات پرسنل</h1>
              <p className="text-muted-foreground">ویرایش وضعیت بهره‌وری پرسنل پایگاه</p>
            </div>
          </div>
          <Badge variant="secondary">
            محدود به ویرایش وضعیت بهره‌وری
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
                    مشاهده لیست پرسنل پایگاه خود
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    ویرایش وضعیت بهره‌وری پرسنل (مولد/غیرمولد)
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    ذخیره تغییرات به صورت فوری
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    بازتاب فوری تغییرات در محاسبات
                  </li>
                </ul>
              </div>
              
              <div className="pt-4">
                <Button disabled className="gap-2" data-testid="button-edit-personnel">
                  <Edit className="h-4 w-4" />
                  ویرایش اطلاعات پرسنل
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}