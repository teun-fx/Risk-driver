// Parses an MT5 "Strategy Tester" or account "History" HTML report and
// extracts a per-trade series plus aggregate metrics, so an uploaded report
// can drive the same Overview/Trades/Monte Carlo tabs as the demo strategy.
import { mean, stdDev } from './montecarlo';

const cellText = (el) => el.textContent.replace(/ /g, ' ').trim();

function parseNum(s) {
  if (s === undefined || s === null) return NaN;
  const cleaned = String(s)
    .replace(/−/g, '-')
    .replace(/[\s ,]/g, '');
  return parseFloat(cleaned);
}

function toIsoDate(raw) {
  const datePart = (raw || '').trim().slice(0, 10);
  return datePart.includes('.') ? datePart.replace(/\./g, '-') : datePart;
}

function longestLosingStreak(trades) {
  let longest = 0;
  let current = 0;
  for (const t of trades) {
    if (t.result < 0) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 0;
    }
  }
  return longest;
}

function extractSummary(doc) {
  const summary = {};
  const rows = doc.querySelectorAll('tr');
  for (const row of rows) {
    const cells = Array.from(row.querySelectorAll('td'));
    for (let i = 0; i < cells.length - 1; i++) {
      const label = cellText(cells[i]);
      if (label.endsWith(':')) {
        const value = cellText(cells[i + 1]);
        if (value) summary[label.slice(0, -1).trim()] = value;
      }
    }
  }
  return summary;
}

function findHeaderRow(tables, requiredLower) {
  for (const table of tables) {
    for (const row of Array.from(table.querySelectorAll('tr'))) {
      const cells = Array.from(row.querySelectorAll('td,th')).map(cellText);
      const lower = cells.map((c) => c.toLowerCase());
      if (requiredLower.every((r) => lower.includes(r))) {
        return { table, row, lower };
      }
    }
  }
  return null;
}

// Strategy Tester reports (backtests) log every deal, in and out. Only the
// "out" deals carry a realized profit for a closed position.
function extractDealsTrades(tables) {
  const found = findHeaderRow(tables, ['direction', 'profit', 'balance']);
  if (!found) return null;

  const { table, row: headerRow, lower } = found;
  const col = (name) => lower.indexOf(name);
  const timeIdx = col('time');
  const symbolIdx = col('symbol');
  const typeIdx = col('type');
  const dirIdx = col('direction');
  const profitIdx = col('profit');
  const commentIdx = col('comment');

  const trades = [];
  let id = 1;
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    if (row === headerRow) continue;
    const cells = Array.from(row.querySelectorAll('td')).map(cellText);
    if (cells.length <= Math.max(dirIdx, profitIdx)) continue;
    if ((cells[dirIdx] || '').toLowerCase() !== 'out') continue;
    const profit = parseNum(cells[profitIdx]);
    if (isNaN(profit)) continue;
    const type = cells[typeIdx] || '';
    trades.push({
      id: `mt5-${id++}`,
      date: toIsoDate(cells[timeIdx]),
      instrument: cells[symbolIdx] || '',
      setup: type ? type[0].toUpperCase() + type.slice(1) : '',
      result: profit,
      pips: null,
      notes: cells[commentIdx] || '',
    });
  }
  return trades;
}

// Plain account "History" exports: one row per trade with a single Profit
// column and no explicit in/out deal pairing.
function extractHistoryTrades(tables) {
  const found = findHeaderRow(tables, ['profit']);
  if (!found) return null;

  const { table, row: headerRow, lower } = found;
  const profitIdx = lower.indexOf('profit');
  const timeIdx = lower.indexOf('close time') !== -1 ? lower.indexOf('close time') : lower.indexOf('time');
  const symbolIdx = lower.indexOf('symbol') !== -1 ? lower.indexOf('symbol') : lower.indexOf('item');

  const trades = [];
  let id = 1;
  for (const row of Array.from(table.querySelectorAll('tr'))) {
    if (row === headerRow) continue;
    const cells = Array.from(row.querySelectorAll('td')).map(cellText);
    if (cells.length <= profitIdx) continue;
    const profit = parseNum(cells[profitIdx]);
    if (isNaN(profit) || profit === 0) continue;
    trades.push({
      id: `mt5-${id++}`,
      date: timeIdx !== -1 ? toIsoDate(cells[timeIdx]) : '',
      instrument: symbolIdx !== -1 ? cells[symbolIdx] || '' : '',
      setup: '',
      result: profit,
      pips: null,
      notes: '',
    });
  }
  return trades;
}

