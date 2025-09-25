import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { UserCheck, Edit, CheckCircle } from "lucide-react";

// Simplified form data that only includes productivity status
interface ProductivityUpdateData {
  productivityStatus: string;
}

export default function PersonnelInfo() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPersonnel, setEditingPersonnel] = useState<any>(null);
  const [productivityStatus, setProductivityStatus] = useState("");

  // Queries - fetch all personnel
  const { data: personnel = [], isLoading } = useQuery({
    queryKey: ["/api/personnel"],
  }) as { data: any[]; isLoading: boolean };

  // Mutation for updating productivity status only
  const updateProductivityMutation = useMutation({
    mutationFn: ({ id, productivityStatus }: { id: string; productivityStatus: string }) =>
      apiRequest("PATCH", `/api/personnel/${id}`, { 
        productivityStatus  // Only send productivity status field
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "موفقیت",
        description: "وضعیت بهره‌وری پرسنل با موفقیت به‌روزرسانی شد",
      });
      setIsDialogOpen(false);
      setEditingPersonnel(null);
      setProductivityStatus("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی وضعیت بهره‌وری",
      });
    },
  });

  // Event handlers
  const handleEditProductivity = (person: any) => {
    setEditingPersonnel(person);
    setProductivityStatus(person.productivityStatus);
    setIsDialogOpen(true);
  };

  const handleSaveProductivity = () => {
    if (editingPersonnel && productivityStatus) {
      updateProductivityMutation.mutate({
        id: editingPersonnel.id,
        productivityStatus,
      });
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPersonnel(null);
    setProductivityStatus("");
  };

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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <CardTitle>لیست پرسنل پایگاه</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">در حال بارگذاری اطلاعات پرسنل...</p>
              </div>
            ) : personnel.length === 0 ? (
              <div className="text-center py-8">
                <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">هیچ پرسنلی یافت نشد</p>
              </div>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditProductivity(person)}
                          data-testid={`button-edit-productivity-${person.id}`}
                          className="gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          ویرایش بهره‌وری
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Productivity Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>ویرایش وضعیت بهره‌وری</DialogTitle>
            </DialogHeader>

            {editingPersonnel && (
              <div className="space-y-4">
                {/* Read-only personnel info */}
                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">نام:</span>
                      <span className="mr-2 font-medium">
                        {editingPersonnel.firstName} {editingPersonnel.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">کد ملی:</span>
                      <span className="mr-2 font-mono">{editingPersonnel.nationalId}</span>
                    </div>
                  </div>
                </div>

                {/* Editable productivity status */}
                <div>
                  <Label htmlFor="productivityStatus">وضعیت بهره‌وری</Label>
                  <Select
                    value={productivityStatus}
                    onValueChange={setProductivityStatus}
                  >
                    <SelectTrigger data-testid="select-productivity-status">
                      <SelectValue placeholder="انتخاب وضعیت بهره‌وری" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="productive">بهره‌ور</SelectItem>
                      <SelectItem value="non_productive">غیر بهره‌ور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveProductivity}
                    disabled={updateProductivityMutation.isPending || !productivityStatus}
                    data-testid="button-save-productivity"
                    className="gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {updateProductivityMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                    data-testid="button-cancel-productivity"
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}