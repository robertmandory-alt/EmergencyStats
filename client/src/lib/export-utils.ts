import * as XLSX from 'xlsx';

export interface ExportData {
  personnel: any[];
  assignments: any[];
  bases: any[];
  workShifts: any[];
  month: number;
  year: number;
}

export async function exportToExcel(data: ExportData, type: 'comprehensive' | 'codes' | 'hours' | 'urban' | 'road' | 'meals') {
  const { personnel, assignments, bases, workShifts, month, year } = data;
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare data based on export type
  let sheetData: any[][] = [];
  let sheetName = '';
  
  switch (type) {
    case 'comprehensive':
      sheetName = 'گزارش جامع عملکرد';
      sheetData = prepareComprehensiveReport(data);
      break;
    case 'codes':
      sheetName = 'گزارش کدهای شیفت';
      sheetData = prepareCodesReport(data);
      break;
    case 'hours':
      sheetName = 'گزارش ساعات کاری';
      sheetData = prepareHoursReport(data);
      break;
    case 'urban':
      sheetName = 'گزارش ماموریت‌های شهری';
      sheetData = prepareUrbanReport(data);
      break;
    case 'road':
      sheetName = 'گزارش ماموریت‌های جاده‌ای';
      sheetData = prepareRoadReport(data);
      break;
    case 'meals':
      sheetName = 'گزارش تعداد غذا';
      sheetData = prepareMealsReport(data);
      break;
  }
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // Set RTL direction for Persian content
  ws['!dir'] = 'rtl';
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  // Save file
  const fileName = `${sheetName}_${year}_${month}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

function prepareComprehensiveReport(data: ExportData): any[][] {
  const { personnel, assignments, bases, workShifts } = data;
  
  // Headers
  const headers = ['نام و نام خانوادگی', 'کد ملی'];
  
  // Add day columns (1-30)
  for (let day = 1; day <= 30; day++) {
    headers.push(`روز ${day}`);
  }
  
  headers.push('کل ساعات کاری', 'ماموریت شهری', 'ماموریت جاده‌ای', 'تعداد غذا');
  
  const rows = [headers];
  
  personnel.forEach(person => {
    const row = [`${person.firstName} ${person.lastName}`, person.nationalId];
    
    // Add shift data for each day
    for (let day = 1; day <= 30; day++) {
      const dateStr = `${data.year}-${data.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const assignment = assignments.find(a => a.personnelId === person.id && a.date === dateStr);
      
      if (assignment) {
        const shift = workShifts.find(s => s.id === assignment.shiftId);
        const base = bases.find(b => b.id === assignment.baseId);
        row.push(shift ? `${shift.title} - ${base?.name || ''}` : '');
      } else {
        row.push('');
      }
    }
    
    // Calculate totals
    const personAssignments = assignments.filter(a => a.personnelId === person.id);
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
    
    row.push(totalHours, urbanMissions, roadMissions, personAssignments.length);
    rows.push(row);
  });
  
  return rows;
}

function prepareCodesReport(data: ExportData): any[][] {
  const { personnel, assignments, workShifts } = data;
  
  const headers = ['نام و نام خانوادگی', 'کد ملی'];
  
  for (let day = 1; day <= 30; day++) {
    headers.push(`روز ${day}`);
  }
  
  const rows = [headers];
  
  personnel.forEach(person => {
    const row = [`${person.firstName} ${person.lastName}`, person.nationalId];
    
    for (let day = 1; day <= 30; day++) {
      const dateStr = `${data.year}-${data.month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const assignment = assignments.find(a => a.personnelId === person.id && a.date === dateStr);
      
      if (assignment) {
        const shift = workShifts.find(s => s.id === assignment.shiftId);
        row.push(shift?.shiftCode || '');
      } else {
        row.push('');
      }
    }
    
    rows.push(row);
  });
  
  return rows;
}

function prepareHoursReport(data: ExportData): any[][] {
  const { personnel, assignments, workShifts } = data;
  
  const rows = [['نام و نام خانوادگی', 'کد ملی', 'کل ساعات کاری']];
  
  personnel.forEach(person => {
    const personAssignments = assignments.filter(a => a.personnelId === person.id);
    const totalHours = personAssignments.reduce((sum, assignment) => {
      const shift = workShifts.find(s => s.id === assignment.shiftId);
      return sum + (shift?.equivalentHours || 0);
    }, 0);
    
    rows.push([`${person.firstName} ${person.lastName}`, person.nationalId, totalHours]);
  });
  
  return rows;
}

function prepareUrbanReport(data: ExportData): any[][] {
  const { personnel, assignments, bases } = data;
  
  const rows = [['نام و نام خانوادگی', 'کد ملی', 'ماموریت‌های شهری']];
  
  personnel.forEach(person => {
    const personAssignments = assignments.filter(a => a.personnelId === person.id);
    const urbanMissions = personAssignments.filter(assignment => {
      const base = bases.find(b => b.id === assignment.baseId);
      return base?.type === 'urban';
    }).length;
    
    rows.push([`${person.firstName} ${person.lastName}`, person.nationalId, urbanMissions]);
  });
  
  return rows;
}

function prepareRoadReport(data: ExportData): any[][] {
  const { personnel, assignments, bases } = data;
  
  const rows = [['نام و نام خانوادگی', 'کد ملی', 'ماموریت‌های جاده‌ای']];
  
  personnel.forEach(person => {
    const personAssignments = assignments.filter(a => a.personnelId === person.id);
    const roadMissions = personAssignments.filter(assignment => {
      const base = bases.find(b => b.id === assignment.baseId);
      return base?.type === 'road';
    }).length;
    
    rows.push([`${person.firstName} ${person.lastName}`, person.nationalId, roadMissions]);
  });
  
  return rows;
}

function prepareMealsReport(data: ExportData): any[][] {
  const { personnel, assignments } = data;
  
  const rows = [['نام و نام خانوادگی', 'کد ملی', 'تعداد غذا']];
  
  personnel.forEach(person => {
    const personAssignments = assignments.filter(a => a.personnelId === person.id);
    const mealCount = personAssignments.length; // One meal per shift assignment
    
    rows.push([`${person.firstName} ${person.lastName}`, person.nationalId, mealCount]);
  });
  
  return rows;
}

export async function exportToImage(elementId: string) {
  const { default: html2canvas } = await import('html2canvas');
  
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error('Element not found');
  }
  
  const canvas = await html2canvas(element, {
    useCORS: true,
    scale: 2,
    backgroundColor: '#ffffff',
  });
  
  // Create download link
  const link = document.createElement('a');
  link.download = `performance-grid-${Date.now()}.png`;
  link.href = canvas.toDataURL();
  link.click();
}
