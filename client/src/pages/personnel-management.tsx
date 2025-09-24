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
import { insertPersonnelSchema } from "@shared/schema";
import { Plus, Edit, Trash2, UserCheck } from "lucide-react";
import { z } from "zod";

type PersonnelFormData = z.infer<typeof insertPersonnelSchema>;

export default function PersonnelManagement() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonnelFormData>({
    resolver: zodResolver(insertPersonnelSchema),
    defaultValues: {
      employmentStatus: "official",
      productivityStatus: "productive",
      driverStatus: "non_driver",
    },
  });

  // Queries
  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ["/api/personnel"],
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (personnelData: PersonnelFormData) =>
      apiRequest("POST", "/api/personnel", personnelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "موفقیت",
        description: "پرسنل با موفقیت ایجاد شد",
      });
      setIsDialogOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد پرسنل",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...personnelData }: any) =>
      apiRequest("PUT", `/api/personnel/${id}`, personnelData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "موفقیت",
        description: "پرسنل با موفقیت به‌روزرسانی شد",
      });
      setIsDialogOpen(false);
      setEditingPersonnel(null);
      reset();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی پرسنل",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/personnel/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "موفقیت",
        description: "پرسنل با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف پرسنل",
      });
    },
  });

  // Event handlers
  const onSubmit = (data: PersonnelFormData) => {
    if (editingPersonnel) {
      updateMutation.mutate({ id: editingPersonnel.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (person: any) => {
    setEditingPersonnel(person);
    setValue("firstName", person.firstName);
    setValue("lastName", person.lastName);
    setValue("nationalId", person.nationalId);
    setValue("employmentStatus", person.employmentStatus);
    setValue("productivityStatus", person.productivityStatus);
    setValue("driverStatus", person.driverStatus);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("آیا از حذف این پرسنل اطمینان دارید؟")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPersonnel(null);
    reset();
  };

  const isLoadingMutation =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  const getEmploymentStatusLabel = (status: string) => {
    return status === "official" ? "رسمی" : "طرحی";
  };

  const getProductivityStatusLabel = (status: string) => {
    return status === "productive" ? "بهره‌ور" : "غیر بهره‌ور";
  };

  const getDriverStatusLabel = (status: string) => {
    return status === "driver" ? "راننده" : "غیر راننده";
  };

  return (
    <AdminLayout title="مدیریت پرسنل">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>لیست پرسنل</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-personnel">
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن پرسنل جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingPersonnel ? "ویرایش پرسنل" : "افزودن پرسنل جدید"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="firstName">نام</Label>
                    <Input
                      id="firstName"
                      data-testid="input-personnel-firstName"
                      {...register("firstName")}
                      disabled={isLoadingMutation}
                    />
                    {errors.firstName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">نام خانوادگی</Label>
                    <Input
                      id="lastName"
                      data-testid="input-personnel-lastName"
                      {...register("lastName")}
                      disabled={isLoadingMutation}
                    />
                    {errors.lastName && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="nationalId">کد ملی</Label>
                    <Input
                      id="nationalId"
                      data-testid="input-personnel-nationalId"
                      {...register("nationalId")}
                      disabled={isLoadingMutation}
                      placeholder="مثال: ۰۰۱۲۳۴۵۶۷۸"
                    />
                    {errors.nationalId && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.nationalId.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="employmentStatus">وضعیت استخدام</Label>
                    <Select
                      value={watch("employmentStatus")}
                      onValueChange={(value) => setValue("employmentStatus", value)}
                    >
                      <SelectTrigger data-testid="select-personnel-employment">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="official">رسمی</SelectItem>
                        <SelectItem value="contractual">طرحی</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="productivityStatus">وضعیت بهره‌وری</Label>
                    <Select
                      value={watch("productivityStatus")}
                      onValueChange={(value) => setValue("productivityStatus", value)}
                    >
                      <SelectTrigger data-testid="select-personnel-productivity">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="productive">بهره‌ور</SelectItem>
                        <SelectItem value="non_productive">غیر بهره‌ور</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="driverStatus">وضعیت رانندگی</Label>
                    <Select
                      value={watch("driverStatus")}
                      onValueChange={(value) => setValue("driverStatus", value)}
                    >
                      <SelectTrigger data-testid="select-personnel-driver">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="driver">راننده</SelectItem>
                        <SelectItem value="non_driver">غیر راننده</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoadingMutation}
                      data-testid="button-save-personnel"
                    >
                      {isLoadingMutation ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseDialog}
                      data-testid="button-cancel-personnel"
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
                    <TableHead className="text-right">نام و نام خانوادگی</TableHead>
                    <TableHead className="text-right">کد ملی</TableHead>
                    <TableHead className="text-right">وضعیت استخدام</TableHead>
                    <TableHead className="text-right">وضعیت بهره‌وری</TableHead>
                    <TableHead className="text-right">وضعیت رانندگی</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personnel.map((person: any) => (
                    <TableRow key={person.id} data-testid={`row-personnel-${person.id}`}>
                      <TableCell className="font-medium">
                        {person.firstName} {person.lastName}
                      </TableCell>
                      <TableCell className="font-mono">
                        {person.nationalId}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={person.employmentStatus === "official" ? "default" : "secondary"}
                        >
                          {getEmploymentStatusLabel(person.employmentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={person.productivityStatus === "productive" ? "default" : "destructive"}
                        >
                          {getProductivityStatusLabel(person.productivityStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getDriverStatusLabel(person.driverStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(person)}
                            data-testid={`button-edit-personnel-${person.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(person.id)}
                            data-testid={`button-delete-personnel-${person.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
