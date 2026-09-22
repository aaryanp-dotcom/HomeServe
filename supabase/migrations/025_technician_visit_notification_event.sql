-- notification_event is a Postgres ENUM (001_initial_schema.sql); every event key used with
-- sendNotification() must exist here first or the notification_logs insert fails silently
-- (the insert's error is never checked, so a missing value just means the notification never
-- shows up anywhere, with no error visible to the admin who triggered it).
ALTER TYPE notification_event ADD VALUE IF NOT EXISTS 'technician_visit_assigned';
