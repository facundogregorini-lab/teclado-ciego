#!/usr/bin/env node
// Reads metrics from PostHog with the personal key of the environment (never from the page).
//   node scripts/posthog-query.cjs funnel            embudo de los últimos 7 días
//   node scripts/posthog-query.cjs events            eventos por día
//   node scripts/posthog-query.cjs "SELECT ..."      cualquier consulta HogQL
// Needs POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID and POSTHOG_HOST (https://us.posthog.com).
const { query } = require('../api/_posthog');

const days = Number(process.env.DAYS) || 7;
const NAMED = {
  // Unique people (or anonymous visitors) who reached each step, in the funnel order.
  funnel: `SELECT
      uniqIf(person_id, event = '$pageview') AS visitantes,
      uniqIf(person_id, event = 'practice_started') AS empezaron_practica,
      uniqIf(person_id, event = 'practice_completed') AS terminaron_practica,
      uniqIf(person_id, event = 'pricing_viewed') AS vieron_precio,
      uniqIf(person_id, event = 'checkout_clicked') AS clic_pagar,
      uniqIf(person_id, event = 'signed_up') AS crearon_cuenta,
      uniqIf(person_id, event = 'checkout_started') AS fueron_a_mercadopago,
      uniqIf(person_id, event = 'payment_succeeded') AS pagaron
    FROM events WHERE timestamp > now() - INTERVAL ${days} DAY`,
  events: `SELECT toDate(timestamp) AS dia, event, count() AS n FROM events
    WHERE timestamp > now() - INTERVAL ${days} DAY GROUP BY dia, event ORDER BY dia, n DESC`,
  sources: `SELECT properties.$initial_utm_source AS fuente, properties.$initial_utm_campaign AS campania, uniq(person_id) AS personas
    FROM events WHERE event = '$pageview' AND timestamp > now() - INTERVAL ${days} DAY GROUP BY fuente, campania ORDER BY personas DESC`,
};

(async () => {
  const arg = process.argv.slice(2).join(' ').trim() || 'funnel';
  const { columns, results } = await query(NAMED[arg] || arg);
  console.table(results.map(row => Object.fromEntries(columns.map((c, i) => [c, row[i]]))));
})().catch(err => { console.error(err.message); process.exit(1); });
