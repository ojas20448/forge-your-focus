// PDF Report Generator - Generate weekly analytics reports as PDF
// Uses html2canvas and jsPDF for client-side PDF generation

import { WeeklyReport } from './analyticsEngine';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export class PDFReportGenerator {
  /**
   * Generate PDF report from weekly data
   */
  async generateWeeklyPDF(report: WeeklyReport, userName: string): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Header
    pdf.setFontSize(24);
    pdf.setTextColor(88, 28, 135); // Purple
    pdf.text('FocusForge Weekly Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`${format(new Date(report.weekStart), 'MMM d')} - ${format(new Date(report.weekEnd), 'MMM d, yyyy')}`, pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(0, 0, 0);
    pdf.text(userName, pageWidth / 2, yPos, { align: 'center' });

    yPos += 15;
    
    // Summary Box
    pdf.setFillColor(245, 245, 250);
    pdf.rect(15, yPos, pageWidth - 30, 40, 'F');
    
    yPos += 8;
    pdf.setFontSize(16);
    pdf.setTextColor(88, 28, 135);
    pdf.text('Weekly Summary', 20, yPos);
    
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    const summaryItems = [
      `XP Earned: ${report.summary.totalXp.toLocaleString()}`,
      `Focus Hours: ${report.summary.totalFocusHours}h`,
      `Tasks Completed: ${report.summary.tasksCompleted}`,
      `Completion Rate: ${Math.round(report.summary.completionRate * 100)}%`,
      `Current Streak: ${report.summary.streakDays} days`,
      `Avg Productivity: ${report.summary.avgProductivityScore}/100`,
    ];

    summaryItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      pdf.text(item, 20 + (col * 90), yPos + (row * 7));
    });

    yPos += 30;

    // Burnout Analysis
    if (report.burnoutAnalysis) {
      this.checkPageBreak(pdf, yPos, 50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text('Burnout Analysis', 20, yPos);
      
      yPos += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      const riskColors: Record<string, [number, number, number]> = {
        critical: [220, 38, 38],
        high: [234, 88, 12],
        moderate: [234, 179, 8],
        low: [34, 197, 94],
      };
      
      const color = riskColors[report.burnoutAnalysis.riskLevel];
      pdf.setTextColor(...color);
      pdf.text(`Risk Level: ${report.burnoutAnalysis.riskLevel.toUpperCase()} (${report.burnoutAnalysis.burnoutScore}/100)`, 20, yPos);
      
      yPos += 8;
      pdf.setTextColor(0, 0, 0);
      
      if (report.burnoutAnalysis.warnings.length > 0) {
        pdf.setFontSize(10);
        pdf.text('⚠️  Warnings:', 20, yPos);
        yPos += 6;
        
        report.burnoutAnalysis.warnings.slice(0, 3).forEach(warning => {
          pdf.text(`• ${warning}`, 25, yPos);
          yPos += 5;
        });
      }
      
      yPos += 5;
    }

    // Top Performing Hours
    this.checkPageBreak(pdf, yPos, 40);
    
    pdf.setFontSize(14);
    pdf.setTextColor(88, 28, 135);
    pdf.text('Peak Productivity Hours', 20, yPos);
    
    yPos += 8;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    
    const topHours = report.topPerformingHours.slice(0, 5);
    pdf.text(`Best times to schedule important tasks: ${topHours.map(h => `${h}:00`).join(', ')}`, 20, yPos);
    
    yPos += 15;

    // Comparative Analysis
    if (report.comparativeAnalysis) {
      this.checkPageBreak(pdf, yPos, 50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text('League Performance', 20, yPos);
      
      yPos += 8;
      pdf.setFontSize(11);
      pdf.setTextColor(0, 0, 0);
      
      pdf.text(`Rank: #${report.comparativeAnalysis.rank} of ${report.comparativeAnalysis.totalUsers}`, 20, yPos);
      yPos += 6;
      pdf.text(`Percentile: ${report.comparativeAnalysis.percentile}th (Top ${100 - report.comparativeAnalysis.percentile}%)`, 20, yPos);
      
      yPos += 10;
      pdf.setFillColor(245, 245, 250);
      pdf.rect(20, yPos - 5, (pageWidth - 40) / 2 - 5, 25, 'F');
      pdf.rect((pageWidth - 40) / 2 + 25, yPos - 5, (pageWidth - 40) / 2 - 5, 25, 'F');
      
      pdf.setFontSize(10);
      pdf.text('Your Performance', 25, yPos);
      pdf.text('League Average', (pageWidth - 40) / 2 + 30, yPos);
      
      yPos += 6;
      pdf.setFontSize(9);
      pdf.text(`XP: ${report.comparativeAnalysis.userPerformance.weeklyXp}`, 25, yPos);
      pdf.text(`XP: ${report.comparativeAnalysis.cohortAverage.weeklyXp}`, (pageWidth - 40) / 2 + 30, yPos);
      
      yPos += 5;
      pdf.text(`Hours: ${report.comparativeAnalysis.userPerformance.weeklyFocusHours}h`, 25, yPos);
      pdf.text(`Hours: ${report.comparativeAnalysis.cohortAverage.weeklyFocusHours}h`, (pageWidth - 40) / 2 + 30, yPos);
      
      yPos += 5;
      pdf.text(`Tasks/day: ${report.comparativeAnalysis.userPerformance.avgTasksPerDay}`, 25, yPos);
      pdf.text(`Tasks/day: ${report.comparativeAnalysis.cohortAverage.avgTasksPerDay}`, (pageWidth - 40) / 2 + 30, yPos);
      
      yPos += 15;
    }

    // Task Predictions
    if (report.predictions.length > 0) {
      this.checkPageBreak(pdf, yPos, 50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text('High-Risk Tasks', 20, yPos);
      
      yPos += 8;
      pdf.setFontSize(9);
      pdf.setTextColor(0, 0, 0);
      
      report.predictions.slice(0, 5).forEach(pred => {
        const riskPercent = Math.round(pred.failureProbability * 100);
        pdf.text(`• ${pred.taskTitle} (${riskPercent}% failure risk)`, 20, yPos);
        yPos += 5;
        
        if (pred.recommendations.length > 0) {
          pdf.setTextColor(100, 100, 100);
          pdf.text(`  → ${pred.recommendations[0]}`, 22, yPos);
          pdf.setTextColor(0, 0, 0);
          yPos += 5;
        }
      });
      
      yPos += 5;
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      this.checkPageBreak(pdf, yPos, 50);
      
      pdf.setFontSize(14);
      pdf.setTextColor(88, 28, 135);
      pdf.text('💡 Key Recommendations', 20, yPos);
      
      yPos += 8;
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      
      report.recommendations.forEach((rec, i) => {
        this.checkPageBreak(pdf, yPos, 15);
        
        pdf.setFillColor(245, 245, 250);
        pdf.rect(20, yPos - 4, pageWidth - 40, 8, 'F');
        
        pdf.text(`${i + 1}. ${rec}`, 25, yPos);
        yPos += 10;
      });
    }

    // Footer
    const footerY = pageHeight - 15;
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Generated by FocusForge Analytics Engine', pageWidth / 2, footerY, { align: 'center' });
    pdf.text(format(new Date(), 'PPpp'), pageWidth / 2, footerY + 4, { align: 'center' });

    return pdf.output('blob');
  }

  /**
   * Check if we need a page break
   */
  private checkPageBreak(pdf: jsPDF, currentY: number, requiredSpace: number): number {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (currentY + requiredSpace > pageHeight - 20) {
      pdf.addPage();
      return 20;
    }
    return currentY;
  }

  /**
   * Download PDF file
   */
  async downloadWeeklyPDF(report: WeeklyReport, userName: string): Promise<void> {
    const blob = await this.generateWeeklyPDF(report, userName);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FocusForge_Weekly_Report_${format(new Date(report.weekStart), 'yyyy-MM-dd')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Singleton instance
export const pdfReportGenerator = new PDFReportGenerator();
