import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";
import { JALALI_MONTHS } from "@/lib/jalali-utils";

interface FiltersPanelProps {
  filters: {
    month: number;
    year: number;
    baseName: string;
    baseType: string;
    employmentStatus: string;
    productivityStatus: string;
  };
  onFiltersChange: (filters: any) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  bases: any[];
}

export function FiltersPanel({
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
  bases,
}: FiltersPanelProps) {
  const currentYear = 1403; // Current Jalali year
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const updateFilter = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value === "all" ? "" : value,
    });
  };

  return (
    <Card className="p-6 shadow-sm mb-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[200px]">
          <Label className="block text-sm font-medium mb-2">ماه و سال</Label>
          <div className="flex gap-2">
            <Select
              value={filters.month.toString()}
              onValueChange={(value) => updateFilter("month", value)}
            >
              <SelectTrigger className="flex-1" data-testid="select-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JALALI_MONTHS.map((month, index) => (
                  <SelectItem key={index + 1} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.year.toString()}
              onValueChange={(value) => updateFilter("year", value)}
            >
              <SelectTrigger className="w-20" data-testid="select-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-w-[160px]">
          <Label className="block text-sm font-medium mb-2">نام پایگاه</Label>
          <Select
            value={filters.baseName || "all"}
            onValueChange={(value) => updateFilter("baseName", value)}
          >
            <SelectTrigger data-testid="select-base">
              <SelectValue placeholder="همه پایگاه‌ها" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه پایگاه‌ها</SelectItem>
              {bases.map((base) => (
                <SelectItem key={base.id} value={base.id}>
                  {base.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Label className="block text-sm font-medium mb-2">نوع پایگاه</Label>
          <Select
            value={filters.baseType || "all"}
            onValueChange={(value) => updateFilter("baseType", value)}
          >
            <SelectTrigger data-testid="select-base-type">
              <SelectValue placeholder="همه انواع" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه انواع</SelectItem>
              <SelectItem value="urban">شهری</SelectItem>
              <SelectItem value="road">جاده‌ای</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Label className="block text-sm font-medium mb-2">وضعیت استخدام</Label>
          <Select
            value={filters.employmentStatus || "all"}
            onValueChange={(value) => updateFilter("employmentStatus", value)}
          >
            <SelectTrigger data-testid="select-employment">
              <SelectValue placeholder="همه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="official">رسمی</SelectItem>
              <SelectItem value="contractual">طرحی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[160px]">
          <Label className="block text-sm font-medium mb-2">وضعیت بهره‌وری</Label>
          <Select
            value={filters.productivityStatus || "all"}
            onValueChange={(value) => updateFilter("productivityStatus", value)}
          >
            <SelectTrigger data-testid="select-productivity">
              <SelectValue placeholder="همه" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه</SelectItem>
              <SelectItem value="productive">بهره‌ور</SelectItem>
              <SelectItem value="non_productive">غیر بهره‌ور</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onApplyFilters}
            data-testid="button-apply-filters"
          >
            <Search className="h-4 w-4 ml-2" />
            اعمال فیلتر
          </Button>
          <Button
            variant="outline"
            onClick={onClearFilters}
            data-testid="button-clear-filters"
          >
            <RotateCcw className="h-4 w-4 ml-2" />
            پاک کردن
          </Button>
        </div>
      </div>
    </Card>
  );
}
