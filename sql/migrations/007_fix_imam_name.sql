UPDATE imam_profile
SET
  name = 'Njoya Kassim',
  i18n = CASE
    WHEN i18n IS NULL THEN i18n
    ELSE jsonb_set(i18n, '{en,name}', to_jsonb('Njoya Kassim'::text), true)
  END,
  updated_at = NOW()
WHERE
  name = 'Nojya Kassim'
  OR (i18n->'en'->>'name' = 'Nojya Kassim');
