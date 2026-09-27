# Motion foundation — Transitions.dev

User direction: all authored UI animation should use https://transitions.dev/. Latest visual reference is [multicolor Dashboard V2](DASHBOARD-V2.md); SVG icons and responsive browser scope remain active. Latest navigation feedback simplifies recipe08 to a120ms opacity-only fade with no slide/filter or permanent will-change. Other recipe clocks remain.

## Source and usage rights

Read the official [skill](https://github.com/Jakubantalik/transitions.dev/blob/e2d5551656e4d3274e075d1cbd9a95af50f53225/skills/transitions-dev/SKILL.md) and selected public recipes at commit `e2d5551656e4d3274e075d1cbd9a95af50f53225` (27 September 2026). The recipe CSS lives in [motion.css](../src/motion.css), imported last after Dashboard V2. Recipe hooks, timing variables and reduced-motion guards remain; the page recipe now removes filter/transform from its property list and uses only opacity120ms to meet lighter navigation feedback. Formatting follows project Prettier.

Transitions are licensed under [Transitions.dev terms](https://transitions.dev/terms.html), **not MIT**. These allow modifying and shipping recipes inside personal/commercial products. Do not extract this implementation into a competing animation library or template collection. Copyright 2026 Jakub Antalik / Transitions.dev. No Pro recipes, paid subscription, remote runtime, agent relay, global skill installation or animation dependency was added.

## Implemented mapping

| Public recipe        | Masuk Saku use                                                                            | Clock                                   |
| -------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------- |
| 06 Modal             | Transaction, planning, receipt, history and mobile-menu native dialogs                    | 250ms open / 150ms close, scale 0.96    |
| 08 Page side-by-side | Incoming dashboard/transaction/wallet/planning/settings/trash content, simplified to fade | 120ms opacity only; no filter/transform |
| 09 Icon swap         | Eye/EyeOff on balance privacy and password visibility                                     | 250ms                                   |
| 15 Shimmer text      | Actual session/loading/receipt/history/auth busy labels                                   | 2000ms loop while pending               |
| 18 Texts reveal      | Welcome headline then supporting text                                                     | 500ms with 40ms stagger, 12px rise      |
| 21 Accordion         | Welcome FAQ disclosure and Lucide chevron                                                 | 250ms                                   |
| 22 Toast             | Existing transaction/status notifications; explicit dismiss remains                       | 350ms enter / 250ms leave               |
| 24 Learn more hover  | Welcome CTA and introductory link chevron                                                 | 350ms, 2px shift                        |

Legacy control color/border/focus feedback now reads the shared 150ms duration and smooth-out easing from the source token scale. The previous custom spinning keyframe was removed. Static decorative rotations and native browser smooth anchor scrolling are not custom animation recipes. Hover chevrons retain licensed Lucide geometry; only the recipe's whole-icon translation is used, without custom SVG path morphing.

## Lifecycle and accessibility

- [useMotionDialog](../src/lib/motion.ts) owns native showModal, focus restoration and timed close cleanup. It reads the CSS close clock. Closing is inert and ignores repeated dismissal. Submit handlers reject busy/closing requests. Animations never delay a ledger RPC or substitute for human confirmation; only UI removal follows the close clock after save succeeds. Unmount/session changes clear timers immediately.
- Native dialog backdrops intercept pointer input during exit. Transaction previews are keyed by their own request key, so opening a fresh preview cancels the previous surface's close timer and initializes the correct draft values. A rapid-reopen regression verifies this without writing money.
- [MotionPage](../src/components/Motion.tsx) replays the recipe on page changes without remounting the content root. Only the incoming financial view exists. The original absolute overlay positioning is overridden with normal flow, so responsive height and fixed bottom controls remain correct. Search focus survives navigation.
- Money masking updates React content immediately; it does not animate digits, crossfade old amounts, retain old charts/tables or use document view-transition snapshots. Scope data changes also remain immediate.
- FAQ controls use buttons, aria-expanded, aria-controls, collapsed aria-hidden and inert. Grid rows animate height without measuring content. Native details were replaced by these accessible disclosure controls.
- Loading shimmer's duplicate decorative text is hidden from accessibility; a single screen-reader label remains.
- Notices do not automatically expire. Timers are cancelled when replaced/unmounted; keyboard dismiss returns focus to main content when appropriate.
- Every recipe includes reduced-motion handling. A global pseudo-element guard also covers old control feedback. Reduced-motion modal/notice dismissal has zero timed delay. All final states remain readable and operable.

## Verification

Meaningful checks live in [motion.spec.ts](../tests/e2e/motion.spec.ts): modal exit/inert/reopen/focus with unchanged balance, confirmed notice exit/focus, rapid navigation/search focus, immediate money masking without duplicate pages, reduced-motion timing and keyboard FAQ collapse. The existing finance, receipt, planning, household, responsive layout and navigation checks remain required. Actual latest results and deployment are recorded in [VERIFICATION](VERIFICATION.md) and [NOTES](../NOTES.md).

Development artifact preflight rejects missing recipe/reduced-motion selectors before uploading. It was verified against the built artifact and an empty-CSS negative fixture after a stylesheet cleanup failure. Recipe comments use ASCII arrows to satisfy the project's source icon audit; CSS behavior is unchanged.

## Catalog tactile adaptation —27September2026

Watermelon animated-button (MIT) inspired native CSS press0.98 and hover2px responses for primary/capture/welcome controls. Existing Transitions.dev recipe24 easing/timing is reused for arrow hover; feedback uses150ms shared tokens, card shadow250ms. Only controls/decorative SVGs transform. Money, chart/progress geometry and page placement are never animated; no perpetual effects/new animation library. Hover rules apply only fine pointers; reduced-motion explicitly removes all added transitions/transforms. See UI-REFERENCES for source and MIT attribution.

## Shared dropdown disclosure —27September2026

src/select.css provides native customizable-select panels. Recipe21 shared chevron easing/150ms quick token rotates the SVG picker icon; recipe08 incoming-only120ms opacity styles picker opening with @starting-style. Closing and selected values use immediate browser behavior, no display/overlay exit hold or financial snapshot. prefers-reduced-motion removes both transitions. All native picker positioning/focus/collision/keyboard lifecycle remains browser-managed.

## Component accent motion —27September2026

User requested a few components feel more alive. Finite500ms recipe18 reveal/recipe06 scale adaptations now animate only decorative summary/count/wallet/goal/Quick Add/empty icons and the three shortcut SVGs. Stagger40/80/120ms is limited to decorations; no container/page slide, numeric tween or chart/progress interpolation. The saldo's abstract pseudo-card unfolds once with translate18px/rotate−20→−26degrees using the same reveal clock. Hover recipe24/shared350ms easing gives wallet/goal/feature SVGs a small lift/tilt and Quick Add SVG feedback on focus/hover. No persistent loops, observer, animation library or JS state introduced. Native select opening @starting-style selector specificity is aligned with select.css so its existing120ms opacity entry can apply. Reduced-motion explicitly removes new animations/transforms/transitions; desktop/mobile navigation stays opacity120ms with no delay to financial actions.

Source patterns remain existing licensed Transitions.dev public recipes06/18/24 at documented commit, adapted to decorations. Existing license exception/provenance applies; this is not a new MIT animation pack. Financial text, chart geometry and selected values render immediately. Development crosscheck deployment only; current Production remains separate.
