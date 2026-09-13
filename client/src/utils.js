export const MONTHS_SW = [
  'Januari','Februari','Machi','Aprili','Mei','Juni',
  'Julai','Agosti','Septemba','Oktoba','Novemba','Desemba'
];

export function fmt(n) {
  return (Number(n) || 0).toLocaleString('en-US');
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isoWeek(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff = target - firstThursday;
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  return { year: target.getFullYear(), week };
}

export function monthKey(dateStr) {
  return dateStr.slice(0, 7);
}

export function monthLabel(mk) {
  const [y, m] = mk.split('-');
  return MONTHS_SW[parseInt(m, 10) - 1] + ' ' + y;
}

export function dateLabel(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['Jumapili','Jumatatu','Jumanne','Jumatano','Alhamisi','Ijumaa','Jumamosi'];
  return days[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_SW[d.getMonth()] + ' ' + d.getFullYear();
}

/**
 * Huhesabu tarehe ya Ijumaa ya wiki namba fulani ndani ya mwezi na mwaka.
 * Inarudisha tarehe ISO string (YYYY-MM-DD) au null kama wiki hiyo haipo kwenye mwezi huo.
 */
export function wikiTarehe(year, month, weekNum) {
  const first = new Date(year, month - 1, 1);
  const firstDay = first.getDay(); // 0=Jumapili..6=Jumamosi
  // Ijumaa = 5; pata Ijumaa ya kwanza ya mwezi
  const daysToFirstFriday = (5 - firstDay + 7) % 7;
  const firstFriday = 1 + daysToFirstFriday;
  const targetDate  = firstFriday + (weekNum - 1) * 7;
  const d = new Date(year, month - 1, targetDate);
  if (d.getMonth() !== month - 1) return null; // imepita mwezi
  return d.toISOString().slice(0, 10);
}

/**
 * Huhesabu WIKI ZOTE za Ijumaa zilizopo ndani ya mwezi husika.
 * Kama mwezi una Ijumaa 4 → Wiki 1..4. Kama una 5 → Wiki 1..5.
 * year na month ni hiari — chaguo-msingi ni mwezi wa sasa.
 */
export function getMonthWikiOptions(year, month) {
  const today = new Date();
  const y = year  ?? today.getFullYear();
  const m = month ?? today.getMonth() + 1;

  const options = [];
  for (let wk = 1; wk <= 5; wk++) {
    const tarehe = wikiTarehe(y, m, wk);
    if (tarehe) {
      options.push({
        label: `Wiki ${wk}  —  ${dateLabel(tarehe)}`,
        value: tarehe,
        wiki:  wk,
        year:  y,
        month: m,
      });
    }
  }
  return options; // Wiki 1..4 au Wiki 1..5 kulingana na mwezi
}

/**
 * Rudisha chaguo la wiki za mwezi wa sasa.
 * (shortcut inayotumika EntryForm)
 */
export function getWikiOptions() {
  return getMonthWikiOptions();
}

export function sumEntries(list) {
  const t = { hisaIdadi:0, hisaThamani:0, jamii:0, marejeshoHisa:0, marejeshoJamii:0, bima:0, faini:0 };
  list.forEach(e => {
    t.hisaIdadi    += Number(e.hisaIdadi)    || 0;
    t.hisaThamani  += Number(e.hisaThamani)  || 0;
    t.jamii        += Number(e.jamii)        || 0;
    t.marejeshoHisa  += Number(e.marejeshoHisa)  || 0;
    t.marejeshoJamii += Number(e.marejeshoJamii) || 0;
    t.bima         += Number(e.bima)         || 0;
    t.faini        += Number(e.faini)        || 0;
  });
  return t;
}
