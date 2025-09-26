import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Calendar, Users } from "lucide-react";
import { 
  generateJalaliMonthDays, 
  JALALI_WEEKDAYS_SHORT, 
  formatPersianNumber,
  JALALI_MONTHS 
} from "@/lib/jalali-utils";

interface AdminPerformanceGridProps {
  personnel: any[];
  assignments: any[];
  bases: any[];
  workShifts: any[];
  selectedPersonnel: string[];
  month: number;
  year: number;
  onPersonnelSelect: (personnelId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onCellClick: (personnelId: string, date: string) => void;
  className?: string;
}

export function AdminPerformanceGrid({
  personnel,
  assignments,
  bases,
  workShifts,
  selectedPersonnel,
  month,
  year,
  onPersonnelSelect,
  onSelectAll,
  onCellClick,
  className
}: AdminPerformanceGridProps) {
  // Generate calendar days for the selected month
  const calendarDays = useMemo(() => {
    return generateJalaliMonthDays(year, month);
  }, [year, month]);

  // Create a map of assignments for quick lookup
  const assignmentsMap = useMemo(() => {
    const map = new Map();
    (assignments || []).forEach(assignment => {
      const key = `${assignment.personnelId}-${assignment.date}`;
      map.set(key, assignment);
    });
    return map;
  }, [assignments]);

  // Calculate grid data with assignment information
  const gridData = useMemo(() => {
    if (!personnel || !Array.isArray(personnel)) return [];

    return personnel.map(person => {
      const personAssignments = (assignments || []).filter(a => a.personnelId === person.id);
      
      return {
        personnelId: person.id,
        personnelName: `${person.firstName} ${person.lastName}`,
        assignmentsCount: personAssignments.length,
        assignments: personAssignments
      };
    });
  }, [personnel, assignments]);

  const allSelected = personnel?.length > 0 && selectedPersonnel.length === personnel.length;
  const someSelected = selectedPersonnel.length > 0 && selectedPersonnel.length < (personnel?.length || 0);

  return (
    <Card className={className} data-testid="admin-performance-grid">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => onSelectAll(checked as boolean)}
              data-testid="checkbox-select-all"
            />
            <span className="text-sm text-muted-foreground">
              انتخاب همه ({formatPersianNumber(selectedPersonnel.length)} از {formatPersianNumber(personnel?.length || 0)})
            </span>
          </div>
          
          <CardTitle className="flex items-center gap-2 text-right">
            <Calendar className="h-5 w-5" />
            جدول تخصیص‌های {JALALI_MONTHS[month - 1]} {formatPersianNumber(year)}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        {!personnel || personnel.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>هیچ پرسنلی یافت نشد</p>
            <p className="text-sm">پرسنل مورد نظر را اضافه کنید یا فیلترها را تغییر دهید</p>
          </div>
        ) : (
          <div className="min-w-fit" data-testid="grid-table">
            {/* Table Header */}
            <div className="grid gap-1 mb-2 sticky top-0 bg-background z-10" 
                 style={{ gridTemplateColumns: `50px 200px repeat(${calendarDays.length}, 60px) 100px` }}>
              {/* Select column header */}
              <div className="p-2 text-center font-medium border rounded bg-muted">
                انتخاب
              </div>
              
              {/* Personnel column header */}
              <div className="p-2 text-center font-medium border rounded bg-muted">
                پرسنل
              </div>
              
              {/* Day headers */}
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
              
              {/* Total assignments header */}
              <div className="p-2 text-center text-xs font-medium border rounded bg-muted">
                کل تخصیص‌ها
              </div>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {gridData.map((personData) => (
                <div
                  key={personData.personnelId}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `50px 200px repeat(${calendarDays.length}, 60px) 100px` }}
                  data-testid={`personnel-row-${personData.personnelId}`}
                >
                  {/* Select checkbox */}
                  <div className="h-12 p-2 border flex items-center justify-center">
                    <Checkbox
                      checked={selectedPersonnel.includes(personData.personnelId)}
                      onCheckedChange={(checked) => 
                        onPersonnelSelect(personData.personnelId, checked as boolean)
                      }
                      data-testid={`checkbox-personnel-${personData.personnelId}`}
                    />
                  </div>

                  {/* Personnel name */}
                  <div className="h-12 p-2 text-right border bg-muted flex items-center">
                    <span className="truncate font-medium" data-testid={`personnel-name-${personData.personnelId}`}>
                      {personData.personnelName}
                    </span>
                  </div>

                  {/* Day cells */}
                  {calendarDays.map((day) => {
                    const assignment = assignmentsMap.get(`${personData.personnelId}-${day.date}`);
                    const hasAssignment = !!assignment;
                    const shift = hasAssignment ? workShifts?.find(s => s.id === assignment?.shiftId) : null;
                    const base = hasAssignment ? bases?.find(b => b.id === assignment?.baseId) : null;
                    
                    return (
                      <Button
                        key={day.date}
                        variant="outline"
                        className={`h-12 p-1 text-xs border ${
                          hasAssignment 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 hover:bg-green-100'
                            : 'bg-white dark:bg-background hover:bg-muted'
                        }`}
                        onClick={() => onCellClick(personData.personnelId, day.date)}
                        data-testid={`cell-${personData.personnelId}-${day.day}`}
                        title={hasAssignment ? `${shift?.title || 'شیفت'} - ${base?.name || 'پایگاه'}` : 'شیفت تعریف نشده'}
                      >
                        {hasAssignment && (
                          <div className="text-center">
                            <div className="text-green-700 dark:text-green-300 font-medium text-xs">
                              {shift?.shiftCode || 'شیفت'}
                            </div>
                            {base && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {base.number}
                              </div>
                            )}
                          </div>
                        )}
                      </Button>
                    );
                  })}

                  {/* Total assignments */}
                  <div className="h-12 p-2 text-center border rounded bg-muted flex items-center justify-center">
                    <Badge variant="secondary" data-testid={`total-assignments-${personData.personnelId}`}>
                      {formatPersianNumber(personData.assignmentsCount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
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