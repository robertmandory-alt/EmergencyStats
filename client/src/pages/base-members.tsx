import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserLayout } from "@/components/layout/user-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import type { Personnel } from "@shared/schema";
import {
  UserPlus,
  Plus,
  Trash2,
  Users,
  UserCheck,
  CheckCircle,
  XCircle,
  Car,
  Loader2,
} from "lucide-react";

export default function BaseMembers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPersonnelId, setSelectedPersonnelId] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Personnel[]>([]);
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null);

  // Queries
  const { data: personnel = [], isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["/api/personnel"],
  }) as { data: Personnel[]; isLoading: boolean };

  // Get available personnel (not already in selected members)
  const availablePersonnel = personnel.filter(
    person => !selectedMembers.find(member => member.id === person.id)
  );

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (personnelId: string) => {
      // Note: This is a placeholder implementation
      // In a full implementation, this would save the member to the database
      console.log('Adding base member:', personnelId);
      return Promise.resolve({ personnelId });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "عضو جدید با موفقیت به پایگاه اضافه شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در افزودن عضو به پایگاه",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (personnelId: string) => {
      // Note: This is a placeholder implementation
      // In a full implementation, this would remove the member from the database
      console.log('Removing base member:', personnelId);
      return Promise.resolve({ personnelId });
    },
    onSuccess: () => {
      toast({
        title: "موفقیت",
        description: "عضو با موفقیت از پایگاه حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف عضو از پایگاه",
      });
    },
  });

  // Event handlers
  const handleAddMember = () => {
    if (!selectedPersonnelId) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفاً یک پرسنل را انتخاب کنید",
      });
      return;
    }

    const selectedPerson = personnel.find(p => p.id === selectedPersonnelId);
    if (selectedPerson) {
      setSelectedMembers(prev => [...prev, selectedPerson]);
      addMemberMutation.mutate(selectedPersonnelId);
      setSelectedPersonnelId(""); // Reset selection
    }
  };

  const handleRemoveMember = (personnelId: string) => {
    setSelectedMembers(prev => prev.filter(member => member.id !== personnelId));
    removeMemberMutation.mutate(personnelId);
    setRemoveConfirmId(null);
  };

  const isLoading = isLoadingPersonnel;

  if (isLoading) {
    return (
      <UserLayout title="ثبت اعضای پایگاه">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout title="ثبت اعضای پایگاه">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3">
          <UserPlus className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">ثبت اعضای پایگاه</h1>
            <p className="text-muted-foreground">
              انتخاب و مدیریت اعضای ثابت و اصلی پایگاه
            </p>
          </div>
        </div>

        {/* Add Member Section */}
        <Card>
          <CardHeader>
            <CardTitle>افزودن عضو جدید</CardTitle>
            <CardDescription>
              یک پرسنل را از لیست انتخاب کرده و به اعضای پایگاه اضافه کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">انتخاب پرسنل</label>
                <Select
                  value={selectedPersonnelId}
                  onValueChange={setSelectedPersonnelId}
                  disabled={availablePersonnel.length === 0}
                >
                  <SelectTrigger data-testid="select-personnel">
                    <SelectValue placeholder={
                      availablePersonnel.length === 0 
                        ? "همه پرسنل قبلاً اضافه شده‌اند" 
                        : "پرسنل را انتخاب کنید"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePersonnel.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{person.firstName} {person.lastName}</span>
                          <span className="text-muted-foreground text-sm mr-2">
                            ({person.nationalId})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAddMember}
                disabled={!selectedPersonnelId || addMemberMutation.isPending}
                className="gap-2"
                data-testid="button-add-member"
              >
                {addMemberMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                افزودن
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Current Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle>اعضای فعلی پایگاه</CardTitle>
                  <CardDescription>
                    {selectedMembers.length} نفر در پایگاه ثبت شده‌اند
                  </CardDescription>
                </div>
              </div>
              {selectedMembers.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <UserCheck className="h-3 w-3" />
                  {selectedMembers.length} عضو
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedMembers.length > 0 ? (
              <div className="space-y-4">
                {selectedMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-background"
                    data-testid={`member-card-${member.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div>
                          <h4 className="font-medium">
                            {member.firstName} {member.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {member.nationalId}
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          <Badge 
                            variant={member.employmentStatus === "official" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {member.employmentStatus === "official" ? "رسمی" : "طرحی"}
                          </Badge>
                          <Badge 
                            variant={member.productivityStatus === "productive" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {member.productivityStatus === "productive" ? (
                              <><CheckCircle className="h-3 w-3 mr-1" />بهره‌ور</>
                            ) : (
                              <><XCircle className="h-3 w-3 mr-1" />غیر بهره‌ور</>
                            )}
                          </Badge>
                          {member.driverStatus === "driver" && (
                            <Badge variant="outline" className="text-xs gap-1">
                              <Car className="h-3 w-3" />
                              راننده
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRemoveConfirmId(member.id)}
                      className="gap-2 text-destructive hover:text-destructive"
                      data-testid={`button-remove-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                      حذف
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  هیچ عضوی در پایگاه ثبت نشده
                </h3>
                <p className="text-sm text-muted-foreground">
                  {personnel.length === 0 
                    ? "ابتدا باید پرسنل توسط مدیر سیستم تعریف شود"
                    : "از بالا یک پرسنل انتخاب کرده و به پایگاه اضافه کنید"
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        {selectedMembers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>خلاصه آماری اعضای پایگاه</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedMembers.filter(m => m.productivityStatus === "productive").length}
                  </div>
                  <div className="text-sm text-muted-foreground">اعضای بهره‌ور</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedMembers.filter(m => m.employmentStatus === "official").length}
                  </div>
                  <div className="text-sm text-muted-foreground">پرسنل رسمی</div>
                </div>
                
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedMembers.filter(m => m.driverStatus === "driver").length}
                  </div>
                  <div className="text-sm text-muted-foreground">راننده‌ها</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Remove Confirmation Dialog */}
        <AlertDialog 
          open={removeConfirmId !== null} 
          onOpenChange={(open) => !open && setRemoveConfirmId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأیید حذف عضو</AlertDialogTitle>
              <AlertDialogDescription>
                آیا مطمئن هستید که می‌خواهید این عضو را از پایگاه حذف کنید؟
                این عمل قابل برگشت نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-remove">
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => removeConfirmId && handleRemoveMember(removeConfirmId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-remove"
              >
                تأیید حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </UserLayout>
  );
}