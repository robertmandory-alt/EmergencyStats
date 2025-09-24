import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Hospital } from "lucide-react";

interface LoginFormData {
  username: string;
  password: string;
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      toast({
        title: "ورود موفقیت‌آمیز",
        description: "خوش آمدید",
      });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "خطا در ورود",
        description: error.message || "نام کاربری یا رمز عبور اشتباه است",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Hospital className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            سیستم مدیریت اورژانس
          </CardTitle>
          <p className="text-muted-foreground">
            ورود به پنل مدیریت
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">نام کاربری</Label>
              <Input
                id="username"
                data-testid="input-username"
                {...register("username", {
                  required: "نام کاربری الزامی است",
                })}
                disabled={isLoading}
              />
              {errors.username && (
                <p className="text-sm text-destructive">
                  {errors.username.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <Input
                id="password"
                type="password"
                data-testid="input-password"
                {...register("password", {
                  required: "رمز عبور الزامی است",
                })}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>برای ورود از اطلاعات زیر استفاده کنید:</p>
            <p className="font-mono mt-2">
              نام کاربری: admin<br />
              رمز عبور: admin1
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