export function parseMt5ReportHtml(htmlText) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');
  const tables = Array.from(doc.querySelectorAll('table'));

  const trades = extractDealsTrades(tables) || extractHistoryTrades(tables);
  if (!trades || trades.length === 0) {
    throw new Error('No closed trades found in this report.');
  }

  const winners = trades.filter((t) => t.result >= 0);
  const losers = trades.filter((t) => t.result < 0);

  // Normalize each trade into an R-multiple (using average loss as the risk
  // unit) so uploaded trades are plug-compatible with the bootstrap
  // resampling in montecarlo.js, which expects a `rr` field like "1.8R".
  const riskUnit = losers.length
    ? Math.abs(mean(losers.map((t) => t.result)))
    : mean(trades.map((t) => Math.abs(t.result))) || 1;
  trades.forEach((t) => {
    t.rr = `${(t.result / riskUnit).toFixed(2)}R`;
  });

  const summary = extractSummary(doc);
  const pctInParens = (s) => {
    const m = /\(([\d.,]+)%\)/.exec(s || '');
    return m ? parseFloat(m[1].replace(',', '.')) : null;
  };
  const leadingInt = (s) => {
    const m = /^(\d+)/.exec((s || '').trim());
    return m ? parseInt(m[1], 10) : null;
  };

  const grossWin = winners.reduce((a, t) => a + t.result, 0);
  const grossLoss = Math.abs(losers.reduce((a, t) => a + t.result, 0));

  const winrate = pctInParens(summary['Profit Trades (% of total)']) ?? (winners.length / trades.length) * 100;
  const profitFactor = parseNum(summary['Profit Factor']) || (grossLoss === 0 ? grossWin : grossWin / grossLoss);
  const expectancy = parseNum(summary['Expected Payoff']) || mean(trades.map((t) => t.result));
  const totalPnl = parseNum(summary['Total Net Profit']) || trades.reduce((a, t) => a + t.result, 0);

  const avgProfitTrade = parseNum(summary['Average profit trade']);
  const avgLossTrade = parseNum(summary['Average loss trade']);
  const avgWin = winners.length ? grossWin / winners.length : 0;
  const avgLoss = losers.length ? grossLoss / losers.length : 0;
  const rr = avgProfitTrade && avgLossTrade ? avgProfitTrade / Math.abs(avgLossTrade) : avgLoss ? avgWin / avgLoss : 0;

  const maxLosingStreak = leadingInt(summary['Maximum consecutive losses ($)']) ?? longestLosingStreak(trades);

  const rMultiples = trades.map((t) => parseFloat(t.rr));
  const rMean = mean(rMultiples);
  const rStd = stdDev(rMultiples) || 1;
  const sharpe = parseNum(summary['Sharpe Ratio']) || rMean / rStd;
  const downside = rMultiples.filter((r) => r < 0);
  const downsideDev = downside.length ? Math.sqrt(mean(downside.map((r) => r * r))) : rStd;
  const sortino = rMean / (downsideDev || 1);

  return {
    trades,
    metrics: {
      totalTrades: trades.length,
      winrate: Number(winrate.toFixed(1)),
      rr: Number(rr.toFixed(2)),
      profitFactor: Number(profitFactor.toFixed(2)),
      expectancy: Number(expectancy.toFixed(2)),
      maxLosingStreak,
      sharpe: Number(sharpe.toFixed(2)),
      sortino: Number(sortino.toFixed(2)),
      totalPnl: Number(totalPnl.toFixed(2)),
    },
  };
}
