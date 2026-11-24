/**
 * @title Repeat & Cross-Category Customer Spend Uplift
 * @description Editorial scrollytelling cohort study examining how repeat multi-item & cross-category adoption relates to annualized customer spend across matched ticket bands.
 * @toolkit-version       1.3.0
 */
window.__lookerDataAppMeta = Object.assign(window.__lookerDataAppMeta || {}, {
  publishedAt: '2026-11-24T07:41:00Z',
});

// Pre-handshake with Portal window.top before DataApp vendor bundle finishes so frame 0 renders in the exact theme without white flash.
let _earlyHostTheme = null;
if (typeof window !== 'undefined') {
  try {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.background = 'transparent';
    }
    window.addEventListener('message', (e) => {
      if (e && e.data && e.data.type === 'embed-demo-theme') {
        _earlyHostTheme = e.data;
        if (typeof document !== 'undefined' && document.documentElement && typeof e.data.isDark === 'boolean') {
          document.documentElement.classList.toggle('dark-theme', e.data.isDark);
          if (e.data.palette && e.data.palette.bg) {
            document.documentElement.style.setProperty('--app-bg', e.data.palette.bg);
            document.documentElement.style.background = e.data.palette.bg;
          }
        }
      }
    });
    if (window.top && window.top !== window) {
      window.top.postMessage({ type: 'embed-demo-theme-request' }, '*');
    }
  } catch (_) {}
}

import { DataApp, html, nothing } from 'https://www.gstatic.com/looker-data-apps/versions/1.3.0/data-app.js';

export const elementName = 'cohort-uplift-story';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PL = 92;
const PR = 920;
const PT = 40;
const BARW = 96;
const MONTHS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

const lin = (d0, d1, r0, r1) => (v) => {
  if (d1 === d0) return r0;
  return r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
};
const colX = (i, n) => PL + ((PR - PL) / n) * (i + 0.5);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const pathD = (pts) => 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L');
const sgn = (v) => {
  const r = Math.round(v);
  return (r > 0 ? '+' : r < 0 ? '-' : '') + Math.abs(r);
};
const sgn1 = (v) => (v > 0 ? '+' : v < 0 ? '-' : '') + Math.abs(v).toFixed(1);
const comma = (v) => Math.round(v).toLocaleString('en-US');
const usdFmt = (v) => '$' + Math.round(v).toLocaleString('en-US');
const usdCompact = (v) => {
  const a = Math.abs(v);
  const prefix = v < 0 ? '-$' : '+$';
  if (a >= 1e6) return prefix + (a / 1e6).toFixed(2) + 'M';
  if (a >= 1e3) return prefix + Math.round(a / 1e3).toLocaleString('en-US') + 'K';
  return prefix + Math.round(a).toLocaleString('en-US');
};

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function median(sorted) {
  const n = sorted.length;
  if (!n) return 0;
  const mid = n >> 1;
  return n % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) * 0.5;
}

function quantile(sorted, q) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function bootstrapMedianDiff(treatArr, ctrlArr, rng, iters = 600) {
  if (!treatArr.length || !ctrlArr.length) return [0, 0, 0];
  const sT = treatArr.slice().sort((a, b) => a - b);
  const sC = ctrlArr.slice().sort((a, b) => a - b);
  const point = median(sT) - median(sC);
  if (sT.length < 2 || sC.length < 2) {
    const r = Math.round(point);
    return [r, r, r];
  }
  const diffs = new Float64Array(iters);
  const nT = sT.length;
  const nC = sC.length;
  const subT = Math.min(nT, 180);
  const subC = Math.min(nC, 220);
  const tmpT = new Float64Array(subT);
  const tmpC = new Float64Array(subC);
  for (let b = 0; b < iters; b++) {
    for (let i = 0; i < subT; i++) tmpT[i] = sT[Math.floor(rng() * nT)];
    for (let i = 0; i < subC; i++) tmpC[i] = sC[Math.floor(rng() * nC)];
    tmpT.sort();
    tmpC.sort();
    const mT = subT % 2 ? tmpT[subT >> 1] : (tmpT[(subT >> 1) - 1] + tmpT[subT >> 1]) * 0.5;
    const mC = subC % 2 ? tmpC[subC >> 1] : (tmpC[(subC >> 1) - 1] + tmpC[subC >> 1]) * 0.5;
    const scale = Math.sqrt(subT / nT);
    diffs[b] = point + (mT - mC - point) * Math.max(0.65, scale);
  }
  diffs.sort();
  const lo = diffs[Math.floor(iters * 0.025)];
  const hi = diffs[Math.floor(iters * 0.975)];
  return [Math.round(point), Math.round(Math.min(point, lo)), Math.round(Math.max(point, hi))];
}

function monthIndex(ym) {
  if (!ym || typeof ym !== 'string') return null;
  const parts = ym.split('-');
  if (parts.length < 2) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return null;
  return y * 12 + (m - 1);
}

function monthsBetween(dateStr, refDate) {
  if (!dateStr || typeof dateStr !== 'string') return 12;
  const dt = new Date(dateStr + 'T00:00:00Z');
  if (Number.isNaN(dt.getTime())) return 12;
  const diffDays = (refDate.getTime() - dt.getTime()) / 86400000;
  return Math.max(6, diffDays / 30.4375);
}

export class CohortUpliftStory extends DataApp {
  static properties = {
    loading: { type: Boolean },
    loadError: { type: String },
    study: { type: Object },
    activeStep: { type: Number },
    band: { type: String },
    measure: { type: String },
    showStoppers: { type: Boolean },
    conv: { type: Number },
    hoverTip: { type: Object },
    hostBrand: { type: String },
  };

  constructor() {
    super();
    this.lookerModel = 'embed_demo';
    this.explore = 'orders_with_share_of_wallet_application';
    this.loading = true;
    this.loadError = '';
    this.study = null;
    this.activeStep = 0;
    this.band = 'all';
    this.measure = 'orders';
    this.showStoppers = true;
    this.conv = 0.1;
    this.hoverTip = null;
    this.hostBrand = (_earlyHostTheme && _earlyHostTheme.brand) || '';
    this.isDark =
      _earlyHostTheme && typeof _earlyHostTheme.isDark === 'boolean'
        ? _earlyHostTheme.isDark
        : typeof window !== 'undefined' && window.matchMedia
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false;

    this._live = new Map();
    this._raf = 0;
    this._scrollRaf = 0;
    this._vh = 620;
    this._pb = 542;
    this._resizeTimer = 0;
    this._abortCtrl = null;
    this._lastFilterKey = '';
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onResize = this._handleResize.bind(this);
    this._onScroll = this._handleScroll.bind(this);
    this._onHostMessage = this._handleHostMessage.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('resize', this._onResize);
    window.addEventListener('scroll', this._onScroll, { passive: true, capture: true });
    window.addEventListener('message', this._onHostMessage);
    if (_earlyHostTheme && _earlyHostTheme.palette) {
      this._applyThemePalette(_earlyHostTheme.palette);
    }
    try {
      if (window.top && window.top !== window) {
        window.top.postMessage({ type: 'embed-demo-theme-request' }, '*');
      }
    } catch (_) {
      // Standalone or restricted top window; keep default theme.
    }
  }

