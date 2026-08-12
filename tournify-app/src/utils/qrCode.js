import QRCode from "qrcode";

function sanitizeFilePart(value) {
  return String(value || "sans-nom")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "sans-nom";
}

export function formatConnectionLinkLabel(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.host}/...`;
  } catch {
    return "lien/...";
  }
}

export async function downloadConnectionQrJpeg(url, teamName, tournamentName) {
  const pngDataUrl = await QRCode.toDataURL(url, {
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = pngDataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0);

  const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.92);
  const filename = `${sanitizeFilePart(teamName)}_${sanitizeFilePart(tournamentName)}.jpeg`;

  const link = document.createElement("a");
  link.href = jpegDataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  return filename;
}
