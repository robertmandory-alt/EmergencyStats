import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/layout/admin-layout";
import { StatsCards } from "@/components/stats-cards";
import { FiltersPanel } from "@/components/filters-panel";
import { BatchOperations } from "@/components/batch-operations";
import { AdminPerformanceGrid } from "@/components/admin-performance-grid";
import { ShiftModal } from "@/components/shift-modal";
import { useToast } from "@/hooks/use-toast";
import { getCurrentJalaliDate } from "@/lib/jalali-utils";
import { exportToExcel, exportToImage } from "@/lib/export-utils";

export default function AdminDashboard() {
  const currentDate = getCurrentJalaliDate();
  const { toast } = useToast();
  
  const [filters, setFilters] = useState({
    month: currentDate.month,
    year: currentDate.year,
    baseName: "",
    baseType: "",
    employmentStatus: "",
    productivityStatus: "",
  });

  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [shiftModal, setShiftModal] = useState<{
    isOpen: boolean;
    personnelId: string;
    personnelName: string;
    date: string;
    currentAssignment?: any;
  }>({
    isOpen: false,
    personnelId: "",
    personnelName: "",
    date: "",
  });

  // Queries
  const { data: personnel = [] } = useQuery({
    queryKey: ["/api/personnel"],
  }) as { data: any[] };

  const { data: bases = [] } = useQuery({
    queryKey: ["/api/bases"],
  }) as { data: any[] };

  const { data: workShifts = [] } = useQuery({
    queryKey: ["/api/work-shifts"],
  }) as { data: any[] };

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/performance-assignments", filters.year, filters.month],
    queryFn: () => fetch(`/api/performance-assignments?year=${filters.year}&month=${filters.month}`).then(res => res.json()),
  }) as { data: any[] };

  // Ensure all data is always an array
  const personnelArray = Array.isArray(personnel) ? personnel : [];
  const basesArray = Array.isArray(bases) ? bases : [];
  const workShiftsArray = Array.isArray(workShifts) ? workShifts : [];
  const assignmentsArray = Array.isArray(assignments) ? assignments : [];

  // Calculate statistics
  const stats = {
    totalPersonnel: personnelArray.length,
    urbanMissions: assignmentsArray.filter((assignment: any) => {
      const base = basesArray.find((b: any) => b.id === assignment.baseId);
      return base?.type === 'urban';
    }).length,
    roadMissions: assignmentsArray.filter((assignment: any) => {
      const base = basesArray.find((b: any) => b.id === assignment.baseId);
      return base?.type === 'road';
    }).length,
    totalHours: assignmentsArray.reduce((sum: number, assignment: any) => {
      const shift = workShiftsArray.find((s: any) => s.id === assignment.shiftId);
      return sum + (shift?.equivalentHours || 0);
    }, 0),
  };

  // Filter personnel based on current filters
  const filteredPersonnel = personnelArray.filter((person: any) => {
    if (filters.employmentStatus && person.employmentStatus !== filters.employmentStatus) {
      return false;
    }
    if (filters.productivityStatus && person.productivityStatus !== filters.productivityStatus) {
      return false;
    }
    return true;
  });

  // Event handlers
  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleApplyFilters = () => {
    // Filters are applied automatically through the state
    toast({
      title: "فیلترها اعمال شد",
      description: `${filteredPersonnel.length} پرسنل یافت شد`,
    });
  };

  const handleClearFilters = () => {
    setFilters({
      month: currentDate.month,
      year: currentDate.year,
      baseName: "",
      baseType: "",
      employmentStatus: "",
      productivityStatus: "",
    });
    setSelectedPersonnel([]);
  };

  const handlePersonnelSelect = (personnelId: string, selected: boolean) => {
    if (selected) {
      setSelectedPersonnel(prev => [...prev, personnelId]);
    } else {
      setSelectedPersonnel(prev => prev.filter(id => id !== personnelId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedPersonnel(filteredPersonnel.map((p: any) => p.id));
    } else {
      setSelectedPersonnel([]);
    }
  };

  const handleCellClick = (personnelId: string, date: string) => {
    const person = personnelArray.find((p: any) => p.id === personnelId);
    const currentAssignment = assignmentsArray.find((a: any) => 
      a.personnelId === personnelId && a.date === date
    );
    
    setShiftModal({
      isOpen: true,
      personnelId,
      personnelName: `${person?.firstName} ${person?.lastName}`,
      date,
      currentAssignment,
    });
  };

  const handleBatchAssignment = () => {
    toast({
      title: "تخصیص دسته‌ای",
      description: "این ویژگی در نسخه آینده اضافه خواهد شد",
    });
  };

  const handleExportExcel = async () => {
    try {
      await exportToExcel({
        personnel: filteredPersonnel,
        assignments: assignmentsArray,
        bases: basesArray,
        workShifts: workShiftsArray,
        month: filters.month,
        year: filters.year,
      }, 'comprehensive');
      
      toast({
        title: "خروجی اکسل",
        description: "فایل با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در تولید فایل اکسل",
      });
    }
  };

  const handleExportImage = async () => {
    try {
      await exportToImage("performance-grid");
      toast({
        title: "خروجی تصویر",
        description: "تصویر با موفقیت دانلود شد",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "خطا",
        description: "خطا در تولید تصویر",
      });
    }
  };

  return (
    <AdminLayout title="داشبورد مدیریت عملکرد پرسنل">
      <StatsCards stats={stats} />
      
      <FiltersPanel
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApplyFilters={handleApplyFilters}
        onClearFilters={handleClearFilters}
        bases={basesArray}
      />
      
      <BatchOperations
        selectedCount={selectedPersonnel.length}
        onBatchAssignment={handleBatchAssignment}
        onExportExcel={handleExportExcel}
        onExportImage={handleExportImage}
      />
      
      <AdminPerformanceGrid
        personnel={filteredPersonnel}
        assignments={assignmentsArray}
        bases={basesArray}
        workShifts={workShiftsArray}
        selectedPersonnel={selectedPersonnel}
        month={filters.month}
        year={filters.year}
        onPersonnelSelect={handlePersonnelSelect}
        onSelectAll={handleSelectAll}
        onCellClick={handleCellClick}
      />
      
      <ShiftModal
        isOpen={shiftModal.isOpen}
        onClose={() => setShiftModal(prev => ({ ...prev, isOpen: false }))}
        personnelName={shiftModal.personnelName}
        date={shiftModal.date}
        personnelId={shiftModal.personnelId}
        currentAssignment={shiftModal.currentAssignment}
        bases={basesArray}
        workShifts={workShiftsArray}
      />
    </AdminLayout>
  );
}
