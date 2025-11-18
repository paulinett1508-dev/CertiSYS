import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import type { CertificateWithRelations } from "@shared/schema";

function calculateStatistics(certificates: CertificateWithRelations[]) {
  const stats = {
    total: certificates.length,
    active: 0,
    expiringSoon: 0,
    expired: 0,
    byType: {} as Record<string, number>,
    byStatus: {} as Record<string, number>,
  };

  certificates.forEach((cert) => {
    if (cert.status === "active") stats.active++;
    if (cert.status === "expiring_soon") stats.expiringSoon++;
    if (cert.status === "expired") stats.expired++;

    stats.byType[cert.type] = (stats.byType[cert.type] || 0) + 1;
    stats.byStatus[cert.status] = (stats.byStatus[cert.status] || 0) + 1;
  });

  return stats;
}

export function generatePDFReport(
  certificates: CertificateWithRelations[]
): Buffer {
  const doc = new jsPDF();
  const statistics = calculateStatistics(certificates);

  // Title
  doc.setFontSize(18);
  doc.text("Relatório de Certidões Negativas", 14, 20);

  // Statistics
  doc.setFontSize(12);
  doc.text(`Total de Certidões: ${statistics.total}`, 14, 35);
  doc.text(`Ativas: ${statistics.active}`, 14, 42);
  doc.text(`Vencendo em breve: ${statistics.expiringSoon}`, 14, 49);
  doc.text(`Vencidas: ${statistics.expired}`, 14, 56);

  // Table
  const tableData = certificates.map((cert) => [
    cert.client?.name || "N/A",
    cert.type,
    cert.status === "active" ? "Ativa" : cert.status === "expiring_soon" ? "Vencendo" : "Vencida",
    new Date(cert.expiryDate).toLocaleDateString("pt-BR"),
    cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("pt-BR") : "N/A",
  ]);

  autoTable(doc, {
    head: [["Cliente", "Tipo", "Status", "Vencimento", "Emissão"]],
    body: tableData,
    startY: 65,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [66, 66, 66] },
  });

  return Buffer.from(doc.output("arraybuffer"));
}

export function generateExcelReport(
  certificates: CertificateWithRelations[]
): Buffer {
  const workbook = XLSX.utils.book_new();
  const statistics = calculateStatistics(certificates);

  // Statistics sheet
  const statsData = [
    ["Estatísticas Gerais"],
    ["Total de Certidões", statistics.total],
    ["Ativas", statistics.active],
    ["Vencendo em breve", statistics.expiringSoon],
    ["Vencidas", statistics.expired],
    [],
    ["Por Tipo"],
    ...Object.entries(statistics.byType).map(([type, count]) => [type, count]),
    [],
    ["Por Status"],
    ...Object.entries(statistics.byStatus).map(([status, count]) => [
      status === "active" ? "Ativa" : status === "expiring_soon" ? "Vencendo" : "Vencida",
      count,
    ]),
  ];
  const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
  XLSX.utils.book_append_sheet(workbook, statsSheet, "Estatísticas");

  // Certificates sheet
  const certData = [
    ["Cliente", "Tipo", "Status", "Data de Vencimento", "Data de Emissão", "Número", "Criado por"],
    ...certificates.map((cert) => [
      cert.client?.name || "N/A",
      cert.type,
      cert.status === "active" ? "Ativa" : cert.status === "expiring_soon" ? "Vencendo" : "Vencida",
      new Date(cert.expiryDate).toLocaleDateString("pt-BR"),
      cert.issueDate ? new Date(cert.issueDate).toLocaleDateString("pt-BR") : "N/A",
      cert.number || "N/A",
      cert.creator?.email || "N/A",
    ]),
  ];
  const certSheet = XLSX.utils.aoa_to_sheet(certData);
  XLSX.utils.book_append_sheet(workbook, certSheet, "Certidões");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
