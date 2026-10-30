import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export async function stampPdf(params: {
  bytes: ArrayBuffer;
  fullName: string;
  email: string;
  coverTextColor?: "dark" | "white";
}) {
  const code = makeCode();
  const pdf = await PDFDocument.load(params.bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const footer = `Prepared for ${params.fullName} · ${params.email} · Code ${code} · Do not share`;
  const size = 8;
  const color =
    params.coverTextColor === "white" ? rgb(1, 1, 1) : rgb(0.15, 0.15, 0.18);

  pdf.setTitle(`Vantage · ${params.fullName}`);
  pdf.setAuthor("Vantage Tutoring");
  pdf.setSubject(`Download code ${code}`);
  pdf.setKeywords([`vantage-code:${code}`, params.email]);
  pdf.setProducer("Vantage Student Portal");
  pdf.setCreator("Vantage Tutoring");

  const pages = pdf.getPages();
  pages.forEach((page, index) => {
    const { width } = page.getSize();
    page.drawText(footer, {
      x: 36,
      y: 18,
      size,
      font,
      color: rgb(0.35, 0.35, 0.38),
    });

    if (index === 0) {
      const nameWidth = font.widthOfTextAtSize(params.fullName, 14);
      page.drawText(params.fullName, {
        x: Math.max(36, (width - nameWidth) / 2),
        y: 72,
        size: 14,
        font,
        color,
      });
    }
  });

  // Flatten by rewriting content stream via save (pdf-lib draws into content)
  const stamped = await pdf.save({ useObjectStreams: false });
  return { bytes: stamped, code };
}

export { makeCode };
