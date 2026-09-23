export interface ActivityRow {
  timestamp: string;
  userId: string;
  userEmail: string;
  eventType: string;
  device: string;
  location: string;
  ipAddress: string;
  details: string;
}

/** Minimal CSV parser that respects quoted fields (for our known 8-column format). */
export function parseActivityCsv(text: string): ActivityRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const rows: ActivityRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const fields = splitCsvLine(lines[i]);
    if (fields.length < 8) continue;
    rows.push({
      timestamp: fields[0].trim(),
      userId: fields[1].trim(),
      userEmail: fields[2].trim(),
      eventType: fields[3].trim(),
      device: fields[4].trim(),
      location: fields[5].trim(),
      ipAddress: fields[6].trim(),
      details: fields[7].trim(),
    });
  }
  return rows;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

export function groupByDay(rows: ActivityRow[]): Map<string, ActivityRow[]> {
  const m = new Map<string, ActivityRow[]>();
  for (const r of rows) {
    const day = r.timestamp.slice(0, 10);
    const arr = m.get(day) ?? [];
    arr.push(r);
    m.set(day, arr);
  }
  return m;
}
