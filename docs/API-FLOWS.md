## Catalog and transaction tags

Categories/tags use household-scoped authenticated Supabase CRUD under existing member RLS, with original-field optimistic checks on edits. Referenced rows cannot be deleted (FK restriction). Category hierarchy remains one level. Ledger tag creation uses create_transaction; revisions use revise_transaction with optional tag_ids (maximum30): omission preserves, [] clears, array replaces. Composite household FK rejects foreign tags; duplicate tags abort the entire revision. Revision snapshots retain tag IDs. Catalog edits do not write wallet/ledger values.
