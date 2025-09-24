import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { parseJalaliDate } from "@/lib/jalali-utils";

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnelName: string;
  date: string;
  personnelId: string;
  currentAssignment?: any;
  bases: any[];
  workShifts: any[];
}

export function ShiftModal({
  isOpen,
  onClose,
  personnelName,
  date,
  personnelId,
  currentAssignment,
  bases,
  workShifts,
}: ShiftModalProps) {
  const [selectedShiftId, setSelectedShiftId] = useState(
    currentAssignment?.shiftId || ""
  );
  const [selectedBaseId, setSelectedBaseId] = useState(
    currentAssignment?.baseId || ""
  );
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/performance-assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-assignments"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت تخصیص داده شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در تخصیص شیفت",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/performance-assignments/${currentAssignment.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-assignments"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت به‌روزرسانی شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی شیفت",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", "/api/performance-assignments/by-date", {
        personnelId,
        date,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-assignments"] });
      toast({
        title: "موفقیت",
        description: "شیفت با موفقیت حذف شد",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در حذف شیفت",
      });
    },
  });

  const handleSave = () => {
    if (!selectedShiftId || !selectedBaseId) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفاً شیفت و پایگاه را انتخاب کنید",
      });
      return;
    }

    const parsedDate = parseJalaliDate(date);
    const assignmentData = {
      personnelId,
      shiftId: selectedShiftId,
      baseId: selectedBaseId,
      date,
      year: parsedDate.year,
      month: parsedDate.month,
      day: parsedDate.day,
    };

    if (currentAssignment) {
      updateMutation.mutate(assignmentData);
    } else {
      createMutation.mutate(assignmentData);
    }
  };

  const handleDelete = () => {
    if (currentAssignment) {
      deleteMutation.mutate();
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" data-testid="modal-shift">
        <DialogHeader>
          <DialogTitle>تخصیص/ویرایش شیفت</DialogTitle>
          <p className="text-sm text-muted-foreground">
            برای: <span data-testid="text-selected-personnel">{personnelName}</span> - 
            تاریخ: <span data-testid="text-selected-date">{date}</span>
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="shift">نوع شیفت</Label>
            <Select
              value={selectedShiftId}
              onValueChange={setSelectedShiftId}
              disabled={isLoading}
            >
              <SelectTrigger data-testid="select-shift">
                <SelectValue placeholder="انتخاب شیفت..." />
              </SelectTrigger>
              <SelectContent>
                {workShifts.map((shift) => (
                  <SelectItem key={shift.id} value={shift.id}>
                    {shift.title} ({shift.equivalentHours} ساعت)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="base">پایگاه</Label>
            <Select
              value={selectedBaseId}
              onValueChange={setSelectedBaseId}
              disabled={isLoading}
            >
              <SelectTrigger data-testid="select-base-assignment">
                <SelectValue placeholder="انتخاب پایگاه..." />
              </SelectTrigger>
              <SelectContent>
                {bases.map((base) => (
                  <SelectItem key={base.id} value={base.id}>
                    {base.name} - {base.type === 'urban' ? 'شهری' : 'جاده‌ای'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
              data-testid="button-save-shift"
            >
              {isLoading ? "در حال ذخیره..." : "ذخیره"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              data-testid="button-cancel-shift"
            >
              انصراف
            </Button>
            {currentAssignment && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isLoading}
                data-testid="button-delete-shift"
              >
                حذف
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
