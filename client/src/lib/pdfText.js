import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    // pdf.js splits text into positioned items; joining with newlines when a
    // new line's y-position changes keeps roughly one transcript row per line.
    // Separate table cells are often separate items with no literal space
    // character between them, so a horizontal gap also needs an inserted space
    // — otherwise adjacent columns (e.g. a course code and its title) glue
    // together into one unparseable token.
    let lastY = null;
    let lastEndX = null;
    let line = "";
    const lines = [];
    for (const item of content.items) {
      const y = item.transform[5];
      const x = item.transform[4];
      const isNewLine = lastY !== null && Math.abs(y - lastY) > 2;
      if (isNewLine) {
        lines.push(line);
        line = "";
        lastEndX = null;
      } else if (lastEndX !== null && x - lastEndX > 2 && !line.endsWith(" ") && !item.str.startsWith(" ")) {
        line += " ";
      }
      line += item.str;
      lastY = y;
      lastEndX = x + (item.width ?? 0);
    }
    if (line) lines.push(line);
    pageTexts.push(lines.join("\n"));
  }
  return pageTexts.join("\n");
}
