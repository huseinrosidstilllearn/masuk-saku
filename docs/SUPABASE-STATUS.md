# Supabase status — 28 September 2026

| Item                 | Development                      | Production                                 |
| -------------------- | -------------------------------- | ------------------------------------------ |
| Project ref          | kxezrgvnpoaqzcseymts             | snqkfrcxjfdjkwxjiabc                       |
| Database migrations  | 17 applied                       | 17 applied; dry-run up-to-date             |
| Edge Functions       | 6 deployed                       | 6 ACTIVE v3                                |
| Frontend             | 365f1032                         | 3de0d4a3                                   |
| Domain               | masuk-saku-development.pages.dev | masuksaku.my.id                            |
| CLI                  | Primary linked project           | Explicit ref; isolated work/production-cli |
| Google / email Auth  | Enabled                          | Enabled; public settings verified          |
| Maintenance          | Every 15 minutes                 | Single Production job; every 15 minutes    |
| Realtime publication | 6 tables                         | 6 tables                                   |

Production now includes migrations 12–17 and the frontend realtime catch-up fix. SMTP/Auth and server secrets were preserved; no Development database or credentials were copied. Pre-migration encrypted database+Storage backup 36401935020 passed. Hosted Production synthetic API and two-session financial UI pilots, delayed realtime join, public routes and demo reset passed; fixtures cleaned. Full acceptance still requires valid-key AI/physical device and isolated recovery/self-host evidence. See [Production](PRODUCTION.md), [QA report](QA-HOSTED.md) and [handoff](AGENT-HANDOFF.md).
