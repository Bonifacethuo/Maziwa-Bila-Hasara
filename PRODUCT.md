# Product notes

## North star

Reduce **avoidable rejected litres per 100 litres presented** at a cooperating milk collection point while preserving animal welfare and food safety. Report both farmer income effects and safety outcomes; lower rejection counts alone can be misleading if testing weakens.

## Initial users and workflow

| Person | Need | Prototype action | Later system requirement |
| --- | --- | --- | --- |
| Farmer | Remember treatment instructions | Record provider, medicine, date, hold-through date, notes | Verified instructions, reminders and shared access |
| Farmer | Catch handling concerns before travel | Three-question checklist | Locally validated guidance and accessible voice/USSD |
| Collection clerk | Give a clear result and reason | Farmer records clerk's result | Clerk login, testing evidence, receipt and audit trail |
| Veterinarian | Keep treatment instructions accurate | Named provider field | Provider verification and an editable treatment protocol |

## Data dictionary, v1

- `animals`: `id`, `name` (or tag), optional `note`, `createdAt`.
- `treatments`: `id`, `animalId`, `name`, `vet`, `date`, optional `holdUntil`, optional `instructions`, `createdAt`. `holdUntil` is the last day **through which milk is held** as supplied by a veterinarian. Blank means ask; an elapsed date means review, never an automatic safe status.
- `checks`: `id`, `date`, `container`, `water`, `promptly` (`yes`, `no`, `unsure`), `flagged`, `createdAt`. A flag means follow up, not a test result.
- `deliveries`: `id`, `date`, `litres`, `status` (`accepted`, `rejected`), optional `reason` (required on rejection), optional `collector`, `createdAt`.

## Decisions to validate with farmers

- Which rejection reasons appear on actual collection receipts? Do clerks distinguish spoilage, adulteration, contamination, antibiotic test, and other results?
- Are farmers able to enter treatment details accurately, or should a veterinarian or cooperative enter them?
- Is Kiswahili text sufficient, and which local languages or voice prompts are useful?
- What device and connectivity conditions are typical at the farm and collection point?
- How should a cow-level hold warning relate to milk from a shared container? Never imply a mixed container is cleared by an unrelated animal's record.

## Backlog, in order

1. Observe a collection workflow and refine categories using actual receipts.
2. Design informed consent, farmer and clerk roles, secure shared records, and retention rules.
3. Add verified collection test evidence and a correction history.
4. Pilot reminders over a channel farmers prefer, with an explicit opt-in and delivery cost model.
5. Evaluate impact against a baseline and comparison group, including false reassurance and unintended harm.

## Claims we will not make

The app cannot certify milk safety, replace a laboratory test, set a withdrawal period, diagnose mastitis, or establish a causal effect from simple before-and-after counts.
