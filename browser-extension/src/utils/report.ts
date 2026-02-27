import { utils, write } from 'xlsx-js-style';
import type { IssueData, ReportFormData } from '../types/issue';
import { getTranslation } from '@/lib/i18n';
import type { Locale } from '@/lib/i18n';

const defaultCellStyle = {
  font: { name: 'Calibri', sz: 11 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const headerCellStyle = {
  font: { name: 'Calibri', sz: 14, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'D9E1F2' } },
  border: {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const labelCellStyle = {
  font: { name: 'Calibri', sz: 11, bold: true },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  fill: { type: 'pattern', pattern: 'solid', fgColor: { rgb: 'F2F2F2' } },
  border: {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
    left: { style: 'thin' },
    right: { style: 'thin' },
  },
};

const cellAddress = (row: number, col: number): string => {
  const colLetter = String.fromCharCode(65 + col);
  return `${colLetter}${row + 1}`;
};

export const generateReport = (_: IssueData, formData: ReportFormData, locale: Locale): any => {
  const workbook = utils.book_new();

  const t = (key: string) => getTranslation(locale, key);

  const data: string[][] = [
    [t('issueReport.reportTitle')],
    [t('issueReport.redmineIdLabel'), formData.redmineId, "", ""],
    [t('issueReport.titleLabel'), formData.title, "", ""],
    [t('issueReport.filesLabel'), formData.files, "", ""],
    [t('issueReport.modifier'), formData.modifier, "", t('issueReport.modifiedDate'), formData.modifyDate],
    [t('issueReport.solution'), formData.solution, "", ""],
    [t('issueReport.reason'), formData.reason, "", ""],
    [t('issueReport.debuggingResults'), t('issueReport.initialState'), "", "", ""],
    ["", formData.debuggingResults.initialState, "", "", ""],
    ["", t('issueReport.resultState'), "", "", ""],
    ["", formData.debuggingResults.resultState, "", "", ""],
    [t('issueReport.aiUsage'), "", "", "", ""],
  ];

  const worksheet = utils.aoa_to_sheet(data);

  worksheet['!cols'] = [{ wch: 15 }, { wch: 45 }, { wch: 2 }, { wch: 15 }, { wch: 45 }];
  worksheet['!rows'] = [
    { hpt: 20 }, { hpt: 60 }, { hpt: 60 }, { hpt: 60 }, { hpt: 120 }, { hpt: 80 }, { hpt: 80 },
    { hpt: 30 }, { hpt: 60 }, { hpt: 30 }, { hpt: 60 }, { hpt: 30 }
  ];

  const range = utils.decode_range(worksheet['!ref']!);
  for (let R = range.s.r; R <= range.e.r; R++) {
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = cellAddress(R, C);
      if (!worksheet[addr]) {
        worksheet[addr] = { v: '', t: 's' };
      }
      const cell = worksheet[addr];

      if (R === 0) {
        cell.s = headerCellStyle;
      } else if (C === 0) {
        cell.s = labelCellStyle;
      } else {
        cell.s = defaultCellStyle;
      }
    }
  }

  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    { s: { r: 1, c: 1 }, e: { r: 1, c: 4 } },
    { s: { r: 2, c: 1 }, e: { r: 2, c: 4 } },
    { s: { r: 3, c: 1 }, e: { r: 3, c: 4 } },
    { s: { r: 5, c: 1 }, e: { r: 5, c: 4 } },
    { s: { r: 6, c: 1 }, e: { r: 6, c: 4 } },
    { s: { r: 7, c: 1 }, e: { r: 7, c: 4 } },
    { s: { r: 8, c: 1 }, e: { r: 8, c: 4 } },
    { s: { r: 9, c: 1 }, e: { r: 9, c: 4 } },
    { s: { r: 10, c: 1 }, e: { r: 10, c: 4 } },
    { s: { r: 11, c: 1 }, e: { r: 11, c: 4 } },
    { s: { r: 12, c: 1 }, e: { r: 12, c: 4 } },
  ];

  utils.book_append_sheet(workbook, worksheet, 'Report');

  return workbook;
};

export const downloadReport = (workbook: any, filename: string): void => {
  const buffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const generateAndDownloadReport = (
  issueData: IssueData,
  formData: ReportFormData,
  locale: Locale
): void => {
  const workbook = generateReport(issueData, formData, locale);
  const filename = `${issueData.id}.xlsx`;
  downloadReport(workbook, filename);
};
