import { useQuery } from "@tanstack/react-query";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth";
import type { Personnel, Base, BaseProfile } from "@shared/schema";
import {
  Building2,
  Users,
  MapPin,
  User,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Car,
  UserCheck,
} from "lucide-react";

export default function UserHome() {
  const { user } = useAuth();

  // Queries
  const { data: personnel = [], isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["/api/personnel"],
  }) as { data: Personnel[]; isLoading: boolean };

  const { data: bases = [], isLoading: isLoadingBases } = useQuery({
    queryKey: ["/api/bases"],
  }) as { data: Base[]; isLoading: boolean };

  const { data: baseProfile, isLoading: isLoadingProfile } = useQuery({
    queryKey: ["/api/base-profile", user?.id],
    enabled: !!user?.id,
    retry: false,
  }) as { data: BaseProfile | null; isLoading: boolean };

  // Find the selected base from baseProfile
  const selectedBase = bases.find(base => base.name === baseProfile?.baseName);

  // Statistics
  const totalPersonnel = personnel.length;
  const productivePersonnel = personnel.filter(p => p.productivityStatus === "productive").length;
  const officialPersonnel = personnel.filter(p => p.employmentStatus === "official").length;
  const driverPersonnel = personnel.filter(p => p.driverStatus === "driver").length;

  const isLoading = isLoadingPersonnel || isLoadingBases || isLoadingProfile;

  if (isLoading) {
    return (
      <UserLayout title="خانه">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="خانه">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-l from-primary/10 to-primary/5 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-full">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">خوش آمدید</h1>
              <p className="text-lg text-muted-foreground">
                {user?.fullName || user?.username} - سرپرست پایگاه
              </p>
            </div>
          </div>
        </div>

        {/* Base Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>مشخصات پایگاه</CardTitle>
                <CardDescription>اطلاعات کلی پایگاه تحت مدیریت</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {baseProfile && selectedBase ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">نام پایگاه</p>
                      <p className="text-muted-foreground">{baseProfile.baseName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">شماره پایگاه</p>
                      <p className="text-muted-foreground">{baseProfile.baseNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">نوع پایگاه</p>
                      <Badge variant="outline">
                        {baseProfile.baseType === "urban" ? "شهری" : "جاده‌ای"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">نام سرپرست</p>
                      <p className="text-muted-foreground">{baseProfile.supervisorName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <UserCheck className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">کد ملی سرپرست</p>
                      <p className="text-muted-foreground font-mono">{baseProfile.supervisorNationalId}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">وضعیت امضا</p>
                      <Badge variant="default" className="bg-green-500">
                        {baseProfile.digitalSignature ? "ثبت شده" : "ثبت نشده"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  اطلاعات پایگاه ثبت نشده
                </h3>
                <p className="text-sm text-muted-foreground">
                  لطفاً ابتدا اطلاعات پایگاه خود را در بخش "ثبت اطلاعات پایگاه" تکمیل کنید
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">کل پرسنل</p>
                  <p className="text-3xl font-bold">{totalPersonnel}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">پرسنل بهره‌ور</p>
                  <p className="text-3xl font-bold text-green-600">{productivePersonnel}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">پرسنل رسمی</p>
                  <p className="text-3xl font-bold text-blue-600">{officialPersonnel}</p>
                </div>
                <UserCheck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">راننده‌ها</p>
                  <p className="text-3xl font-bold text-orange-600">{driverPersonnel}</p>
                </div>
                <Car className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Personnel List */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>اعضای پایگاه</CardTitle>
                <CardDescription>لیست اعضای ثابت و پرسنل پایگاه</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {personnel.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {personnel.map((person) => (
                  <div
                    key={person.id}
                    className="p-4 border rounded-lg bg-background"
                    data-testid={`member-info-${person.id}`}
                  >
                    <div className="space-y-2">
                      <h4 className="font-medium">
                        {person.firstName} {person.lastName}
                      </h4>
                      <p className="text-sm text-muted-foreground font-mono">
                        {person.nationalId}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        <Badge 
                          variant={person.employmentStatus === "official" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {person.employmentStatus === "official" ? "رسمی" : "طرحی"}
                        </Badge>
                        <Badge 
                          variant={person.productivityStatus === "productive" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {person.productivityStatus === "productive" ? "بهره‌ور" : "غیر بهره‌ور"}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {person.driverStatus === "driver" ? "راننده" : "غیر راننده"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  هیچ پرسنلی یافت نشد
                </h3>
                <p className="text-sm text-muted-foreground">
                  پرسنل باید توسط مدیر سیستم تعریف شود
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}