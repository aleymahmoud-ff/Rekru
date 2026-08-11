/**
 * `app_settings` is a single-row table — the app is single-organization, so
 * there is exactly one branding record. Its primary key is pinned to this
 * value so it can be read and upserted without first looking up the row.
 */
export const APP_SETTINGS_ID = 'singleton'
