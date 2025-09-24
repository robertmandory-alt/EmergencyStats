import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateJalaliMonthDays, formatPersianNumber } from "@/lib/jalali-utils";
import { Plus } from "lucide-react";

interface PerformanceGridProps {
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
}

export function PerformanceGrid({
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
}: PerformanceGridProps) {
  const monthDays = generateJalaliMonthDays(year, month);
  
  // Calculate stats for each personnel
  const getPersonnelStats = (personnelId: string) => {
    const personAssignments = assignments.filter(a => a.personnelId === personnelId);
    
    const totalHours = personAssignments.reduce((sum, assignment) => {
      const shift = workShifts.find(s => s.id === assignment.shiftId);
      return sum + (shift?.equivalentHours || 0);
    }, 0);

    const urbanMissions = personAssignments.filter(assignment => {
      const base = bases.find(b => b.id === assignment.baseId);
      return base?.type === 'urban';
    }).length;

    const roadMissions = personAssignments.filter(assignment => {
      const base = bases.find(b => b.id === assignment.baseId);
      return base?.type === 'road';
    }).length;

    const mealCount = personAssignments.length;

    return { totalHours, urbanMissions, roadMissions, mealCount };
  };

  // Get assignment for specific personnel and date
  const getAssignment = (personnelId: string, date: string) => {
    return assignments.find(a => a.personnelId === personnelId && a.date === date);
  };

  const handleSelectAll = (checked: boolean) => {
    onSelectAll(checked);
  };

  const handlePersonnelSelect = (personnelId: string, checked: boolean) => {
    onPersonnelSelect(personnelId, checked);
  };

  return (
    <Card className="shadow-sm" id="performance-grid">
      <div className="performance-grid overflow-x-auto max-h-[70vh]">
        <table className="w-full text-sm">
          <thead className="grid-header border-b border-border sticky top-0 bg-background z-20">
            <tr className="bg-muted/50">
              <th className="sticky-column px-4 py-3 text-right font-semibold border-l border-border w-8">
                <Checkbox
                  checked={personnel.length > 0 && selectedPersonnel.length === personnel.length}
                  onCheckedChange={handleSelectAll}
                  data-testid="checkbox-select-all"
                />
              </th>
              <th className="sticky-column px-4 py-3 text-right font-semibold border-l border-border min-w-[200px] bg-background">
                نام و نام خانوادگی
              </th>
              
              {/* Days of month */}
              {monthDays.map((dayInfo) => (
                <th
                  key={dayInfo.day}
                  className={cn(
                    "grid-cell px-2 py-3 text-center font-semibold border-l border-border",
                    dayInfo.isHoliday && "holiday-column"
                  )}
                >
                  <div className="text-xs text-muted-foreground">
                    {dayInfo.weekday}
                  </div>
                  <div>{formatPersianNumber(dayInfo.day)}</div>
                  {dayInfo.isHoliday && (
                    <div className="text-xs text-red-600">تعطیل</div>
                  )}
                </th>
              ))}
              
              {/* Summary columns */}
              <th className="px-3 py-3 text-center font-semibold border-l border-border bg-primary/10 min-w-[100px]">
                <div className="text-xs">کل ساعت</div>
                <div>کاری</div>
              </th>
              <th className="px-3 py-3 text-center font-semibold border-l border-border bg-secondary/10 min-w-[100px]">
                <div className="text-xs">ماموریت</div>
                <div>شهری</div>
              </th>
              <th className="px-3 py-3 text-center font-semibold border-l border-border bg-accent/10 min-w-[100px]">
                <div className="text-xs">ماموریت</div>
                <div>جاده‌ای</div>
              </th>
              <th className="px-3 py-3 text-center font-semibold bg-muted/50 min-w-[100px]">
                <div className="text-xs">تعداد</div>
                <div>غذا</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {personnel.map((person) => {
              const stats = getPersonnelStats(person.id);
              const isSelected = selectedPersonnel.includes(person.id);
              
              return (
                <tr
                  key={person.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                  data-testid={`row-personnel-${person.id}`}
                >
                  <td className="sticky-column px-4 py-2 border-l border-border bg-background">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => 
                        handlePersonnelSelect(person.id, checked as boolean)
                      }
                      data-testid={`checkbox-personnel-${person.id}`}
                    />
                  </td>
                  <td className="sticky-column px-4 py-2 border-l border-border font-medium bg-background">
                    <div data-testid={`text-personnel-name-${person.id}`}>
                      {person.firstName} {person.lastName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {person.nationalId}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Badge
                        variant={person.employmentStatus === 'official' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {person.employmentStatus === 'official' ? 'رسمی' : 'طرحی'}
                      </Badge>
                      <Badge
                        variant={person.productivityStatus === 'productive' ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {person.productivityStatus === 'productive' ? 'بهره‌ور' : 'غیر بهره‌ور'}
                      </Badge>
                    </div>
                  </td>
                  
                  {/* Day cells */}
                  {monthDays.map((dayInfo) => {
                    const assignment = getAssignment(person.id, dayInfo.date);
                    const shift = assignment ? workShifts.find(s => s.id === assignment.shiftId) : null;
                    const base = assignment ? bases.find(b => b.id === assignment.baseId) : null;
                    
                    return (
                      <td
                        key={dayInfo.day}
                        className={cn(
                          "grid-cell p-1 border-l border-border cursor-pointer hover:bg-muted/50",
                          dayInfo.isHoliday && "holiday-column"
                        )}
                        onClick={() => onCellClick(person.id, dayInfo.date)}
                        data-testid={`cell-${person.id}-${dayInfo.day}`}
                      >
                        {assignment && shift && base ? (
                          <div className={cn(
                            "text-center rounded p-1",
                            base.type === 'urban' ? 'bg-primary/10' : 'bg-secondary/10'
                          )}>
                            <div className="text-xs font-medium">{shift.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {base.name} - {base.type === 'urban' ? 'شهری' : 'جاده‌ای'}
                            </div>
                            <div className="text-xs font-mono">{shift.shiftCode}</div>
                          </div>
                        ) : (
                          !dayInfo.isHoliday && (
                            <div className="text-center border border-dashed border-muted-foreground/30 rounded p-1 h-full flex items-center justify-center text-muted-foreground">
                              <Plus className="h-3 w-3" />
                            </div>
                          )
                        )}
                      </td>
                    );
                  })}
                  
                  {/* Summary cells */}
                  <td className="px-3 py-2 text-center font-bold border-l border-border bg-primary/10">
                    {formatPersianNumber(stats.totalHours)}
                  </td>
                  <td className="px-3 py-2 text-center font-bold border-l border-border bg-secondary/10">
                    {formatPersianNumber(stats.urbanMissions)}
                  </td>
                  <td className="px-3 py-2 text-center font-bold border-l border-border bg-accent/10">
                    {formatPersianNumber(stats.roadMissions)}
                  </td>
                  <td className="px-3 py-2 text-center font-bold bg-muted/50">
                    {formatPersianNumber(stats.mealCount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
