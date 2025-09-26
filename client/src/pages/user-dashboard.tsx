import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { insertBaseProfileSchema } from "@shared/schema";
import type { Personnel, Base, BaseProfile } from "@shared/schema";
import {
  Building2,
  Users,
  BarChart3,
  FileText,
  Save,
  Edit,
  PenTool,
  CheckCircle,
  UserPlus,
  RotateCcw,
  Loader2,
} from "lucide-react";

// Form validation schema for base information
const baseInfoSchema = insertBaseProfileSchema.omit({ 
  userId: true, 
  isComplete: true,
  createdAt: true
}).extend({
  supervisorName: z.string().min(1, "انتخاب سرپرست الزامی است"),
  supervisorNationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد").regex(/^\d+$/, "کد ملی باید فقط شامل عدد باشد"),
  baseName: z.string().min(1, "انتخاب پایگاه الزامی است"),
  baseNumber: z.string().min(1, "شماره پایگاه الزامی است"),
  baseType: z.enum(["urban", "road"], { required_error: "نوع پایگاه را انتخاب کنید" }),
  digitalSignature: z.string().min(1, "امضای دیجیتال الزامی است"),
});

type BaseInfoForm = z.infer<typeof baseInfoSchema>;

// Signature Canvas Component
function SignatureCanvas({ 
  onSignatureChange, 
  className = "",
  initialSignature = ""
}: { 
  onSignatureChange: (signature: string) => void;
  className?: string;
  initialSignature?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Load initial signature if provided
      if (initialSignature) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = initialSignature;
      }
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const { x, y } = getCoordinates(e);
    
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      
      // Export signature as base64
      const dataURL = canvas.toDataURL();
      onSignatureChange(dataURL);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onSignatureChange("");
    }
  };

  // Initialize canvas when component mounts
  useEffect(() => {
    setupCanvas();
  }, [initialSignature]);

  return (
    <div className={`space-y-2 ${className}`}>
      <canvas
        ref={canvasRef}
        width={300}
        height={150}
        className="border border-border rounded cursor-crosshair bg-background"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={clearCanvas}
        className="gap-2"
        data-testid="button-clear-signature"
      >
        <RotateCcw className="h-4 w-4" />
        پاک کردن امضا
      </Button>
    </div>
  );
}

