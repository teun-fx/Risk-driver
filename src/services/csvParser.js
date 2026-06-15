// Parses uploaded CSV files into a normalised trade list.
// Supports: RiskDriver template, MT4/MT5 HTML statement, MT5 CSV export, generic CSV.

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
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
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
  if (!val && val !== 0) return null;
  // Handle European decimal commas: "1,20" → 1.20
  const s = String(val).replace(',', '.');
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function tradeResult(rMultiple, profit) {
  const r = parseNum(rMultiple);
  const p = parseNum(profit) ?? 0;
  const val = r !== null ? r : p;
  if (val > 0) return 'Win';
  if (val < 0) return 'Loss';
  return 'Break-even';
}

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
  const setup      = getField(row, 'setup', 'tag', 'strategy', 'label', 'type');
  const notes      = getField(row, 'notes', 'comment', 'remarks');

  const netProfit = profitRaw + commission + swap;

  // R-multiple: read from column first (highest priority), then calculate from SL/profit
  const rRaw = getField(row, 'r-multiple', 'r multiple', 'r_multiple', 'rmultiple', 'reward', 'r');
  let rMultiple = parseNum(rRaw);

  if (rMultiple === null && sl !== null && openPx !== null && lots) {
    const riskPerLot = Math.abs(openPx - sl);
    const riskAmt = riskPerLot * lots * 100;
    if (riskAmt > 0) rMultiple = parseFloat((netProfit / riskAmt).toFixed(2));
  }

  // R:R ratio
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
    sl,
    tp,
    profit:     netProfit,
    setup:      setup || '—',
    notes,
    rMultiple:  rMultiple !== null ? String(rMultiple) : null,
    rr:         rr || '—',
    result:     tradeResult(rMultiple, netProfit),
  };
}

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
      commission: parseFloat(cells[11] || 0),
      swap:       parseFloat(cells[12] || 0),
      setup: '—', notes: '', rMultiple: null, rr: '—',
      result:     tradeResult(null, parseFloat(cells[13] || 0)),
    });
  }
  return trades.filter(t => t.instrument !== '—');
}

export async function parseTradeFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const text = e.target.result;
        let trades = [];

        if (file.name.endsWith('.htm') || file.name.endsWith('.html')) {
          trades = parseMT5HTML(text);
        } else {
          const rows = parseCSVRows(text);
          trades = rows.map(mapRow).filter(t => t.instrument !== '—' || t.date !== '—');
        }

        const wins   = trades.filter(t => t.result === 'Win').length;
        const losses = trades.filter(t => t.result === 'Loss').length;
        const bes    = trades.filter(t => t.result === 'Break-even').length;
        const totalProfit = trades.reduce((s, t) => s + (t.profit || 0), 0);
        const winRate = (wins + losses) > 0 ? Math.round(wins / (wins + losses) * 100) : 0;

        resolve({ trades, totalProfit, winRate, wins, losses, bes });
      } catch (err) {
        reject(new Error('Could not parse file: ' + err.message));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
