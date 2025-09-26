import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, PieChart, TrendingUp, Filter } from "lucide-react";

export default function Reports() {
  return (
    <UserLayout title="گزارشات">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">گزارشات</h1>
            <p className="text-muted-foreground">
              مشاهده و دریافت گزارش‌های مربوط به عملکرد پایگاه
            </p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              در حال توسعه
            </CardTitle>
            <CardDescription>
              این بخش به زودی در دسترس خواهد بود
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-24 w-24 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-medium text-muted-foreground mb-4">
                ماژول گزارشات و تحلیل
              </h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                این بخش شامل امکانات زیر خواهد بود:
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <BarChart3 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">گزارش عملکرد</h4>
                  <p className="text-sm text-muted-foreground">
                    آمار کلی عملکرد پایگاه
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <PieChart className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">تحلیل اعضا</h4>
                  <p className="text-sm text-muted-foreground">
                    آمار و تحلیل اعضای پایگاه
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">روند عملکرد</h4>
                  <p className="text-sm text-muted-foreground">
                    نمودارهای روند و پیشرفت
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <Filter className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">فیلترهای پیشرفته</h4>
                  <p className="text-sm text-muted-foreground">
                    فیلتر بر اساس تاریخ و معیارها
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <Download className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">خروجی اکسل</h4>
                  <p className="text-sm text-muted-foreground">
                    دانلود گزارشات در فرمت اکسل
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg bg-muted/30">
                  <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                  <h4 className="font-medium mb-1">گزارش PDF</h4>
                  <p className="text-sm text-muted-foreground">
                    تولید گزارشات قابل چاپ
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                جزئیات کامل انواع گزارش‌ها و فیلترهای آن در آینده ارائه خواهد شد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}