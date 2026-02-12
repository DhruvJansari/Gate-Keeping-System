# Database Migrations Guide

This directory contains database migration files that should be run in numerical order.

## Migration Files

| # | File | Description | Status |
|---|------|-------------|--------|
| 001 | `001_add_items_status.sql` | Add status column to items table | ✅ In schema.sql |
| 002 | `002_add_parties_status_email.sql` | Add status & email to parties | ✅ In schema.sql |
| 003 | `003_add_transporters_fields.sql` | Add fields to transporters | ✅ In schema.sql |
| 004 | `004_add_parking_confirmed_at.sql` | Add parking timestamp | ✅ In schema.sql |
| 005 | `005_add_confirm_stages_permissions.sql` | Add stage permissions | ✅ In schema.sql |
| 006 | `006_add_pan_to_parties.sql` | Add PAN field to parties | ✅ In schema.sql |
| 007 | `007_split_remarks_fields.sql` | Split remarks into remark1/remark2 | ✅ In schema.sql |

## For Fresh Installation

Run the main schema file which includes all updates:

```bash
mysql -u root -p gatekeeping_db < database/schema.sql
```

## For Existing Database Upgrade

Run migrations in order from your last applied migration:

```bash
# Run each migration file in sequence
mysql -u root -p gatekeeping_db < database/migrations/001_add_items_status.sql
mysql -u root -p gatekeeping_db < database/migrations/002_add_parties_status_email.sql
mysql -u root -p gatekeeping_db < database/migrations/003_add_transporters_fields.sql
mysql -u root -p gatekeeping_db < database/migrations/004_add_parking_confirmed_at.sql
mysql -u root -p gatekeeping_db < database/migrations/005_add_confirm_stages_permissions.sql
mysql -u root -p gatekeeping_db < database/migrations/006_add_pan_to_parties.sql
```

## Migration Safety

- All migrations use `ADD COLUMN` (safe, non-destructive)
- Permissions use `INSERT IGNORE` (idempotent)
- No data deletion or modification

## Creating New Migrations

1. Create file: `database/migrations/00X_description.sql`
2. Use `ALTER TABLE ADD COLUMN` for new fields
3. Use `INSERT IGNORE` for seed data
4. Update `database/schema.sql` with the changes
5. Add entry to this README
