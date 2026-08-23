/**
 * Minimal RFC 4180-ish CSV parser: handles quoted fields and escaped quotes ("").
 * Government CSV exports are small (a few thousand rows at most), so this
 * favors correctness/readability over streaming performance.
 */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\r") {
      // skip; \n handles the row break
    } else if (c === "\n") {
      pushRow();
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) {
    pushRow();
  }

  const header = rows.shift() ?? [];
  return rows
    .filter((r) => r.length === header.length && r.some((cell) => cell !== ""))
    .map((r) => Object.fromEntries(header.map((key, idx) => [key, r[idx]])));
}
