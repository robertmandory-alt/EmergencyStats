import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";
import { Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { z } from "zod";

const userFormSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "رمزهای عبور باید یکسان باشند",
  path: ["confirmPassword"],
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function UserManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      role: "user",
      isActive: true,
    },
  });

  // Queries
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["/api/users"],
  }) as { data: any[]; isLoading: boolean };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (userData: any) => apiRequest("POST", "/api/users", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت ایجاد شد",
      });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد کاربر",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...userData }: any) =>
      apiRequest("PUT", `/api/users/${id}`, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت به‌روزرسانی شد",
      });
      setIsDialogOpen(false);
      setEditingUser(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی کاربر",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف کاربر",
      });
    },
  });

  // Event handlers
  const onSubmit = (data: UserFormData) => {
    const { confirmPassword, ...userData } = data;
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, ...userData });
    } else {
      createMutation.mutate(userData);
    }
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setValue("username", user.username);
    setValue("role", user.role);
    setValue("isActive", user.isActive);
    setValue("password", "");
    setValue("confirmPassword", "");
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این کاربر اطمینان دارید؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(null);
    reset();
  };

  const isLoading_mutations = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <AdminLayout title="مدیریت کاربران">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>لیست کاربران</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-user">
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن کاربر جدید
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingUser ? "ویرایش کاربر" : "افزودن کاربر جدید"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="username">نام کاربری</Label>
                    <Input
                      id="username"
                      data-testid="input-user-username"
                      {...register("username")}
                      disabled={isLoading_mutations}
                    />
                    {errors.username && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.username.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">رمز عبور</Label>
                    <Input
                      id="password"
                      type="password"
                      data-testid="input-user-password"
                      {...register("password")}
                      disabled={isLoading_mutations}
                      placeholder={editingUser ? "برای تغییر رمز عبور وارد کنید" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">تایید رمز عبور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      data-testid="input-user-confirm-password"
                      {...register("confirmPassword")}
                      disabled={isLoading_mutations}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="role">نقش</Label>
                    <Select
                      value={watch("role")}
                      onValueChange={(value) => setValue("role", value)}
                    >
                      <SelectTrigger data-testid="select-user-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">مدیر سیستم</SelectItem>
                        <SelectItem value="user">سرپرست پایگاه</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="isActive">وضعیت</Label>
                    <Select
                      value={watch("isActive") ? "active" : "inactive"}
                      onValueChange={(value) => setValue("isActive", value === "active")}
                    >
                      <SelectTrigger data-testid="select-user-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">فعال</SelectItem>
                        <SelectItem value="inactive">غیرفعال</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoading_mutations}
                      data-testid="button-save-user"
                    >
                      {isLoading_mutations ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      data-testid="button-cancel-user"
                    >
                      انصراف
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">در حال بارگذاری...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام کاربری</TableHead>
                    <TableHead className="text-right">نقش</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user: any) => (
                    <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                          {user.role === "admin" ? "مدیر سیستم" : "سرپرست پایگاه"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "فعال" : "غیرفعال"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.role !== "admin" && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(user.id)}
                              data-testid={`button-delete-user-${user.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
