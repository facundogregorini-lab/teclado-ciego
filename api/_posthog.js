// PostHog from the server: the successful payment (the one event that must not depend on the browser) and
// read-only queries for metrics. The project key is public, so it is the default; POSTHOG_KEY changes it and
// POSTHOG_KEY=off turns server events off. The personal key (POSTHOG_PERSONAL_API_KEY) is only read here,
// never sent to the page.
const env = name => (process.env[name] || '').trim();
const DEFAULT_KEY = 'phc_tPTtLds2LH6udzJtXWcZzHsXyxUrTgxjSDyMmDThg3gz';

function posthogSettings() {
  const key = env('POSTHOG_KEY') || DEFAULT_KEY;
  return {
    key: key === 'off' ? '' : key,
    ingest: (env('POSTHOG_INGEST_HOST') || 'https://us.i.posthog.com').replace(/\/$/, ''),
    host: (env('POSTHOG_HOST') || 'https://us.posthog.com').replace(/\/$/, ''),
    personalKey: env('POSTHOG_PERSONAL_API_KEY'),
    projectId: env('POSTHOG_PROJECT_ID'),
  };
}

// Sends one event. Never throws: analytics must not break a payment.
async function capture(distinctId, event, properties = {}) {
  const s = posthogSettings();
  if (!s.key || !distinctId) return false;
  try {
    const response = await fetch(s.ingest + '/i/v0/e/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: s.key, event, distinct_id: String(distinctId), properties: { app: 'templo-ninja', source: 'server', ...properties }, timestamp: new Date().toISOString() }),
    });
    if (!response.ok) console.error('PostHog capture', response.status, await response.text().catch(() => ''));
    return response.ok;
  } catch (error) {
    console.error('PostHog unreachable', error.message);
    return false;
  }
}

// Runs a HogQL query with the personal key, e.g. query("SELECT event, count() FROM events GROUP BY event").
async function query(hogql) {
  const s = posthogSettings();
  if (!s.personalKey || !s.projectId) throw new Error('Faltan POSTHOG_PERSONAL_API_KEY o POSTHOG_PROJECT_ID');
  const response = await fetch(`${s.host}/api/projects/${encodeURIComponent(s.projectId)}/query/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + s.personalKey },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: hogql } }),
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PostHog ${response.status}: ${json.detail || json.error || 'error'}`);
  return { columns: json.columns || [], results: json.results || [] };
}

module.exports = { posthogSettings, capture, query };
