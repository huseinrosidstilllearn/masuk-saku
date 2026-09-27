# Reports and transaction filters

Transaction lists support type/status/scope/wallet/actor, inclusive WIB dates, whole-rupiah minimum/maximum and search through merchant/notes/wallets/actor/categories/subcategories/tags. Wallet ownership selector remains independent from actor. Filter controls use a keyboard-native disclosure and shared styled selects. Invalid ranges block application; drafts do not mutate the ledger.

Lists show25logical parent transactions per page, stable by timestamp and ID. Search/filter/ownership changes reset to page1; the last page clamps after edits/deletes. Browser verification traverses260seeded demo transactions without loss or duplicates, beyond the former200row display cap. The backend snapshot still has a10000row-per-table ceiling; this is frontend pagination, not scalable server pagination. Do not claim that limit removed.

Reports use custom inclusive WIB dates and equal-length immediately preceding period. Completed/non-trash income and expense only; principal transfers excluded and linked fees included once. Category/subcategory splits distribute exact expense amounts. Virtual goal contributions do not change cashflow. Ownership filters include inactive wallets for historical reporting. Labels display both date ranges; comparisons are amounts, not fabricated percentage growth with zero baseline. Hide Balance masks current/previous/delta and removes category rankings/insights.

Local domain and320px browser checks pass. Demo/fixture verification does not substitute for real-account reports or hosted managed database pilot. Remaining reporting work: preset period controls, server aggregates/pagination, insights refinements and widget configuration according to PRD.
