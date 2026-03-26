import { jsPDF } from "jspdf";
import "jspdf-autotable";

export interface PDFOptions {
  pageSize: "a4" | "letter" | "legal";
  orientation: "p" | "l";
  title: string;
  author: string;
  header: string;
  footer: string;
  showPageNumbers: boolean;
  includeTOC: boolean;
}

export async function generatePDF(
  content: { type: "text" | "image" | "markdown"; data: string }[],
  options: PDFOptions
): Promise<Blob> {
  const doc = new jsPDF({
    format: options.pageSize,
    orientation: options.orientation,
    unit: "mm",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const addHeaderFooter = (pageNumber: number, totalPages: number) => {
    doc.setFontSize(10);
    doc.setTextColor(150);
    
    // Header
    if (options.header) {
      doc.text(options.header, margin, 10);
    }

    // Footer
    if (options.footer) {
      doc.text(options.footer, margin, pageHeight - 10);
    }

    // Page numbers
    if (options.showPageNumbers) {
      const pageText = `Page ${pageNumber} of ${totalPages}`;
      doc.text(pageText, pageWidth - margin - doc.getTextWidth(pageText), pageHeight - 10);
    }
  };

  // Title Page
  if (options.title) {
    doc.setFontSize(24);
    doc.setTextColor(0);
    doc.text(options.title, pageWidth / 2, pageHeight / 3, { align: "center" });
    
    if (options.author) {
      doc.setFontSize(14);
      doc.text(`By ${options.author}`, pageWidth / 2, pageHeight / 3 + 15, { align: "center" });
    }
    
    doc.addPage();
    cursorY = margin;
  }

  // Process Content
  for (let i = 0; i < content.length; i++) {
    const item = content[i];

    if (item.type === "text" || item.type === "markdown") {
      const lines = item.data.split("\n");
      
      for (const line of lines) {
        // Simple Markdown-ish header detection
        if (line.startsWith("# ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(18);
          const text = line.replace("# ", "");
          if (cursorY + 10 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
          doc.text(text, margin, cursorY);
          cursorY += 12;
        } else if (line.startsWith("## ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(15);
          const text = line.replace("## ", "");
          if (cursorY + 8 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
          doc.text(text, margin, cursorY);
          cursorY += 10;
        } else if (line.startsWith("### ")) {
          doc.setFont("helvetica", "bold");
          doc.setFontSize(13);
          const text = line.replace("### ", "");
          if (cursorY + 7 > pageHeight - margin) { doc.addPage(); cursorY = margin; }
          doc.text(text, margin, cursorY);
          cursorY += 8;
        } else {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(11);
          const wrappedLines = doc.splitTextToSize(line, contentWidth);
          for (const wLine of wrappedLines) {
            if (cursorY + 6 > pageHeight - margin) {
              doc.addPage();
              cursorY = margin;
            }
            doc.text(wLine, margin, cursorY);
            cursorY += 6;
          }
        }
      }
      cursorY += 10;
    } else if (item.type === "image") {
      try {
        const img = new Image();
        img.src = item.data;
        await new Promise((resolve) => (img.onload = resolve));

        const imgWidth = img.width;
        const imgHeight = img.height;
        const ratio = imgWidth / imgHeight;
        
        let targetWidth = contentWidth;
        let targetHeight = targetWidth / ratio;

        if (targetHeight > pageHeight - margin * 2) {
          targetHeight = pageHeight - margin * 2;
          targetWidth = targetHeight * ratio;
        }

        if (cursorY + targetHeight > pageHeight - margin) {
          doc.addPage();
          cursorY = margin;
        }

        doc.addImage(item.data, "JPEG", margin + (contentWidth - targetWidth) / 2, cursorY, targetWidth, targetHeight);
        cursorY += targetHeight + 10;
      } catch (e) {
        console.error("Error adding image to PDF", e);
      }
    }
  }

  // Add Headers/Footers to all pages
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderFooter(i, totalPages);
  }

  return doc.output("blob");
}
