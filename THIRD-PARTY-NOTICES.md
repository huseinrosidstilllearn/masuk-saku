# Third-party notices

Application source is MIT. Runtime dependencies retain their own licenses:

Exception: the selected Transitions.dev CSS recipes in src/motion.css are copyright 2026 Jakub Antalik / Transitions.dev and use [Transitions.dev product-use terms](https://transitions.dev/terms.html), not MIT. They are incorporated into this application with native-dialog/layout adaptations. Do not redistribute them as a competing transition library or template pack. Source commit, recipe mapping and accessibility changes are documented in [motion foundation](docs/MOTION.md).

| Package                    | License                  |
| -------------------------- | ------------------------ |
| React / React DOM          | MIT                      |
| Supabase JavaScript client | MIT                      |
| Zod                        | MIT                      |
| DM Sans font               | SIL Open Font License1.1 |

DM Sans is the active self-hosted font for UI, headings and wordmark. Its unmodified [OFL](public/licenses/DM-Sans-OFL.txt) is copied into the static build under /licenses/. Fonts are not sold independently. Other dependency notices are retained in their npm packages; dependency versions are recorded in package-lock.json and Edge deno.lock.

Lucide React1.48.0 icons are used as inline SVG, including the Wallet favicon. Source: https://lucide.dev/guide/react. The complete installed license (ISC plus Feather MIT notices) is distributed at [Lucide license](public/licenses/Lucide-LICENSE.txt) and copied into the static build under /licenses/. No external icon request is needed at runtime.

Previous revisions used Fredoka and Instrument Serif under SIL Open Font License1.1. Their [Fredoka OFL](public/licenses/Fredoka-OFL.txt) and [Instrument Serif OFL](public/licenses/Instrument-Serif-OFL.txt) texts are retained for historical attribution; both fonts and dependencies are now removed from the application. Billow logo, copy, screenshots and proprietary assets are not distributed in the app.

Watermelon budget-card and animated-button visual patterns are adapted in src/components/BudgetPulse.tsx, src/dashboard-v2.css and the catalog tactile section of src/motion.css. Copyright2026 Watermelon Platform Contributors; [MIT license](public/licenses/Watermelon-MIT.txt) is shipped with the app. Source-backed registry endpoints and inspected repository revision are documented in [UI references](docs/UI-REFERENCES.md). Their demo data, provider artwork and component dependencies are not distributed.

Lucide ChevronDown/Check are also rendered into public/icons/dropdown-chevron.svg and dropdown-check.svg for shared CSS select triggers/pickers. These unmodified icon shapes use the installed package's license and require no runtime internet request.
