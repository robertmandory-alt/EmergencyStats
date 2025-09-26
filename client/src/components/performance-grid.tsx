import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Users, AlertCircle } from "lucide-react";
import { 
  generateJalaliMonthDays, 
  JALALI_WEEKDAYS_SHORT, 
  formatPersianNumber,
  JALALI_MONTHS 
} from "@/lib/jalali-utils";
import type { 
  PerformanceGridData, 
  CalendarDay 
} from "@/hooks/use-performance-logging";
import type { Personnel, PerformanceEntry, IranHoliday, PerformanceLog } from "@shared/schema";

interface PerformanceGridProps {
  year: number;
  month: number;
  personnel: Personnel[];
  performanceLog: PerformanceLog | null;
  entries: PerformanceEntry[];
  holidays: IranHoliday[];
  isLoadingLog: boolean;
  isLoadingEntries: boolean;
  isLoadingHolidays: boolean;
  logError: any;
  entriesError: any;
  onCellClick: (personnelId: string, date: string) => void;
  onPersonnelClick: (personnelId: string) => void;
  onAddPersonnel: () => void;
  className?: string;
}

export function PerformanceGrid({
  year,
  month,
  personnel,
  performanceLog,
  entries,
  holidays,
  isLoadingLog,
  isLoadingEntries,
  isLoadingHolidays,
  logError,
  entriesError,
  onCellClick,
  onPersonnelClick,
  onAddPersonnel,
  className
}: PerformanceGridProps) {

  // Generate calendar days for the selected month (simplified - no holiday highlighting)
  const calendarDays = useMemo(() => {
    return generateJalaliMonthDays(year, month);
  }, [year, month]);

  // Process performance data into grid format
  const gridData = useMemo((): PerformanceGridData[] => {
    if (!personnel || !personnel.length) return [];
    if (!entries || !Array.isArray(entries)) return [];

    return personnel.map(person => {
      const personEntries = entries.filter(entry => entry.personnelId === person.id);
      const entriesMap = new Map(
        personEntries.map(entry => [entry.date || '', entry])
      );

      // Calculate totals
      const totalMissions = personEntries
        .filter(entry => entry.entryType === 'summary')
        .reduce((sum, entry) => sum + (entry.missions || 0), 0);
      
      const totalMeals = personEntries
        .filter(entry => entry.entryType === 'summary')
        .reduce((sum, entry) => sum + (entry.meals || 0), 0);

      return {
        personnelId: person.id,
        personnelName: `${person.firstName} ${person.lastName}`,
        entries: entriesMap,
        totalMissions,
        totalMeals
      };
    });
  }, [personnel, entries]);

  // Loading state
  if (isLoadingLog || isLoadingEntries || isLoadingHolidays) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right">در حال بارگذاری...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (logError || entriesError) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-right flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            خطا در بارگذاری اطلاعات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-right text-muted-foreground">
            {logError?.message || entriesError?.message}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isFinalized = performanceLog?.status === 'finalized';

  return (
    <Card className={className} data-testid="performance-grid">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button
            onClick={onAddPersonnel}
            variant="outline"
            size="sm"
            disabled={isFinalized}
            data-testid="button-add-personnel"
          >
            <Plus className="ml-2 h-4 w-4" />
            افزودن پرسنل
          </Button>
          
          <CardTitle className="flex items-center gap-2 text-right">
            <Calendar className="h-5 w-5" />
            جدول کارکرد {JALALI_MONTHS[month - 1]} {formatPersianNumber(year)}
          </CardTitle>
        </div>
        
        {isFinalized && (
          <Badge variant="secondary" className="w-fit mr-auto">
            نهایی شده
          </Badge>
        )}
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {personnel.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>هیچ پرسنلی تعریف نشده است</p>
            <p className="text-sm">برای شروع، پرسنل مورد نظر را اضافه کنید</p>
          </div>
        ) : (
          <div className="min-w-fit" data-testid="grid-table">
            {/* Table Header */}
            <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10" 
                 style={{ gridTemplateColumns: `200px repeat(${calendarDays.length}, 60px) 80px 80px` }}>
              {/* Personnel column header */}
              <div className="p-2 text-center font-medium border rounded bg-muted">
                پرسنل
              </div>
              
              {/* Day headers - simplified without holiday highlighting */}
              {calendarDays.map((day) => (
                <div
                  key={day.date}
                  className="p-1 text-center text-xs font-medium border rounded bg-muted"
                  data-testid={`day-header-${day.day}`}
                >
                  <div>{JALALI_WEEKDAYS_SHORT[day.weekday === 'شنبه' ? 0 : 
                                                day.weekday === 'یکشنبه' ? 1 :
                                                day.weekday === 'دوشنبه' ? 2 :
                                                day.weekday === 'سه‌شنبه' ? 3 :
                                                day.weekday === 'چهارشنبه' ? 4 :
                                                day.weekday === 'پنج‌شنبه' ? 5 : 6]}</div>
                  <div>{formatPersianNumber(day.day)}</div>
                </div>
              ))}
              
              {/* Summary headers */}
              <div className="p-2 text-center text-xs font-medium border rounded bg-muted">
                کل ماموریت
              </div>
              <div className="p-2 text-center text-xs font-medium border rounded bg-muted">
                کل وعده
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {gridData.map((personData) => (
                <div
                  key={personData.personnelId}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `200px repeat(${calendarDays.length}, 60px) 80px 80px` }}
                  data-testid={`personnel-row-${personData.personnelId}`}
                >
                  {/* Personnel name - clickable for bulk edit */}
                  <Button
                    variant="ghost"
                    className="h-12 p-2 text-right justify-start font-normal border"
                    onClick={() => onPersonnelClick(personData.personnelId)}
                    disabled={isFinalized}
                    data-testid={`personnel-name-${personData.personnelId}`}
                  >
                    <span className="truncate">{personData.personnelName}</span>
                  </Button>

                  {/* Day cells - simplified without holiday highlighting */}
                  {calendarDays.map((day) => {
                    const entry = personData.entries.get(day.date);
                    const hasShift = entry && entry.shiftId;
                    
                    return (
                      <Button
                        key={day.date}
                        variant="outline"
                        className={`h-12 p-1 text-xs border ${
                          hasShift 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300'
                            : 'bg-white dark:bg-background'
                        }`}
                        onClick={() => onCellClick(personData.personnelId, day.date)}
                        disabled={isFinalized}
                        data-testid={`cell-${personData.personnelId}-${day.day}`}
                      >
                        {hasShift && (
                          <div className="text-center">
                            <div className="text-green-700 dark:text-green-300 font-medium">
                              شیفت
                            </div>
                          </div>
                        )}
                      </Button>
                    );
                  })}

                  {/* Summary cells */}
                  <div className="h-12 p-2 text-center border rounded bg-muted flex items-center justify-center">
                    <span className="font-medium" data-testid={`total-missions-${personData.personnelId}`}>
                      {formatPersianNumber(personData.totalMissions)}
                    </span>
                  </div>
                  <div className="h-12 p-2 text-center border rounded bg-muted flex items-center justify-center">
                    <span className="font-medium" data-testid={`total-meals-${personData.personnelId}`}>
                      {formatPersianNumber(personData.totalMeals)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend - simplified */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-green-300 rounded"></div>
            <span>شیفت تعریف شده</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white dark:bg-background border rounded"></div>
            <span>بدون شیفت</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Grid statistics summary component
interface GridStatsProps {
  gridData: PerformanceGridData[];
  calendarDays: CalendarDay[];
}

export function GridStats({ gridData, calendarDays }: GridStatsProps) {
  const stats = useMemo(() => {
    const totalPersonnel = gridData.length;
    const totalDays = calendarDays.length;
    
    const totalAssignedShifts = gridData.reduce((sum, person) => {
      return sum + Array.from(person.entries.values()).filter(entry => entry.shiftId).length;
    }, 0);
    
    const totalMissions = gridData.reduce((sum, person) => sum + person.totalMissions, 0);
    const totalMeals = gridData.reduce((sum, person) => sum + person.totalMeals, 0);

    return {
      totalPersonnel,
      totalDays,
      totalAssignedShifts,
      totalMissions,
      totalMeals
    };
  }, [gridData, calendarDays]);

  return (
    <Card data-testid="grid-stats">
      <CardHeader>
        <CardTitle className="text-right text-lg">خلاصه آمار</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary" data-testid="stat-personnel">
              {formatPersianNumber(stats.totalPersonnel)}
            </div>
            <div className="text-sm text-muted-foreground">تعداد پرسنل</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-days">
              {formatPersianNumber(stats.totalDays)}
            </div>
            <div className="text-sm text-muted-foreground">روز در ماه</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-green-600" data-testid="stat-shifts">
              {formatPersianNumber(stats.totalAssignedShifts)}
            </div>
            <div className="text-sm text-muted-foreground">شیفت تعریف شده</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-missions">
              {formatPersianNumber(stats.totalMissions)}
            </div>
            <div className="text-sm text-muted-foreground">کل ماموریت</div>
          </div>
          
          <div className="space-y-1">
            <div className="text-2xl font-bold text-orange-600" data-testid="stat-meals">
              {formatPersianNumber(stats.totalMeals)}
            </div>
            <div className="text-sm text-muted-foreground">کل وعده غذایی</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}