# Maziwa Bila Hasara

**Every litre matters.** A smallholder dairy prototype for recording treatments, preparing for milk collection, and learning from collection results. Designed in a Kenyan context with English and Kiswahili interface text.

## The one problem

Avoidable milk rejection at collection costs farmers income and can obscure the cause of a failed delivery. This prototype helps a farmer keep a simple treatment record, review handling steps before travelling, and record the collector's actual result. It does **not** test milk, diagnose disease, prescribe treatment, or certify that milk is safe. Follow the veterinarian's instructions and the collection point's testing procedure.

## What works in v0.1

- Register animals with names or tags.
- Record a treatment, animal health provider, date, exact instructions, and an optional **vet supplied** hold-through date. Missing dates prompt a vet check; dates that have passed never automatically clear milk for sale.
- Run a three-question precollection checklist for container, cleaning water, and prompt cooling or delivery. A concern produces a follow-up warning.
- Record accepted or rejected litres and a reason supplied by the collector. A rejected result requires a reason.
- See totals and recent results. Export four separate CSV backups, with spreadsheet formula injection protection.
- Use the interface in English or Kiswahili. Installable service worker caches the app shell for offline use after the first load.

## Run locally

This version has no external dependencies or account setup. Serve it over HTTP (service workers do not run from `file://`):

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. Run the domain tests with:

```bash
node --test tests/*.test.mjs
```

## Data and pilot limits

All records currently live in **this browser's local storage**. Farmers and collection clerks on different devices cannot see each other's entries. Data can disappear if the browser is cleared or a device is lost. Export backups regularly; CSV files contain potentially sensitive farm and treatment information. There is no server, login, automatic SMS/WhatsApp, veterinarian verification, laboratory integration, or production-grade consent and access controls yet. Do not use this prototype as a collection point's official record.

The "offline ready" interface refers to the cached app shell after its first successful load. The system cannot guarantee offline availability on a browser that blocks service workers or clears its cache.

## Pilot learning plan

1. Interview farmers, collection clerks, and veterinarians about the actual rejection categories, language, phone access, and who should enter each record.
2. Obtain a willing collection point's baseline **accepted/rejected litres and reasons** before using the tool.
3. Test the workflow with consent. Compare rejection rate and rejected litres over time, while recording seasonality and changes in testing. Never claim the app caused a reduction without a credible comparison.
4. Build shared accounts, audit logs, verified test results, and privacy controls before a multi-device field deployment.

Research and context: [ILRI on smallholder milk quality practices](https://www.ilri.org/knowledge/publications/milk-quality-and-hygiene-knowledge-attitudes-and-practices-smallholder-dairy), [ILRI MaziwaPlus](https://www.ilri.org/research/projects/maziwaplus-reducing-mastitis-incidence-and-improving-antibiotic-stewardship), and [World Bank on Kenyan dairy traceability](https://blogs.worldbank.org/en/impactevaluations/let-the-cream-rise-to-the-top--digital-traceability-and-quality-). The concept is independently implemented; these sources are context, not an endorsement or partnership.

## Extend it every day

See [PRODUCT.md](PRODUCT.md) for scope, data fields, and the next decisions. Add field observations as a dated note under `research/`, then open a small issue or pull request with the exact change and how to verify it. Keep farmer language simple, protect personal and treatment data, and maintain the distinction between reminders and laboratory tests.

## License

MIT, see [LICENSE](LICENSE). This license covers the code and design in this repository. It does not grant permission to use third-party names or marks.
