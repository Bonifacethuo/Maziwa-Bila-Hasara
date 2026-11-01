# Contributing

This is an early field prototype. Small changes with a clear farmer benefit are welcome.

1. Write down the farmer or collection point problem and the exact words people use. Remove names and phone numbers from public issues and screenshots.
2. Keep each change focused. For a new field, update `PRODUCT.md`, the English and Kiswahili labels, CSV export, and relevant validation.
3. Run `node --test tests/*.test.mjs`, serve the app locally, and check the workflow at phone width.
4. Include what changed, how you tested it, and what still needs field validation in the pull request.

Treat any suggestion about medicine or withdrawal as a veterinary decision. The software may record and remind; it must not generate a universal clearance date.


For a browser without device emulation, open `tests/mobile-preview.html` on the local server to inspect the app in 320px and 390px frames. Verify both English and Kiswahili navigation, form labels, touch controls and horizontal overflow. The frames use the browser's existing app records; use a separate test browser for any submissions. This helper is a layout preview, not a device or assistive-technology certification.
