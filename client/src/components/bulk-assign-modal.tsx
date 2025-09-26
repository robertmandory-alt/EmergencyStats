import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  User, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Circle,
  BarChart3,
  AlertCircle
} from "lucide-react";
import { 
  generateJalaliMonthDays, 
  formatJalaliDateLong, 
  parseJalaliDate, 
  JALALI_MONTHS,
  formatPersianNumber 
} from "@/lib/jalali-utils";
import { usePerformanceLogWorkflow } from "@/hooks/use-performance-logging";
import type { Personnel, WorkShift, PerformanceEntry, InsertPerformanceEntry } from "@shared/schema";

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  personnel: Personnel | null;
  year: number;
  month: number;
  workShifts: WorkShift[];
  onSave: (entries: InsertPerformanceEntry[]) => Promise<void>;
}

interface ShiftAssignment {
  id: string;
  shiftId: string;
  selectedDates: string[];
  shift?: WorkShift;
}

interface MonthlyStats {
  totalMissions: number;
  totalMeals: number;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  personnel,
  year,
  month,
  workShifts,
  onSave
}: BulkAssignModalProps) {
  const [shiftAssignments, setShiftAssignments] = useState<ShiftAssignment[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({ totalMissions: 0, totalMeals: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("shifts");

  const { 
    performanceLog, 
    entries,
    holidays
  } = usePerformanceLogWorkflow(year, month);

  // Generate calendar days for the month
  const calendarDays = useMemo(() => {
    const monthDays = generateJalaliMonthDays(year, month);
    const holidayMap = new Map(holidays.map(h => [h.date, h]));
    
    return monthDays.map(day => ({
      ...day,
      isOfficialHoliday: holidayMap.has(day.date),
      holidayTitle: holidayMap.get(day.date)?.title,
      isWeekend: day.weekday === 'جمعه'
    }));
  }, [year, month, holidays]);

  // Find existing entries for this personnel
  const existingEntries = useMemo(() => {
    if (!personnel) return [];
    return entries.filter(entry => entry.personnelId === personnel.id);
  }, [entries, personnel]);

  // Initialize form with existing data
  useEffect(() => {
    if (isOpen && personnel) {
      // Group existing shift entries by shift type
      const shiftGroups = new Map<string, string[]>();
      let missions = 0;
      let meals = 0;

      existingEntries.forEach(entry => {
        if (entry.shiftId && entry.date) {
          if (!shiftGroups.has(entry.shiftId)) {
            shiftGroups.set(entry.shiftId, []);
          }
          shiftGroups.get(entry.shiftId)!.push(entry.date);
        }
        
        if (entry.entryType === 'summary') {
          missions += entry.missions || 0;
          meals += entry.meals || 0;
        }
      });

      // Convert to assignments
      const assignments: ShiftAssignment[] = Array.from(shiftGroups.entries()).map(([shiftId, dates]) => ({
        id: Math.random().toString(36).substr(2, 9),
        shiftId,
        selectedDates: dates,
        shift: workShifts.find(s => s.id === shiftId)
      }));

      setShiftAssignments(assignments);
      setMonthlyStats({ totalMissions: missions, totalMeals: meals });
    } else {
      setShiftAssignments([]);
      setMonthlyStats({ totalMissions: 0, totalMeals: 0 });
    }
  }, [isOpen, personnel, existingEntries, workShifts]);

  const addShiftAssignment = () => {
    const newAssignment: ShiftAssignment = {
      id: Math.random().toString(36).substr(2, 9),
      shiftId: "",
      selectedDates: []
    };
    setShiftAssignments([...shiftAssignments, newAssignment]);
  };

  const removeShiftAssignment = (id: string) => {
    setShiftAssignments(shiftAssignments.filter(assignment => assignment.id !== id));
  };

  const updateShiftAssignment = (id: string, updates: Partial<ShiftAssignment>) => {
    setShiftAssignments(assignments => 
      assignments.map(assignment => 
        assignment.id === id 
          ? { 
              ...assignment, 
              ...updates,
              shift: updates.shiftId ? workShifts.find(s => s.id === updates.shiftId) : assignment.shift
            }
          : assignment
      )
    );
  };

  const toggleDate = (assignmentId: string, date: string) => {
    const assignment = shiftAssignments.find(a => a.id === assignmentId);
    if (!assignment) return;

    const newDates = assignment.selectedDates.includes(date)
      ? assignment.selectedDates.filter(d => d !== date)
      : [...assignment.selectedDates, date];

    updateShiftAssignment(assignmentId, { selectedDates: newDates });
  };

  const handleSave = async () => {
    if (!personnel) return;

    setIsLoading(true);
    try {
      const entries: InsertPerformanceEntry[] = [];

      // Add shift entries
      shiftAssignments.forEach(assignment => {
        if (assignment.shiftId && assignment.selectedDates.length > 0) {
          assignment.selectedDates.forEach(date => {
            const jalaliDate = parseJalaliDate(date);
            entries.push({
              logId: performanceLog?.id || "",
              userId: "",
              personnelId: personnel.id,
              shiftId: assignment.shiftId,
              date,
              year: jalaliDate.year,
              month: jalaliDate.month,
              day: jalaliDate.day,
              entryType: "batch",
              missions: 0,
              meals: 0,
              lastModifiedBy: ""
            });
          });
        }
      });

      // Add monthly summary entry
      if (monthlyStats.totalMissions > 0 || monthlyStats.totalMeals > 0) {
        entries.push({
          logId: performanceLog?.id || "",
          userId: "",
          personnelId: personnel.id,
          shiftId: null,
          date: null,
          year,
          month,
          day: null,
          entryType: "summary",
          missions: monthlyStats.totalMissions,
          meals: monthlyStats.totalMeals,
          lastModifiedBy: ""
        });
      }

      await onSave(entries);
      onClose();
    } catch (error) {
      console.error("Error saving bulk assignments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAssignedDays = shiftAssignments.reduce(
      (sum, assignment) => sum + assignment.selectedDates.length, 0
    );
    
    const totalWorkingHours = shiftAssignments.reduce((sum, assignment) => {
      const shift = assignment.shift;
      return sum + (shift ? shift.equivalentHours * assignment.selectedDates.length : 0);
    }, 0);

    return { totalAssignedDays, totalWorkingHours };
  }, [shiftAssignments]);

  const isFinalized = performanceLog?.status === 'finalized';

  if (!personnel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="bulk-assign-modal">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <User className="h-5 w-5" />
            ویرایش دسته‌جمعی - {personnel.firstName} {personnel.lastName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Personnel Info */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="font-medium" data-testid="personnel-name">
                    {personnel.firstName} {personnel.lastName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    کد ملی: {personnel.nationalId}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Badge variant={personnel.employmentStatus === 'official' ? 'default' : 'secondary'}>
                    {personnel.employmentStatus === 'official' ? 'رسمی' : 'طرحی'}
                  </Badge>
                  <Badge variant={personnel.productivityStatus === 'productive' ? 'default' : 'destructive'}>
                    {personnel.productivityStatus === 'productive' ? 'بهره‌ور' : 'غیر بهره‌ور'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period Info */}
          <div className="text-center text-sm text-muted-foreground">
            دوره: {JALALI_MONTHS[month - 1]} {formatPersianNumber(year)}
          </div>

          {/* Statistics Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-right text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                خلاصه آمار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-primary" data-testid="stat-assigned-days">
                    {formatPersianNumber(stats.totalAssignedDays)}
                  </div>
                  <div className="text-xs text-muted-foreground">روز شیفت</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600" data-testid="stat-working-hours">
                    {formatPersianNumber(stats.totalWorkingHours)}
                  </div>
                  <div className="text-xs text-muted-foreground">ساعت کار</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600" data-testid="stat-missions">
                    {formatPersianNumber(monthlyStats.totalMissions)}
                  </div>
                  <div className="text-xs text-muted-foreground">ماموریت</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-600" data-testid="stat-meals">
                    {formatPersianNumber(monthlyStats.totalMeals)}
                  </div>
                  <div className="text-xs text-muted-foreground">وعده غذا</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalized Warning */}
          {isFinalized && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <span>این لاگ نهایی شده و قابل ویرایش نیست</span>
              </div>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="shifts" data-testid="tab-shifts">
                ثبت شیفت‌ها
              </TabsTrigger>
              <TabsTrigger value="monthly" data-testid="tab-monthly">
                آمار ماهانه
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shifts" className="space-y-4">
              {/* Shift Assignments */}
              <div className="space-y-4">
                {shiftAssignments.map((assignment, index) => (
                  <ShiftAssignmentEditor
                    key={assignment.id}
                    assignment={assignment}
                    index={index}
                    calendarDays={calendarDays}
                    workShifts={workShifts}
                    onUpdate={(updates) => updateShiftAssignment(assignment.id, updates)}
                    onRemove={() => removeShiftAssignment(assignment.id)}
                    onToggleDate={(date) => toggleDate(assignment.id, date)}
                    disabled={isFinalized}
                  />
                ))}

                {!isFinalized && (
                  <Button
                    onClick={addShiftAssignment}
                    variant="outline"
                    className="w-full"
                    data-testid="button-add-shift-assignment"
                  >
                    <Plus className="ml-2 h-4 w-4" />
                    افزودن نوع شیفت جدید
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="monthly" className="space-y-4">
              {/* Monthly Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-right">آمار کلی ماه</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="total-missions" className="text-right">
                        تعداد کل ماموریت در ماه
                      </Label>
                      <Input
                        id="total-missions"
                        type="number"
                        min="0"
                        value={monthlyStats.totalMissions}
                        onChange={(e) => setMonthlyStats(prev => ({
                          ...prev,
                          totalMissions: parseInt(e.target.value) || 0
                        }))}
                        disabled={isFinalized}
                        data-testid="input-total-missions"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="total-meals" className="text-right">
                        تعداد کل وعده غذایی در ماه
                      </Label>
                      <Input
                        id="total-meals"
                        type="number"
                        min="0"
                        value={monthlyStats.totalMeals}
                        onChange={(e) => setMonthlyStats(prev => ({
                          ...prev,
                          totalMeals: parseInt(e.target.value) || 0
                        }))}
                        disabled={isFinalized}
                        data-testid="input-total-meals"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="flex gap-2 justify-start">
          <Button
            variant="outline"
            onClick={onClose}
            data-testid="button-cancel"
          >
            انصراف
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={isLoading || isFinalized}
            data-testid="button-save"
          >
            {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Shift Assignment Editor Component
interface ShiftAssignmentEditorProps {
  assignment: ShiftAssignment;
  index: number;
  calendarDays: any[];
  workShifts: WorkShift[];
  onUpdate: (updates: Partial<ShiftAssignment>) => void;
  onRemove: () => void;
  onToggleDate: (date: string) => void;
  disabled?: boolean;
}

function ShiftAssignmentEditor({
  assignment,
  index,
  calendarDays,
  workShifts,
  onUpdate,
  onRemove,
  onToggleDate,
  disabled = false
}: ShiftAssignmentEditorProps) {
  return (
    <Card data-testid={`shift-assignment-${index}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            data-testid={`button-remove-assignment-${index}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <CardTitle className="text-sm">
            نوع شیفت {formatPersianNumber(index + 1)}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shift Selection */}
        <div className="space-y-2">
          <Label className="text-right">انتخاب نوع شیفت:</Label>
          <Select
            value={assignment.shiftId}
            onValueChange={(value) => onUpdate({ shiftId: value })}
            disabled={disabled}
            data-testid={`select-shift-${index}`}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب شیفت..." />
            </SelectTrigger>
            <SelectContent>
              {workShifts.map((shift) => (
                <SelectItem key={shift.id} value={shift.id}>
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

        {/* Date Selection */}
        {assignment.shiftId && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="text-right">
                انتخاب روزها برای شیفت {assignment.shift?.title}:
              </Label>
              <div className="grid grid-cols-7 gap-1 text-xs">
                {calendarDays.map((day) => {
                  const isSelected = assignment.selectedDates.includes(day.date);
                  const isHoliday = day.isWeekend || day.isOfficialHoliday;
                  
                  return (
                    <Button
                      key={day.date}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className={`h-12 p-1 ${
                        isHoliday ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                      }`}
                      onClick={() => onToggleDate(day.date)}
                      disabled={disabled}
                      data-testid={`toggle-date-${index}-${day.day}`}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center mb-1">
                          {isSelected ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <Circle className="h-3 w-3" />
                          )}
                        </div>
                        <div>{formatPersianNumber(day.day)}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {assignment.selectedDates.length > 0 && (
                <div className="text-sm text-muted-foreground text-right">
                  {formatPersianNumber(assignment.selectedDates.length)} روز انتخاب شده
                  {assignment.shift && (
                    <span> - معادل {formatPersianNumber(assignment.shift.equivalentHours * assignment.selectedDates.length)} ساعت کاری</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}