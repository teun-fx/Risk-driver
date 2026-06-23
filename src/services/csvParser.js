// Parses trade CSV/HTML files into a normalised trade list.
// Called as: parseTradeFile(text, filename)
// Supports: RiskDriver template, TradingBase (Teun's format), MT4/MT5 HTML, MT5 CSV, generic CSV.

function parseCSVLine(line) {
  const cols = [];
  let cur = '', inQ = false;
  for (const ch of line) {
    if (ch === '"') { inQ = !inQ; }
    else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
    else { cur += ch; }
  }
  cols.push(cur.trim());
  return cols.map(c => c.replace(/^"|"$/g, '').trim());
}

function parseCSVRows(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

function getField(row, ...keys) {
  for (const k of keys) {
    const v = row[k] ?? row[k.toLowerCase()] ?? row[k.replace(/ /g, '_')];
    if (v !== undefined && v !== '') return v;
  }
  return '';
}

function parseNum(val) {
  if (val === null || val === undefined || val === '') return null;
  // Handle European decimal commas: "1,20" → 1.20
  const s = String(val).replace(/\s/g, '').replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function tradeResult(rMultiple, profit, resultRaw) {
  // Check explicit result field first (W/L/B)
  if (resultRaw) {
    const r = String(resultRaw).trim().toUpperCase();
    if (r === 'W' || r === 'WIN') return 'Win';
    if (r === 'L' || r === 'LOSS') return 'Loss';
    if (r === 'B' || r === 'BE' || r === 'BREAK-EVEN' || r === 'BREAKEVEN') return 'Break-even';
  }
  const r = parseNum(rMultiple);
  const p = parseNum(profit) ?? 0;
  const val = r !== null ? r : p;
  if (val > 0) return 'Win';
  if (val < 0) return 'Loss';
  return 'Break-even';
}

// ─── TradingBase format detector ──────────────────────────────────────────────
// Headers: Date,Tijd,Dag,Close Date,...,Code,Asset,...,Result,Risk,Reward,Return (%),...
function isTradingBaseFormat(headers) {
  return headers.includes('tijd') && headers.includes('code') && headers.includes('asset');
}

// Code column: "1025" → Oct 2025, "125" → Jan 2025, "926" → Sep 2026
function decodeCodeYear(code) {
  const s = String(code).replace(/\D/g, '');
  if (s.length < 3) return null;
  const yearSuffix = s.slice(-2);                  // last 2 digits = year
  const month      = parseInt(s.slice(0, -2), 10); // preceding = month
  const year       = 2000 + parseInt(yearSuffix, 10);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

// Date column: "7/10" → day=7, month=10
function parseDayMonth(dateStr) {
  const parts = String(dateStr).split('/');
  if (parts.length < 2) return null;
  const day   = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  if (isNaN(day) || isNaN(month)) return null;
  return { day, month };
}

function parseTradingBase(rows) {
  const trades = [];
  for (const row of rows) {
    const dateStr  = getField(row, 'date');
    const code     = getField(row, 'code');
    const asset    = getField(row, 'asset');
    const resultRaw = getField(row, 'result');
    const rewardRaw = getField(row, 'reward');
    const returnRaw = getField(row, 'return (%)', 'return');
    const riskRaw   = getField(row, 'risk');
    const setup     = getField(row, 'setup');
    const session   = getField(row, 'session');
    const order     = getField(row, 'order');
    const timeframe = getField(row, 'timeframe');
    const notes     = getField(row, 'notes');
    const trend     = getField(row, 'trend');

    // Skip empty / summary rows
    if (!asset || !resultRaw || asset.toLowerCase() === 'asset') continue;
    // Skip rows with invalid result (B = breakeven counted separately)
    const resultUpper = resultRaw.trim().toUpperCase();
    if (!['W', 'L', 'B'].includes(resultUpper)) continue;

    // Build full date from Code column
    const dm     = parseDayMonth(dateStr);
    const coded  = decodeCodeYear(code);
    let fullDate = '';
    if (dm && coded) {
      const d = String(dm.day).padStart(2, '0');
      const m = String(coded.month).padStart(2, '0');
      fullDate = `${coded.year}-${m}-${d}`;
    }

    // R-multiple from reward column ("1,20" = 1.2R, "-1,00" = -1R)
    const reward  = parseNum(rewardRaw);
    const retPct  = parseNum(returnRaw);
    // Use reward if available, else return
    const rMultiple = reward !== null ? reward : retPct;

    // Profit: derive from R-multiple (assume 1% risk on arbitrary $10,000 base)
    // This makes equity curve meaningful relative to each other
    const riskPct = parseNum(String(riskRaw).replace('%', '')) ?? 1;
    const BASE_BAL = 10000;
    let profit = 0;
    if (rMultiple !== null) {
      profit = parseFloat(((rMultiple * riskPct / 100) * BASE_BAL).toFixed(2));
    }

    const result = tradeResult(rMultiple, profit, resultRaw);

    trades.push({
      date:       fullDate || dateStr || '—',
      closeDate:  fullDate || dateStr || '—',
      instrument: asset,
      direction:  /sell|short/i.test(order) ? 'Short' : 'Long',
      setup:      setup || timeframe || '—',
      session,
      trend,
      timeframe,
      notes,
      profit,
      rMultiple:  rMultiple !== null ? String(rMultiple) : null,
      rr:         rMultiple !== null && rMultiple > 0 ? `1:${rMultiple.toFixed(1)}` : '—',
      result,
      lots: null, openPrice: null, closePrice: null, sl: null, tp: null,
    });
  }
  return trades;
}

// ─── Generic CSV mapper ───────────────────────────────────────────────────────
function mapRow(row) {
  const openDate   = getField(row, 'date', 'open date', 'open time', 'time', 'opentime');
  const closeDate  = getField(row, 'close date', 'close time', 'closetime');
  const instrument = getField(row, 'instrument', 'symbol', 'ticker', 'pair', 'asset');
  const dirRaw     = getField(row, 'direction', 'type', 'side', 'action', 'order');
  const direction  = /sell|short/i.test(dirRaw) ? 'Short' : 'Long';
  const lots       = parseNum(getField(row, 'lots', 'volume', 'size', 'qty', 'quantity'));
  const openPx     = parseNum(getField(row, 'open price', 'openprice', 'entry', 'entry price'));
  const closePx    = parseNum(getField(row, 'close price', 'closeprice', 'exit', 'exit price'));
  const sl         = parseNum(getField(row, 'stop loss', 'stoploss', 's/l', 'sl'));
  const tp         = parseNum(getField(row, 'take profit', 'takeprofit', 't/p', 'tp'));
  const profitRaw  = parseNum(getField(row, 'profit (€/$)', 'profit (€)', 'profit ($)', 'profit', 'p&l', 'pnl', 'net profit', 'netprofit', 'return')) ?? 0;
  const commission = parseNum(getField(row, 'commission')) ?? 0;
  const swap       = parseNum(getField(row, 'swap')) ?? 0;
  const setup      = getField(row, 'setup', 'tag', 'strategy', 'label');
  const notes      = getField(row, 'notes', 'comment', 'remarks');
  const resultRaw  = getField(row, 'result');

  const netProfit = profitRaw + commission + swap;

  const rRaw = getField(row, 'r-multiple', 'r multiple', 'r_multiple', 'rmultiple', 'reward', 'r');
  let rMultiple = parseNum(rRaw);

  if (rMultiple === null && sl !== null && openPx !== null && lots) {
    const riskPerLot = Math.abs(openPx - sl);
    const riskAmt = riskPerLot * lots * 100;
    if (riskAmt > 0) rMultiple = parseFloat((netProfit / riskAmt).toFixed(2));
  }

  let rr = getField(row, 'r:r', 'rr', 'risk reward', 'riskreward', 'risk/reward');
  if (!rr && sl !== null && tp !== null && openPx !== null) {
    const risk   = Math.abs(openPx - sl);
    const reward = Math.abs(openPx - tp);
    if (risk > 0) rr = `1:${(reward / risk).toFixed(1)}`;
  }

  return {
    date:       openDate || closeDate || '—',
    closeDate:  closeDate || openDate || '—',
    instrument: instrument || '—',
    direction,
    lots,
    openPrice:  openPx,
    closePrice: closePx,
    sl, tp,
    profit:     netProfit,
    setup:      setup || '—',
    notes,
    rMultiple:  rMultiple !== null ? String(rMultiple) : null,
    rr:         rr || '—',
    result:     tradeResult(rMultiple, netProfit, resultRaw),
  };
}

// ─── MT5 HTML ────────────────────────────────────────────────────────────────
function parseMT5HTML(text) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  const rows = Array.from(doc.querySelectorAll('tr'));
  const trades = [];
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
    if (cells.length < 10) continue;
    const profit = parseFloat(cells[13] || cells[10] || '0');
    if (isNaN(profit) && !cells[2]) continue;
    trades.push({
      date:       cells[0] || '—',
      closeDate:  cells[8] || cells[0] || '—',
      instrument: cells[2] || '—',
      direction:  /sell|short/i.test(cells[3] || '') ? 'Short' : 'Long',
      lots:       parseFloat(cells[4]) || null,
      openPrice:  parseFloat(cells[5]) || null,
      closePrice: parseFloat(cells[9]) || null,
      sl:         parseFloat(cells[6]) || null,
      tp:         parseFloat(cells[7]) || null,
      profit:     parseFloat(cells[13] || cells[10] || 0),
      setup: '—', notes: '', rMultiple: null, rr: '—',
      result: tradeResult(null, parseFloat(cells[13] || 0), ''),
    });
  }
  return trades.filter(t => t.instrument !== '—');
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Called as parseTradeFile(text, filename)
export function parseTradeFile(text, filename = '') {
  try {
    let trades = [];

    if (/\.(htm|html)$/i.test(filename)) {
      trades = parseMT5HTML(text);
    } else {
      const rows = parseCSVRows(text);
      if (!rows.length) return { trades: [], totalProfit: 0, winRate: 0, wins: 0, losses: 0, bes: 0 };

      const headers = parseCSVLine(text.split(/\r?\n/)[0]).map(h => h.toLowerCase().trim());

      if (isTradingBaseFormat(headers)) {
        trades = parseTradingBase(rows);
      } else {
        trades = rows.map(mapRow).filter(t => t.instrument !== '—' || t.date !== '—');
      }
    }

    // Filter out rows with no meaningful data
    trades = trades.filter(t => t.result && t.date !== '—');

    const wins        = trades.filter(t => t.result === 'Win').length;
    const losses      = trades.filter(t => t.result === 'Loss').length;
    const bes         = trades.filter(t => t.result === 'Break-even').length;
    const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
    const winRate     = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : 0;

    return { trades, totalProfit, winRate, wins, losses, bes };
  } catch (err) {
    throw new Error('Could not parse file: ' + err.message);
  }
}
