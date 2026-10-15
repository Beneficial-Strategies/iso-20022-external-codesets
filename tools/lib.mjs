// Reading ISO's ExternalCodeSets JSON (a JSON Schema: one definition per code set, its codes in `enum`, and the text of every code inside
// the definition's `description`, one line per code: *`CODE`-text). Pure functions, no I/O.

const ITEM = /^\*`([^`]+)`-(.*)$/;
/** ISO writes "Name (ABBR) - definition" for many codes. The part before " - " is the name, if it reads like one. */
const NAME_LIMIT = 80;

/** "2Q2026_externalcodesets_v3.json" -> "2Q2026 v3" (the release is only in ISO's file name); the file name itself if it does not fit. */
export function releaseOf(fileName) {
  const m = /(\dQ\d{4})_externalcodesets_v(\d+)/i.exec(fileName);
  return m ? `${m[1]} v${m[2]}` : fileName.replace(/\.json$/i, '');
}

function nameOf(text) {
  const i = text.indexOf(' - ');
  if (i <= 0) return undefined;
  const name = text.slice(0, i).trim();
  return name.length <= NAME_LIMIT && !/\.\s/.test(name) ? name : undefined;
}

/**
 * One code set of ISO's JSON as a resource: { type, definition, length?, pattern?, values: [{ value, text, name? }] }.
 * `text` is ISO's text for the code, verbatim (several lines are joined with a newline). `name` is present only where the text has the form
 * "Name - definition". Throws if the codes in the text and the codes in `enum` differ: ISO's file would have changed shape.
 */
export function codeSet(type, def) {
  const lines = String(def.description ?? '').replace(/\r/g, '').split('\n');
  const first = lines.findIndex((l) => ITEM.test(l));
  const head = (first < 0 ? lines : lines.slice(0, first)).filter((l) => l.trim());
  const values = [];
  if (first >= 0) {
    for (const line of lines.slice(first)) {
      const m = ITEM.exec(line);
      if (m) values.push({ value: m[1], text: m[2].trim() });
      else if (line.trim() && values.length) values[values.length - 1].text += `\n${line.trim()}`;
    }
  }
  for (const v of values) {
    const name = nameOf(v.text);
    if (name) v.name = name;
  }
  const listed = def.enum ?? [];
  if (JSON.stringify(values.map((v) => v.value)) !== JSON.stringify(listed)) {
    throw new Error(`${type}: the codes in the description (${values.length}) are not the codes in enum (${listed.length})`);
  }
  const out = { type, definition: head[0]?.trim() ?? '' };
  if (def.minLength !== undefined || def.maxLength !== undefined) out.length = { min: def.minLength, max: def.maxLength };
  if (def.pattern) out.pattern = def.pattern;
  out.values = values;
  return out;
}

/** Every code set of the file, in the file's order. */
export function codeSets(json) {
  const defs = json.definitions ?? {};
  return Object.entries(defs).map(([type, def]) => codeSet(type, def));
}
