# Certificate template presets (from user samples)

Three preset layouts to offer in the certificate template designer. ALL rebranded
to Vitalcare colours — navy `#1b2e6b`, gold `#d4a843` — NOT the sample purples/blues.
Every preset MUST carry a signature block. Default signatory:

> Overseen by **Harni Muharami RN MSc**, Clinical Director

Plus an optional uploaded signature image per signatory line. Logos live in
`public/logos/` (use `logo-horizontal-navy.svg` on white, `logo-round-navy.svg` for the seal area).

Common dynamic fields (placeholders the designer fills at issue time):
`{{learner_name}}`, `{{course_title}}`, `{{cpd_hours}}`, `{{issued_date}}`,
`{{certificate_id}}`, `{{verification_url}}` (vitalcare.uk/verify), `{{clinical_director}}`.
Standard accreditation line: "CSTF-aligned, CPD-accredited, verifiable at vitalcare.uk/verify".

A4 landscape (≈1086×768 preview).

## Preset 1 — "Completion" (banner + medallion)
- Top navy band (~38% height) with a gold wavy divider beneath it; gold rosette
  medallion top-right overlapping the divider.
- Title in band, white, font-display: "CERTIFICATE" with "OF COMPLETION" beneath.
- Body area white: round Vitalcare logo + org name on the left column; right column
  "THIS IS TO CERTIFY THAT", large `{{learner_name}}`, then recital text referencing
  `{{course_title}}` and `{{issued_date}}`.
- Two signature lines bottom: left = Clinical Director (Harni Muharami RN MSc),
  right = Training Instructor / issuing trainer. Accreditation line centred at foot.

## Preset 2 — "Participation" (wave + hexagons)
- Navy flowing waves in opposite corners (top-left, bottom-right) with subtle gold
  edge; small hexagon accents scattered; navy+gold star rosette top-right.
- Centred layout, font-display title "CERTIFICATE" + "OF PARTICIPATION".
- "This certificate is proudly presented to", centred `{{learner_name}}` (large,
  gold-to-navy gradient text), body recital centred.
- Single signature bottom-left: Clinical Director + optional signature image.
- Accreditation + `{{certificate_id}}` small at foot.

## Preset 3 — "Achievement" (ornate border)
- Navy + gold double ornate border framing the page; navy corner blocks top, gold
  band lower third; subtle hex watermark.
- Centred serif title "CERTIFICATE" + gold "OF ACHIEVEMENT".
- "This certificate is proudly presented to", centred `{{learner_name}}` with a gold
  underline rule, body recital centred.
- Central gold medallion between two signature lines: left + right signatories
  (Clinical Director default left). Optional uploaded signature images above names.

## Notes
- Persist chosen preset id + per-section text overrides + optional signature image
  URLs on the certificate template row.
- Live side-by-side: form inputs (per section) on the left, the rendered preset on
  the right, updating as fields change. Printable / exportable to PDF.
