/**
 * Gera PDF a partir de docs/Relatorio-Tecnico-SmartComplaint.md (estilo relatório académico A4).
 * Requer Chromium via puppeteer (instalado com md-to-pdf).
 *
 * Execução: npm run report:tecnico-pdf
 */
import path from "path";
import { fileURLToPath } from "url";
import { mdToPdf } from "md-to-pdf";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const mdPath = path.join(root, "docs", "Relatorio-Tecnico-SmartComplaint.md");
const cssPath = path.join(root, "docs", "report-tecnico-pdf.css");
const outPath = path.join(root, "docs", "Relatorio-Tecnico-SmartComplaint.pdf");
const bundledMdCss = path.join(root, "node_modules", "md-to-pdf", "markdown.css");

const pdf = await mdToPdf(
  { path: mdPath },
  {
    basedir: root,
    dest: outPath,
    stylesheet: [bundledMdCss, cssPath],
    document_title: "Relatório Técnico — SmartComplaint",
    page_media_type: "print",
    pdf_options: {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "16mm", right: "14mm", bottom: "20mm", left: "14mm" },
      displayHeaderFooter: true,
      headerTemplate: "<div></div>",
      footerTemplate: `<div style="box-sizing:border-box;width:100%;font-size:9px;color:#333;text-align:center;font-family:Cambria,Georgia,serif;padding:0 8mm;">
        <span>SmartComplaint — Relatório Técnico</span>
        <span style="margin:0 0.5em">·</span>
        Página <span class="pageNumber"></span> de <span class="totalPages"></span>
      </div>`,
    },
    launch_options: {
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  }
);

if (!pdf?.filename) {
  console.error("Falha: md-to-pdf não devolveu ficheiro.");
  process.exit(1);
}

console.log("PDF gerado:", pdf.filename);
