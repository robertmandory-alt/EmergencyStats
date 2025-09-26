import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Save, 
  Edit, 
  Send, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PeriodSelector, QuickPeriodSelector } from "@/components/period-selector";
import { PerformanceGrid, GridStats } from "@/components/performance-grid";
import { CellEditorModal } from "@/components/cell-editor-modal";
import { BulkAssignModal } from "@/components/bulk-assign-modal";
import { getCurrentJalaliDate, JALALI_MONTHS, formatPersianNumber } from "@/lib/jalali-utils";
import { usePerformanceLogWorkflow } from "@/hooks/use-performance-logging";
import type { Personnel, WorkShift, InsertPerformanceEntry } from "@shared/schema";

// Real data hooks using React Query
function usePersonnel() {
  return useQuery({
    queryKey: ['/api/personnel'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  }) as {
    data: Personnel[] | undefined;
    isLoading: boolean;
    error: any;
  };
}

function useWorkShifts() {
  return useQuery({
    queryKey: ['/api/work-shifts'],
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2
  }) as {
    data: WorkShift[] | undefined;
    isLoading: boolean;
    error: any;
  };
}

export default function PerformanceLoggingPage() {
  const { toast } = useToast();
  const currentJalali = getCurrentJalaliDate();
  
  // State management
  const [selectedYear, setSelectedYear] = useState(currentJalali.year);
  const [selectedMonth, setSelectedMonth] = useState(currentJalali.month);
  const [showGrid, setShowGrid] = useState(false);
  
  // Modal state
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [selectedPersonnel, setSelectedPersonnel] = useState<Personnel | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Data hooks
  const personnelQuery = usePersonnel();
  const workShiftsQuery = useWorkShifts();
  
  const {
    performanceLog,
    entries,
    holidays,
    isLoadingLog,
    isLoadingEntries,
    isLoadingHolidays,
    isCreatingLog,
    isSavingEntries,
    isFinalizingLog,
    logError,
    entriesError,
    ensureLogExists,
    saveDraftEntries,
    finalizeLog
  } = usePerformanceLogWorkflow(selectedYear, selectedMonth);

  // Period selection handler
  const handlePeriodConfirm = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setShowGrid(true);
  };

  // Cell click handler (individual editing)
  const handleCellClick = (personnelId: string, date: string) => {
    const personnel = personnelQuery.data?.find(p => p.id === personnelId);
    if (personnel) {
      setSelectedPersonnel(personnel);
      setSelectedDate(date);
      setCellModalOpen(true);
    }
  };

  // Personnel click handler (bulk editing)
  const handlePersonnelClick = (personnelId: string) => {
    const personnel = personnelQuery.data?.find(p => p.id === personnelId);
    if (personnel) {
      setSelectedPersonnel(personnel);
      setBulkModalOpen(true);
    }
  };

  // Add personnel handler
  const handleAddPersonnel = () => {
    toast({
      title: "افزودن پرسنل",
      description: "این قابلیت در نسخه آینده اضافه خواهد شد"
    });
  };

  // Save individual cell entry
  const handleSaveCellEntry = async (personnelId: string, date: string, shiftId: string | null) => {
    try {
      await ensureLogExists();
      
      if (shiftId) {
        const jalaliDate = date.split('-').map(Number);
        const entry: InsertPerformanceEntry = {
          logId: performanceLog?.id || "",
          userId: "",
          personnelId,
          shiftId,
          date,
          year: jalaliDate[0],
          month: jalaliDate[1],
          day: jalaliDate[2],
          entryType: "cell",
          missions: 0,
          meals: 0,
          lastModifiedBy: ""
        };
        
        await saveDraftEntries([entry]);
      }
      
      toast({
        title: "ذخیره موفق",
        description: "تغییرات با موفقیت ذخیره شد"
      });
    } catch (error) {
      toast({
        title: "خطا در ذخیره",
        description: "خطا در ذخیره تغییرات",
        variant: "destructive"
      });
    }
  };

  // Save bulk entries
  const handleSaveBulkEntries = async (entries: InsertPerformanceEntry[]) => {
    try {
      await ensureLogExists();
      await saveDraftEntries(entries);
      
      toast({
        title: "ذخیره موفق",
        description: "تغییرات دسته‌جمعی با موفقیت ذخیره شد"
      });
    } catch (error) {
      toast({
        title: "خطا در ذخیره",
        description: "خطا در ذخیره تغییرات دسته‌جمعی",
        variant: "destructive"
      });
    }
  };

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      await ensureLogExists();
      toast({
        title: "ذخیره پیش‌نویس",
        description: "اطلاعات به عنوان پیش‌نویس ذخیره شد"
      });
    } catch (error) {
      toast({
        title: "خطا در ذخیره",
        description: "خطا در ذخیره پیش‌نویس",
        variant: "destructive"
      });
    }
  };

  // Finalize and submit
  const handleFinalize = async () => {
    try {
      await finalizeLog();
      toast({
        title: "نهایی‌سازی موفق",
        description: "لاگ عملکرد نهایی شد و برای ادمین ارسال شد"
      });
    } catch (error) {
      toast({
        title: "خطا در نهایی‌سازی",
        description: "خطا در نهایی‌سازی لاگ عملکرد",
        variant: "destructive"
      });
    }
  };

  const isFinalized = performanceLog?.status === 'finalized';
  const isDraft = performanceLog?.status === 'draft';
  const hasEntries = entries.length > 0;

  return (
    <div className="container mx-auto py-6 space-y-6" data-testid="performance-logging-page">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ثبت آمار کارکرد پرسنل</h1>
        <p className="text-muted-foreground">
          سیستم ثبت و مدیریت آمار ماهانه کارکرد پرسنل اورژانس
        </p>
      </div>

      {/* Period Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PeriodSelector
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onPeriodConfirm={handlePeriodConfirm}
          />
        </div>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm font-medium text-right mb-2">انتخاب سریع:</div>
              <QuickPeriodSelector onPeriodSelect={handlePeriodConfirm} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Log Status */}
      {showGrid && (
        <Card data-testid="log-status-card">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isFinalized ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="ml-1 h-3 w-3" />
                    نهایی شده
                  </Badge>
                ) : isDraft ? (
                  <Badge variant="secondary">
                    <Edit className="ml-1 h-3 w-3" />
                    پیش‌نویس
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <Clock className="ml-1 h-3 w-3" />
                    جدید
                  </Badge>
                )}
                
                {performanceLog && (
                  <span className="text-sm text-muted-foreground">
                    آخرین بروزرسانی: {new Date(performanceLog.updatedAt).toLocaleDateString('fa-IR')}
                  </span>
                )}
              </div>

              <div className="text-right">
                <div className="font-medium">
                  {JALALI_MONTHS[selectedMonth - 1]} {formatPersianNumber(selectedYear)}
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatPersianNumber(entries.length)} ورودی ثبت شده
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      {showGrid && (
        <div className="space-y-6">
          {/* Loading State */}
          {(isLoadingLog || isLoadingEntries || isLoadingHolidays) && (
            <Card>
              <CardContent className="pt-4 text-center">
                <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                <p>در حال بارگذاری اطلاعات...</p>
              </CardContent>
            </Card>
          )}

          {/* Error State */}
          {(logError || entriesError) && (
            <Card className="border-destructive">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  <span>خطا در بارگذاری اطلاعات</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {logError?.message || entriesError?.message}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Performance Grid */}
          {!isLoadingLog && !isLoadingEntries && (
            <>
              <PerformanceGrid
                year={selectedYear}
                month={selectedMonth}
                personnel={personnelQuery.data || []}
                onCellClick={handleCellClick}
                onPersonnelClick={handlePersonnelClick}
                onAddPersonnel={handleAddPersonnel}
              />

              {/* Grid Statistics */}
              {hasEntries && (
                <GridStats
                  gridData={[]} // This would be calculated from entries
                  calendarDays={[]} // This would be generated from the current month
                />
              )}
            </>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-4 justify-center">
                {!isFinalized && (
                  <>
                    <Button
                      onClick={handleSaveDraft}
                      disabled={isCreatingLog || isSavingEntries}
                      variant="outline"
                      data-testid="button-save-draft"
                    >
                      {isSavingEntries ? (
                        <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="ml-2 h-4 w-4" />
                      )}
                      ذخیره موقت
                    </Button>

                    <Button
                      onClick={handleFinalize}
                      disabled={!hasEntries || isFinalizingLog}
                      data-testid="button-finalize"
                    >
                      {isFinalizingLog ? (
                        <RefreshCw className="ml-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="ml-2 h-4 w-4" />
                      )}
                      ثبت نهایی و ارسال
                    </Button>
                  </>
                )}

                {isFinalized && (
                  <div className="text-center text-muted-foreground">
                    <CheckCircle className="mx-auto h-8 w-8 mb-2 text-green-600" />
                    <p>این لاگ نهایی شده و برای ادمین ارسال شده است</p>
                    <p className="text-sm">امکان ویرایش وجود ندارد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modals */}
      <CellEditorModal
        isOpen={cellModalOpen}
        onClose={() => setCellModalOpen(false)}
        personnel={selectedPersonnel}
        date={selectedDate}
        year={selectedYear}
        month={selectedMonth}
        workShifts={workShiftsQuery.data || []}
        onSave={handleSaveCellEntry}
      />

      <BulkAssignModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        personnel={selectedPersonnel}
        year={selectedYear}
        month={selectedMonth}
        workShifts={workShiftsQuery.data || []}
        onSave={handleSaveBulkEntries}
      />
    </div>
  );
}