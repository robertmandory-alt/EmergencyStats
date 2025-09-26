import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { 
  getCurrentJalaliDate,
  getJalaliMonthDays,
  JALALI_MONTHS,
  JALALI_WEEKDAYS_SHORT
} from "@/lib/jalali-utils";
import type { 
  PerformanceEntry, 
  WorkShift, 
  Personnel,
  InsertPerformanceEntry
} from "@shared/schema";
import { 
  FileText, 
  Calendar, 
  Send, 
  Plus, 
  Edit, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock
} from "lucide-react";


export default function PerformanceLog() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const currentDate = getCurrentJalaliDate();
  const [selectedYear, setSelectedYear] = useState(currentDate.year);
  const [selectedMonth, setSelectedMonth] = useState(currentDate.month);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state for modal
  const [selectedPersonnel, setSelectedPersonnel] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [missions, setMissions] = useState("");
  const [meals, setMeals] = useState("");
  const [editingEntry, setEditingEntry] = useState<PerformanceEntry | null>(null);

  // Queries - fetch base members instead of all personnel
  const { data: personnel = [], isLoading: isLoadingPersonnel } = useQuery({
    queryKey: ["/api/base-members"],
  }) as { data: Personnel[]; isLoading: boolean };

  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery({
    queryKey: ["/api/work-shifts"],
  }) as { data: WorkShift[]; isLoading: boolean };

  const { data: performanceEntries = [], isLoading: isLoadingEntries, refetch: refetchEntries } = useQuery({
    queryKey: ["/api/performance-entries", user?.id, selectedYear, selectedMonth],
    enabled: !!user?.id,
    queryFn: async () => {
      const response = await fetch(`/api/performance-entries?userId=${user?.id}&year=${selectedYear}&month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error('Failed to fetch performance entries');
      }
      return response.json();
    },
  }) as { data: PerformanceEntry[]; isLoading: boolean; refetch: () => void };

  // Create performance entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: Partial<InsertPerformanceEntry>) => {
      const response = await apiRequest('POST', '/api/performance-entries', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-entries', user?.id, selectedYear, selectedMonth] });
      toast({
        title: "موفقیت",
        description: "ورودی عملکرد با موفقیت ثبت شد",
      });
      closeModal();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در ثبت ورودی عملکرد",
      });
    },
  });

  // Update performance entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<InsertPerformanceEntry> }) => {
      const response = await apiRequest('PUT', `/api/performance-entries/${data.id}`, data.updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-entries', user?.id, selectedYear, selectedMonth] });
      toast({
        title: "موفقیت",
        description: "ورودی عملکرد با موفقیت به‌روزرسانی شد",
      });
      closeModal();
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در به‌روزرسانی ورودی عملکرد",
      });
    },
  });

  // Finalize entries mutation
  const finalizeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/performance-entries/finalize', {
        userId: user?.id,
        year: selectedYear,
        month: selectedMonth,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/performance-entries', user?.id, selectedYear, selectedMonth] });
      toast({
        title: "موفقیت",
        description: "عملکرد ماهانه با موفقیت نهایی و ارسال شد",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "خطا",
        description: error.message || "خطا در نهایی کردن عملکرد",
      });
    },
  });

  // Get entries for a specific day
  const getEntriesForDay = (day: number) => {
    return performanceEntries.filter(entry => entry.day === day);
  };

  // Check if month is finalized
  const isMonthFinalized = useMemo(() => {
    return performanceEntries.length > 0 && performanceEntries.every(entry => entry.isFinalized);
  }, [performanceEntries]);

  // Generate calendar grid
  const monthDays = getJalaliMonthDays(selectedYear, selectedMonth);
  const calendarDays = Array.from({ length: monthDays }, (_, i) => i + 1);

  const openModal = (day: number) => {
    if (isMonthFinalized) return; // Don't open modal if month is finalized
    
    setSelectedDay(day);
    setIsModalOpen(true);
    
    // Reset form
    setSelectedPersonnel("");
    setSelectedShift("");
    setMissions("");
    setMeals("");
    setEditingEntry(null);
  };

  const openEditModal = (entry: PerformanceEntry) => {
    if (entry.isFinalized) return; // Don't allow editing finalized entries
    
    setSelectedDay(entry.day);
    setEditingEntry(entry);
    setSelectedPersonnel(entry.personnelId);
    setSelectedShift(entry.shiftId || "");
    setMissions(entry.missions.toString());
    setMeals(entry.meals.toString());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDay(null);
    setEditingEntry(null);
    setSelectedPersonnel("");
    setSelectedShift("");
    setMissions("");
    setMeals("");
  };

  const handleSaveEntry = () => {
    if (!selectedPersonnel || !selectedShift || !missions || !meals || !selectedDay) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "لطفاً همه فیلدها را پر کنید",
      });
      return;
    }

    const formattedDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-${selectedDay.toString().padStart(2, '0')}`;
    
    const entryData = {
      userId: user?.id,
      personnelId: selectedPersonnel,
      shiftId: selectedShift,
      date: formattedDate,
      year: selectedYear,
      month: selectedMonth,
      day: selectedDay,
      missions: parseInt(missions),
      meals: parseInt(meals),
    };

    if (editingEntry) {
      updateEntryMutation.mutate({
        id: editingEntry.id!,
        updates: entryData,
      });
    } else {
      createEntryMutation.mutate(entryData);
    }
  };

  const handleFinalizeMonth = () => {
    if (performanceEntries.length === 0) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "برای نهایی کردن، حداقل یک ورودی عملکرد لازم است",
      });
      return;
    }

    finalizeMutation.mutate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    }
  };

  if (isLoadingEntries || isLoadingPersonnel || isLoadingShifts) {
    return (
      <AdminLayout title="ثبت عملکرد">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ثبت عملکرد">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">ثبت عملکرد</h1>
              <p className="text-muted-foreground">ثبت ماموریت‌ها و وعده‌های غذایی ماهانه</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMonthFinalized && (
              <Badge variant="secondary" className="gap-1">
                <Lock className="h-3 w-3" />
                نهایی شده
              </Badge>
            )}
            {!isMonthFinalized && performanceEntries.length > 0 && (
              <Badge variant="outline" className="gap-1">
                <Unlock className="h-3 w-3" />
                در حال ویرایش
              </Badge>
            )}
          </div>
        </div>

        {/* Month Navigation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('prev')}
                data-testid="button-prev-month"
              >
                <ChevronRight className="h-4 w-4" />
                ماه قبل
              </Button>
              
              <div className="text-center">
                <CardTitle className="text-xl">
                  {JALALI_MONTHS[selectedMonth - 1]} {selectedYear}
                </CardTitle>
                <CardDescription>
                  {performanceEntries.length} ورودی ثبت شده
                </CardDescription>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateMonth('next')}
                data-testid="button-next-month"
              >
                ماه بعد
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Calendar Grid */}
        <Card>
          <CardHeader>
            <CardTitle>تقویم عملکرد ماهانه</CardTitle>
            <CardDescription>
              روی هر روز کلیک کنید تا اطلاعات عملکرد را وارد کنید
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {JALALI_WEEKDAYS_SHORT.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day) => {
                const dayEntries = getEntriesForDay(day);
                const hasEntries = dayEntries.length > 0;
                const isFinalized = hasEntries && dayEntries.every(entry => entry.isFinalized);
                
                return (
                  <div
                    key={day}
                    className={`
                      min-h-[60px] p-2 border rounded cursor-pointer transition-colors
                      ${hasEntries 
                        ? isFinalized 
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        : 'bg-background border-border hover:bg-muted/50'
                      }
                      ${isMonthFinalized ? 'cursor-not-allowed opacity-75' : 'hover:bg-muted/75'}
                    `}
                    onClick={() => openModal(day)}
                    data-testid={`day-${day}`}
                  >
                    <div className="text-sm font-medium mb-1">{day}</div>
                    {hasEntries && (
                      <div className="space-y-1">
                        {dayEntries.slice(0, 2).map((entry, index) => (
                          <div
                            key={entry.id}
                            className="text-xs p-1 rounded bg-primary/10 truncate cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(entry);
                            }}
                            data-testid={`entry-${entry.id}`}
                          >
                            م: {entry.missions} و: {entry.meals}
                          </div>
                        ))}
                        {dayEntries.length > 2 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayEntries.length - 2} مورد دیگر
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Finalize Button */}
        {!isMonthFinalized && performanceEntries.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">نهایی کردن عملکرد ماهانه</h3>
                  <p className="text-sm text-muted-foreground">
                    پس از نهایی کردن، امکان ویرایش اطلاعات وجود نخواهد داشت
                  </p>
                </div>
                <Button
                  onClick={handleFinalizeMonth}
                  disabled={finalizeMutation.isPending}
                  className="gap-2"
                  data-testid="button-finalize-month"
                >
                  <Send className="h-4 w-4" />
                  {finalizeMutation.isPending ? "در حال نهایی کردن..." : "نهایی کردن و ارسال"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entry Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEntry ? "ویرایش عملکرد" : "ثبت عملکرد جدید"}
              </DialogTitle>
              <DialogDescription>
                ثبت اطلاعات عملکرد برای روز {selectedDay} {JALALI_MONTHS[selectedMonth - 1]}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="personnel">انتخاب پرسنل</Label>
                <Select
                  value={selectedPersonnel}
                  onValueChange={setSelectedPersonnel}
                  disabled={!!editingEntry} // Don't allow changing personnel when editing
                >
                  <SelectTrigger data-testid="select-personnel">
                    <SelectValue placeholder="پرسنل را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.firstName} {person.lastName} ({person.nationalId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="shift">نوع شیفت</Label>
                <Select value={selectedShift} onValueChange={setSelectedShift}>
                  <SelectTrigger data-testid="select-shift">
                    <SelectValue placeholder="نوع شیفت را انتخاب کنید" />
                  </SelectTrigger>
                  <SelectContent>
                    {shifts.map((shift) => (
                      <SelectItem key={shift.id} value={shift.id}>
                        {shift.title} - {shift.equivalentHours} ساعت (کد: {shift.shiftCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="missions">تعداد ماموریت‌ها</Label>
                  <Input
                    id="missions"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={missions}
                    onChange={(e) => setMissions(e.target.value)}
                    data-testid="input-missions"
                  />
                </div>

                <div>
                  <Label htmlFor="meals">تعداد وعده‌های غذایی</Label>
                  <Input
                    id="meals"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={meals}
                    onChange={(e) => setMeals(e.target.value)}
                    data-testid="input-meals"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveEntry}
                  disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                  className="gap-2 flex-1"
                  data-testid="button-save-entry"
                >
                  <CheckCircle className="h-4 w-4" />
                  {editingEntry 
                    ? (updateEntryMutation.isPending ? "در حال به‌روزرسانی..." : "به‌روزرسانی")
                    : (createEntryMutation.isPending ? "در حال ذخیره..." : "ذخیره")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  data-testid="button-cancel-entry"
                >
                  انصراف
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}