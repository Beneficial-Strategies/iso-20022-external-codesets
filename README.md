# ISO 20022 external code sets

ISO publishes the **external code sets** of ISO 20022 (purpose codes, clearing systems, local instruments, return reasons, ...) as a file that it
replaces a few times a year. This repository follows that file and serves each code set as a small JSON file:

**https://iso-20022-external-codesets.beneficialstrategies.com**

It is the same kind of host as the [text hosts](https://github.com/Beneficial-Strategies/iso-20022-text), but it is not specific to a language. Tools that
show an external code set as a dropdown (the [Headless](https://github.com/Beneficial-Strategies/Iso20022Headless) form library and the Message Explorer
among them) can read it instead of carrying their own copy. The names and definitions are ISO's English; translating them is the language repositories' job.

> **Status: new.** The release below is what ISO published; whether a client uses this host is its choice (see *Using it*).

## How it stays current

1. **Every night** `.github/workflows/nightly.yml` downloads
   [ISO's `ExternalCodeSets_JSON.zip`](https://www.iso20022.org/sites/default/files/media/file/ExternalCodeSets_JSON.zip), extracts the JSON, and compares it
   (a hash of the contents) with `source/`.
2. **If nothing changed**, nothing else happens. ISO publishes about quarterly, so most nights end here.
3. **If it changed**, the run tests and builds the new copy, and opens a **pull request** with what changed: code sets added or removed, codes added,
   removed or reworded. It refuses a file that does not read as before, or that has lost more than a tenth of its code sets.
4. **Merging the pull request deploys it.** Cloudflare builds `main`; every branch (including the nightly pull request) also gets a preview address.
   A person looks at the change before it reaches anyone's dropdown.

If the nightly run itself fails, it opens an issue labelled `nightly-failed`.

## Addresses

One file per code set, no file extension, any origin allowed (`Access-Control-Allow-Origin: *`), `Content-Type: application/json; charset=utf-8`.

| Path | Returns |
| --- | --- |
| `/{CodeSetName}` | the **code set**: its codes with ISO's text, for example `/ExternalPurpose1Code` |
| `/coverage` | every code set that exists here, with its number of codes. **A code set not listed here does not exist**; a client asks this once |
| `/manifest` | the release, where the data came from (address, file, date, SHA-256), totals, and a `notice` saying the lists are ISO's and this is not the official site |

A path that is not published answers `404`. Names are ISO's own (`ExternalPurpose1Code`); they start with an upper-case letter, so they cannot clash
with `coverage` or `manifest`.

### A code set

```json
{
  "type": "ExternalPurpose1Code",
  "definition": "Specifies the external purpose code in the format of character string with a maximum length of 4 characters.",
  "length": { "min": 1, "max": 4 },
  "values": [
    { "value": "BKDF", "text": "Delayed draw funding. Certain issuers may utilize delayed draw loans ..." },
    { "value": "AIIN", "text": "Issuer Identification Number (IIN) - identifies a card issuing institution ...", "name": "Issuer Identification Number (IIN)" }
  ],
  "release": "2Q2026 v3"
}
```

- `values` are in ISO's order. `value` is the code.
- `text` is ISO's text for the code, **verbatim**. ISO's file does not separate a name from a definition.
- `name` is present only where the text has ISO's own form `Name - definition`; it is the part before the dash. Otherwise show `text` as it is.
- A code set ISO publishes no list for has `"values": []` (and is in `/coverage` with 0): the field is free text.
- `length` and `pattern` are ISO's, for information. **External code sets are not closed lists**: ISO adds codes between releases and banks use their own, so a
  client should accept any value of the right length and offer these as options.

## Using it

A client treats the host as the primary source when it has been told about it, and keeps what it already has (the values burned into the library) for when
the host is not configured or does not answer. Ask `/coverage` once to learn which code sets exist, then fetch `/{CodeSetName}` for the ones a form shows.
Translations are applied by the client from the text hosts, keyed by the code, as for any other code.

## Run it, or host your own

```sh
npm test                 # Node 24; `unzip` is needed only for the download
npm run build            # writes site/
npm run serve            # http://localhost:8807/ExternalPurpose1Code
npm run fetch            # download ISO's file now; changes source/ if it differs
```

A company that wants its own codes (an internal purpose code, a local instrument) can **fork this repository**, add to `source/` or to the build, deploy its own
host, and point its application at it. The addresses above are the whole contract.

## Layout

| Path | What |
| --- | --- |
| `source/ExternalCodeSets.json`, `source/source.json` | ISO's file exactly as downloaded, and where and when it came from |
| `tools/fetch.mjs` | the nightly download and comparison |
| `tools/lib.mjs` | reads ISO's file (a JSON Schema whose descriptions carry the codes' text) |
| `tools/build.mjs` | `source/` to `site/` |
| `tools/diff.mjs` | what changed between two copies, as Markdown for the pull request |
| `wrangler.jsonc` | the host (Cloudflare, static assets) |

## License and ISO's material

The code and documentation here are MIT (see [LICENSE](LICENSE)). **The code lists and their text are ISO's**, from ISO's
[external code sets page](https://www.iso20022.org/catalogue-messages/additional-content-messages/external-code-sets). We publish them unchanged, only split by code set.
The host also says this in the `notice` field of `/manifest`.

**ISO 20022 material.** The ISO 20022 specification, its schemas, code sets and their text are ISO's. ISO and its Registration Authority publish them to be used and reproduced freely under the [ISO 20022 Terms of use](https://www.iso20022.org/terms-use) and the [Intellectual Property Rights Policy](https://www.iso20022.org/intellectual-property-rights). **This is not the official ISO 20022 site. The sole source of up-to-date material is <https://www.iso20022.org/>.** ISO's material is provided "as is", without warranty. The license of this repository covers what we wrote, not ISO's material. This is not legal advice.

No warranty: check ISO's own files for anything that matters.
