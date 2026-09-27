# Personal profile

Open the account avatar or Settings → Edit profil saya. Full name and nickname are required; phone, birthday, city and a 500-character bio are optional. Email is read-only here. Only nickname is synchronized to active household membership display names. Other fields and the photo are private to the account, including against household Owners.

Photo selection previews locally. Save explicitly commits changes, including removal. JPEG, PNG and WebP are accepted with MIME/signature validation and a 2 MiB limit in both frontend and private Supabase avatars bucket. SVG is excluded. Objects use user UUID / random UUID paths, no upsert, and short-lived signed URLs. RLS restricts reads, inserts and deletes to the owning user.

Migration 202609270011_user_profiles.sql adds own-user SELECT and the authenticated save_my_profile RPC. Direct profile writes are revoked. The RPC validates fields, birthday and avatar ownership, checks the expected revision, then updates the profile and active membership nickname in one transaction. Wallet ownership, actors, roles, identities and ledger records are unchanged.

Replacement uploads precede the profile transaction. Previous objects are deleted only after commit. Explicit transaction rejection permits candidate cleanup; an ambiguous network failure retains the candidate because the server may have committed. Failed old-photo cleanup is reported, so private orphan objects may require administrative cleanup. Reload after a concurrent-edit conflict before saving again.

Database backups include profile rows. Existing pg_dump backups do not include Storage photo bytes; backing up and restoring avatar objects remains an operational release gate. No secrets or profile data belong in the public repository.

Verification: SQL tests cover owner-only reads/writes, conflicting revisions, foreign avatars, birthday constraints and unchanged identities. Configured browser tests cover 2 MiB rejection, staged removal, failed-save retry, committed old-object deletion and 320 px layout. These fixtures do not substitute for a hosted account upload pilot.

Username is shown and editable in a separate explicit-save form using existing get_my_username/set_my_username RPCs. It is distinct from nickname; subsequent logins use the saved username. Duplicate rejection preserves input. Mobile avatar remains visible inside a40px account button; inherited small-avatar hiding is overridden only for that button.
