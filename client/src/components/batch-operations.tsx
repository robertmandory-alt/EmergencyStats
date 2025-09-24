import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Download, Image } from "lucide-react";
import { formatPersianNumber } from "@/lib/jalali-utils";

interface BatchOperationsProps {
  selectedCount: number;
  onBatchAssignment: () => void;
  onExportExcel: () => void;
  onExportImage: () => void;
}

export function BatchOperations({
  selectedCount,
  onBatchAssignment,
  onExportExcel,
  onExportImage,
}: BatchOperationsProps) {
  return (
    <Card className="p-4 shadow-sm mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={onBatchAssignment}
            variant="secondary"
            data-testid="button-batch-assignment"
          >
            <FileText className="h-4 w-4 ml-2" />
            تخصیص دسته‌ای شیفت
          </Button>
          <div className="text-sm text-muted-foreground">
            <span data-testid="text-selected-count">
              {formatPersianNumber(selectedCount)}
            </span>{" "}
            نفر انتخاب شده
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={onExportExcel}
            variant="default"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            data-testid="button-export-excel"
          >
            <Download className="h-4 w-4 ml-2" />
            خروجی اکسل
          </Button>
          <Button
            onClick={onExportImage}
            variant="outline"
            data-testid="button-export-image"
          >
            <Image className="h-4 w-4 ml-2" />
            خروجی تصویر
          </Button>
        </div>
      </div>
    </Card>
  );
}
