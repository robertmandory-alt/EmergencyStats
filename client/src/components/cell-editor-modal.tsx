import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Clock, Trash2 } from "lucide-react";
import { formatJalaliDateLong, parseJalaliDate, JALALI_WEEKDAYS } from "@/lib/jalali-utils";
import { usePerformanceLogWorkflow } from "@/hooks/use-performance-logging";
import type { Personnel, WorkShift, PerformanceEntry } from "@shared/schema";

interface CellEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: Personnel | null;
  date: string; // Jalali date (YYYY-MM-DD)
  year: number;
  month: number;
  workShifts: WorkShift[];
  onSave: (personnelId: string, date: string, shiftId: string | null) => Promise<void>;
}

export function CellEditorModal({
  isOpen,
  onClose,
  personnel,
  date,
  year,
  month,
  workShifts,
  onSave
}: CellEditorModalProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const { 
    performanceLog, 
    entries,
    saveDraftEntries
  } = usePerformanceLogWorkflow(year, month);

  // Find existing entry for this personnel and date
  const existingEntry = entries.find(
    entry => entry.personnelId === personnel?.id && entry.date === date
  );

  // Reset form when modal opens/closes or personnel changes
  useEffect(() => {
    if (isOpen && personnel) {
      setSelectedShiftId(existingEntry?.shiftId || "");
    } else {
      setSelectedShiftId("");
    }
  }, [isOpen, personnel, existingEntry]);

  const handleSave = async () => {
    if (!personnel) return;

    setIsLoading(true);
    try {
      await onSave(personnel.id, date, selectedShiftId || null);
      onClose();
    } catch (error) {
      console.error("Error saving shift assignment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!personnel) return;

    setIsLoading(true);
    try {
      await onSave(personnel.id, date, null);
      onClose();
    } catch (error) {
      console.error("Error removing shift assignment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse date for display
  const jalaliDate = parseJalaliDate(date);
  const selectedShift = workShifts.find(shift => shift.id === selectedShiftId);

  const isFinalized = performanceLog?.status === 'finalized';

  if (!personnel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="cell-editor-modal">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            ویرایش شیفت
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personnel Info */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 text-right">
              <User className="h-4 w-4" />
              <span className="font-medium">پرسنل:</span>
            </div>
            <div className="mt-1" data-testid="personnel-name">
              {personnel.firstName} {personnel.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              کد ملی: {personnel.nationalId}
            </div>
            <div className="flex gap-1 mt-2">
              <Badge variant={personnel.employmentStatus === 'official' ? 'default' : 'secondary'}>
                {personnel.employmentStatus === 'official' ? 'رسمی' : 'طرحی'}
              </Badge>
              <Badge variant={personnel.productivityStatus === 'productive' ? 'default' : 'destructive'}>
                {personnel.productivityStatus === 'productive' ? 'بهره‌ور' : 'غیر بهره‌ور'}
              </Badge>
            </div>
          </div>

          {/* Date Info */}
          <div className="bg-muted p-3 rounded-md">
            <div className="flex items-center gap-2 text-right">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">تاریخ:</span>
            </div>
            <div className="mt-1" data-testid="selected-date">
              {formatJalaliDateLong(jalaliDate, true)}
            </div>
          </div>

          {/* Current Assignment (if exists) */}
          {existingEntry && existingEntry.shiftId && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-right text-blue-800 dark:text-blue-200">
                <Clock className="h-4 w-4" />
                <span className="font-medium">شیفت فعلی:</span>
              </div>
              <div className="mt-1">
                {workShifts.find(s => s.id === existingEntry.shiftId)?.title || 'شیفت نامشخص'}
              </div>
            </div>
          )}

          {/* Shift Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-right block">
              انتخاب شیفت
            </label>
            <Select
              value={selectedShiftId}
              onValueChange={setSelectedShiftId}
              disabled={isFinalized}
              data-testid="select-shift"
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="انتخاب شیفت..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="" data-testid="shift-option-none">
                  بدون شیفت
                </SelectItem>
                {workShifts.map((shift) => (
                  <SelectItem 
                    key={shift.id} 
                    value={shift.id}
                    data-testid={`shift-option-${shift.id}`}
                  >
                    <div className="text-right">
                      <div className="font-medium">{shift.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {shift.equivalentHours} ساعت - کد: {shift.shiftCode}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Shift Preview */}
          {selectedShift && (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md border border-green-200 dark:border-green-800">
              <div className="text-green-800 dark:text-green-200 font-medium">
                شیفت انتخاب شده: {selectedShift.title}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                معادل {selectedShift.equivalentHours} ساعت کاری
              </div>
              <div className="text-xs text-green-600 dark:text-green-400">
                کد شیفت: {selectedShift.shiftCode}
              </div>
            </div>
          )}

          {/* Finalized Warning */}
          {isFinalized && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="text-yellow-800 dark:text-yellow-200 text-sm">
                ⚠️ این لاگ نهایی شده و قابل ویرایش نیست
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            انصراف
          </Button>
          
          {existingEntry && existingEntry.shiftId && !isFinalized && (
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isLoading}
              data-testid="button-remove"
            >
              <Trash2 className="ml-2 h-4 w-4" />
              حذف شیفت
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={isLoading || isFinalized || selectedShiftId === (existingEntry?.shiftId || "")}
            data-testid="button-save"
          >
            {isLoading ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Quick shift assignment component for common operations
interface QuickShiftAssignProps {
  personnel: Personnel[];
  date: string;
  workShifts: WorkShift[];
  onAssignShift: (personnelIds: string[], date: string, shiftId: string) => Promise<void>;
}

export function QuickShiftAssign({
  personnel,
  date,
  workShifts,
  onAssignShift
}: QuickShiftAssignProps) {
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (selectedPersonnel.length === 0 || !selectedShiftId) return;

    setIsLoading(true);
    try {
      await onAssignShift(selectedPersonnel, date, selectedShiftId);
      setSelectedPersonnel([]);
      setSelectedShiftId("");
    } catch (error) {
      console.error("Error in quick shift assignment:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const jalaliDate = parseJalaliDate(date);

  return (
    <div className="bg-muted p-4 rounded-md space-y-4" data-testid="quick-shift-assign">
      <div className="text-sm font-medium text-right">
        تخصیص سریع شیفت برای {formatJalaliDateLong(jalaliDate)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personnel Multi-Select */}
        <div className="space-y-2">
          <label className="text-sm text-right block">انتخاب پرسنل:</label>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {personnel.map((person) => (
              <label key={person.id} className="flex items-center gap-2 text-right cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPersonnel.includes(person.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPersonnel([...selectedPersonnel, person.id]);
                    } else {
                      setSelectedPersonnel(selectedPersonnel.filter(id => id !== person.id));
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{person.firstName} {person.lastName}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Shift Selection */}
        <div className="space-y-2">
          <label className="text-sm text-right block">انتخاب شیفت:</label>
          <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
            <SelectTrigger>
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
      </div>

      <Button
        onClick={handleAssign}
        disabled={selectedPersonnel.length === 0 || !selectedShiftId || isLoading}
        className="w-full"
        data-testid="button-quick-assign"
      >
        {isLoading ? "در حال تخصیص..." : `تخصیص به ${selectedPersonnel.length} نفر`}
      </Button>
    </div>
  );
}