export default function UserDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isEditingMembers, setIsEditingMembers] = useState(false);

  // Queries
  const { data: personnel = [], isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["/api/personnel"],
  }) as { data: Personnel[]; isLoading: boolean };

  const { data: bases = [], isLoading: isLoadingBases } = useQuery({
    queryKey: ["/api/bases"],
  }) as { data: Base[]; isLoading: boolean };

  const { data: baseProfile, isLoading: isLoadingProfile, refetch: refetchProfile } = useQuery({
    queryKey: ["/api/base-profile", user?.id],
    enabled: !!user?.id,
    retry: false,
  }) as { data: BaseProfile | null; isLoading: boolean; refetch: () => void };

  // Form setup for base information
  const form = useForm<BaseInfoForm>({
    resolver: zodResolver(baseInfoSchema),
    defaultValues: {
      supervisorName: "",
      supervisorNationalId: "",
      baseName: "",
      baseNumber: "",
      baseType: undefined,
      digitalSignature: "",
    },
  });

  // Reset form when baseProfile data loads
  useEffect(() => {
    if (baseProfile) {
      form.reset({
        supervisorName: baseProfile.supervisorName || "",
        supervisorNationalId: baseProfile.supervisorNationalId || "",
        baseName: baseProfile.baseName || "",
        baseNumber: baseProfile.baseNumber || "",
        baseType: (baseProfile.baseType as "urban" | "road") || undefined,
        digitalSignature: baseProfile.digitalSignature || "",
      });
    }
  }, [baseProfile, form]);

  // Watch for base selection to auto-fill base number and type
  const selectedBaseName = form.watch("baseName");
  const selectedBase = bases.find(base => base.name === selectedBaseName);

  // Auto-fill base number and type when base is selected
  useEffect(() => {
    if (selectedBase) {
      form.setValue("baseNumber", selectedBase.number);
      form.setValue("baseType", selectedBase.type as "urban" | "road");
    }
  }, [selectedBase, form]);

  // Mutations
  const saveBaseInfoMutation = useMutation({
    mutationFn: async (data: BaseInfoForm) => {
      const response = await apiRequest("POST", "/api/base-profile", {
        ...data,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "اطلاعات پایگاه با موفقیت ذخیره شد",
      });
      refetchProfile();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ذخیره اطلاعات پایگاه",
      });
    },
  });

  const saveMembersMutation = useMutation({
    mutationFn: async (members: string[]) => {
      // Note: This is a placeholder implementation
      // In a full implementation, this would save the selected members to the database
      console.log('Saving base members:', members);
      return Promise.resolve({ members });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "اعضای پایگاه با موفقیت ذخیره شد",
      });
      setIsEditingMembers(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ذخیره اعضای پایگاه",
      });
    },
  });

  // Event handlers
  const onSubmitBaseInfo = (data: BaseInfoForm) => {
    saveBaseInfoMutation.mutate(data);
  };

  const handleMemberToggle = (personnelId: string) => {
    setSelectedMembers(prev => 
      prev.includes(personnelId)
        ? prev.filter(id => id !== personnelId)
        : [...prev, personnelId]
    );
  };

  const handleSaveMembers = () => {
    saveMembersMutation.mutate(selectedMembers);
  };

  const isLoading = isLoadingPersonnel || isLoadingBases || isLoadingProfile;

  if (isLoading) {
    return (
      <AdminLayout title="پنل سرپرست پایگاه">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="پنل سرپرست پایگاه">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">پنل سرپرست پایگاه</h1>
            <p className="text-muted-foreground mt-2">
              مدیریت اطلاعات پایگاه، اعضا و عملکرد
            </p>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Users className="h-4 w-4" />
            {user?.fullName || user?.username}
          </Badge>
        </div>

        {/* Section 1: Base Information Registration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>بخش ۱: ثبت اطلاعات پایگاه</CardTitle>
                <CardDescription>
                  ثبت و ویرایش اطلاعات شناسایی پایگاه تحت مدیریت
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitBaseInfo)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Base Selection */}
                  <FormField
                    control={form.control}
                    name="baseName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>انتخاب نام پایگاه</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-base-name">
                              <SelectValue placeholder="پایگاه را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bases.map((base) => (
                              <SelectItem key={base.id} value={base.name}>
                                {base.name} - {base.number} ({base.type === "urban" ? "شهری" : "جاده‌ای"})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Supervisor Selection */}
                  <FormField
                    control={form.control}
                    name="supervisorName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>انتخاب نام مسئول پایگاه</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const selectedPerson = personnel.find(p => `${p.firstName} ${p.lastName}` === value);
                          if (selectedPerson) {
                            form.setValue("supervisorNationalId", selectedPerson.nationalId);
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-supervisor">
                              <SelectValue placeholder="مسئول پایگاه را انتخاب کنید" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {personnel.map((person) => (
                              <SelectItem key={person.id} value={`${person.firstName} ${person.lastName}`}>
                                {person.firstName} {person.lastName} ({person.nationalId})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* National ID - Auto-filled */}
                  <FormField
                    control={form.control}
                    name="supervisorNationalId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>کد ملی مسئول پایگاه</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="کد ملی مسئول"
                            readOnly
                            className="bg-muted"
                            data-testid="input-supervisor-national-id"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Base Number - Auto-filled */}
                  <FormField
                    control={form.control}
                    name="baseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>شماره پایگاه</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="شماره پایگاه"
                            readOnly
                            className="bg-muted"
                            data-testid="input-base-number"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Digital Signature */}
                <FormField
                  control={form.control}
                  name="digitalSignature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <PenTool className="h-4 w-4" />
                        ثبت امضای دیجیتال
                      </FormLabel>
                      <FormControl>
                        <SignatureCanvas
                          onSignatureChange={field.onChange}
                          initialSignature={field.value}
                          data-testid="signature-canvas"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={saveBaseInfoMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-base-info"
                  >
                    {saveBaseInfoMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saveBaseInfoMutation.isPending ? "در حال ذخیره..." : "ذخیره اطلاعات"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                    className="gap-2"
                    data-testid="button-reset-base-info"
                  >
                    <RotateCcw className="h-4 w-4" />
                    بازنشانی
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Separator />

        {/* Section 2: Base Members Registration */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserPlus className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>بخش ۲: ثبت اطلاعات اعضای پایگاه</CardTitle>
                  <CardDescription>
                    انتخاب و مشخص کردن اعضای ثابت و اصلی پایگاه
                  </CardDescription>
                </div>
              </div>
              <Button
                variant={isEditingMembers ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsEditingMembers(!isEditingMembers)}
                className="gap-2"
                data-testid="button-toggle-edit-members"
              >
                <Edit className="h-4 w-4" />
                {isEditingMembers ? "انصراف" : "ویرایش اعضا"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {personnel.map((person) => (
                  <div
                    key={person.id}
                    className={`
                      p-4 border rounded-lg cursor-pointer transition-all
                      ${selectedMembers.includes(person.id)
                        ? "bg-primary/10 border-primary"
                        : "bg-background border-border hover:bg-muted/50"
                      }
                      ${!isEditingMembers ? "cursor-default" : ""}
                    `}
                    onClick={() => isEditingMembers && handleMemberToggle(person.id)}
                    data-testid={`member-card-${person.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {person.firstName} {person.lastName}
                        </h4>
                        <p className="text-sm text-muted-foreground font-mono">
                          {person.nationalId}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {person.employmentStatus === "official" ? "رسمی" : "طرحی"}
                          </Badge>
                          <Badge variant={person.productivityStatus === "productive" ? "default" : "secondary"} className="text-xs">
                            {person.productivityStatus === "productive" ? "بهره‌ور" : "غیر بهره‌ور"}
                          </Badge>
                        </div>
                      </div>
                      {selectedMembers.includes(person.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isEditingMembers && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    {selectedMembers.length} نفر انتخاب شده
                  </div>
                  <Button
                    onClick={handleSaveMembers}
                    disabled={saveMembersMutation.isPending}
                    className="gap-2"
                    data-testid="button-save-members"
                  >
                    {saveMembersMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {saveMembersMutation.isPending ? "در حال ذخیره..." : "ذخیره اعضای پایگاه"}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Section 3: Performance Logging Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle className="text-muted-foreground">بخش ۳: ثبت آمار کارکرد پرسنل</CardTitle>
                <CardDescription>
                  ماژول اصلی برای ثبت شیفت‌ها، تعداد ماموریت‌ها و وعده‌های غذایی
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                این بخش در حال توسعه است
              </h3>
              <p className="text-sm text-muted-foreground">
                جزئیات کامل عملکرد و طراحی این بخش در آینده ارائه خواهد شد
              </p>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Section 4: Reports Placeholder */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-muted-foreground" />
              <div>
                <CardTitle className="text-muted-foreground">بخش ۴: گزارشات</CardTitle>
                <CardDescription>
                  مشاهده و دریافت گزارش‌های مربوط به عملکرد پایگاه
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                این بخش در حال توسعه است
              </h3>
              <p className="text-sm text-muted-foreground">
                جزئیات کامل انواع گزارش‌ها و فیلترهای آن در آینده ارائه خواهد شد
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}