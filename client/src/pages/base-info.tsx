import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { insertBaseProfileSchema } from "@shared/schema";
import type { Personnel, Base, BaseProfile } from "@shared/schema";
import {
  Building2,
  Save,
  PenTool,
  RotateCcw,
  Loader2,
  CheckCircle,
} from "lucide-react";

// Form validation schema for base information (simplified)
const baseInfoSchema = z.object({
  baseName: z.string().min(1, "انتخاب پایگاه الزامی است"),
  baseNumber: z.string().min(1, "شماره پایگاه الزامی است"),
  baseType: z.enum(["urban", "road"], { required_error: "نوع پایگاه را انتخاب کنید" }),
  supervisorName: z.string().min(1, "انتخاب سرپرست الزامی است"),
  supervisorNationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد").regex(/^\d+$/, "کد ملی باید فقط شامل عدد باشد"),
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
        width={400}
        height={200}
        className="border border-border rounded cursor-crosshair bg-background w-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        data-testid="signature-canvas"
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

export default function BaseInfo() {
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Form setup
  const form = useForm<BaseInfoForm>({
    resolver: zodResolver(baseInfoSchema),
    defaultValues: {
      baseName: "",
      baseNumber: "",
      baseType: undefined,
      supervisorName: "",
      supervisorNationalId: "",
      digitalSignature: "",
    },
  });

  // Reset form when baseProfile data loads
  useEffect(() => {
    if (baseProfile) {
      form.reset({
        baseName: baseProfile.baseName || "",
        baseNumber: baseProfile.baseNumber || "",
        baseType: (baseProfile.baseType as "urban" | "road") || undefined,
        supervisorName: baseProfile.supervisorName || "",
        supervisorNationalId: baseProfile.supervisorNationalId || "",
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

  // Save mutation
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

  // Event handlers
  const onSubmit = (data: BaseInfoForm) => {
    saveBaseInfoMutation.mutate(data);
  };

  const isLoading = isLoadingPersonnel || isLoadingBases || isLoadingProfile;

  if (isLoading) {
    return (
      <UserLayout title="ثبت اطلاعات پایگاه">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="ثبت اطلاعات پایگاه">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ثبت اطلاعات پایگاه</h1>
            <p className="text-muted-foreground">
              تنظیمات اولیه پایگاه، انتخاب سرپرست و ثبت امضای دیجیتال
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>اطلاعات پایگاه</CardTitle>
            <CardDescription>
              لطفاً اطلاعات پایگاه، سرپرست و امضای دیجیتال خود را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <FormLabel>انتخاب نام سرپرست پایگاه</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          const selectedPerson = personnel.find(p => `${p.firstName} ${p.lastName}` === value);
                          if (selectedPerson) {
                            form.setValue("supervisorNationalId", selectedPerson.nationalId);
                          }
                        }} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-supervisor">
                              <SelectValue placeholder="سرپرست پایگاه را انتخاب کنید" />
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
                </div>

                {/* Selected base info (read-only) */}
                {selectedBase && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">اطلاعات پایگاه انتخاب شده:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">نام پایگاه:</span>
                        <span className="mr-2 font-medium">{selectedBase.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">شماره:</span>
                        <span className="mr-2 font-medium">{selectedBase.number}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">نوع:</span>
                        <span className="mr-2 font-medium">
                          {selectedBase.type === "urban" ? "شهری" : "جاده‌ای"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

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
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
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

                {/* Status indicator */}
                {baseProfile && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">اطلاعات پایگاه قبلاً ثبت شده است</span>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}