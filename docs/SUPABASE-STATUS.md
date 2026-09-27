# Supabase status — 27 September 2026

| Item                | Development                         | Production                                 |
| ------------------- | ----------------------------------- | ------------------------------------------ |
| Project ref         | kxezrgvnpoaqzcseymts                | snqkfrcxjfdjkwxjiabc                       |
| Database migrations | 11 applied                          | 11 applied, fresh dry-run up-to-date       |
| Edge Functions      | 6 deployed                          | 6 freshly redeployed                       |
| Frontend            | 58458d65                            | 64f9f8a6                                   |
| Domain              | masuk-saku-development.pages.dev    | masuksaku.my.id                            |
| CLI                 | Primary linked project              | Explicit ref, isolated work/production-cli |
| Google Auth         | Enabled; authorize redirect checked | Enabled; authorize redirect checked        |

Production promotion includes migrations9(BYOK lifecycle),10(active memberships),11(private profiles/avatars). Production secrets/SMTP preserved. No Development database or credentials copied. Hosted public Auth/Edge denial checks passed; real financial/profile/AI pilots and backup restore remain separate gates. See PRODUCTION.md and AGENT-HANDOFF.md for current evidence; older deployment notes are historical.
