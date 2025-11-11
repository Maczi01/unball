-- =====================================================================
-- Migration: Drop photo_sources table
-- Created: 2025-11-11
-- Description: Removes the photo_sources table as it's no longer needed
--
-- Changes:
--   - Drop photo_sources table (will cascade to remove related data)
-- =====================================================================

-- Drop the photo_sources table
-- CASCADE will automatically drop any dependent objects
DROP TABLE IF EXISTS photo_sources CASCADE;

-- =====================================================================
-- END OF MIGRATION
-- =====================================================================
