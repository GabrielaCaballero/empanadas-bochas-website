// Anything a visitor typed that ends up inside an email's HTML has to be
// escaped first, or a message containing markup would render as markup in
// the business's inbox.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
