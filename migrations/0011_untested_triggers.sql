-- UNTESTED v9 immutability and optimistic-concurrency triggers.
-- Apply after 0010_untested_schema.sql.

CREATE TRIGGER IF NOT EXISTS untested_version_no_update_when_sealed
BEFORE UPDATE ON untested_instrument_versions
WHEN OLD.sealed_at IS NOT NULL
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_IMMUTABLE'); END;

CREATE TRIGGER IF NOT EXISTS untested_version_no_delete_when_sealed
BEFORE DELETE ON untested_instrument_versions
WHEN OLD.sealed_at IS NOT NULL
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_IMMUTABLE'); END;

CREATE TRIGGER IF NOT EXISTS untested_session_requires_sealed_version
BEFORE INSERT ON untested_sessions
WHEN NOT EXISTS (
  SELECT 1 FROM untested_instrument_versions v
  WHERE v.instrument_version=NEW.instrument_version
    AND v.sealed_at IS NOT NULL
    AND v.content_hash IS NOT NULL
)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_NOT_SEALED'); END;

-- instrument_copy
CREATE TRIGGER IF NOT EXISTS untested_copy_no_insert_sealed BEFORE INSERT ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_copy_no_update_sealed BEFORE UPDATE ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_copy_no_delete_sealed BEFORE DELETE ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_copy_revision_insert AFTER INSERT ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_copy_revision_update AFTER UPDATE ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_copy_revision_delete AFTER DELETE ON untested_instrument_copy
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=OLD.instrument_version; END;

-- confidence_definitions
CREATE TRIGGER IF NOT EXISTS untested_conf_no_insert_sealed BEFORE INSERT ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_conf_no_update_sealed BEFORE UPDATE ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_conf_no_delete_sealed BEFORE DELETE ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_conf_revision_insert AFTER INSERT ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_conf_revision_update AFTER UPDATE ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_conf_revision_delete AFTER DELETE ON untested_confidence_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=OLD.instrument_version; END;

-- scenario_definitions
CREATE TRIGGER IF NOT EXISTS untested_scenario_no_insert_sealed BEFORE INSERT ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_scenario_no_update_sealed BEFORE UPDATE ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_scenario_no_delete_sealed BEFORE DELETE ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_scenario_revision_insert AFTER INSERT ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_scenario_revision_update AFTER UPDATE ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_scenario_revision_delete AFTER DELETE ON untested_scenario_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=OLD.instrument_version; END;

-- variant_definitions
CREATE TRIGGER IF NOT EXISTS untested_variant_no_insert_sealed BEFORE INSERT ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_variant_no_update_sealed BEFORE UPDATE ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_variant_no_delete_sealed BEFORE DELETE ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_variant_revision_insert AFTER INSERT ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_variant_revision_update AFTER UPDATE ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_variant_revision_delete AFTER DELETE ON untested_variant_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=OLD.instrument_version; END;

-- choice_definitions
CREATE TRIGGER IF NOT EXISTS untested_choice_no_insert_sealed BEFORE INSERT ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_choice_no_update_sealed BEFORE UPDATE ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_choice_no_delete_sealed BEFORE DELETE ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NOT NULL)
BEGIN SELECT RAISE(ABORT,'UNTESTED_VERSION_SEALED'); END;
CREATE TRIGGER IF NOT EXISTS untested_choice_revision_insert AFTER INSERT ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_choice_revision_update AFTER UPDATE ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=NEW.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=NEW.instrument_version; END;
CREATE TRIGGER IF NOT EXISTS untested_choice_revision_delete AFTER DELETE ON untested_choice_definitions
WHEN EXISTS(SELECT 1 FROM untested_instrument_versions v WHERE v.instrument_version=OLD.instrument_version AND v.sealed_at IS NULL)
BEGIN UPDATE untested_instrument_versions SET draft_revision=draft_revision+1 WHERE instrument_version=OLD.instrument_version; END;
