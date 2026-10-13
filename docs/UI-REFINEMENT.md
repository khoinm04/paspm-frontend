# UI refinement · 14 October 2026

Design read: preserve the warm retail dashboard in the supplied Figma, with clearer hierarchy and less visual noise. Taste-skill dials: DESIGN_VARIANCE 3, MOTION_INTENSITY 1, VISUAL_DENSITY 4. Figma takes precedence over marketing-oriented skill defaults.

## Audit and preservation

Keep forest green `#1E3A2F`, warm canvas `#FAF8F5`, white panels, DM Sans, the desktop sidebar/topbar and the main/context-column hierarchy. Existing routes and role navigation remain the information architecture. Preserve the source photography and product images.

The audit found repeated demo/helper copy, a tall login form, inconsistent card action wrapping, and two structural differences: the mining configuration had lost its file summary and horizontal placement controls, while the detail view had lost the basket comparison and four-tier shelf diagram.

## Changes

- Restore the source file summary above mining rules, the completed-data/active-rules stepper, and the side-by-side group-size and cross-department controls.
- Put supplementary algorithm/schedule settings and sample import controls into native disclosure sections.
- Use a restrained import step highlight and keep the upload/connectors/context hierarchy.
- Remove the repeated pairing heading, align desktop card actions, use a quieter placement caption, and keep product/metric/advice blocks in their original order.
- Restore the two-panel basket comparison and four-tier shelf/clip-strip composition. Values come from the catalog; the comparison and diagram remain clearly illustrative.
- Give login a wider, shorter form with a compact role selector and a proper OR divider.
- Standardize type spacing, tabular numeric figures, inner radii, subtle shadows and reduced-motion-aware button feedback.
- Use an off-canvas navigation drawer at tablet widths through 1024px so the sidebar does not squeeze forms. Desktop retains the supplied sidebar composition.
- Reflow mobile pairing metrics into two columns plus a full-width location, keeping their labels readable.

## Evidence

Mining frame `7:2615` was read again using Figma design context. The remaining MCP calls hit the Starter quota; other visual targets are the original exports in `docs/figma-reference`. The work is a faithful composition refinement, not a pixel-perfect claim. Missing screens continue the shared design language.

Lint, TypeScript/build, and all 25 existing unit/component tests pass. Nine browser layout/state checks pass: existing desktop/mobile captures plus mining/detail at 320, 768 and 1024px. Screenshots in `artifacts/screenshots` now show this revision, including the 1440px preview. Images were visually inspected, including tablet input widths, mobile diagrams, login proportions and desktop card actions. Screenshot capture is visual evidence; there is no automated pixel-diff baseline.

No backend or mining service changes are part of this refinement. Earlier functional-review findings are outside this UI-only request.
