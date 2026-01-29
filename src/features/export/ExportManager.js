import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Export utility functions for reports and data
 */
export class ExportManager {
  /**
   * Export analytics data as PDF
   */
  static exportAnalyticsPDF(data, filename = 'analytics-report.pdf') {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(16);
    doc.text('Analytics Report', 14, 15);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 25);
    
    // Summary
    doc.setFontSize(12);
    doc.text('Summary', 14, 35);
    
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Projects', data.projectCount || 0],
      ['Active Users', data.activeUsers || 0],
      ['Deployments', data.deployments || 0],
      ['Success Rate', `${data.successRate || 0}%`],
    ];
    
    doc.autoTable({
      startY: 40,
      head: [summaryData[0]],
      body: summaryData.slice(1),
      margin: { left: 14, right: 14 },
    });
    
    // Charts as images (if provided)
    if (data.chartImages) {
      let yPosition = doc.lastAutoTable.finalY + 10;
      Object.entries(data.chartImages).forEach(([title, imgData]) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 14;
        }
        doc.setFontSize(11);
        doc.text(title, 14, yPosition);
        doc.addImage(imgData, 'PNG', 14, yPosition + 5, 180, 80);
        yPosition += 90;
      });
    }
    
    doc.save(filename);
  }

  /**
   * Export data as CSV
   */
  static exportAsCSV(data, columns, filename = 'export.csv') {
    const headers = columns.map(col => col.header).join(',');
    const rows = data.map(row =>
      columns.map(col => {
        const value = row[col.key];
        // Escape quotes and wrap in quotes if contains comma
        const escaped = String(value || '').replace(/"/g, '""');
        return `"${escaped}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    this._downloadFile(csv, filename, 'text/csv');
  }

  /**
   * Export data as JSON
   */
  static exportAsJSON(data, filename = 'export.json') {
    const json = JSON.stringify(data, null, 2);
    this._downloadFile(json, filename, 'application/json');
  }

  /**
   * Export data as Excel (simple approach)
   */
  static exportAsExcel(data, sheetName = 'Sheet1', filename = 'export.xlsx') {
    const xlsx = require('xlsx');
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    xlsx.writeFile(workbook, filename);
  }

  /**
   * Export chart as image
   */
  static async exportChartAsImage(chartElement, filename = 'chart.png') {
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(chartElement);
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = filename;
    link.click();
  }

  /**
   * Export project structure as tree
   */
  static exportProjectStructure(project, filename = 'project-structure.txt') {
    const structure = this._buildProjectTree(project);
    this._downloadFile(structure, filename, 'text/plain');
  }

  /**
   * Helper: Download file
   */
  static _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Helper: Build project tree
   */
  static _buildProjectTree(project, indent = '') {
    let tree = `${project.name}\n`;
    if (project.entities) {
      project.entities.forEach((entity, idx) => {
        const isLast = idx === project.entities.length - 1;
        tree += `${indent}${isLast ? '└── ' : '├── '}${entity.name}\n`;
        if (entity.fields) {
          entity.fields.forEach((field, fieldIdx) => {
            const fieldIsLast = fieldIdx === entity.fields.length - 1;
            tree += `${indent}${isLast ? '    ' : '│   '}${fieldIsLast ? '└── ' : '├── '}${field.name} (${field.type})\n`;
          });
        }
      });
    }
    return tree;
  }
}

/**
 * Hook for export functionality
 */
export function useExport() {
  const exportData = (data, format = 'json', filename = 'export') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}-${timestamp}.${format}`;

    switch (format) {
      case 'json':
        ExportManager.exportAsJSON(data, fullFilename);
        break;
      case 'csv':
        ExportManager.exportAsCSV(data, Object.keys(data[0] || {}).map(k => ({
          key: k,
          header: k,
        })), fullFilename);
        break;
      case 'pdf':
        ExportManager.exportAnalyticsPDF(data, fullFilename);
        break;
      default:
        console.warn(`Unknown export format: ${format}`);
    }
  };

  return { exportData };
}
