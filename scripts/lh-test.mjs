#!/usr/bin/env node
// Lighthouse runner local · usa o Chrome instalado no SO via chrome-launcher.
// Roda o Lighthouse direto (não usa PSI API · sem rate limits, sem API key).
//
// Pré-requisito (uma vez por projeto):
//   npm install --save-dev lighthouse chrome-launcher
//
// Uso:
//   node scripts/lh-test.mjs mobile https://oferta.exemplo.com/
//   node scripts/lh-test.mjs desktop https://oferta.exemplo.com/
//   node scripts/lh-test.mjs mobile https://oferta.exemplo.com/ json > /tmp/lh.json
//
// Variável de ambiente alternativa:
//   PAGESPEED_URL=https://exemplo.com node scripts/lh-test.mjs mobile

import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const strategy = process.argv[2] || 'mobile';
const urlArg = process.argv[3];
const url = (!urlArg || urlArg === '-')
  ? (process.env.PAGESPEED_URL || 'http://localhost:3000/')
  : urlArg;
const format = process.argv[4] || 'summary';

if (!url || url.startsWith('-')) {
  console.error('Usage: node lh-test.mjs <mobile|desktop> <url> [json]');
  console.error('Or set PAGESPEED_URL env var.');
  process.exit(1);
}

const chrome = await chromeLauncher.launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'],
});

const opts = {
  logLevel: 'error',
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  port: chrome.port,
  formFactor: strategy,
  screenEmulation: strategy === 'mobile'
    ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }
    : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
  throttling: strategy === 'mobile'
    ? {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 562.5,
        downloadThroughputKbps: 1474.56,
        uploadThroughputKbps: 675,
      }
    : {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
};

try {
  const runnerResult = await lighthouse(url, opts);
  const lhr = runnerResult.lhr;
  await chrome.kill();

  if (format === 'json') {
    console.log(JSON.stringify(lhr, null, 2));
    process.exit(0);
  }

  const score = (k) => Math.round((lhr.categories[k]?.score || 0) * 100);
  const audit = (k) => lhr.audits[k];
  const val = (k) => audit(k)?.displayValue || 'n/a';

  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`  ${strategy.toUpperCase()} · ${new Date().toISOString()}`);
  console.log(`  ${url}`);
  console.log('═══════════════════════════════════════════');
  console.log(`  Performance:     ${score('performance')}`);
  console.log(`  Accessibility:   ${score('accessibility')}`);
  console.log(`  Best Practices:  ${score('best-practices')}`);
  console.log(`  SEO:             ${score('seo')}`);
  console.log('');
  console.log(`  FCP:  ${val('first-contentful-paint')}`);
  console.log(`  LCP:  ${val('largest-contentful-paint')}`);
  console.log(`  TBT:  ${val('total-blocking-time')}`);
  console.log(`  CLS:  ${val('cumulative-layout-shift')}`);
  console.log(`  SI:   ${val('speed-index')}`);
  console.log('');

  // Top opportunities (savings ≥ 100ms or ≥ 50KB)
  const opps = Object.entries(lhr.audits)
    .filter(([_, a]) => {
      const ms = a.details?.overallSavingsMs || 0;
      const bytes = a.details?.overallSavingsBytes || 0;
      return (ms >= 100 || bytes >= 50000) && a.score !== 1;
    })
    .sort((a, b) =>
      (b[1].details?.overallSavingsMs || 0) - (a[1].details?.overallSavingsMs || 0)
    );

  if (opps.length) {
    console.log('═══════════════════════════════════════════');
    console.log('  TOP OPPORTUNITIES');
    console.log('═══════════════════════════════════════════');
    opps.slice(0, 10).forEach(([key, a]) => {
      const ms = a.details?.overallSavingsMs || 0;
      const kb = (a.details?.overallSavingsBytes || 0) / 1024;
      const parts = [];
      if (ms) parts.push(`${Math.round(ms)}ms`);
      if (kb) parts.push(`${Math.round(kb)} KB`);
      console.log(`  • ${a.title}`);
      if (parts.length) console.log(`      saves ${parts.join(' · ')}`);
      console.log(`      [${key}]`);
    });
    console.log('');
  }

  // LCP element
  const lcpAudit = audit('largest-contentful-paint-element');
  if (lcpAudit?.details?.items?.[0]?.items?.[0]?.node) {
    const lcpNode = lcpAudit.details.items[0].items[0].node;
    console.log('═══════════════════════════════════════════');
    console.log('  LCP ELEMENT');
    console.log('═══════════════════════════════════════════');
    console.log(`  ${(lcpNode.snippet || lcpNode.nodeLabel || '').slice(0, 200)}`);
    if (lcpNode.selector) console.log(`  selector: ${lcpNode.selector}`);
    console.log('');
  }

  // LCP breakdown (phases)
  const lcpBreakdown = audit('lcp-breakdown-insight');
  if (lcpBreakdown?.details?.items?.length) {
    console.log('═══════════════════════════════════════════');
    console.log('  LCP BREAKDOWN');
    console.log('═══════════════════════════════════════════');
    lcpBreakdown.details.items.forEach(it => {
      if (it.label && it.duration !== undefined) {
        console.log(`  ${it.label.padEnd(28)} ${Math.round(it.duration)}ms`);
      }
    });
    console.log('');
  }

  // Critical failed audits
  const failures = Object.entries(lhr.audits)
    .filter(([_, a]) => a.score !== null && a.score < 0.5 && a.scoreDisplayMode !== 'informative')
    .map(([k, a]) => `  ❌ ${a.title}  [${k}]`);

  if (failures.length) {
    console.log('═══════════════════════════════════════════');
    console.log('  FAILED AUDITS');
    console.log('═══════════════════════════════════════════');
    failures.slice(0, 15).forEach(f => console.log(f));
    console.log('');
  }

  // Diagnostics
  console.log('═══════════════════════════════════════════');
  console.log('  DIAGNOSTICS');
  console.log('═══════════════════════════════════════════');
  const diagKeys = [
    'main-thread-tasks', 'bootup-time', 'mainthread-work-breakdown',
    'third-party-summary', 'dom-size', 'non-composited-animations',
    'long-tasks', 'unused-javascript', 'unused-css-rules',
    'total-byte-weight', 'render-blocking-resources',
  ];
  diagKeys.forEach(k => {
    const a = audit(k);
    if (a?.displayValue) console.log(`  • ${a.title}: ${a.displayValue}`);
  });

} catch (e) {
  await chrome.kill();
  console.error('Lighthouse error:', e.message);
  process.exit(1);
}