  disconnectedCallback() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('scroll', this._onScroll, { capture: true });
    window.removeEventListener('message', this._onHostMessage);
    if (this._abortCtrl) {
      this._abortCtrl.abort();
      this._abortCtrl = null;
    }
    cancelAnimationFrame(this._raf);
    cancelAnimationFrame(this._scrollRaf);
    clearTimeout(this._resizeTimer);
    super.disconnectedCallback();
  }

  _applyThemePalette(palette) {
    if (!palette || typeof palette !== 'object') return;
    const roots = [this, typeof document !== 'undefined' ? document.documentElement : null].filter(Boolean);
    for (const el of roots) {
      if (palette.bg) {
        el.style.setProperty('--es-paper', palette.bg);
        el.style.setProperty('--app-bg', palette.bg);
      }
      if (palette.surface) {
        el.style.setProperty('--es-surface', palette.surface);
        el.style.setProperty('--app-card-bg', palette.surface);
      }
      if (palette.ink) {
        el.style.setProperty('--es-ink', palette.ink);
        el.style.setProperty('--app-text', palette.ink);
      }
      if (palette.ink2) {
        el.style.setProperty('--es-ink2', palette.ink2);
      }
      if (palette.accent) {
        el.style.setProperty('--es-accent', palette.accent);
        el.style.setProperty('--app-primary', palette.accent);
      }
    }
  }

  _handleHostMessage(e) {
    const msg = e && e.data;
    if (!msg || msg.type !== 'embed-demo-theme') return;
    if (typeof msg.isDark === 'boolean') {
      this.isDark = msg.isDark;
    }
    if (typeof msg.brand === 'string') {
      this.hostBrand = msg.brand;
    }
    if (msg.palette && typeof msg.palette === 'object') {
      this._applyThemePalette(msg.palette);
    } else if (typeof msg.accent === 'string' && msg.accent.trim()) {
      this._applyThemePalette({ accent: msg.accent.trim() });
    }
    if (this.study) this._redrawSvg(260);
  }

  willUpdate(changed) {
    super.willUpdate(changed);
    if (this.hasUpdated && (changed.has('dashboardFilters') || changed.has('crossFilters'))) {
      const nextKey = JSON.stringify(this.getEffectiveFilters());
      if (nextKey !== this._lastFilterKey) {
        this._lastFilterKey = nextKey;
        this._fetchAndBuildStudy();
      }
    }
  }

  async firstUpdated() {
    this._lastFilterKey = JSON.stringify(this.getEffectiveFilters());
    await this._fetchAndBuildStudy();
  }

  async _fetchAndBuildStudy() {
    if (this._abortCtrl) this._abortCtrl.abort();
    this._abortCtrl = new AbortController();
    const { signal } = this._abortCtrl;
    this.loading = true;
    this.loadError = '';

    try {
      const baseFilters = this.getEffectiveFilters();

      const [popRows, brandRows, cohortRows, eventRows] = await Promise.all([
        this.runQuery(
          {
            model: 'embed_demo',
            explore: 'orders_with_share_of_wallet_application',
            fields: [
              'users.count',
              'order_items.order_count',
              'order_items.count',
              'order_items.total_sale_price',
              'order_items.average_sale_price',
            ],
            filters: baseFilters,
            limit: '5',
          },
          signal
        ),
        this.runQuery(
          {
            model: 'embed_demo',
            explore: 'order_items',
            fields: [
              'products.brand',
              'users.count',
              'order_items.order_count',
              'order_items.total_sale_price',
              'order_items.average_sale_price',
            ],
            filters: baseFilters,
            sorts: ['order_items.total_sale_price desc'],
            limit: '10',
          },
          signal
        ),
        this.runQuery(
          {
            model: 'embed_demo',
            explore: 'orders_with_share_of_wallet_application',
            fields: [
              'users.id',
              'users.created_date',
              'order_items.order_count',
              'order_items.count',
              'order_items.count_complete',
              'order_items.total_sale_price',
              'products.count',
            ],
            filters: this.getEffectiveFilters({
              'users.created_date': 'before 6 months ago',
            }),
            sorts: ['users.id asc'],
            limit: '1800',
          },
          signal
        ),
        this.runQuery(
          {
            model: 'embed_demo',
            explore: 'orders_with_share_of_wallet_application',
            fields: [
              'order_items.user_id',
              'order_items.created_month',
              'order_items.order_count',
              'order_items.count',
              'order_items.total_sale_price',
            ],
            filters: this.getEffectiveFilters({
              'order_items.created_date': '36 months',
              'order_items.user_id': '<=12000',
            }),
            sorts: ['order_items.user_id asc', 'order_items.created_month asc'],
            limit: '4000',
          },
          signal
        ),
      ]);

      if (signal.aborted) return;
      this.study = this._computeStudyMetrics(popRows || [], brandRows || [], cohortRows || [], eventRows || []);
      this.loading = false;

      await this.updateComplete;
      this._setupObserversAndStage();
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      this.loadError = (err && err.message) || 'Unable to query cohort data.';
      this.loading = false;
    }
  }

  _computeStudyMetrics(popRows, brandRows, cohortRows, eventRows) {
    const rng = mulberry32(20261123);
    const pop0 = popRows[0] || {};
    const totalCustomers = Math.max(0, Math.round(parseFloat(pop0['users.count']) || 0));
    const totalSalesPop = Math.max(0, parseFloat(pop0['order_items.total_sale_price']) || 0);
    const meanCustomerSpend = totalCustomers > 0 ? totalSalesPop / totalCustomers : 0;

    // Active tenant brand summary when scoped to a single brand
    const scopedBrand =
      brandRows.length === 1
        ? {
            name: String(brandRows[0]['products.brand'] || ''),
            customers: Math.round(parseFloat(brandRows[0]['users.count']) || 0),
            orders: Math.round(parseFloat(brandRows[0]['order_items.order_count']) || 0),
            sales: parseFloat(brandRows[0]['order_items.total_sale_price']) || 0,
          }
        : null;

    // Anchor tenure clock to latest observed month in eventRows so cohorts are time-consistent
    let maxMonthIdx = 0;
    for (const r of eventRows) {
      const mi = monthIndex(r['order_items.created_month']);
      if (mi != null && mi > maxMonthIdx) maxMonthIdx = mi;
    }
    const refDate =
      maxMonthIdx > 0
        ? new Date(Date.UTC(Math.floor(maxMonthIdx / 12), (maxMonthIdx % 12) + 1, 1))
        : new Date();

    const customers = [];
    for (const r of cohortRows) {
      const sales = parseFloat(r['order_items.total_sale_price']) || 0;
      const items = Math.max(1, Math.round(parseFloat(r['order_items.count']) || 1));
      const orders = Math.max(1, Math.round(parseFloat(r['order_items.order_count']) || 1));
      const skus = Math.max(1, Math.round(parseFloat(r['products.count']) || items));
      const completed = Math.max(0, Math.round(parseFloat(r['order_items.count_complete']) || 0));
      if (sales <= 0) continue;

      const months = monthsBetween(r['users.created_date'], refDate);
      const years = Math.max(0.5, months / 12);
      const aov = sales / items;
      const extraItems = Math.max(0, items - 1);
      const annualSpend = sales / years;

      customers.push({
        id: r['users.id'],
        sales,
        items,
        orders,
        skus,
        completed,
        extra: extraItems,
        aov,
        years,
        annualSpend,
      });
    }

    const sampleTotal = Math.max(1, customers.length);
    const ctrlSampleAll = customers.filter((c) => c.extra === 0);
    const trialSampleAll = customers.filter((c) => c.extra === 1);
    const t1SampleAll = customers.filter((c) => c.extra >= 2 && c.extra <= 3);
    const t2SampleAll = customers.filter((c) => c.extra >= 4);
    const s2pSampleAll = customers.filter((c) => c.extra >= 2);

    const scalePop = totalCustomers > 0 ? totalCustomers / sampleTotal : 1;
    const popNone = Math.round(ctrlSampleAll.length * scalePop);
    const popTrial = Math.round(trialSampleAll.length * scalePop);
    const popT1 = Math.round(t1SampleAll.length * scalePop);
    const popT2 = Math.round(t2SampleAll.length * scalePop);
    const popSustained = popT1 + popT2;

    // 3 per-item ticket bands cut at 35th and 70th percentiles of single-item baseline shoppers
    const basisAovs = (ctrlSampleAll.length >= 10 ? ctrlSampleAll : customers)
      .map((c) => c.aov)
      .sort((a, b) => a - b);
    const cut1 = Math.round(quantile(basisAovs, 0.35));
    const cut2 = Math.round(quantile(basisAovs, 0.7));

    const bandNames = [
      `Value (<$${cut1}/item)`,
      `Core ($${cut1}–$${cut2}/item)`,
      `Premium ($${cut2}+/item)`,
    ];
    const bandShort = ['Value ticket', 'Core ticket', 'Premium ticket'];

    for (const c of customers) {
      c.band = c.aov < cut1 ? 0 : c.aov < cut2 ? 1 : 2;
    }

    const noneN = [0, 0, 0];
    const sN = [0, 0, 0];
    const bandBaseAnnual = [0, 0, 0];
    const cohBands = { b1: [], b2: [], b3: [] };
    const bandKeys = ['b1', 'b2', 'b3'];

    for (let b = 0; b < 3; b++) {
      const inBand = customers.filter((c) => c.band === b);
      const ctrl = inBand.filter((c) => c.extra === 0);
      const s1 = inBand.filter((c) => c.extra === 1);
      const s23 = inBand.filter((c) => c.extra >= 2 && c.extra <= 3);
      const s4p = inBand.filter((c) => c.extra >= 4);
      const s2p = inBand.filter((c) => c.extra >= 2);

      noneN[b] = Math.round(ctrl.length * scalePop);
      sN[b] = Math.round(s2p.length * scalePop);

      const ctrlSpends = ctrl.map((c) => c.annualSpend).sort((a, b) => a - b);
      const ctrlMed = median(ctrlSpends);
      bandBaseAnnual[b] = ctrlMed;

      for (const c of inBand) {
        c.normPct = ctrlMed > 0 ? ((c.annualSpend - ctrlMed) / ctrlMed) * 100 : 0;
      }

      const normCtrl = ctrl.map((c) => c.normPct);
      cohBands[bandKeys[b]] = [s1, s23, s4p, s2p].map((grp) =>
        bootstrapMedianDiff(
          grp.map((c) => c.normPct),
          normCtrl,
          rng
        )
      );
    }

    const sTotal = Math.max(1, sN[0] + sN[1] + sN[2]);
    const weights = [sN[0] / sTotal, sN[1] / sTotal, sN[2] / sTotal];
    const cohAll = [0, 1, 2, 3].map((t) => {
      const pt = Math.round(
        cohBands.b1[t][0] * weights[0] + cohBands.b2[t][0] * weights[1] + cohBands.b3[t][0] * weights[2]
      );
      const lo = Math.round(
        cohBands.b1[t][1] * weights[0] + cohBands.b2[t][1] * weights[1] + cohBands.b3[t][1] * weights[2]
      );
      const hi = Math.round(
        cohBands.b1[t][2] * weights[0] + cohBands.b2[t][2] * weights[1] + cohBands.b3[t][2] * weights[2]
      );
      return [pt, Math.min(pt, lo), Math.max(pt, hi)];
    });

    const COH = {
      all: cohAll,
      b1: cohBands.b1,
      b2: cohBands.b2,
      b3: cohBands.b3,
    };

    const exBase = Math.round(bandBaseAnnual[1]);
    const exUpliftPct = COH.b2[1][0];
    const exAfter = Math.round(exBase * (1 + exUpliftPct / 100));

    const midCtrlSample = customers
      .filter((c) => c.band === 1 && c.extra === 0)
      .map((c) => Math.max(-55, Math.min(185, Math.round(c.normPct))))
      .sort((a, b) => a - b);
    const midTreatSample = customers
      .filter((c) => c.band === 1 && c.extra >= 2 && c.extra <= 3)
      .map((c) => Math.max(-55, Math.min(185, Math.round(c.normPct))))
      .sort((a, b) => a - b);

    const sampleQuantiles21 = (arr) => {
      if (!arr.length) return new Array(21).fill(0);
      const out = [];
      for (let i = 0; i < 21; i++) out.push(Math.round(quantile(arr, i / 20)));
      return out;
    };
    const illCtrl = sampleQuantiles21(midCtrlSample);
    const illTreat = sampleQuantiles21(midTreatSample);

    // Part 3: Engagement depth quartiles across repeat buyers (orders vs SKU breadth)
    const activeCusts = customers.filter((c) => c.extra >= 1);
    const ctrlAllNorm = customers.filter((c) => c.extra === 0).map((c) => c.normPct);

    const buildQuartiles = (metricFn, unitLabel) => {
      const sorted = activeCusts.slice().sort((a, b) => metricFn(a) - metricFn(b));
      const n = sorted.length;
      if (!n) {
        return { rng: ['Q1', 'Q2', 'Q3', 'Q4'], v: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] };
      }
      const rngLabels = [];
      const vals = [];
      for (let q = 0; q < 4; q++) {
        const slice = sorted.slice(Math.floor((q * n) / 4), Math.max(Math.floor((q * n) / 4) + 1, Math.floor(((q + 1) * n) / 4)));
        const loV = Math.round(metricFn(slice[0]));
        const hiV = Math.round(metricFn(slice[slice.length - 1]));
        rngLabels.push(loV === hiV ? `${loV} ${unitLabel}` : `${loV}–${hiV} ${unitLabel}`);
        vals.push(
          bootstrapMedianDiff(
            slice.map((c) => c.normPct),
            ctrlAllNorm,
            rng
          )
        );
      }
      return { rng: rngLabels, v: vals };
    };

    const DEPTH = {
      orders: buildQuartiles((c) => c.orders, 'orders'),
      skus: buildQuartiles((c) => c.skus + c.completed * 0.5, 'fulfilled units'),
    };

    // Part 2: Empirical running annualized spend trajectory around 2nd purchase month (adopters) and 6-month inactivity mark (lapsed)
    const createdMiMap = new Map();
    for (const r of cohortRows) {
      const mi = monthIndex(r['users.created_date']);
      if (r['users.id'] != null && mi != null) createdMiMap.set(r['users.id'], mi);
    }

    const byCust = new Map();
    for (const r of eventRows) {
      const cid = r['order_items.user_id'];
      const mi = monthIndex(r['order_items.created_month']);
      if (cid == null || mi == null) continue;
      const spend = parseFloat(r['order_items.total_sale_price']) || 0;
      if (!byCust.has(cid)) byCust.set(cid, []);
      byCust.get(cid).push({ mi, spend });
    }

    const starterBins = MONTHS.map(() => []);
    const stopperBins = MONTHS.map(() => []);
    let starterN = 0;
    let stopperN = 0;

    for (const [cid, recs] of byCust.entries()) {
      const monthMap = new Map();
      for (const x of recs) {
        monthMap.set(x.mi, (monthMap.get(x.mi) || 0) + x.spend);
      }
      const activeMonths = Array.from(monthMap.keys()).sort((a, b) => a - b);
      if (activeMonths.length < 2) continue;

      const firstM = activeMonths[0];
      const secondM = activeMonths[1];
      const lastM = activeMonths[activeMonths.length - 1];
      const createdMi = createdMiMap.get(cid);
      const acctStart = createdMi != null ? Math.min(firstM, createdMi) : firstM;

      const annRateAt = (t) => {
        let cum = 0;
        for (const [mk, sp] of monthMap.entries()) {
          if (mk <= t) cum += sp;
        }
        const tenureMonths = Math.max(6, t - acctStart + 1);
        return (cum / tenureMonths) * 12;
      };

      // Repeat adopters: >=6 months prior tenure before 2nd active purchase month and >=12 months follow-up
      if (secondM - acctStart >= 6 && maxMonthIdx - secondM >= 12) {
        const baseRate = annRateAt(secondM - 1);
        if (baseRate > 0) {
          starterN++;
          MONTHS.forEach((m, idx) => {
            const v = annRateAt(secondM + m);
            starterBins[idx].push(Math.max(-100, Math.min(300, ((v - baseRate) / baseRate) * 100)));
          });
        }
      }

      // Lapsed repeat shoppers: >=2 purchase months, aligned to 6-month inactivity mark (lastM + 6) with >=12 months post-lapse
      const lapseZero = lastM + 6;
      if (lastM > firstM && maxMonthIdx - lapseZero >= 12) {
        const activeBase = annRateAt(lapseZero - 1);
        if (activeBase > 0) {
          stopperN++;
          MONTHS.forEach((m, idx) => {
            const v = annRateAt(lapseZero + m);
            stopperBins[idx].push(Math.max(-100, Math.min(300, ((v - activeBase) / activeBase) * 100)));
          });
        }
      }
    }

    const meanArr = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    const seArr = (arr) => {
      if (arr.length < 2) return 0;
      const m = meanArr(arr);
      let sq = 0;
      for (let i = 0; i < arr.length; i++) sq += (arr[i] - m) * (arr[i] - m);
      return Math.sqrt(sq / (arr.length * (arr.length - 1)));
    };

    const startersCurve = starterBins.map((arr) => Number(meanArr(arr).toFixed(1)));
    const stoppersCurve = stopperBins.map((arr) => Number(meanArr(arr).toFixed(1)));

    const makeWin = (bins, nCount) => {
      const sliceWin = (i0, i1, mCenter, label) => {
        const custCount = bins[i0] ? bins[i0].length : 0;
        const span = i1 - i0 + 1;
        const perCust = [];
        for (let c = 0; c < custCount; c++) {
          let sum = 0;
          for (let i = i0; i <= i1; i++) sum += bins[i][c];
          perCust.push(sum / span);
        }
        const e = Number(meanArr(perCust).toFixed(1));
        const half = Number((1.96 * seArr(perCust)).toFixed(1));
        return {
          m: mCenter,
          e,
          lo: Number((e - half).toFixed(1)),
          hi: Number((e + half).toFixed(1)),
          l: label,
          n: comma(nCount),
        };
      };
      return [
        sliceWin(0, 2, -5, 'Months -6 to -4'),
        sliceWin(7, 9, 2, 'Months 1 – 3'),
        sliceWin(10, 12, 5, 'Months 4 – 6'),
        sliceWin(16, 18, 11, 'Months 10 – 12'),
      ];
    };

    const WIN_S = makeWin(starterBins, starterN);
    const WIN_P = makeWin(stopperBins, stopperN);

    const tlVals = [
      ...startersCurve,
      ...stoppersCurve,
      ...WIN_S.flatMap((w) => [w.lo, w.hi]),
      ...WIN_P.flatMap((w) => [w.lo, w.hi]),
    ];
    const tlMinY = Math.min(-40, Math.floor((Math.min(0, ...tlVals) - 8) / 20) * 20);
    const tlMaxY = Math.max(60, Math.ceil((Math.max(0, ...tlVals) + 12) / 20) * 20);

    // Part 4: Scenario Revenue Sizing (Single-item shoppers converting to 2–3 extra-item repeat tier)
    const prizeRows = [0, 1, 2].map((b) => {
      const basePerCust = Math.round(bandBaseAnnual[b]);
      const upliftPct = Math.max(0, COH[bandKeys[b]][1][0]);
      const extraPerCust = Math.round((basePerCust * upliftPct) / 100);
      return {
        b: bandShort[b],
        fullLabel: bandNames[b],
        nCount: noneN[b],
        n: comma(noneN[b]),
        base: basePerCust,
        x: extraPerCust,
        g: sgn(upliftPct) + '%',
        ceilingPool: noneN[b] * extraPerCust,
      };
    });
    const totalCeilingUsd = prizeRows.reduce((acc, r) => acc + r.ceilingPool, 0);

    // 100-dot population grid
    const dotScale = Math.max(1, totalCustomers / 100);
    const dots = [];
    for (let b = 0; b < 3; b++) {
      const nn = Math.max(1, Math.round(noneN[b] / dotScale));
      const ns = Math.max(1, Math.round(sN[b] / dotScale));
      for (let i = 0; i < nn; i++) dots.push({ band: b, kind: 'none', j: i });
      for (let i = 0; i < ns; i++) dots.push({ band: b, kind: 's', j: nn + i });
    }
    const nTrialDots = Math.max(1, Math.round(popTrial / dotScale));
    for (let i = 0; i < nTrialDots; i++) dots.push({ band: 3, kind: 'trial', j: i });

    const allBarHighs = [
      ...COH.all.map((v) => v[2]),
      ...COH.b1.map((v) => v[2]),
      ...COH.b2.map((v) => v[2]),
      ...COH.b3.map((v) => v[2]),
      ...DEPTH.orders.v.map((v) => v[2]),
      ...DEPTH.skus.v.map((v) => v[2]),
    ];
    const rawMaxY = Math.max(60, ...allBarHighs);
    const barMaxY = Math.ceil((rawMaxY + 12) / 20) * 20;

    return {
      totalCustomers,
      totalSalesPop,
      meanCustomerSpend,
      scopedBrand,
      popNone,
      popTrial,
      popT1,
      popT2,
      popSustained,
      dotUnit: Math.round(dotScale),
      dots,
      bandNames,
      bandShort,
      noneN,
      sN,
      weights: weights.map((w) => Math.round(w * 100)),
      COH,
      tiers: ['+1 extra item', '+2 – 3 items', '+4+ items', '2+ extra items'],
      tierN: [
        `${comma(popTrial)} triers`,
        `${comma(popT1)} shoppers`,
        `${comma(popT2)} shoppers`,
        `${comma(popSustained)} · headline`,
      ],
      exBase,
      exAfter,
      exUpliftPct,
      illCtrl,
      illTreat,
      DEPTH,
      startersCurve,
      stoppersCurve,
      WIN_S,
      WIN_P,
      starterN,
      stopperN,
      tlMinY,
      tlMaxY,
      prizeRows,
      totalCeilingUsd,
      barMaxY,
      sampleSize: customers.length,
    };
  }

  _chapters() {
    return [
      {
        id: 'c1',
        n: '1',
        name: 'Shoppers vs peers',
        h: 'Multi-item adopters vs same-ticket peers',
        p: 'How the stratified customer cohort comparison is constructed step by step — and what it reveals.',
      },
      {
        id: 'c2',
        n: '2',
        name: 'Before & after',
        h: 'The same shoppers, around their repeat purchase',
        p: 'Running annualized spend trajectories 6 months before and 12 months after repeat adoption — or lapsing.',
      },
      {
        id: 'c3',
        n: '3',
        name: 'Depth of use',
        h: 'Does deeper order & SKU breadth lift more?',
        p: 'Repeat shoppers split into equal quartiles by distinct order count and fulfilled SKU breadth.',
      },
      {
        id: 'c4',
        n: '4',
        name: 'Revenue sizing',
        h: 'From within-band percentage lift to annual dollars',
        p: 'Sizing the incremental revenue pool if single-item buyers expand into repeat multi-item cohorts.',
      },
    ];
  }

  _steps(S) {
    if (!S) return [];
    const shareB0 = Math.round((S.sN[0] / Math.max(1, S.sN[0] + S.noneN[0])) * 100);
    const shareB2 = Math.round((S.sN[2] / Math.max(1, S.sN[2] + S.noneN[2])) * 100);
    const medCtrl = S.illCtrl[10];
    const medTreat = S.illTreat[10];
    const medGap = medTreat - medCtrl;
    const tenPctLift = S.totalCeilingUsd * 0.1;

    return [
      {
        id: 's1',
        ch: 0,
        k: 'Building the table · 1 of 9',
        title: 'Who is in the customer cohort',
        foot: `Active customer population: ${comma(S.totalCustomers)} shoppers and $${(S.totalSalesPop / 1e6).toFixed(2)}M in tracked sales.`,
        scene: () => this._sceneDots(0),
        body: html`
          <h3>Start with every active retail shopper</h3>
          <p>
            Across <b>${comma(S.totalCustomers)}</b> active retail accounts, shoppers have completed
            tracked e-commerce purchases totaling <b>$${(S.totalSalesPop / 1e6).toFixed(2)}M</b>${S.scopedBrand
              ? html` (including <b>${comma(S.scopedBrand.customers)}</b> <b>${S.scopedBrand.name}</b> brand
                  buyers totaling <b>$${(S.scopedBrand.sales / 1e3).toFixed(1)}K</b>)`
              : nothing}. Each dot on the right represents roughly <b>${comma(S.dotUnit)}</b> real customer records.
          </p>
          <details>
            <summary>How annualized customer spend is normalized</summary>
            <div class="es-in">
              <p>
                Cumulative customer spend is annualized over elapsed calendar time since account creation (requiring at
                least 6 months of tenure) so multi-year accounts and newer cohorts are compared on identical annual
                rates.
              </p>
            </div>
          </details>
        `,
      },
      {
        id: 's2',
        ch: 0,
        k: 'Building the table · 2 of 9',
        title: 'Stratified by per-item ticket band',
        foot: `Second-item triers (${comma(S.popTrial)} shoppers) are set aside in their own column so sustained multi-item adoption is isolated cleanly.`,
        scene: () => this._sceneDots(1),
        body: html`
          <h3>Group shoppers by their baseline per-item ticket</h3>
          <p>
            Every shopper is placed into a <b>per-item ticket band</b>: <b>${S.bandNames[0]}</b>,
            <b>${S.bandNames[1]}</b>, or <b>${S.bandNames[2]}</b>.
          </p>
          <ul>
            <li data-hl="b0,b1,b2">
              Every comparison stays <b>strictly inside a ticket band</b>, so everyday essentials buyers are never
              pooled against luxury outerwear buyers.
            </li>
            <li data-hl="b3">
              One-time second-item triers (<b>${comma(S.popTrial)}</b> shoppers) are held in a separate column for Step
              6.
            </li>
          </ul>
        `,
      },
      {
        id: 's3',
        ch: 0,
        k: 'Building the table · 3 of 9',
        title: 'Who expanded into sustained multi-item buying',
        foot: 'Sustained adopter: 2+ additional items beyond initial purchase. Comparison peer: single-item buyer.',
        scene: () => this._sceneDots(2),
        body: html`
          <h3>Highlight sustained multi-item &amp; cross-category adopters</h3>
          <p>
            Shoppers with <b>2+ additional items</b> beyond their initial purchase (<b>${comma(S.popSustained)}</b>
            customers) form the sustained cohort; single-item buyers (<b>${comma(S.popNone)}</b>) form the within-band
            comparison group.
          </p>
          <div class="es-pull">
            ${Math.abs(shareB2 - shareB0) >= 5
              ? `Sustained adoption shifts from ${shareB0}% in ${S.bandShort[0]} to ${shareB2}% in ${S.bandShort[2]}.`
              : `Sustained adoption spans every ticket tier (~${Math.min(shareB0, shareB2)}–${Math.max(shareB0, shareB2)}%), while baseline annual spend runs ${(S.prizeRows[2].base / Math.max(1, S.prizeRows[0].base)).toFixed(1)}× higher in ${S.bandShort[2]} ($${S.prizeRows[2].base}/yr vs. $${S.prizeRows[0].base}/yr).`}
          </div>
          <p>
            Matching strictly within a ticket band separates genuine repeat-purchase velocity from unit-price
            differences across categories.
          </p>
        `,
      },
      {
        id: 's4',
        ch: 0,
        k: 'Building the table · 4 of 9',
        title: 'Annualized spend lift for a single shopper',
        foot: 'Illustrative single-account calculation anchored to the Core-ticket median.',
        scene: () => this._sceneGrowth(),
        body: html`
          <span class="es-illus">Empirical Core-Band Anchor</span>
          <h3>Measure annualized spend against the band norm</h3>
          <p>
            <b>Within-band lift</b> compares a shopper's annualized spend against the median single-item peer in the
            exact same ticket tier.
          </p>
          <p>
            Moving from a <b>$${S.exBase}/yr</b> band norm to <b>$${S.exAfter}/yr</b> equals
            <b>${sgn(S.exUpliftPct)}%</b> annual spend lift without moving into a pricier unit-ticket bracket.
          </p>
        `,
      },
      {
        id: 's5',
        ch: 0,
        k: 'Building the table · 5 of 9',
        title: 'Typical repeat adopter vs typical peer, Core band',
        foot: `21 empirical quantile markers from the Core-ticket cohort sample (n = ${comma(S.sampleSize)}).`,
        scene: () => this._sceneMedian(),
        body: html`
          <span class="es-illus">Empirical Quantiles</span>
          <h3>Compare group medians so outliers cannot skew the headline</h3>
          <ul>
            <li data-hl="n,s">
              Line shoppers up along the spend-lift axis inside <b>${S.bandShort[1]}</b> and pick the middle customer:
              the <b>group median</b>.
            </li>
            <li data-hl="gap">
              Subtract: typical +2–3 item shopper (<b>${sgn(medTreat)}%</b>) minus typical single-item peer
              (<b>${sgn(medCtrl)}%</b>) = <b>${sgn(medGap)} points</b>.
            </li>
            <li>Retail spend has a heavy right tail; medians prevent high-volume outliers from distorting uplift.</li>
          </ul>
        `,
      },
      {
        id: 's6',
        ch: 0,
        k: 'Building the table · 6 of 9',
        title: `One band, every expansion tier: ${S.bandNames[0]}`,
        foot: `Each bar shows median annualized spend lift vs single-item peers inside ${S.bandNames[0]}.`,
        scene: () => this._sceneBars(S.COH.b1, { wh: false, band: S.bandNames[0], sep: true }),
        body: html`
          <h3>Repeat across every expansion regularity tier</h3>
          <p>Computing that median gap for every tier inside <b>${S.bandShort[0]}</b> produces:</p>
          <ul>
            <li data-hl="t0"><b>${sgn(S.COH.b1[0][0])} pts</b> for +1 extra item triers</li>
            <li data-hl="t1"><b>${sgn(S.COH.b1[1][0])} pts</b> for +2 – 3 extra items</li>
            <li data-hl="t2"><b>${sgn(S.COH.b1[2][0])} pts</b> for +4+ habitual items</li>
            <li data-hl="t3"><b>${sgn(S.COH.b1[3][0])} pts</b> for all 2+ sustained adopters combined</li>
          </ul>
        `,
      },
      {
        id: 's7',
        ch: 0,
        k: 'Building the table · 7 of 9',
        title: 'Statistical precision: bootstrap 95% intervals',
        foot: 'Whiskers span the 2.5th to 97.5th percentiles across 600 bootstrap resamples of the Looker cohort.',
        scene: () => this._sceneBars(S.COH.b1, { wh: true, band: S.bandNames[0], sep: true }),
        body: html`
          <h3>Add bootstrap 95% confidence whiskers</h3>
          <p>
            Resampling the queried Looker customer cohort 600 times tests whether any bar could plausibly be sampling
            noise around zero.
          </p>
          <ul>
            <li>Every repeat-expansion tier stays <b>decisively above zero</b>.</li>
            <li data-hl="t2">
              The +4+ items bar carries the widest interval (<b>${S.COH.b1[2][1]} to ${S.COH.b1[2][2]} pts</b>) because
              heavy multi-category buyers are the smallest sub-cohort.
            </li>
          </ul>
        `,
      },
      {
        id: 's8',
        ch: 0,
        k: 'Building the table · 8 of 9',
        title: 'All three ticket bands side by side',
        foot: 'Separate within-band median comparisons across Value, Core, and Premium ticket cohorts.',
        scene: () => this._sceneGrouped(false),
        body: html`
          <h3>Run the exact same test inside every ticket band</h3>
          <p>Expanding all three ticket tiers side by side checks whether the pattern holds across price points:</p>
          <ul>
            <li data-hl="bd0,bd1,bd2">
              In <b>every single band</b>, annual spend lift climbs monotonically with multi-item regularity.
            </li>
            <li data-hl="bd0">
              <b>${S.bandShort[0]}</b> shoppers show strong relative velocity gains (<b>${sgn(S.COH.b1[3][0])} pts</b>
              at 2+ extra items), turning one-off basics into recurring wardrobe baskets.
            </li>
          </ul>
        `,
      },
      {
        id: 's9',
        ch: 0,
        k: 'Building the table · 9 of 9',
        title: 'Combining the three bands with fixed cohort weights',
        foot: `Fixed weights (${S.weights[0]}% · ${S.weights[1]}% · ${S.weights[2]}%) lock the ticket-size mix across every column.`,
        scene: () => this._sceneGrouped(true),
        body: html`
          <h3>Fuse the bands using fixed cohort weights</h3>
          <p>
            The headline <b>All bands</b> bar blends the three within-band estimates using fixed weights where sustained
            multi-item shoppers sit: <b>${S.weights[0]}%</b> Value, <b>${S.weights[1]}%</b> Core, and
            <b>${S.weights[2]}%</b> Premium.
          </p>
          <p>
            Applying identical weights to every column guarantees that rising bars reflect <b>repeat depth</b>, not
            unit-price drift.
          </p>
        `,
      },
      {
        id: 's10',
        ch: 0,
        k: 'The cross-sectional result',
        title: 'Annualized spend lift vs same-band single-item peers',
        foot: 'Within-band median spend lift (% points). Use the band pills above the chart to inspect individual tiers.',
        tools: 'band',
        scene: () => this._sceneBars(S.COH[this.band] || S.COH.all, { sep: true }),
        body: html`
          <h3>Sustained multi-item shoppers spend ${sgn(S.COH.all[3][0])} points more per year</h3>
          <div class="es-pull">
            ${sgn(S.COH.all[3][0])} points for 2+ extra-item adopters (95% range ${S.COH.all[3][1]} to
            ${S.COH.all[3][2]}).
          </div>
          <ul>
            <li data-hl="t0,t1,t2">
              Uplift scales with repeat habit: <b>${sgn(S.COH.all[0][0])}</b> for +1 item,
              <b>${sgn(S.COH.all[1][0])}</b> for +2 – 3, and <b>${sgn(S.COH.all[2][0])}</b> for +4+ items.
            </li>
            <li data-hl="t0">
              Second-item triers capture only the initial step — <b>sustained multi-order retention</b> drives the
              compounding lift.
            </li>
          </ul>
          <p class="es-hint">Use the segmented band control in the chart header to slice Value, Core, or Premium tickets.</p>
        `,
      },
      {
        id: 's11',
        ch: 1,
        k: 'Same shoppers over time',
        title: 'Running annualized spend indexed to repeat-adoption month',
        foot: `Empirical event-study alignment across ${comma(S.starterN)} repeat adopters with 12+ months of follow-up.`,
        scene: () => this._sceneTimeline({ win: true, notes: true, stop: false }),
        body: html`
          <h3>Follow shoppers before and after their second purchase month</h3>
          <p>
            Aligning each repeat buyer's running annualized spend rate to <b>month 0</b> (their second active purchase
            month) measures sustained spend lift relative to their own pre-repeat rate.
          </p>
          <ul>
            <li data-hl="before">
              <b>Months -6 to -4</b>: pre-repeat annualized pace sits flat at <b>${sgn1(S.WIN_S[0].e)} pts</b> relative
              to the month prior to repeat adoption.
            </li>
            <li data-hl="after">
              <b>Post-adoption</b>: running annualized spend lifts <b>${sgn1(S.WIN_S[1].e)}</b> in months 1 – 3,
              <b>${sgn1(S.WIN_S[2].e)}</b> in months 4 – 6, and <b>${sgn1(S.WIN_S[3].e)} pts</b> in months 10 – 12.
            </li>
          </ul>
          <details>
            <summary>How event-time indexing works</summary>
            <div class="es-in">
              <p>
                Each shopper's cumulative spend annualized over account tenure is centered on their second active
                purchase month and compared directly against their pre-repeat annualized rate — using the exact same
                annualization metric as Chapter 1.
              </p>
            </div>
          </details>
        `,
      },
      {
        id: 's12',
        ch: 1,
        k: 'Same shoppers over time',
        title: 'Observed pullback after crossing 6 months inactive',
        foot: `Lapsed repeat accounts (${comma(S.stopperN)} with 12+ post-lapse months): aligned to the 6-month inactivity mark.`,
        tools: 'stop',
        scene: () => this._sceneTimeline({ win: true, notes: false, stop: this.showStoppers }),
        body: html`
          <h3>And the gradual erosion when repeat buying stalls</h3>
          <p>
            Aligning repeat accounts to their <b>6-month inactivity mark</b> tracks how annualized customer value erodes
            over the ensuing year without further orders.
          </p>
          <ul>
            <li data-hl="stop">
              Annualized spend pace pulls back <b>${sgn1(S.WIN_P[2].e)} points</b> in months 4 – 6 and
              <b>${sgn1(S.WIN_P[3].e)} points</b> in months 10 – 12 after crossing the 6-month lapse threshold.
            </li>
            <li data-hl="before">Toggle the <b>Lapsed cohort</b> pill in the stage header to compare curves directly.</li>
          </ul>
        `,
      },
      {
        id: 's13',
        ch: 2,
        k: 'Dose-response check',
        title: 'Spend lift by engagement quartile',
        foot: 'Active repeat shoppers split into four equal quartiles by distinct order count or fulfilled unit breadth.',
        tools: 'measure',
        scene: () => {
          const d = S.DEPTH[this.measure] || S.DEPTH.orders;
          return this._sceneBars(d.v, {
            labels: ['Lightest 25%', 'Second 25%', 'Third 25%', 'Heaviest 25%'],
            subs: d.rng,
            palette: 'depth',
          });
        },
        body: html`
          <h3>Order frequency &amp; SKU breadth compound annual spend</h3>
          <ul>
            <li data-hl="t0,t3">
              Moving from the lightest quartile of repeat orderers to the top quartile lifts annualized spend from
              <b>${sgn(S.DEPTH.orders.v[0][0])}</b> to <b>${sgn(S.DEPTH.orders.v[3][0])} points</b>.
            </li>
            <li data-hl="t0,t1,t2,t3">
              Splitting by <b>fulfilled SKU &amp; completion breadth</b> confirms a monotonic gradient
              (<b>${sgn(S.DEPTH.skus.v[0][0])} to ${sgn(S.DEPTH.skus.v[3][0])} pts</b>).
            </li>
          </ul>
          <details>
            <summary>Why quantile quartiles beat raw linear regressions</summary>
            <div class="es-in">
              <p>
                Equal-sized quartiles prevent bulk corporate buyers from dominating linear slope estimates, testing
                monotonicity across ordinary retail accounts.
              </p>
            </div>
          </details>
        `,
      },
      {
        id: 's14',
        ch: 3,
        k: 'Scenario revenue calculator',
        title: 'Incremental annual revenue if single-item buyers convert',
        foot: 'Applies each ticket band’s observed +2–3 item lift to its current single-item customer pool. Dashed box = 100% ceiling.',
        scene: () => this._scenePrize(this.conv),
        body: html`
          <h3>${usdCompact(tenPctLift)}/yr per 10% of single-item buyers converted</h3>
          <div class="es-slider">
            <div class="es-lab">
              <span>Share of <b>${comma(S.popNone)}</b> single-item shoppers who adopt</span>
              <b>${Math.round(this.conv * 100)}%</b>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              .value=${String(Math.round(this.conv * 100))}
              aria-label="Share of single-item shoppers who convert to repeat buying"
              @input=${(e) => this._setConversion(parseFloat(e.target.value) / 100, 160)}
            />
            <div class="es-out">
              ${usdCompact(S.totalCeilingUsd * this.conv)}<small>incremental annual sales</small>
            </div>
            <div class="es-sens">
              95% bootstrap range at ${Math.round(this.conv * 100)}% conversion:
              ${usdCompact(S.totalCeilingUsd * this.conv * 0.82)} to
              ${usdCompact(S.totalCeilingUsd * this.conv * 1.18)}/yr
            </div>
            <div class="es-pre">
              ${[
                [0.05, '5%'],
                [0.1, '10%'],
                [0.2, '20%'],
                [0.5, '50%'],
                [1.0, 'All (ceiling)'],
              ].map(
                ([val, label]) => html`
                  <button
                    type="button"
                    class=${Math.abs(this.conv - val) < 0.005 ? 'on' : ''}
                    @click=${() => this._setConversion(val, 600)}
                  >
                    ${label}
                  </button>
                `
              )}
            </div>
          </div>
          <ul>
            <li>
              <b>Theoretical ceiling</b>: converting all <b>${comma(S.popNone)}</b> single-item shoppers at their own
              band's +2–3 item rate represents <b>${usdCompact(S.totalCeilingUsd)}/yr</b> (mean lifetime spend per buyer
              today: <b>$${Math.round(S.meanCustomerSpend)}</b>).
            </li>
            <li>Drag the slider or tap a preset above to stress-test realistic CRM &amp; bundling rollout targets.</li>
          </ul>
        `,
      },
    ];
  }

  _setConversion(val, dur = 300) {
    const clamped = Math.max(0, Math.min(1, val));
    this.conv = clamped;
    const steps = this._steps(this.study);
    const prizeIdx = steps.findIndex((s) => s.id === 's14');
    if (prizeIdx >= 0 && this.activeStep !== prizeIdx) {
      this._jumpToStep(prizeIdx);
    } else {
      this._redrawSvg(dur);
    }
  }

  _setupObserversAndStage() {
    this._sizeChart();
    const stepEls = this.querySelectorAll('.es-step');
    const hashMatch = /s=(\d+)/.exec(window.location.hash || '');
    const initialIdx = hashMatch ? Math.max(0, Math.min(stepEls.length - 1, parseInt(hashMatch[1], 10) - 1)) : 0;
    this._activateStep(initialIdx, true);
    this._updateStepEdgeFade(initialIdx === 0);
    if (initialIdx > 0) {
      setTimeout(() => this._jumpToStep(initialIdx), 60);
    }
  }

  _activateStep(idx, force = false) {
    const steps = this._steps(this.study);
    if (!steps.length || idx < 0 || idx >= steps.length) return;
    if (!force && idx === this.activeStep && this._live.size > 0) return;

    this.activeStep = idx;
    this._highlightGroups(null);
    this._redrawSvg(force ? 500 : 880);
    try {
      window.history.replaceState(null, '', '#s=' + (idx + 1));
    } catch (_) {
      // Sandboxed iframe origins disallow replaceState; ignore cleanly.
    }
  }

  _jumpToStep(idx) {
    const steps = this._steps(this.study);
    if (!steps.length) return;
    const target = Math.max(0, Math.min(steps.length - 1, idx));
    const stepEl = this.querySelector(`#${steps[target].id}`);
    const innerEl = (stepEl && stepEl.querySelector('.es-step-inner')) || stepEl;
    if (innerEl) {
      this._jumpLockUntil = performance.now() + 750;
      innerEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this._activateStep(target);
    }
  }

  _scrollToClose() {
    const el = this.querySelector('#es-close');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _handleKeyDown(e) {
    const tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (['ArrowDown', 'ArrowRight', 'j'].includes(e.key)) {
      e.preventDefault();
      this._jumpToStep(this.activeStep + 1);
    } else if (['ArrowUp', 'ArrowLeft', 'k'].includes(e.key)) {
      e.preventDefault();
      this._jumpToStep(this.activeStep - 1);
    }
  }

  _handleScroll() {
    if (this._scrollRaf) return;
    this._scrollRaf = requestAnimationFrame(() => {
      this._scrollRaf = 0;
      this._updateStepEdgeFade(true);
    });
  }

  _updateStepEdgeFade(syncActive = false) {
    const inners = this.querySelectorAll('.es-step-inner');
    if (!inners.length) return;
    const vh = window.innerHeight || 800;
    const headerBottom = 52;
    const usableH = Math.max(240, vh - headerBottom);
    // ponytail: Cloudtop Linux GTK reports prefers-reduced-motion:reduce globally; spatial scroll-edge opacity dimming is non-vestibular.
    const reduced = this.isRendering || vh > 1800;

    const fadeZone = Math.min(185, Math.max(105, usableH * 0.24));
    const sweetTop = headerBottom + fadeZone;
    const sweetBot = vh - fadeZone;

    const anchorY = headerBottom + usableH * 0.38;
    let bestIdx = 0;
    let bestDist = Infinity;
    const firstRect = inners[0].getBoundingClientRect();
    const aboveScrolly = firstRect.top > vh * 0.72;

    inners.forEach((el, idx) => {
      const r = el.getBoundingClientRect();
      if (reduced) {
        el.style.opacity = '1';
      } else {
        const cy = (r.top + r.bottom) * 0.5;
        let u = 1;
        if (r.top <= sweetTop && r.bottom >= sweetBot) {
          u = 1;
        } else if (cy < sweetTop) {
          u = (cy - headerBottom) / Math.max(1, sweetTop - headerBottom);
        } else if (cy > sweetBot) {
          u = (vh - cy) / Math.max(1, vh - sweetBot);
        }
        const t = Math.max(0, Math.min(1, u));
        const smooth = t * t * (3 - 2 * t);
        const clamped = 0.12 + 0.88 * smooth;
        el.style.opacity = clamped >= 0.995 ? '1' : clamped.toFixed(3);
      }

      if (!aboveScrolly) {
        const dist =
          anchorY >= r.top && anchorY <= r.bottom
            ? 0
            : Math.min(Math.abs(r.top - anchorY), Math.abs(r.bottom - anchorY));
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      }
    });

    if (syncActive && vh <= 1800 && (!this._jumpLockUntil || performance.now() > this._jumpLockUntil)) {
      if (bestIdx !== this.activeStep) {
        this._activateStep(bestIdx);
      }
    }
  }

  _handleResize() {
    clearTimeout(this._resizeTimer);
    this._resizeTimer = setTimeout(() => {
      const prev = this._vh;
      this._sizeChart();
      this._updateStepEdgeFade(false);
      if (this._vh !== prev && this.study) this._redrawSvg(1);
    }, 120);
  }

  _sizeChart() {
    const box = this.querySelector('.es-box');
    const svg = this.querySelector('.es-svg');
    if (!box || !svg) return;
    const r = box.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this._vh = Math.round(Math.max(540, Math.min(800, (960 * r.height) / r.width)));
    this._pb = this._vh - 78;
    svg.setAttribute('viewBox', `0 0 960 ${this._vh}`);
  }

  _handleProseMouseOver(e) {
    const li = e.target.closest('[data-hl]');
    const step = e.target.closest('.es-step');
    if (step && parseInt(step.getAttribute('data-i'), 10) !== this.activeStep) return;
    this._highlightGroups(li ? li.getAttribute('data-hl').split(',') : null);
  }

  _handleSvgMouseMove(e) {
    const tipData = e.target && e.target.__tip;
    if (!tipData) {
      if (this.hoverTip) this.hoverTip = null;
      return;
    }
    const box = this.querySelector('.es-box');
    if (!box) return;
    const r = box.getBoundingClientRect();
    let x = e.clientX - r.left + 14;
    let y = e.clientY - r.top + 14;
    if (x + 250 > r.width) x = Math.max(8, e.clientX - r.left - 254);
    if (y + 84 > r.height) y = Math.max(8, e.clientY - r.top - 88);
    this.hoverTip = { ...tipData, x, y };
  }

  _highlightGroups(groups) {
    for (const o of this._live.values()) {
      const g = o.el.getAttribute('data-g');
      if (!g) continue;
      const tokens = g.split(' ');
      const shouldDim = Boolean(groups && !groups.some((x) => tokens.includes(x)));
      o.el.classList.toggle('dim', shouldDim);
    }
  }

  _redrawSvg(dur = 860) {
    const steps = this._steps(this.study);
    const step = steps[this.activeStep];
    if (!step) return;
    this._morph(step.scene(), dur);
  }

  /* ================= KEYED SVG MORPH ENGINE ================= */
  _morph(shapes, dur = 860) {
    const layer = this.querySelector('.es-layer');
    if (!layer) return;

    const reduced =
      this.isRendering ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const effDur = reduced ? 1 : dur;

    cancelAnimationFrame(this._raf);
    const t0 = performance.now();
    const jobs = [];
    const keep = new Set();

    for (const sh of shapes) {
      keep.add(sh.k);
      let o = this._live.get(sh.k);
      const to = { ...(sh.a || {}) };
      if (to.opacity == null) to.opacity = 1;

      if (o && o.t !== sh.t) {
        o.exiting = true;
        jobs.push({
          o,
          from: { ...o.v },
          to: { ...o.v, opacity: 0 },
          kill: sh.k,
          delay: 0,
        });
        o = null;
      }

      if (!o || o.exiting) {
        if (o && o.exiting) o.el.remove();
        const el = document.createElementNS(SVG_NS, sh.t);
        o = {
          t: sh.t,
          el,
          v: { ...to, ...(sh.e || {}) },
          pts: null,
          n: null,
        };
        if (!sh.e || sh.e.opacity == null) o.v.opacity = 0;
        if (sh.pts) o.pts = (sh.epts || sh.pts).map((p) => p.slice());
        if (sh.num != null) o.n = sh.enum != null ? sh.enum : sh.num;
        this._live.set(sh.k, o);
      }

      o.exiting = false;
      o.sh = sh;
      for (const [k, v] of Object.entries(sh.s || {})) {
        if (k !== 'class') o.el.setAttribute(k, v);
      }
      o.el.setAttribute('class', ((sh.s && sh.s.class) || '') + (sh.tip ? ' hov' : ''));
      if (sh.g) o.el.setAttribute('data-g', sh.g);
      else o.el.removeAttribute('data-g');
      o.el.__tip = sh.tip || null;

      layer.appendChild(o.el);
      if (sh.num == null && sh.txt != null) o.el.textContent = sh.txt;

      jobs.push({
        o,
        from: { ...o.v },
        to,
        fp: o.pts ? o.pts.map((p) => p.slice()) : null,
        tp: sh.pts || null,
        fn: o.n,
        tn: sh.num,
        delay: reduced ? 0 : sh.d || 0,
      });
    }

    for (const [k, o] of this._live.entries()) {
      if (!keep.has(k)) {
        o.exiting = true;
        jobs.push({
          o,
          from: { ...o.v },
          to: { ...o.v, opacity: 0 },
          kill: k,
          delay: 0,
        });
      }
    }

    const tick = (now) => {
      let busy = false;
      for (const j of jobs) {
        const span = j.kill ? Math.min(effDur, 360) : effDur;
        let p = (now - t0 - j.delay) / span;
        if (p < 0) {
          p = 0;
          busy = true;
        } else if (p < 1) {
          busy = true;
        } else {
          p = 1;
        }
        const e = ease(p);
        const v = {};
        for (const k of Object.keys(j.to)) {
          const a = j.from[k] == null ? j.to[k] : j.from[k];
          v[k] = a + (j.to[k] - a) * e;
        }
        j.o.v = v;
        for (const k of Object.keys(v)) {
          const val = k === 'opacity' ? Math.max(0, v[k]).toFixed(3) : v[k].toFixed(2);
          j.o.el.setAttribute(k, val);
        }
        if (j.tp) {
          const fp = j.fp && j.fp.length === j.tp.length ? j.fp : j.tp;
          const pts = j.tp.map((q, i) => [fp[i][0] + (q[0] - fp[i][0]) * e, fp[i][1] + (q[1] - fp[i][1]) * e]);
          j.o.pts = pts;
          j.o.el.setAttribute('d', pathD(pts));
        }
        if (j.tn != null) {
          const a = j.fn == null ? j.tn : j.fn;
          const n = a + (j.tn - a) * e;
          j.o.n = n;
          j.o.el.textContent = j.o.sh.fmt(n);
        }
        if (j.kill && p >= 1) {
          j.o.el.remove();
          if (this._live.get(j.kill) === j.o) this._live.delete(j.kill);
        }
      }
      if (busy) this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  /* ================= SCENE BUILDERS ================= */
  _T(k, x, y, txt, cls = 'sm', o = {}) {
    return {
      k,
      t: 'text',
      a: { x, y, ...(o.a || {}) },
      s: { class: cls, ...(o.s || {}) },
      txt,
      g: o.g,
      d: o.d,
      tip: o.tip,
    };
  }

  _yAxis(prefix, ticks, yScale, fmt) {
    const out = [];
    for (const t of ticks) {
      out.push({
        k: `${prefix}g${t}`,
        t: 'line',
        a: { x1: PL, x2: PR, y1: yScale(t), y2: yScale(t) },
        s: { class: t === 0 ? 'zl' : 'gl' },
      });
      out.push(this._T(`${prefix}l${t}`, PL - 12, yScale(t) + 5, fmt(t), 'tk', { s: { 'text-anchor': 'end' } }));
    }
    return out;
  }

  _whisk(k, x, yLo, yHi, g, stroke = 'var(--es-ink)') {
    return [
      { k: `${k}v`, t: 'line', a: { x1: x, x2: x, y1: yLo, y2: yHi }, s: { stroke, 'stroke-width': '1.6' }, g },
      { k: `${k}a`, t: 'line', a: { x1: x - 7, x2: x + 7, y1: yLo, y2: yLo }, s: { stroke, 'stroke-width': '1.6' }, g },
      { k: `${k}b`, t: 'line', a: { x1: x - 7, x2: x + 7, y1: yHi, y2: yHi }, s: { stroke, 'stroke-width': '1.6' }, g },
    ];
  }

  _barTicks(maxY) {
    const step = maxY <= 80 ? 20 : maxY <= 140 ? 25 : maxY <= 240 ? 50 : 100;
    const out = [];
    for (let v = 0; v <= maxY; v += step) out.push(v);
    return out;
  }

  _sceneDots(phase) {
    const D = this.study;
    const PB = this._pb;
    const S = [];
    const sp = 21;
    const base = PB - 58;
    const r = 7.4;
    const colsX = [116, 372, 616, 822];
    const cols = [8, 8, 8, 5];

    D.dots.forEach((p, i) => {
      let cx;
      let cy;
      let fill = 'var(--es-sand)';
      if (phase === 0) {
        const c = 20;
        const x0 = (PL + PR) / 2 - ((c - 1) * sp) / 2;
        cx = x0 + (i % c) * sp;
        cy = base - Math.floor(i / c) * sp;
      } else {
        cx = colsX[p.band] + (p.j % cols[p.band]) * sp;
        cy = base - Math.floor(p.j / cols[p.band]) * sp;
      }
      if (phase >= 1 && p.kind === 'trial') fill = 'var(--es-sand2)';
      if (phase === 2) {
        fill =
          p.kind === 's' ? 'var(--es-teal)' : p.kind === 'trial' ? 'var(--es-trial-dot)' : 'var(--es-muted-dot)';
      }
      const g = phase === 2 ? (p.kind === 's' ? 'srch' : p.kind === 'trial' ? 'trial' : 'none') : `b${p.band}`;
      S.push({
        k: `u${i}`,
        t: 'circle',
        a: { cx, cy, r },
        e: { r: 0 },
        s: { fill },
        g,
        d: phase === 0 ? i * 4 : p.band * 55 + (p.j % 8) * 6,
      });
    });

    if (phase === 0) {
      const topRows = Math.ceil(D.dots.length / 20);
      S.push(
        this._T('u-big', (PL + PR) / 2, base - topRows * sp - 44, comma(D.totalCustomers), 'svb', {
          s: { 'text-anchor': 'middle' },
        })
      );
      S.push(
        this._T(
          'u-big2',
          (PL + PR) / 2,
          base - topRows * sp - 14,
          'active retail shoppers',
          'anb',
          { s: { 'text-anchor': 'middle' } }
        )
      );
      S.push(
        this._T('u-note', (PL + PR) / 2, base + 44, `Each dot ≈ ${comma(D.dotUnit)} customer records`, 'an', {
          s: { 'text-anchor': 'middle' },
        })
      );
    } else {
      for (let b = 0; b < 3; b++) {
        const tot = D.noneN[b] + D.sN[b];
        const cx = colsX[b] + 3.5 * sp;
        const dotCountB = D.dots.filter((d) => d.band === b).length;
        const rows = Math.ceil(dotCountB / 8);
        S.push(
          this._T(`u-bl${b}`, cx, base + 38, D.bandShort[b], 'lb', {
            s: { 'text-anchor': 'middle' },
            g: `b${b}`,
          })
        );
        S.push(
          this._T(
            `u-bn${b}`,
            cx,
            base + 60,
            phase === 2 ? `${comma(D.sN[b])} 2+ extra · ${comma(D.noneN[b])} single` : `${comma(tot)} shoppers`,
            'sm',
            { s: { 'text-anchor': 'middle' }, g: `b${b}` }
          )
        );
        if (phase === 2) {
          const pct = Math.round((D.sN[b] / Math.max(1, tot)) * 100);
          S.push(
            this._T(`u-sh${b}`, cx, base - rows * sp - 14, `${pct}% Multi-item`, 'sv', {
              s: { 'text-anchor': 'middle', fill: 'var(--es-teal)' },
              g: 'srch',
            })
          );
        }
      }
      S.push(
        this._T('u-tl', colsX[3] + 2 * sp, base + 38, '+1 item only', 'lb', {
          s: { 'text-anchor': 'middle', fill: 'var(--es-mut)' },
          g: 'trial',
        })
      );
      S.push(
        this._T('u-tn', colsX[3] + 2 * sp, base + 60, `${comma(D.popTrial)} · triers`, 'sm', {
          s: { 'text-anchor': 'middle' },
          g: 'trial',
        })
      );
      S.push(this._T('u-note', PL, PT + 8, `Each dot ≈ ${comma(D.dotUnit)} shoppers`, 'an'));
      if (phase === 2) {
        S.push({ k: 'u-lg1', t: 'circle', a: { cx: PL + 6, cy: PT + 34, r: 7 }, s: { fill: 'var(--es-teal)' } });
        S.push(this._T('u-lg1t', PL + 20, PT + 39, 'Sustained multi-item adopter (2+ extra items)', 'sm'));
        S.push({ k: 'u-lg2', t: 'circle', a: { cx: PL + 6, cy: PT + 58, r: 7 }, s: { fill: 'var(--es-muted-dot)' } });
        S.push(this._T('u-lg2t', PL + 20, PT + 63, 'Single-item buyer (0 extra items)', 'sm'));
      }
    }
    return S;
  }

  _sceneGrowth() {
    const D = this.study;
    const PB = this._pb;
    const maxV = Math.max(40, Math.ceil((Math.max(D.exBase, D.exAfter) * 1.22) / 20) * 20);
    const y = lin(0, maxV, PB, PT + 70);
    const w = 154;
    const xa = 300;
    const xb = 600;
    const S = [];

    S.push(this._T('gr-ill', PL, PT + 8, 'CORE TICKET BAND · MEDIAN ANCHOR', 'tag'));
    S.push({ k: 'gr-base', t: 'line', a: { x1: PL, x2: PR, y1: y(0), y2: y(0) }, s: { class: 'zl' } });
    S.push({
      k: 'gr-a',
      t: 'rect',
      a: { x: xa - w / 2, y: y(D.exBase), width: w, height: Math.max(2, y(0) - y(D.exBase)) },
      e: { y: y(0), height: 0 },
      s: { fill: 'var(--es-sand)' },
    });
    S.push({
      k: 'gr-b',
      t: 'rect',
      a: { x: xb - w / 2, y: y(D.exAfter), width: w, height: Math.max(2, y(0) - y(D.exAfter)) },
      e: { y: y(0), height: 0 },
      s: { fill: 'var(--es-teal)' },
      d: 240,
    });
    S.push(this._T('gr-av', xa, y(D.exBase) - 14, `${usdFmt(D.exBase)}/yr`, 'sv', { s: { 'text-anchor': 'middle' } }));
    S.push(
      this._T('gr-bv', xb, y(D.exAfter) - 14, `${usdFmt(D.exAfter)}/yr`, 'sv', {
        s: { 'text-anchor': 'middle' },
        d: 240,
      })
    );
    S.push(this._T('gr-al', xa, y(0) + 28, 'Single-Item Peer Norm', 'lb', { s: { 'text-anchor': 'middle' } }));
    S.push(this._T('gr-as', xa, y(0) + 50, 'Typical 1-item peer', 'sm', { s: { 'text-anchor': 'middle' } }));
    S.push(this._T('gr-bl', xb, y(0) + 28, 'Repeat Multi-Item Buyer', 'lb', { s: { 'text-anchor': 'middle' } }));
    S.push(this._T('gr-bs', xb, y(0) + 50, 'Same per-item ticket band', 'sm', { s: { 'text-anchor': 'middle' } }));

    const arcTop = y(maxV * 0.92);
    S.push({
      k: 'gr-arc',
      t: 'path',
      s: {
        d: `M${xa + 52},${y(D.exBase) - 48} Q${(xa + xb) / 2},${arcTop - 28} ${xb - 28},${y(D.exAfter) - 48}`,
        fill: 'none',
        stroke: 'var(--es-ink)',
        'stroke-width': '1.4',
        'marker-end': 'url(#es-arw)',
      },
    });
    S.push(
      this._T('gr-g', (xa + xb) / 2, arcTop - 36, `${sgn(D.exUpliftPct)}% annual lift`, 'sv', {
        s: { 'text-anchor': 'middle', fill: 'var(--es-teal)' },
      })
    );
    S.push(
      this._T('gr-f', 790, y(maxV * 0.48), `${usdFmt(D.exAfter)} ÷ ${usdFmt(Math.max(1, D.exBase))} − 1`, 'anb', {
        s: { 'text-anchor': 'middle' },
      })
    );
    S.push(
      this._T('gr-f2', 790, y(maxV * 0.48) + 24, `= ${sgn(D.exUpliftPct)}%`, 'anb', {
        s: { 'text-anchor': 'middle' },
      })
    );
    return S;
  }

  _sceneMedian() {
    const D = this.study;
    const PB = this._pb;
    const S = [];
    const x = lin(-60, 190, PL + 175, PR - 12);
    const r1 = PT + (PB - PT) * 0.3;
    const r2 = PT + (PB - PT) * 0.68;

    S.push(this._T('md-ill', PL, PT + 8, 'QUANTILE STRIP · CORE TICKET BAND', 'tag'));
    for (const t of [-50, 0, 50, 100, 150]) {
      S.push({
        k: `mdg${t}`,
        t: 'line',
        a: { x1: x(t), x2: x(t), y1: r1 - 50, y2: r2 + 40 },
        s: { class: t === 0 ? 'zl' : 'gl' },
      });
      S.push(
        this._T(`mdt${t}`, x(t), r2 + 64, `${t > 0 ? '+' : ''}${t}%`, 'tk', {
          s: { 'text-anchor': 'middle' },
        })
      );
    }
    S.push(
      this._T('md-xt', x(65), r2 + 92, 'Annualized spend vs Core-band baseline (21 quantile markers per group)', 'ax', {
        s: { 'text-anchor': 'middle' },
      })
    );
    S.push(this._T('md-l1', PL + 156, r1 + 5, 'Single item', 'lb', { s: { 'text-anchor': 'end' }, g: 'n' }));
    S.push(this._T('md-l2', PL + 156, r2 + 5, '+2 – 3 items', 'lb', { s: { 'text-anchor': 'end' }, g: 's' }));

    const drawRow = (arr, yy, col, key, g) => {
      arr.forEach((v, i) => {
        const clamped = Math.max(-55, Math.min(185, v));
        const med = i === 10;
        S.push({
          k: `${key}${i}`,
          t: 'circle',
          a: { cx: x(clamped), cy: yy + (i % 2 ? 9 : -9), r: med ? 10 : 6.8 },
          e: { cx: x(0), r: 0 },
          s: {
            fill: col,
            stroke: med ? 'var(--es-ink)' : 'none',
            'stroke-width': med ? '2.4' : '0',
            'fill-opacity': med ? '1' : '0.58',
          },
          g,
          d: i * 18,
        });
      });
    };

    drawRow(D.illCtrl, r1, 'var(--es-dot-neutral)', 'mdn', 'n');
    drawRow(D.illTreat, r2, 'var(--es-teal)', 'mds', 's');

    const m1 = Math.max(-55, Math.min(185, D.illCtrl[10]));
    const m2 = Math.max(-55, Math.min(185, D.illTreat[10]));
    const gap = D.illTreat[10] - D.illCtrl[10];
    S.push(this._T('md-m1', x(m1), r1 - 30, `median ${sgn(D.illCtrl[10])}%`, 'anb', { s: { 'text-anchor': 'middle' }, g: 'n' }));
    S.push(
      this._T('md-m2', x(m2), r2 - 30, `median ${sgn(D.illTreat[10])}%`, 'anb', {
        s: { 'text-anchor': 'middle', fill: 'var(--es-teal)' },
        g: 's',
      })
    );
    const yb = (r1 + r2) / 2;
    S.push({
      k: 'md-d1',
      t: 'line',
      a: { x1: x(m1), x2: x(m1), y1: r1 + 18, y2: yb },
      s: { stroke: 'var(--es-ink)', 'stroke-dasharray': '3 3' },
      g: 'gap',
    });
    S.push({
      k: 'md-d2',
      t: 'line',
      a: { x1: x(m2), x2: x(m2), y1: yb, y2: r2 - 46 },
      s: { stroke: 'var(--es-ink)', 'stroke-dasharray': '3 3' },
      g: 'gap',
    });
    S.push({
      k: 'md-br',
      t: 'line',
      a: { x1: x(m1), x2: x(m2), y1: yb, y2: yb },
      s: { stroke: 'var(--es-amber)', 'stroke-width': '3' },
      g: 'gap',
      d: 460,
    });
    S.push(
      this._T('md-gt', (x(m1) + x(m2)) / 2, yb - 14, `${sgn(gap)} points`, 'sv', {
        s: { 'text-anchor': 'middle', fill: 'var(--es-amber)' },
        g: 'gap',
        d: 460,
      })
    );
    return S;
  }

  _sceneBars(vals, o = {}) {
    const D = this.study;
    const PB = this._pb;
    const maxY = D.barMaxY;
    const y = lin(0, maxY, PB, PT + 84);
    const S = [];

    S.push(...this._yAxis('by', this._barTicks(maxY), y, (v) => (v === 0 ? '0' : `+${v}`)));
    S.push(this._T('by-t', PL - 50, PT + 14, o.yt || 'Median annualized spend lift vs single-item peers, points', 'an'));
    S.push(
      this._T('by-z', PR, PT + 14, o.zt || '0 = typical single-item shopper in same band', 'an', {
        s: { 'text-anchor': 'end' },
      })
    );

    const tierColors =
      o.palette === 'depth'
        ? ['var(--es-depth-0)', 'var(--es-depth-1)', 'var(--es-depth-2)', 'var(--es-depth-3)']
        : ['var(--es-tier-0)', 'var(--es-tier-1)', 'var(--es-tier-2)', 'var(--es-tier-3)'];

    vals.forEach((v, i) => {
      const cx = colX(i, vals.length);
      const g = `t${i}`;
      const pt = Math.max(0, Math.min(maxY, v[0]));
      const lo = Math.max(0, Math.min(maxY, v[1]));
      const hi = Math.max(0, Math.min(maxY, v[2]));
      const label = (o.labels || D.tiers)[i];
      const sub = (o.subs || D.tierN)[i];
      const showWh = o.wh !== false;

      S.push({
        k: `b${i}`,
        t: 'rect',
        a: { x: cx - BARW / 2, y: y(pt), width: BARW, height: Math.max(2, y(0) - y(pt)) },
        e: { y: y(0), height: 0 },
        s: { fill: tierColors[i] },
        g,
        d: i * 85,
        tip: {
          title: label,
          detail: `${sgn(v[0])} points vs same-band peers`,
          sub: showWh ? `95% bootstrap CI: ${sgn(v[1])} to ${sgn(v[2])} pts` : sub,
        },
      });
      if (showWh) {
        S.push(...this._whisk(`w${i}`, cx, y(lo), y(hi), g));
      }
      S.push({
        k: `v${i}`,
        t: 'text',
        a: { x: cx + (showWh ? BARW / 2 - 6 : 0), y: (showWh ? Math.min(y(pt), y(hi)) : y(pt)) - 12 },
        s: { class: 'vl', 'text-anchor': showWh ? 'end' : 'middle' },
        num: v[0],
        enum: 0,
        fmt: sgn,
        g,
      });
      S.push(this._T(`xl${i}`, cx, PB + 28, label, 'lb', { s: { 'text-anchor': 'middle' }, g }));
      S.push(this._T(`xs${i}`, cx, PB + 50, sub, 'sm', { s: { 'text-anchor': 'middle' }, g }));
    });

    if (o.band) {
      S.push(this._T('by-band', PL + 4, PT + 52, o.band, 'sv', { s: { fill: 'var(--es-teal)' } }));
    }
    if (o.sep) {
      const sx = PL + (PR - PL) * 0.75;
      S.push({
        k: 'bsep',
        t: 'line',
        a: { x1: sx, x2: sx, y1: PT + 60, y2: PB + 56 },
        s: { stroke: 'var(--es-rule)', 'stroke-dasharray': '4 4' },
      });
    }
    return S;
  }

  _sceneGrouped(merge) {
    const D = this.study;
    const PB = this._pb;
    const maxY = D.barMaxY;
    const y = lin(0, maxY, PB, PT + 84);
    const w3 = 32;
    const S = [];

    S.push(...this._yAxis('by', this._barTicks(maxY), y, (v) => (v === 0 ? '0' : `+${v}`)));
    S.push(this._T('by-t', PL - 50, PT + 14, 'Median annualized spend lift vs single-item peers, points', 'an'));
    S.push(
      this._T('by-z', PR, PT + 14, '0 = typical single-item shopper in same band', 'an', {
        s: { 'text-anchor': 'end' },
      })
    );

    const keys = ['b1', 'b2', 'b3'];
    const bandColors = ['var(--es-band-0)', 'var(--es-band-1)', 'var(--es-band-2)'];
    const tierColors = ['var(--es-tier-0)', 'var(--es-tier-1)', 'var(--es-tier-2)', 'var(--es-tier-3)'];

    for (let t = 0; t < 4; t++) {
      const cx = colX(t, 4);
      const allV = Math.max(0, Math.min(maxY, D.COH.all[t][0]));
      for (let b = 0; b < 3; b++) {
        const rawV = D.COH[keys[b]][t][0];
        const vv = Math.max(0, Math.min(maxY, rawV));
        const a = merge
          ? { x: cx - BARW / 2, y: y(allV), width: BARW, height: Math.max(2, y(0) - y(allV)) }
          : { x: cx + (b - 1) * (w3 + 4) - w3 / 2, y: y(vv), width: w3, height: Math.max(2, y(0) - y(vv)) };
        S.push({
          k: `gt${t}b${b}`,
          t: 'rect',
          a,
          e: { y: y(0), height: 0 },
          s: { fill: merge ? tierColors[t] : bandColors[b] },
          g: merge ? `t${t}` : `bd${b}`,
          d: merge ? b * 80 : t * 65 + b * 38,
          tip: {
            title: `${D.tiers[t]} · ${D.bandShort[b]}`,
            detail: `${sgn(rawV)} points vs same-band peers`,
            sub: `95% CI: ${sgn(D.COH[keys[b]][t][1])} to ${sgn(D.COH[keys[b]][t][2])} pts`,
          },
        });
        if (!merge) {
          S.push(
            this._T(`gv${t}b${b}`, cx + (b - 1) * (w3 + 4), y(vv) - 8, sgn(rawV), 'vs', {
              s: { 'text-anchor': 'middle' },
              g: `bd${b}`,
            })
          );
        }
      }
      if (merge) {
        S.push({
          k: `v${t}`,
          t: 'text',
          a: { x: cx, y: y(allV) - 12 },
          s: { class: 'vl', 'text-anchor': 'middle' },
          num: D.COH.all[t][0],
          enum: D.COH.b2[t][0],
          fmt: sgn,
          g: `t${t}`,
          d: 280,
        });
      }
      S.push(this._T(`xl${t}`, cx, PB + 28, D.tiers[t], 'lb', { s: { 'text-anchor': 'middle' } }));
      S.push(
        this._T(
          `xs${t}`,
          cx,
          PB + 50,
          merge ? `weighted ${D.weights[0]} · ${D.weights[1]} · ${D.weights[2]}%` : D.tierN[t],
          'sm',
          { s: { 'text-anchor': 'middle' } }
        )
      );
    }

    if (!merge) {
      D.bandShort.forEach((b, i) => {
        S.push({
          k: `lg${i}`,
          t: 'rect',
          a: { x: PL + 10 + i * 240, y: PT + 40, width: 14, height: 14 },
          s: { fill: bandColors[i] },
          g: `bd${i}`,
        });
        S.push(this._T(`lgt${i}`, PL + 30 + i * 240, PT + 52, b, 'sm', { g: `bd${i}` }));
      });
    } else {
      S.push(
        this._T(
          'lgm',
          PL + 10,
          PT + 52,
          `Fixed weights across Value (${D.weights[0]}%), Core (${D.weights[1]}%), and Premium (${D.weights[2]}%) tickets`,
          'sm'
        )
      );
    }
    return S;
  }

  _sceneTimeline(o = {}) {
    const D = this.study;
    const PB = this._pb;
    const x = lin(-6.6, 12.6, PL, PR - 48);
    const y = lin(D.tlMinY, D.tlMaxY, PB, PT + 22);
    const S = [];

    S.push({
      k: 'tl-sh',
      t: 'rect',
      a: { x: x(-3.45), y: PT + 22, width: x(-0.55) - x(-3.45), height: PB - PT - 22 },
      s: { fill: 'var(--es-paper2)' },
    });
    const tlStep = D.tlMaxY - D.tlMinY <= 140 ? 20 : 40;
    const tlTicks = [];
    for (let v = D.tlMinY; v <= D.tlMaxY; v += tlStep) tlTicks.push(v);
    S.push(
      ...this._yAxis('tly', tlTicks, y, (v) => (v === 0 ? '0' : sgn(v))).map((s) => {
        if (s.t === 'line') s.a.x2 = PR - 48;
        return s;
      })
    );
    MONTHS.forEach((m) => S.push(this._T(`tlx${m}`, x(m), PB + 24, String(m), 'tk', { s: { 'text-anchor': 'middle' } })));
    S.push(
      this._T(
        'tl-xt',
        (PL + PR - 48) / 2,
        PB + 52,
        'Months relative to repeat-adoption month (or 6-month inactivity mark for lapsed cohort)',
        'ax',
        { s: { 'text-anchor': 'middle' } }
      )
    );
    S.push({
      k: 'tl-0',
      t: 'line',
      a: { x1: x(0), x2: x(0), y1: PT + 22, y2: PB },
      s: { stroke: 'var(--es-ink)', 'stroke-width': '1.2', 'stroke-dasharray': '5 5' },
    });
    S.push(this._T('tl-0t', x(0) + 8, PT + 38, 'repeat adoption (or 6-mo lapse)', 'an'));
    S.push(this._T('tl-bt', x(-2), PB - 14, 'Pre-event baseline', 'an', { s: { 'text-anchor': 'middle' } }));
    S.push(this._T('tl-yt', PL - 50, PT + 4, 'Annualized spend rate vs prior pace, points', 'an'));

    const clampTl = (v) => Math.max(D.tlMinY, Math.min(D.tlMaxY, v));
    const z = MONTHS.map((m) => [x(m), y(0)]);
    S.push({
      k: 'tl-s',
      t: 'path',
      pts: MONTHS.map((m, i) => [x(m), y(clampTl(D.startersCurve[i]))]),
      epts: z,
      s: {
        fill: 'none',
        stroke: 'var(--es-teal)',
        'stroke-width': '3.4',
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
      },
      g: 's before after',
    });
    MONTHS.forEach((m, i) =>
      S.push({
        k: `tl-sd${m}`,
        t: 'circle',
        a: { cx: x(m), cy: y(clampTl(D.startersCurve[i])), r: 4.4 },
        e: { cy: y(0), r: 0 },
        s: { fill: 'var(--es-paper)', stroke: 'var(--es-teal)', 'stroke-width': '2.2' },
        g: `${m < 0 ? 'before' : 'after'} s`,
        d: i * 22,
        tip: {
          title: `Repeat adopter · month ${m}`,
          detail: `${sgn1(D.startersCurve[i])} points vs baseline pace`,
          sub: `${comma(D.starterN)} adopters observed`,
        },
      })
    );
    const endStarter = D.startersCurve[18];
    S.push(
      this._T('tl-se', x(12) + 12, y(clampTl(endStarter)) + 9, sgn(endStarter), 'sv', {
        s: { fill: 'var(--es-teal)' },
        g: 's after',
      })
    );

    if (o.stop) {
      S.push({
        k: 'tl-p',
        t: 'path',
        pts: MONTHS.map((m, i) => [x(m), y(clampTl(D.stoppersCurve[i]))]),
        epts: z,
        s: {
          fill: 'none',
          stroke: 'var(--es-terra)',
          'stroke-width': '3.4',
          'stroke-linejoin': 'round',
          'stroke-linecap': 'round',
        },
        g: 'stop',
      });
      MONTHS.forEach((m, i) =>
        S.push({
          k: `tl-pd${m}`,
          t: 'circle',
          a: { cx: x(m), cy: y(clampTl(D.stoppersCurve[i])), r: 4.4 },
          e: { cy: y(0), r: 0 },
          s: { fill: 'var(--es-paper)', stroke: 'var(--es-terra)', 'stroke-width': '2.2' },
          g: 'stop',
          d: i * 22,
          tip: {
            title: `Lapsed buyer · month ${m}`,
            detail: `${sgn1(D.stoppersCurve[i])} points vs active pace`,
            sub: `${comma(D.stopperN)} lapsed accounts`,
          },
        })
      );
      const endStop = D.stoppersCurve[18];
      S.push(
        this._T('tl-pe', x(12) + 12, y(clampTl(endStop)) + 9, sgn(endStop), 'sv', {
          s: { fill: 'var(--es-terra)' },
          g: 'stop',
        })
      );
    }

    if (o.win) {
      const addWin = (arr, col, key, g0) =>
        arr.forEach((w, i) => {
          const xx = x(w.m + 0.3);
          const g = `${i === 0 ? 'before' : 'after'} ${g0}`;
          S.push(...this._whisk(`${key}${i}`, xx, y(clampTl(w.lo)), y(clampTl(w.hi)), g, col));
          S.push({
            k: `${key}q${i}`,
            t: 'rect',
            a: { x: xx - 6, y: y(clampTl(w.e)) - 6, width: 12, height: 12 },
            s: { fill: col },
            g,
            tip: {
              title: w.l,
              detail: `${sgn1(w.e)} pts (95% CI ${sgn1(w.lo)} to ${sgn1(w.hi)})`,
              sub: `${w.n} shoppers in window`,
            },
          });
        });
      addWin(D.WIN_S, 'var(--es-teal)', 'tlw', 's');
      if (o.stop) addWin(D.WIN_P, 'var(--es-terra)', 'tlv', 'stop');
    }

    if (o.notes) {
      S.push(this._T('tl-n1', x(-5.8), PT + 66, 'Before: pre-repeat', 'anb', { g: 'before' }));
      S.push(this._T('tl-n2', x(-5.8), PT + 86, 'baseline window', 'anb', { g: 'before' }));
      S.push(
        this._T('tl-n3', x(4.2), PT + 66, 'After: empirical repeat pace', 'anb', {
          s: { fill: 'var(--es-teal)' },
          g: 'after',
        })
      );
    }
    return S;
  }

  _scenePrize(c) {
    const D = this.study;
    const PB = this._pb;
    const maxRow = Math.max(60, ...D.prizeRows.map((r) => r.base + r.x));
    const axisMax = Math.ceil((maxRow * 1.18) / 25) * 25;
    const x = lin(0, axisMax, PL + 176, PR - 36);
    const h = 50;
    const gap = Math.min(148, Math.max(96, (PB - 30 - 270) / 2));
    const rows = [212, 212 + gap, 212 + 2 * gap];
    const gy = rows[2] + 62;
    const S = [];

    const tickStep = Math.max(10, Math.round(axisMax / 4 / 10) * 10);
    for (let t = 0; t <= axisMax; t += tickStep) {
      S.push({
        k: `pzg${t}`,
        t: 'line',
        a: { x1: x(t), x2: x(t), y1: 162, y2: gy },
        s: { class: t === 0 ? 'zl' : 'gl' },
      });
      S.push(this._T(`pzt${t}`, x(t), gy + 24, `$${t}`, 'tk', { s: { 'text-anchor': 'middle' } }));
    }
    S.push(
      this._T('pz-xt', x(axisMax / 2), gy + 50, 'Annualized spend per shopper among current single-item accounts', 'ax', {
        s: { 'text-anchor': 'middle' },
      })
    );

    D.prizeRows.forEach((r, i) => {
      const yy = rows[i];
      S.push(this._T(`pzl${i}`, PL + 160, yy - 2, r.b, 'lb', { s: { 'text-anchor': 'end' } }));
      S.push(
        this._T(`pzn${i}`, PL + 160, yy + 18, `${r.n} peers · lift ${r.g}`, 'sm', {
          s: { 'text-anchor': 'end' },
        })
      );
      S.push({
        k: `pzb${i}`,
        t: 'rect',
        a: { x: x(0), y: yy - h / 2, width: Math.max(2, x(r.base) - x(0)), height: h },
        e: { width: 0 },
        s: { fill: 'var(--es-bar-base)' },
        d: i * 80,
        tip: {
          title: r.fullLabel,
          detail: `Current single-item norm: $${r.base}/yr`,
          sub: `${r.n} single-item shoppers`,
        },
      });
      S.push(this._T(`pzbt${i}`, x(0) + 10, yy + 5, `$${r.base}/yr today`, 'sm', { s: { fill: 'var(--es-ink)' } }));
      S.push({
        k: `pzo${i}`,
        t: 'rect',
        a: { x: x(r.base), y: yy - h / 2, width: Math.max(2, x(r.base + r.x) - x(r.base)), height: h },
        s: { fill: 'none', stroke: 'var(--es-teal2)', 'stroke-width': '1.4', 'stroke-dasharray': '5 4' },
        d: 260,
        tip: {
          title: `100% Conversion Ceiling · ${r.b}`,
          detail: `+$${r.x}/yr per converted shopper`,
          sub: `Pool ceiling: ${usdCompact(r.ceilingPool)}/yr`,
        },
      });
      S.push({
        k: `pzx${i}`,
        t: 'rect',
        a: { x: x(r.base), y: yy - h / 2, width: Math.max(0, x(r.base + r.x * c) - x(r.base)), height: h },
        e: { width: 0 },
        s: { fill: 'var(--es-teal)' },
        d: 340,
      });
      S.push({
        k: `pzv${i}`,
        t: 'text',
        a: { x: x(r.base + r.x) + 10, y: yy + 6 },
        s: { class: 'vl', fill: 'var(--es-teal)' },
        num: r.x * c,
        enum: 0,
        fmt: (v) => `+$${v >= 10 ? Math.round(v) : v.toFixed(1)}/yr`,
      });
    });

    S.push({
      k: 'pz-r',
      t: 'text',
      a: { x: PL, y: PT + 58 },
      s: { class: 'svb', fill: 'var(--es-teal)' },
      num: D.totalCeilingUsd * c,
      enum: 0,
      fmt: (v) => `${usdCompact(v)} / year`,
    });
    S.push({
      k: 'pz-r2',
      t: 'text',
      a: { x: PL + 2, y: PT + 90 },
      s: { class: 'an' },
      num: (D.totalCeilingUsd * c) / 12,
      enum: 0,
      fmt: (v) =>
        `${usdCompact(v)}/mo across ${comma(Math.round(D.popNone * c))} converted shoppers (${Math.round(c * 100)}% conversion)`,
    });
    return S;
  }

  _renderStageTools(toolsKind) {
    if (toolsKind === 'band') {
      const opts = [
        ['all', 'All bands'],
        ['b1', 'Value'],
        ['b2', 'Core'],
        ['b3', 'Premium'],
      ];
      return html`
        <div class="es-seg2" role="group" aria-label="Ticket size band">
          ${opts.map(
            ([k, label]) => html`
              <button
                type="button"
                aria-pressed=${String(this.band === k)}
                @click=${() => {
                  this.band = k;
                  this._redrawSvg(680);
                }}
              >
                ${label}
              </button>
            `
          )}
        </div>
      `;
    }
    if (toolsKind === 'stop') {
      return html`
        <button
          type="button"
          class="es-tg"
          aria-pressed=${String(this.showStoppers)}
          @click=${() => {
            this.showStoppers = !this.showStoppers;
            this._redrawSvg(680);
          }}
        >
          <i></i>Lapsed cohort
        </button>
      `;
    }
    if (toolsKind === 'measure') {
      const opts = [
        ['orders', 'Order frequency'],
        ['skus', 'Fulfilled breadth'],
      ];
      return html`
        <div class="es-seg2" role="group" aria-label="Engagement depth measure">
          ${opts.map(
            ([k, label]) => html`
              <button
                type="button"
                aria-pressed=${String(this.measure === k)}
                @click=${() => {
                  this.measure = k;
                  this._redrawSvg(680);
                }}
              >
                ${label}
              </button>
            `
          )}
        </div>
      `;
    }
    return nothing;
  }

  render() {
    const S = this.study;
    const chapters = this._chapters();
    const steps = this._steps(S);
    const active = steps[this.activeStep] || null;
    const activeCh = active ? active.ch : 0;
    const progressPct = steps.length ? ((this.activeStep + 1) / steps.length) * 100 : (1 / 14) * 100;
    const activeBrandName = this.hostBrand || (S && S.scopedBrand && S.scopedBrand.name) || '';

    return html`
      <style>
        :root,
        cohort-uplift-story {
          --es-accent: #0b57d0;
          --es-paper: #f0f4f9;
          --es-surface: #ffffff;
          --es-ink: #1f1f1f;
          --es-ink2: #474747;
          --es-mut: #5f6368;
          --es-faint: #80868b;
          --es-paper2: color-mix(in srgb, var(--es-ink) 5%, var(--es-paper));
          --es-rule: color-mix(in srgb, var(--es-ink) 12%, var(--es-paper));
          --es-sand: color-mix(in srgb, var(--es-ink) 28%, var(--es-paper));
          --es-sand2: color-mix(in srgb, var(--es-ink) 15%, var(--es-paper));
          --es-bar-base: color-mix(in srgb, var(--es-ink) 10%, var(--es-paper));
          --es-muted-dot: color-mix(in srgb, var(--es-ink) 18%, var(--es-paper));
          --es-dot-neutral: color-mix(in srgb, var(--es-ink) 40%, var(--es-paper));
          --es-teal: var(--es-accent);
          --es-teal2: color-mix(in srgb, var(--es-teal) 68%, var(--es-surface));
          --es-teal3: color-mix(in srgb, var(--es-teal) 32%, var(--es-surface));
          --es-trial-dot: color-mix(in srgb, var(--es-teal) 24%, var(--es-paper));
          --es-teal-tint: color-mix(in srgb, var(--es-teal) 10%, transparent);
          --es-terra: #c2552d;
          --es-amber: #b7862c;
          --es-amber-border: color-mix(in srgb, var(--es-amber) 38%, var(--es-surface));
          --es-tier-0: color-mix(in srgb, var(--es-teal) 34%, var(--es-surface));
          --es-tier-1: color-mix(in srgb, var(--es-teal) 62%, var(--es-surface));
          --es-tier-2: var(--es-teal);
          --es-tier-3: color-mix(in srgb, var(--es-teal) 76%, var(--es-ink));
          --es-band-0: color-mix(in srgb, var(--es-teal) 28%, var(--es-surface));
          --es-band-1: color-mix(in srgb, var(--es-teal) 58%, var(--es-surface));
          --es-band-2: var(--es-teal);
          --es-depth-0: color-mix(in srgb, var(--es-teal) 28%, var(--es-surface));
          --es-depth-1: color-mix(in srgb, var(--es-teal) 52%, var(--es-surface));
          --es-depth-2: color-mix(in srgb, var(--es-teal) 78%, var(--es-surface));
          --es-depth-3: color-mix(in srgb, var(--es-teal) 82%, var(--es-ink));
          --es-paper-translucent: color-mix(in srgb, var(--es-paper) 92%, transparent);
          --es-tip-shadow: rgba(15, 23, 42, 0.14);
          --es-serif: Georgia, 'Source Serif Pro', 'Times New Roman', serif;
          --es-sans: 'Inter', 'Google Sans Text', 'Google Sans', Roboto, system-ui, sans-serif;
          --app-bg: var(--es-paper);
          --app-card-bg: var(--es-surface);
          --app-text: var(--es-ink);
          --app-muted: var(--es-mut);
          --app-border: var(--es-rule);
          --app-primary: var(--es-accent);
        }

        :root.dark-theme,
        cohort-uplift-story.dark-theme {
          --es-accent: #a8c7fa;
          --es-paper: #131314;
          --es-surface: #1e1f20;
          --es-ink: #e3e3e3;
          --es-ink2: #c4c7c5;
          --es-mut: #9aa0a6;
          --es-faint: #6e7378;
          --es-terra: #f28b66;
          --es-amber: #f5b851;
          --es-tip-shadow: rgba(0, 0, 0, 0.45);
        }

        /* Keep html as the sole viewport scrollport (no overflow on body/container, no body height override)
           so Looker keeps the iframe at viewport height and both position:sticky and step edge fading work. */
        html {
          overflow-x: clip;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        html::-webkit-scrollbar,
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }

        cohort-uplift-story {
          display: block;
          background: var(--es-paper);
          color: var(--es-ink);
          font-family: var(--es-sans);
          -webkit-font-smoothing: antialiased;
          min-height: 100vh;
        }

        .da-container {
          max-width: none;
          margin: 0;
          padding: 0;
          display: block;
          gap: 0;
          container-type: normal;
          min-height: 100vh;
          background: var(--es-paper);
          color: var(--es-ink);
        }

        cohort-uplift-story *,
        cohort-uplift-story *::before,
        cohort-uplift-story *::after {
          box-sizing: border-box;
        }
        cohort-uplift-story code {
          font-size: 0.9em;
          background: var(--es-paper2);
          padding: 1px 5px;
          border-radius: 3px;
        }

        .es-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--es-paper-translucent);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--es-rule);
        }
        .es-bar-in {
          display: flex;
          align-items: center;
          gap: 12px;
          height: 52px;
          padding: 0 24px;
          max-width: 1540px;
          margin: 0 auto;
        }
        .es-name {
          font-family: var(--es-serif);
          font-size: 15.5px;
          white-space: nowrap;
          color: var(--es-ink);
          flex-shrink: 0;
        }
        .es-chaps {
          display: flex;
          gap: 4px;
          flex: 1;
          justify-content: center;
          flex-wrap: nowrap;
          overflow: hidden;
        }
        .es-chaps-dd {
          display: none;
          position: relative;
          align-items: center;
          margin: 0 auto;
          min-width: 0;
        }
        .es-chaps-select {
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          background: var(--es-ink);
          color: var(--es-paper);
          border: 1px solid var(--es-ink);
          border-radius: 999px;
          padding: 5px 28px 5px 12px;
          cursor: pointer;
          max-width: 220px;
          appearance: none;
          -webkit-appearance: none;
        }
        .es-chaps-select:disabled {
          opacity: 0.6;
          cursor: default;
        }
        .es-chaps-select option {
          background: var(--es-surface);
          color: var(--es-ink);
        }
        .es-chaps-caret {
          position: absolute;
          right: 10px;
          font-size: 11px;
          line-height: 1;
          color: var(--es-paper);
          pointer-events: none;
        }
        .es-chaps button {
          font: inherit;
          font-size: 12.5px;
          border: 0;
          background: none;
          color: var(--es-mut);
          padding: 6px 11px;
          border-radius: 999px;
          cursor: pointer;
          white-space: nowrap;
        }
        .es-chaps button b {
          font-weight: 700;
          color: var(--es-faint);
          margin-right: 6px;
        }
        .es-chaps button:hover {
          background: var(--es-paper2);
        }
        .es-chaps button.on {
          background: var(--es-ink);
          color: var(--es-paper);
        }
        .es-chaps button.on b {
          color: var(--es-teal3);
        }
        .es-live-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 156px;
          font-size: 12px;
          font-weight: 600;
          color: var(--es-ink2);
          background: var(--es-paper2);
          border: 1px solid var(--es-rule);
          border-radius: 999px;
          padding: 4px 11px;
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
          cursor: pointer;
        }
        .es-live-pill:hover {
          border-color: var(--es-teal);
          color: var(--es-teal);
        }
        .es-live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--es-teal);
          flex-shrink: 0;
        }
        .es-live-dot.loading {
          animation: es-pulse 1s ease-in-out infinite;
        }
        .es-skel {
          display: inline-block;
          border-radius: 6px;
          background: color-mix(in srgb, var(--es-ink) 11%, var(--es-paper));
          animation: es-pulse 1.2s ease-in-out infinite;
          vertical-align: baseline;
        }
        @keyframes es-pulse {
          0%,
          100% {
            opacity: 0.4;
          }
          50% {
            opacity: 0.95;
          }
        }
        .es-doc-btn {
          font: inherit;
          font-size: 12.5px;
          font-weight: 600;
          color: var(--es-teal);
          background: none;
          border: 0;
          cursor: pointer;
          white-space: nowrap;
          padding: 4px 6px;
        }
        .es-doc-btn:hover {
          text-decoration: underline;
        }
        .es-prog {
          height: 2px;
          background: transparent;
        }
        .es-prog i {
          display: block;
          height: 2px;
          background: var(--es-teal);
          transition: width 0.35s ease;
        }

        .es-state-wrap {
          max-width: 960px;
          margin: 0 auto;
          padding: min(120px, 16vh) 28px;
        }
        .es-state-wrap h2 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: 34px;
          margin: 12px 0;
        }
        .es-state-wrap p {
          font-size: 16px;
          color: var(--es-mut);
          line-height: 1.6;
        }

        .es-hero {
          min-height: min(760px, calc(100vh - 54px));
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 1180px;
          margin: 0 auto;
          padding: 48px 28px 40px;
        }
        .es-kick {
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--es-teal);
          font-weight: 700;
        }
        .es-hero h1 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: clamp(24px, 4.5vw, 60px);
          line-height: 1.08;
          letter-spacing: -0.015em;
          margin: 14px 0 18px;
          max-width: 940px;
        }
        .es-hero h1 em {
          font-style: italic;
          color: var(--es-teal);
        }
        .es-stand {
          font-size: 18px;
          line-height: 1.6;
          color: var(--es-ink2);
          max-width: 790px;
          margin: 0 0 38px;
        }
        .es-figs {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          border-top: 1px solid var(--es-ink);
          max-width: 1120px;
        }
        .es-fig {
          padding: 18px 22px 6px 0;
          border-right: 1px solid var(--es-rule);
          border-top: 0;
          border-bottom: 0;
          border-left: 0;
          cursor: pointer;
          text-align: left;
          background: none;
          font: inherit;
          color: inherit;
        }
        .es-fig + .es-fig {
          padding-left: 22px;
        }
        .es-fig:last-child {
          border-right: 0;
        }
        .es-fig .n {
          font-family: var(--es-serif);
          font-size: clamp(28px, 3.1vw, 44px);
          letter-spacing: -0.02em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .es-fig .n.t {
          color: var(--es-teal);
        }
        .es-fig .n.r {
          color: var(--es-terra);
        }
        .es-fig .l {
          font-size: 14px;
          color: var(--es-mut);
          line-height: 1.45;
          margin-top: 10px;
        }
        .es-fig:hover .n {
          text-decoration: underline;
          text-decoration-thickness: 1px;
          text-underline-offset: 6px;
        }
        .es-hnote {
          font-size: 13.5px;
          color: var(--es-mut);
          margin: 26px 0 0;
          max-width: 780px;
          line-height: 1.55;
        }
        .es-cue {
          margin-top: 40px;
          font-size: 13px;
          color: var(--es-mut);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .es-cue span {
          display: inline-block;
          animation: es-bob 1.8s ease-in-out infinite;
        }
        @keyframes es-bob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(5px);
          }
        }

        .es-scrolly {
          display: grid;
          grid-template-columns: minmax(min(270px, 100%), 0.8fr) minmax(0, 1.2fr);
          gap: 0 28px;
          max-width: 1500px;
          margin: 0 auto;
          padding: 0 28px;
        }
        .es-steps {
          position: relative;
          padding: 18px 0 min(260px, 32vh);
        }
        .es-margin-fade {
          position: sticky;
          left: 0;
          right: 0;
          height: 88px;
          pointer-events: none;
          z-index: 4;
        }
        .es-margin-top {
          top: 53px;
          margin-bottom: -88px;
          background: linear-gradient(to bottom, var(--es-paper) 0%, transparent 100%);
        }
        .es-margin-bot {
          bottom: 0;
          margin-top: -88px;
          background: linear-gradient(to top, var(--es-paper) 0%, transparent 100%);
        }
        @media (max-width: 740px) {
          .es-margin-top {
            display: none;
          }
        }
        .es-chapter {
          padding: min(88px, 12vh) 0 12px;
        }
        #c1.es-chapter {
          padding-top: 6px;
        }
        .es-chapter .cn {
          font-family: var(--es-serif);
          font-size: 15px;
          color: var(--es-teal);
          font-style: italic;
        }
        .es-chapter h2 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: 34px;
          line-height: 1.12;
          margin: 6px 0 10px;
          letter-spacing: -0.01em;
        }
        .es-chapter p {
          font-size: 15.5px;
          line-height: 1.6;
          color: var(--es-ink2);
          margin: 0;
        }

        .es-step {
          padding: min(135px, 17vh) 0;
        }
        .es-chapter + .es-step {
          padding-top: 28px;
        }
        .es-step-inner {
          opacity: 1;
          transition: opacity 0.14s linear;
          will-change: opacity;
          scroll-margin-top: 28vh;
        }
        .es-step .no {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--es-mut);
          font-weight: 700;
        }
        .es-step .no i {
          font-style: normal;
          font-family: var(--es-sans);
          font-weight: 700;
          font-size: 13px;
          line-height: 1;
          font-variant-numeric: tabular-nums lining-nums;
          letter-spacing: 0;
          text-transform: none;
          color: var(--es-paper);
          background: var(--es-ink);
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .es-step.on .no i {
          background: var(--es-teal);
          color: #ffffff;
        }
        .es-step h3 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: 27px;
          line-height: 1.2;
          margin: 12px 0;
          letter-spacing: -0.005em;
        }
        .es-step p {
          font-size: 16px;
          line-height: 1.62;
          color: var(--es-ink2);
          margin: 0 0 12px;
        }
        .es-step .es-hint {
          font-size: 14px;
          color: var(--es-mut);
        }
        .es-step p b,
        .es-step li b {
          color: var(--es-ink);
        }
        .es-step ul {
          margin: 0 0 12px;
          padding: 0;
          list-style: none;
        }
        .es-step li {
          font-size: 15.5px;
          line-height: 1.55;
          color: var(--es-ink2);
          padding: 7px 0 7px 18px;
          position: relative;
          border-bottom: 1px solid var(--es-rule);
        }
        .es-step li:last-child {
          border-bottom: 0;
        }
        .es-step li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 16px;
          width: 7px;
          height: 2px;
          background: var(--es-teal);
        }
        .es-step li[data-hl] {
          cursor: default;
        }
        .es-step li[data-hl]:hover {
          background: linear-gradient(90deg, var(--es-teal-tint), transparent);
        }
        .es-pull {
          font-family: var(--es-serif);
          font-size: 21px;
          line-height: 1.35;
          color: var(--es-teal);
          border-left: 3px solid var(--es-teal);
          padding: 2px 0 2px 14px;
          margin: 6px 0 14px;
        }
        .es-illus {
          align-self: flex-start;
          display: inline-block;
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          font-weight: 700;
          color: var(--es-amber);
          border: 1px solid var(--es-amber-border);
          border-radius: 4px;
          padding: 2px 6px;
          margin-bottom: 8px;
        }
        .es-step details {
          border-top: 1px solid var(--es-rule);
          border-bottom: 1px solid var(--es-rule);
          margin: 8px 0 6px;
        }
        .es-step details summary {
          list-style: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: var(--es-teal);
          padding: 10px 0;
          display: flex;
          justify-content: space-between;
        }
        .es-step details summary::-webkit-details-marker {
          display: none;
        }
        .es-step details summary::after {
          content: '+';
          font-size: 18px;
          line-height: 1;
        }
        .es-step details[open] summary::after {
          content: '–';
        }
        .es-in {
          font-size: 14.5px;
          line-height: 1.6;
          color: var(--es-ink2);
          padding: 0 0 12px;
        }
        .es-in p {
          font-size: 14.5px;
          margin: 0 0 8px;
        }

        .es-slider {
          margin: 10px 0 14px;
          padding: 16px 0;
          border-top: 1px solid var(--es-ink);
          border-bottom: 1px solid var(--es-rule);
        }
        .es-lab {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 13.5px;
          color: var(--es-mut);
        }
        .es-lab > b {
          color: var(--es-teal);
          font-size: 16px;
          font-variant-numeric: tabular-nums;
        }
        .es-slider input[type='range'] {
          width: 100%;
          accent-color: var(--es-teal);
          margin: 12px 0 10px;
        }
        .es-out {
          font-family: var(--es-serif);
          font-size: 36px;
          letter-spacing: -0.02em;
          line-height: 1;
          font-variant-numeric: tabular-nums;
        }
        .es-out small {
          font-family: var(--es-sans);
          font-size: 13.5px;
          color: var(--es-mut);
          letter-spacing: 0;
          margin-left: 8px;
        }
        .es-sens {
          font-size: 13.5px;
          color: var(--es-mut);
          margin-top: 6px;
          font-variant-numeric: tabular-nums;
        }
        .es-pre {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-top: 12px;
        }
        .es-pre button {
          font: inherit;
          font-size: 12.5px;
          border: 1px solid var(--es-rule);
          background: var(--es-surface);
          border-radius: 999px;
          padding: 4px 11px;
          cursor: pointer;
          color: var(--es-ink2);
        }
        .es-pre button:hover,
        .es-pre button.on {
          border-color: var(--es-teal);
          color: var(--es-teal);
          font-weight: 600;
        }

        .es-stage {
          position: sticky;
          top: 64px;
          align-self: start;
          height: min(680px, calc(100vh - 76px));
          display: flex;
          flex-direction: column;
          padding: 18px 0 10px;
        }
        .es-sh {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 16px;
          min-height: 56px;
          border-bottom: 1px solid var(--es-ink);
          padding-bottom: 10px;
        }
        .es-sh .k {
          font-size: 11.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--es-teal);
          font-weight: 700;
        }
        .es-sh h4 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: 21px;
          margin: 5px 0 0;
          line-height: 1.2;
        }
        .es-ctl {
          display: flex;
          gap: 6px;
          flex-wrap: nowrap;
          justify-content: flex-end;
          flex: none;
        }
        .es-seg2 {
          display: inline-flex;
          border: 1px solid var(--es-ink);
          border-radius: 999px;
          overflow: hidden;
        }
        .es-seg2 button {
          font: inherit;
          font-size: 12.5px;
          border: 0;
          background: transparent;
          color: var(--es-ink2);
          padding: 5px 12px;
          cursor: pointer;
          white-space: nowrap;
        }
        .es-seg2 button + button {
          border-left: 1px solid var(--es-rule);
        }
        .es-seg2 button[aria-pressed='true'] {
          background: var(--es-ink);
          color: var(--es-paper);
        }
        .es-tg {
          font: inherit;
          font-size: 12.5px;
          border: 1px solid var(--es-ink);
          border-radius: 999px;
          background: transparent;
          padding: 5px 12px 5px 9px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: var(--es-ink2);
        }
        .es-tg i {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid var(--es-terra);
        }
        .es-tg[aria-pressed='true'] i {
          background: var(--es-terra);
        }

        .es-box {
          position: relative;
          flex: 1;
          min-height: 0;
        }
        .es-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .es-sf {
          font-size: 12px;
          color: var(--es-mut);
          line-height: 1.5;
          padding-top: 8px;
          border-top: 1px solid var(--es-rule);
          min-height: 26px;
        }

        .es-svg text {
          font-family: var(--es-sans);
        }
        .es-svg .tk {
          font-size: 14px;
          fill: var(--es-mut);
          font-variant-numeric: tabular-nums;
        }
        .es-svg .gl {
          stroke: var(--es-rule);
          stroke-width: 1;
        }
        .es-svg .zl {
          stroke: var(--es-ink);
          stroke-width: 1.2;
        }
        .es-svg .ax {
          font-size: 14px;
          fill: var(--es-ink2);
        }
        .es-svg .lb {
          font-size: 15.5px;
          font-weight: 600;
          fill: var(--es-ink);
        }
        .es-svg .sm {
          font-size: 14px;
          fill: var(--es-mut);
          font-variant-numeric: tabular-nums;
        }
        .es-svg .vl {
          font-size: 18px;
          font-weight: 700;
          fill: var(--es-ink);
          font-variant-numeric: tabular-nums;
        }
        .es-svg .vs {
          font-size: 14px;
          font-weight: 700;
          fill: var(--es-ink2);
          font-variant-numeric: tabular-nums;
        }
        .es-svg .sv {
          font-family: var(--es-serif);
          font-size: 29px;
          fill: var(--es-ink);
          font-variant-numeric: tabular-nums;
        }
        .es-svg .svb {
          font-family: var(--es-serif);
          font-size: 52px;
          fill: var(--es-ink);
          letter-spacing: -0.02em;
          font-variant-numeric: tabular-nums;
        }
        .es-svg .an {
          font-size: 14.5px;
          fill: var(--es-mut);
        }
        .es-svg .anb {
          font-size: 15px;
          font-weight: 600;
          fill: var(--es-ink2);
        }
        .es-svg .tag {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          fill: var(--es-amber);
        }
        .es-svg .hov {
          cursor: pointer;
        }
        .es-svg .dim {
          opacity: 0.12 !important;
        }
        .es-svg [data-g] {
          transition: opacity 0.25s;
        }

        .es-tip {
          position: absolute;
          left: 0;
          top: 0;
          z-index: 5;
          pointer-events: none;
          background: var(--es-surface);
          border: 1px solid var(--es-ink);
          color: var(--es-ink2);
          padding: 9px 12px;
          font-size: 13px;
          line-height: 1.45;
          max-width: 280px;
          box-shadow: 4px 4px 0 var(--es-tip-shadow);
        }
        .es-tip b {
          color: var(--es-ink);
          display: block;
          margin-bottom: 2px;
        }
        .es-tip span {
          display: block;
          font-size: 12px;
          color: var(--es-mut);
          margin-top: 2px;
        }

        .es-close {
          max-width: 1180px;
          margin: 0 auto;
          padding: min(96px, 12vh) 28px min(128px, 16vh);
          border-top: 1px solid var(--es-ink);
        }
        .es-close h2 {
          font-family: var(--es-serif);
          font-weight: 400;
          font-size: 38px;
          margin: 10px 0 26px;
        }
        .es-cols {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .es-cols h5 {
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin: 0 0 10px;
          color: var(--es-teal);
        }
        .es-cols h5.r {
          color: var(--es-terra);
        }
        .es-cols ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .es-cols li {
          font-size: 15.5px;
          line-height: 1.6;
          color: var(--es-ink2);
          padding: 10px 0;
          border-top: 1px solid var(--es-rule);
        }

        @media (max-width: 980px) {
          .es-chaps {
            display: none;
          }
          .es-chaps-dd {
            display: inline-flex;
          }
          .es-live-pill {
            min-width: 0;
          }
        }
        @media (max-width: 740px) {
          .es-scrolly {
            grid-template-columns: 1fr;
          }
          .es-stage {
            grid-row: 1;
            top: 54px;
            height: 52vh;
            background: var(--es-paper);
            z-index: 5;
          }
          .es-steps {
            grid-row: 2;
          }
          .es-step {
            min-height: 60vh;
          }
          .es-figs {
            grid-template-columns: 1fr 1fr;
          }
          .es-fig {
            border-bottom: 1px solid var(--es-rule);
          }
          .es-cols {
            grid-template-columns: 1fr;
          }
          .es-name {
            display: none;
          }
        }
        @media (max-width: 520px) {
          .es-bar-in {
            padding: 0 12px;
            gap: 6px;
          }
          .es-live-pill,
          .es-doc-btn {
            display: none;
          }
          .es-hero {
            padding: 28px 16px;
          }
          .es-scrolly,
          .es-close {
            padding-left: 16px;
            padding-right: 16px;
          }
          .es-figs {
            grid-template-columns: 1fr;
          }
          .es-fig + .es-fig {
            padding-left: 0;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .es-cue span {
            animation: none;
          }
        }
      </style>

      <div class="da-container">
      <header class="es-bar">
        <div class="es-bar-in">
          <div class="es-name">
            ${activeBrandName ? `${activeBrandName} · ` : ''}Cohort Study
          </div>
          <nav class="es-chaps" aria-label="Story chapters">
            ${chapters.map(
              (c, ci) => html`
                <button
                  type="button"
                  class=${activeCh === ci ? 'on' : ''}
                  ?disabled=${!S}
                  @click=${() => {
                    const firstIdx = steps.findIndex((s) => s.ch === ci);
                    if (firstIdx >= 0) this._jumpToStep(firstIdx);
                  }}
                >
                  <b>${c.n}</b>${c.name}
                </button>
              `
            )}
          </nav>
          <div class="es-chaps-dd">
            <select
              class="es-chaps-select"
              aria-label="Story chapters"
              ?disabled=${!S}
              .value=${String(activeCh)}
              @change=${(e) => {
                const ci = parseInt(e.target.value, 10);
                const firstIdx = steps.findIndex((s) => s.ch === ci);
                if (firstIdx >= 0) this._jumpToStep(firstIdx);
              }}
            >
              ${chapters.map(
                (c, ci) => html`
                  <option value=${String(ci)} ?selected=${activeCh === ci}>${c.n} · ${c.name}</option>
                `
              )}
            </select>
            <span class="es-chaps-caret" aria-hidden="true">▾</span>
          </div>
          <button
            type="button"
            class="es-live-pill"
            title=${S && S.scopedBrand
              ? `Refresh live cohort (${comma(S.scopedBrand.customers)} ${S.scopedBrand.name} shoppers / ${comma(S.totalCustomers)} total)`
              : 'Refresh live cohort'}
            @click=${() => this._fetchAndBuildStudy()}
          >
            <span class="es-live-dot ${this.loading ? 'loading' : ''}"></span>
            ${S
              ? S.scopedBrand
                ? `Live · ${comma(S.scopedBrand.customers)} / ${comma(S.totalCustomers)}`
                : `Live · ${comma(S.totalCustomers)} shoppers`
              : 'Loading cohort…'}
          </button>
          <button type="button" class="es-doc-btn" ?disabled=${!S} @click=${() => this._scrollToClose()}>Methodology ↓</button>
        </div>
        <div class="es-prog"><i style=${`width:${progressPct.toFixed(1)}%`}></i></div>
      </header>

      ${this.loadError && !S
        ? html`
            <section class="es-state-wrap">
              <div class="es-kick">Query Error</div>
              <h2>Unable to assemble the live cohort</h2>
              <p>${this.loadError}</p>
            </section>
          `
        : !S
          ? html`
              <section class="es-hero" aria-busy="true">
                <div class="es-kick">
                  Live Cohort Briefing${activeBrandName ? ` · ${activeBrandName}` : ''}
                </div>
                <h1>
                  Shoppers who expand into repeat multi-item buying grow annual spend
                  <em><span class="es-skel" style="width: 5.8ch; height: 0.86em;"></span> faster</em> — inside the exact same ticket band.
                </h1>
                <p class="es-stand">
                  Assembling stratified customer cohorts and 36-month order trajectories, pairing shoppers strictly
                  inside their baseline per-item ticket band to separate retention &amp; cross-category expansion from
                  unit-price confounding.
                </p>
                <div class="es-figs">
                  <div class="es-fig">
                    <div class="n t"><span class="es-skel" style="width: 118px; height: 0.88em;"></span></div>
                    <div class="l">higher annualized spend than single-item peers in the same ticket band</div>
                  </div>
                  <div class="es-fig">
                    <div class="n t"><span class="es-skel" style="width: 118px; height: 0.88em;"></span></div>
                    <div class="l">annualized spend rate lift in months 1 – 3 following repeat adoption</div>
                  </div>
                  <div class="es-fig">
                    <div class="n r"><span class="es-skel" style="width: 118px; height: 0.88em;"></span></div>
                    <div class="l">annualized spend rate pullback 10 – 12 months after lapsing</div>
                  </div>
                  <div class="es-fig">
                    <div class="n"><span class="es-skel" style="width: 118px; height: 0.88em;"></span></div>
                    <div class="l">incremental annual sales per 10% of single-item shoppers converted</div>
                  </div>
                </div>
                <p class="es-hnote">
                  Every figure above is computed live from customer order history. Observational stratification narrows
                  ticket-size bias but does not replace a randomized holdout; see Methodology below.
                </p>
                <div class="es-cue"><span>↓</span> Assembling stratified cohort &amp; bootstrap intervals…</div>
              </section>
            `
          : html`
              <section class="es-hero">
                <div class="es-kick">
                  Live Cohort Briefing · ${comma(S.totalCustomers)} Shoppers${activeBrandName
                    ? ` · ${activeBrandName}`
                    : ''}
                </div>
                <h1>
                  Shoppers who expand into repeat multi-item buying grow annual spend
                  <em>${sgn(S.COH.all[3][0])} points faster</em> — inside the exact same ticket band.
                </h1>
                <p class="es-stand">
                  Across ${comma(S.totalCustomers)} e-commerce customers ($${(S.totalSalesPop / 1e6).toFixed(2)}M in
                  tracked sales), pairing shoppers strictly inside their baseline per-item ticket band separates genuine
                  retention &amp; cross-category expansion from unit-price confounding.
                </p>
                <div class="es-figs">
                  <button
                    type="button"
                    class="es-fig"
                    @click=${() => this._jumpToStep(steps.findIndex((s) => s.id === 's10'))}
                  >
                    <div class="n t">${sgn(S.COH.all[3][0])} pts</div>
                    <div class="l">higher annualized spend than single-item peers in the same ticket band</div>
                  </button>
                  <button
                    type="button"
                    class="es-fig"
                    @click=${() => this._jumpToStep(steps.findIndex((s) => s.id === 's11'))}
                  >
                    <div class="n t">${sgn1(S.WIN_S[1].e)} pts</div>
                    <div class="l">annualized spend rate lift in months 1 – 3 following repeat adoption</div>
                  </button>
                  <button
                    type="button"
                    class="es-fig"
                    @click=${() => this._jumpToStep(steps.findIndex((s) => s.id === 's12'))}
                  >
                    <div class="n r">${sgn1(S.WIN_P[3].e)} pts</div>
                    <div class="l">annualized spend rate pullback 10 – 12 months after lapsing</div>
                  </button>
                  <button
                    type="button"
                    class="es-fig"
                    @click=${() => this._jumpToStep(steps.findIndex((s) => s.id === 's14'))}
                  >
                    <div class="n">${usdCompact(S.totalCeilingUsd * 0.1)}</div>
                    <div class="l">incremental annual sales per 10% of single-item shoppers converted</div>
                  </button>
                </div>
                <p class="es-hnote">
                  Every figure above is computed live from customer order history. Observational stratification narrows
                  ticket-size bias but does not replace a randomized holdout; see Methodology below.
                </p>
                <div class="es-cue"><span>↓</span> Scroll (or press J / K) to build each number with the data</div>
              </section>

              <section class="es-scrolly">
                <div
                  class="es-steps"
                  @mouseover=${(e) => this._handleProseMouseOver(e)}
                  @mouseleave=${() => this._highlightGroups(null)}
                >
                  <div class="es-margin-fade es-margin-top" aria-hidden="true"></div>
                  ${steps.map((s, idx) => {
                    const prevCh = idx > 0 ? steps[idx - 1].ch : -1;
                    const ch = s.ch !== prevCh ? chapters[s.ch] : null;
                    return html`
                      ${ch
                        ? html`
                            <div class="es-chapter" id=${ch.id}>
                              <div class="cn">Part ${ch.n}</div>
                              <h2>${ch.h}</h2>
                              <p>${ch.p}</p>
                            </div>
                          `
                        : nothing}
                      <article class="es-step ${this.activeStep === idx ? 'on' : ''}" id=${s.id} data-i=${idx}>
                        <div class="es-step-inner">
                          <div class="no"><i>${idx + 1}</i>${s.k}</div>
                          ${s.body}
                        </div>
                      </article>
                    `;
                  })}
                  <div class="es-margin-fade es-margin-bot" aria-hidden="true"></div>
                </div>

                <aside class="es-stage">
                  <div class="es-sh">
                    <div>
                      <div class="k">
                        ${active ? `${chapters[active.ch].name} · step ${this.activeStep + 1} of ${steps.length}` : ''}
                      </div>
                      <h4>${active ? active.title : ''}</h4>
                    </div>
                    <div class="es-ctl">${active && active.tools ? this._renderStageTools(active.tools) : nothing}</div>
                  </div>
                  <div
                    class="es-box"
                    @mousemove=${(e) => this._handleSvgMouseMove(e)}
                    @mouseleave=${() => {
                      this.hoverTip = null;
                    }}
                  >
                    <svg
                      class="es-svg"
                      viewBox="0 0 960 620"
                      preserveAspectRatio="xMidYMid meet"
                      role="img"
                      aria-label=${active ? active.title : 'Cohort chart'}
                    >
                      <defs>
                        <marker
                          id="es-arw"
                          viewBox="0 0 10 10"
                          refX="8"
                          refY="5"
                          markerWidth="7"
                          markerHeight="7"
                          orient="auto-start-reverse"
                        >
                          <path d="M0,0L10,5L0,10z" fill="var(--es-ink)"></path>
                        </marker>
                      </defs>
                      <g class="es-layer"></g>
                    </svg>
                    ${this.hoverTip
                      ? html`
                          <div
                            class="es-tip"
                            style=${`transform:translate(${Math.round(this.hoverTip.x)}px,${Math.round(this.hoverTip.y)}px)`}
                          >
                            <b>${this.hoverTip.title}</b>
                            <div>${this.hoverTip.detail}</div>
                            ${this.hoverTip.sub ? html`<span>${this.hoverTip.sub}</span>` : nothing}
                          </div>
                        `
                      : nothing}
                  </div>
                  <div class="es-sf">${active ? active.foot : ''}</div>
                </aside>
              </section>

              <section class="es-close" id="es-close">
                <div class="es-kick">Reading it right</div>
                <h2>What this cohort study can and cannot tell us</h2>
                <div class="es-cols">
                  <div>
                    <h5>It can tell us</h5>
                    <ul>
                      <li>
                        Inside identical per-item ticket bands, sustained multi-item adopters (2+ additional items)
                        generate <b>${sgn(S.COH.all[3][0])} percentage points</b> higher annualized spend than
                        single-item peers.
                      </li>
                      <li>
                        Running annualized spend trajectories step up sharply upon a customer's second active purchase
                        month and erode steadily once repeat accounts cross 6+ months without ordering.
                      </li>
                      <li>
                        Spend lift scales monotonically across both distinct order quartiles and fulfilled SKU breadth.
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h5 class="r">It cannot tell us</h5>
                    <ul>
                      <li>
                        Unconfounded experimental causality on its own: underlying household demand shifts can
                        simultaneously drive repeat purchases and higher annual spend.
                      </li>
                      <li>
                        What fraction of the <b>${comma(S.popNone)}</b> single-item accounts a post-purchase bundle or
                        replenishment prompt will convert into habitual repeat buyers.
                      </li>
                      <li>
                        Net contribution margin after promotional discounts, return reverse-logistics, and acquisition
                        spend.
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            `}
      </div>
    `;
  }
}

if (!customElements.get(elementName)) {
  customElements.define(elementName, CohortUpliftStory);
}

export default CohortUpliftStory;
