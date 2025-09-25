import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { useRef, useState } from "react";
import { insertBaseProfileSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

// Enhanced validation schema based on shared schema with UI-specific rules
const baseProfileSchema = insertBaseProfileSchema.omit({ userId: true, isComplete: true }).extend({
  supervisorName: z.string().min(2, "نام سرپرست باید حداقل ۲ کاراکتر باشد"),
  supervisorNationalId: z.string().length(10, "کد ملی باید ۱۰ رقم باشد").regex(/^\d+$/, "کد ملی باید فقط شامل عدد باشد"),
  baseName: z.string().min(2, "نام پایگاه باید حداقل ۲ کاراکتر باشد"),
  baseNumber: z.string().min(1, "شماره پایگاه الزامی است"),
  baseType: z.enum(["urban", "road"], { required_error: "نوع پایگاه را انتخاب کنید" }),
  digitalSignature: z.string().min(1, "امضای دیجیتال الزامی است"),
});

type BaseProfileForm = z.infer<typeof baseProfileSchema>;

// Signature Canvas Component
function SignatureCanvas({ 
  onSignatureChange, 
  className = "" 
}: { 
  onSignatureChange: (signature: string) => void;
  className?: string;
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
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    setupCanvas();
    const coords = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        // Convert canvas to base64 string
        const signature = canvas.toDataURL();
        onSignatureChange(signature);
      }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onSignatureChange('');
      }
    }
  };

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="border border-gray-300 dark:border-gray-600 rounded-md cursor-crosshair bg-white dark:bg-gray-900"
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
        onClick={clearSignature}
        className="mt-2"
        data-testid="button-clear-signature"
      >
        پاک کردن امضا
      </Button>
    </div>
  );
}

export default function BaseProfileSetup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm<BaseProfileForm>({
    resolver: zodResolver(baseProfileSchema),
    defaultValues: {
      supervisorName: user?.fullName || "",
      supervisorNationalId: "",
      baseName: "",
      baseNumber: "",
      baseType: undefined,
      digitalSignature: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: BaseProfileForm) => {
      const response = await apiRequest('POST', '/api/base-profile', {
        ...data,
        userId: user?.id,
        isComplete: true,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/base-profile', user?.id] });
      toast({
        title: "موفقیت آمیز",
        description: "پروفایل پایگاه با موفقیت ثبت شد",
      });
      // Redirect based on user role
      if (user?.role === 'admin') {
        setLocation('/dashboard');
      } else {
        setLocation('/dashboard'); // Regular users go to same dashboard for now
      }
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error.message || "خطا در ثبت پروفایل پایگاه",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: BaseProfileForm) => {
    createProfileMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            تکمیل پروفایل پایگاه
          </CardTitle>
          <CardDescription>
            لطفاً اطلاعات پایگاه خود را تکمیل کنید. این اطلاعات فقط یک بار قابل ثبت است.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="supervisorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نام سرپرست</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="نام و نام خانوادگی سرپرست"
                        {...field}
                        data-testid="input-supervisor-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supervisorNationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>کد ملی سرپرست</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="کد ملی ۱۰ رقمی"
                        maxLength={10}
                        {...field}
                        data-testid="input-supervisor-national-id"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>نام پایگاه</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="نام پایگاه"
                          {...field}
                          data-testid="input-base-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="baseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>شماره پایگاه</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="شماره پایگاه"
                          {...field}
                          data-testid="input-base-number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="baseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>نوع پایگاه</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-base-type">
                          <SelectValue placeholder="نوع پایگاه را انتخاب کنید" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="urban" data-testid="select-option-urban">شهری</SelectItem>
                        <SelectItem value="road" data-testid="select-option-road">جاده‌ای</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <FormField
                control={form.control}
                name="digitalSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>امضای دیجیتال</FormLabel>
                    <FormControl>
                      <SignatureCanvas 
                        onSignatureChange={field.onChange}
                        className="w-full"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createProfileMutation.isPending}
                data-testid="button-submit-profile"
              >
                {createProfileMutation.isPending ? "در حال ثبت..." : "ثبت پروفایل پایگاه"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}