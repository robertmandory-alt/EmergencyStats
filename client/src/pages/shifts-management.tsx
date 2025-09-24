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
import { insertWorkShiftSchema, insertBaseSchema } from "@shared/schema";
import { Plus, Edit, Trash2, Clock, Building } from "lucide-react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPersianNumber } from "@/lib/jalali-utils";

type WorkShiftFormData = z.infer<typeof insertWorkShiftSchema>;
type BaseFormData = z.infer<typeof insertBaseSchema>;

export default function ShiftsManagement() {
  const { toast } = useToast();
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [baseDialogOpen, setBaseDialogOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<any>(null);
  const [editingBase, setEditingBase] = useState<any>(null);

  // Shift form
  const {
    register: registerShift,
    handleSubmit: handleSubmitShift,
    reset: resetShift,
    setValue: setValueShift,
    formState: { errors: errorsShift },
  } = useForm<WorkShiftFormData>({
    resolver: zodResolver(insertWorkShiftSchema),
  });

  // Base form
  const {
    register: registerBase,
    handleSubmit: handleSubmitBase,
    reset: resetBase,
    setValue: setValueBase,
    watch: watchBase,
    formState: { errors: errorsBase },
  } = useForm<BaseFormData>({
    resolver: zodResolver(insertBaseSchema),
    defaultValues: {
      type: "urban",
    },
  });

  // Queries
  const { data: workShifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ["/api/work-shifts"],
  });

  const { data: bases = [], isLoading: isLoadingBases } = useQuery({
    queryKey: ["/api/bases"],
  });

  // Work Shift Mutations
  const createShiftMutation = useMutation({
    mutationFn: (shiftData: WorkShiftFormData) =>
      apiRequest("POST", "/api/work-shifts", shiftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-shifts"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت ایجاد شد",
      });
      setShiftDialogOpen(false);
      resetShift();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد شیفت",
      });
    },
  });

  const updateShiftMutation = useMutation({
    mutationFn: ({ id, ...shiftData }: any) =>
      apiRequest("PUT", `/api/work-shifts/${id}`, shiftData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-shifts"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت به‌روزرسانی شد",
      });
      setShiftDialogOpen(false);
      setEditingShift(null);
      resetShift();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی شیفت",
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/work-shifts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-shifts"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف شیفت",
      });
    },
  });

  // Base Mutations
  const createBaseMutation = useMutation({
    mutationFn: (baseData: BaseFormData) =>
      apiRequest("POST", "/api/bases", baseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bases"] });
      toast({
        title: "موفقیت",
        description: "پایگاه با موفقیت ایجاد شد",
      });
      setBaseDialogOpen(false);
      resetBase();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ایجاد پایگاه",
      });
    },
  });

  const updateBaseMutation = useMutation({
    mutationFn: ({ id, ...baseData }: any) =>
      apiRequest("PUT", `/api/bases/${id}`, baseData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bases"] });
      toast({
        title: "موفقیت",
        description: "پایگاه با موفقیت به‌روزرسانی شد",
      });
      setBaseDialogOpen(false);
      setEditingBase(null);
      resetBase();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی پایگاه",
      });
    },
  });

  const deleteBaseMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/bases/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bases"] });
      toast({
        title: "موفقیت",
        description: "پایگاه با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف پایگاه",
      });
    },
  });

  // Event handlers
  const onSubmitShift = (data: WorkShiftFormData) => {
    if (editingShift) {
      updateShiftMutation.mutate({ id: editingShift.id, ...data });
    } else {
      createShiftMutation.mutate(data);
    }
  };

  const onSubmitBase = (data: BaseFormData) => {
    if (editingBase) {
      updateBaseMutation.mutate({ id: editingBase.id, ...data });
    } else {
      createBaseMutation.mutate(data);
    }
  };

  const handleEditShift = (shift: any) => {
    setEditingShift(shift);
    setValueShift("title", shift.title);
    setValueShift("equivalentHours", shift.equivalentHours);
    setValueShift("shiftCode", shift.shiftCode);
    setShiftDialogOpen(true);
  };

  const handleEditBase = (base: any) => {
    setEditingBase(base);
    setValueBase("name", base.name);
    setValueBase("number", base.number);
    setValueBase("type", base.type);
    setBaseDialogOpen(true);
  };

  const handleDeleteShift = (id: string) => {
    if (confirm("آیا از حذف این شیفت اطمینان دارید؟")) {
      deleteShiftMutation.mutate(id);
    }
  };

  const handleDeleteBase = (id: string) => {
    if (confirm("آیا از حذف این پایگاه اطمینان دارید؟")) {
      deleteBaseMutation.mutate(id);
    }
  };

  const handleCloseShiftDialog = () => {
    setShiftDialogOpen(false);
    setEditingShift(null);
    resetShift();
  };

  const handleCloseBaseDialog = () => {
    setBaseDialogOpen(false);
    setEditingBase(null);
    resetBase();
  };

  const isLoadingShiftMutation =
    createShiftMutation.isPending ||
    updateShiftMutation.isPending ||
    deleteShiftMutation.isPending;

  const isLoadingBaseMutation =
    createBaseMutation.isPending ||
    updateBaseMutation.isPending ||
    deleteBaseMutation.isPending;

  return (
    <AdminLayout title="مدیریت شیفت‌ها و پایگاه‌ها">
      <div className="space-y-6">
        {/* Work Shifts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              مدیریت شیفت‌های کاری
            </CardTitle>
            <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-shift">
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن شیفت جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingShift ? "ویرایش شیفت" : "افزودن شیفت جدید"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmitShift(onSubmitShift)} className="space-y-4">
                  <div>
                    <Label htmlFor="title">عنوان شیفت</Label>
                    <Input
                      id="title"
                      data-testid="input-shift-title"
                      {...registerShift("title")}
                      disabled={isLoadingShiftMutation}
                      placeholder="مثال: ۲۴ ساعته"
                    />
                    {errorsShift.title && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsShift.title.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="equivalentHours">ساعات معادل</Label>
                    <Input
                      id="equivalentHours"
                      type="number"
                      data-testid="input-shift-hours"
                      {...registerShift("equivalentHours", { valueAsNumber: true })}
                      disabled={isLoadingShiftMutation}
                      placeholder="مثال: ۲۴"
                    />
                    {errorsShift.equivalentHours && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsShift.equivalentHours.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="shiftCode">کد شیفت</Label>
                    <Input
                      id="shiftCode"
                      data-testid="input-shift-code"
                      {...registerShift("shiftCode")}
                      disabled={isLoadingShiftMutation}
                      placeholder="مثال: ۲۷۳"
                    />
                    {errorsShift.shiftCode && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsShift.shiftCode.message}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoadingShiftMutation}
                      data-testid="button-save-shift"
                    >
                      {isLoadingShiftMutation ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseShiftDialog}
                      data-testid="button-cancel-shift"
                    >
                      انصراف
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingShifts ? (
              <div className="text-center py-4">در حال بارگذاری...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">عنوان شیفت</TableHead>
                    <TableHead className="text-right">ساعات معادل</TableHead>
                    <TableHead className="text-right">کد شیفت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workShifts.map((shift: any) => (
                    <TableRow key={shift.id} data-testid={`row-shift-${shift.id}`}>
                      <TableCell className="font-medium">{shift.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatPersianNumber(shift.equivalentHours)} ساعت
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{shift.shiftCode}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditShift(shift)}
                            data-testid={`button-edit-shift-${shift.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteShift(shift.id)}
                            data-testid={`button-delete-shift-${shift.id}`}
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

        {/* Bases Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              مدیریت پایگاه‌ها
            </CardTitle>
            <Dialog open={baseDialogOpen} onOpenChange={setBaseDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-base">
                  <Plus className="h-4 w-4 ml-2" />
                  افزودن پایگاه جدید
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingBase ? "ویرایش پایگاه" : "افزودن پایگاه جدید"}
                  </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmitBase(onSubmitBase)} className="space-y-4">
                  <div>
                    <Label htmlFor="name">نام پایگاه</Label>
                    <Input
                      id="name"
                      data-testid="input-base-name"
                      {...registerBase("name")}
                      disabled={isLoadingBaseMutation}
                      placeholder="مثال: پایگاه ۱۰۱"
                    />
                    {errorsBase.name && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsBase.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="number">شماره پایگاه</Label>
                    <Input
                      id="number"
                      data-testid="input-base-number"
                      {...registerBase("number")}
                      disabled={isLoadingBaseMutation}
                      placeholder="مثال: ۱۰۱"
                    />
                    {errorsBase.number && (
                      <p className="text-sm text-destructive mt-1">
                        {errorsBase.number.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="type">نوع پایگاه</Label>
                    <Select
                      value={watchBase("type")}
                      onValueChange={(value) => setValueBase("type", value)}
                    >
                      <SelectTrigger data-testid="select-base-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="urban">شهری</SelectItem>
                        <SelectItem value="road">جاده‌ای</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={isLoadingBaseMutation}
                      data-testid="button-save-base"
                    >
                      {isLoadingBaseMutation ? "در حال ذخیره..." : "ذخیره"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseBaseDialog}
                      data-testid="button-cancel-base"
                    >
                      انصراف
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingBases ? (
              <div className="text-center py-4">در حال بارگذاری...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">نام پایگاه</TableHead>
                    <TableHead className="text-right">شماره</TableHead>
                    <TableHead className="text-right">نوع</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bases.map((base: any) => (
                    <TableRow key={base.id} data-testid={`row-base-${base.id}`}>
                      <TableCell className="font-medium">{base.name}</TableCell>
                      <TableCell className="font-mono">{base.number}</TableCell>
                      <TableCell>
                        <Badge
                          variant={base.type === "urban" ? "default" : "secondary"}
                        >
                          {base.type === "urban" ? "شهری" : "جاده‌ای"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditBase(base)}
                            data-testid={`button-edit-base-${base.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteBase(base.id)}
                            data-testid={`button-delete-base-${base.id}`}
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
