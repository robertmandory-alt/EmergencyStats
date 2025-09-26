import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle } from "lucide-react";
import { JALALI_MONTHS, getCurrentJalaliDate, formatPersianNumber } from "@/lib/jalali-utils";

interface PeriodSelectorProps {
  selectedYear?: number;
  selectedMonth?: number;
  onPeriodConfirm: (year: number, month: number) => void;
  className?: string;
}

export function PeriodSelector({ 
  selectedYear, 
  selectedMonth, 
  onPeriodConfirm, 
  className 
}: PeriodSelectorProps) {
  const currentJalali = getCurrentJalaliDate();
  
  const [year, setYear] = useState<number>(selectedYear || currentJalali.year);
  const [month, setMonth] = useState<number>(selectedMonth || currentJalali.month);

  // Generate year options (current year and previous years)
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentJalali.year - i);

  const handleConfirm = () => {
    if (year && month) {
      onPeriodConfirm(year, month);
    }
  };

  const isCurrentSelection = selectedYear === year && selectedMonth === month;

  return (
    <Card className={className} data-testid="period-selector">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-right">
          <Calendar className="h-5 w-5" />
          انتخاب دوره زمانی
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Year Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-right block">
              سال شمسی
            </label>
            <Select
              value={year.toString()}
              onValueChange={(value) => setYear(parseInt(value))}
              data-testid="select-year"
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="انتخاب سال" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((yearOption) => (
                  <SelectItem 
                    key={yearOption} 
                    value={yearOption.toString()}
                    data-testid={`year-option-${yearOption}`}
                  >
                    {formatPersianNumber(yearOption)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Month Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-right block">
              ماه شمسی
            </label>
            <Select
              value={month.toString()}
              onValueChange={(value) => setMonth(parseInt(value))}
              data-testid="select-month"
            >
              <SelectTrigger className="w-full text-right">
                <SelectValue placeholder="انتخاب ماه" />
              </SelectTrigger>
              <SelectContent>
                {JALALI_MONTHS.map((monthName, index) => (
                  <SelectItem 
                    key={index + 1} 
                    value={(index + 1).toString()}
                    data-testid={`month-option-${index + 1}`}
                  >
                    {monthName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Selected Period Display */}
        <div className="bg-muted p-3 rounded-md text-right">
          <div className="text-sm text-muted-foreground">دوره انتخاب شده:</div>
          <div className="font-medium" data-testid="selected-period">
            {JALALI_MONTHS[month - 1]} {formatPersianNumber(year)}
          </div>
        </div>

        {/* Confirm Button */}
        <Button
          onClick={handleConfirm}
          disabled={!year || !month || isCurrentSelection}
          className="w-full"
          data-testid="button-confirm-period"
        >
          {isCurrentSelection ? (
            <>
              <CheckCircle className="ml-2 h-4 w-4" />
              دوره فعلی
            </>
          ) : (
            "تایید و نمایش جدول"
          )}
        </Button>

        {/* Helper Text */}
        <div className="text-xs text-muted-foreground text-center">
          پس از انتخاب سال و ماه، روی دکمه تایید کلیک کنید تا جدول کارکرد نمایش داده شود
        </div>
      </CardContent>
    </Card>
  );
}

// Preset quick selection component for common periods
interface QuickPeriodSelectorProps {
  onPeriodSelect: (year: number, month: number) => void;
}

export function QuickPeriodSelector({ onPeriodSelect }: QuickPeriodSelectorProps) {
  const currentJalali = getCurrentJalaliDate();
  
  const quickOptions = [
    {
      label: "ماه جاری",
      year: currentJalali.year,
      month: currentJalali.month,
    },
    {
      label: "ماه گذشته",
      year: currentJalali.month === 1 ? currentJalali.year - 1 : currentJalali.year,
      month: currentJalali.month === 1 ? 12 : currentJalali.month - 1,
    },
  ];

  return (
    <div className="flex gap-2" data-testid="quick-period-selector">
      {quickOptions.map((option, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onPeriodSelect(option.year, option.month)}
          data-testid={`quick-select-${index}`}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}