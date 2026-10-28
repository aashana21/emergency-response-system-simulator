// ---------- CPU scheduling (tick-based; lower priority number = higher priority) ----------
export function schedule(ps, algo, q = 2) {
  const p = ps.map((x, i) => ({ ...x, i, rem: x.burst, start: null, end: null }));
  const key = { FCFS: x => x.arrival, SJF: x => x.burst, PRIORITY: x => x.priority, SRTF: x => x.rem };
  const pick = a => [...a].sort((x, y) => key[algo](x) - key[algo](y) || x.arrival - y.arrival || x.i - y.i)[0];
  const gantt = []; const rq = []; let t = 0, cur = null, slice = 0, busy = 0;
  while (p.some(x => x.rem > 0)) {
    p.forEach(x => { if (x.arrival === t) rq.push(x); });
    if (cur && cur.rem === 0) cur = null;
    if (cur && algo === 'RR' && slice >= q) { rq.push(cur); cur = null; }
    const ready = p.filter(x => x.arrival <= t && x.rem > 0);
    if (algo === 'SRTF') cur = pick(ready) || null;
    else if (!cur) { if (algo === 'RR') { cur = rq.shift() || null; slice = 0; } else cur = pick(ready) || null; }
    if (!cur) { t++; continue; }
    if (cur.start === null) cur.start = t;
    const last = gantt[gantt.length - 1];
    if (last && last.id === cur.id && last.end === t) last.end++; else gantt.push({ id: cur.id, start: t, end: t + 1 });
    cur.rem--; slice++; busy++; t++; if (cur.rem === 0) cur.end = t;
  }
  const rows = p.map(x => ({ id: x.id, completion: x.end, turnaround: x.end - x.arrival, waiting: x.end - x.arrival - x.burst, response: x.start - x.arrival }));
  const avg = k => rows.reduce((s, r) => s + r[k], 0) / rows.length;
  return { gantt, rows, total: t, avgWaiting: avg('waiting'), avgTurnaround: avg('turnaround'), avgResponse: avg('response'), utilization: (busy / t) * 100 };
}
// ---------- Bounded buffer with semaphores ----------
export const pcInit = cap => ({ cap, buf: [], empty: cap, full: 0, mutex: 1, blockedP: 0, blockedC: 0, n: 0, log: [] });
export function pcStep(s, act) {
  const n = { ...s, buf: [...s.buf], log: [...s.log] };
  if (act === 'P') {
    if (n.empty === 0) { n.blockedP++; n.log.push('Producer BLOCKED: wait(empty) with empty=0 (buffer full)'); return n; }
    n.empty--; n.mutex = 0; n.buf.push('A' + ++n.n); n.mutex = 1; n.full++;
    n.log.push(`Produced ${n.buf[n.buf.length - 1]} (wait(empty), lock, insert, unlock, signal(full))`);
    if (n.blockedC > 0) { n.blockedC--; return pcStep(n, 'C'); }
  } else {
    if (n.full === 0) { n.blockedC++; n.log.push('Consumer BLOCKED: wait(full) with full=0 (buffer empty)'); return n; }
    n.full--; n.mutex = 0; const it = n.buf.shift(); n.mutex = 1; n.empty++;
    n.log.push(`Consumed ${it} (wait(full), lock, remove, unlock, signal(empty))`);
    if (n.blockedP > 0) { n.blockedP--; return pcStep(n, 'P'); }
  }
  return n;
}
// ---------- Memory (variable partitions) ----------
export const memInit = sizes => { let a = 0; return sizes.map(size => { const b = { start: a, size, pid: null }; a += size; return b; }); };
export function memAlloc(mem, pid, size, strat) {
  const c = mem.map((b, i) => ({ b, i })).filter(({ b }) => b.pid === null && b.size >= size);
  if (!c.length) return { mem, ok: false };
  const { b, i } = strat === 'best' ? c.reduce((a, x) => (x.b.size < a.b.size ? x : a)) : strat === 'worst' ? c.reduce((a, x) => (x.b.size > a.b.size ? x : a)) : c[0];
  const out = [...mem]; out.splice(i, 1, { start: b.start, size, pid }, ...(b.size > size ? [{ start: b.start + size, size: b.size - size, pid: null }] : []));
  return { mem: out, ok: true };
}
export function memFree(mem, pid) {
  const out = []; mem.forEach(b => { const x = b.pid === pid ? { ...b, pid: null } : { ...b }; const l = out[out.length - 1]; if (l && l.pid === null && x.pid === null) l.size += x.size; else out.push(x); }); return out;
}
export function memStats(mem) {
  const total = mem.reduce((s, b) => s + b.size, 0), free = mem.filter(b => b.pid === null), fs = free.reduce((s, b) => s + b.size, 0), big = Math.max(0, ...free.map(b => b.size));
  return { total, used: total - fs, free: fs, utilization: ((total - fs) / total) * 100, externalFrag: fs ? (1 - big / fs) * 100 : 0, largestFree: big };
}
// ---------- Banker's algorithm ----------
export const need = (max, alloc) => max.map((r, i) => r.map((v, j) => v - alloc[i][j]));
export function safety(avail, alloc, max) {
  const N = need(max, alloc), work = [...avail], fin = alloc.map(() => false), seq = [], steps = [];
  for (let k = 0; k < alloc.length; k++) {
    const i = N.findIndex((r, x) => !fin[x] && r.every((v, j) => v <= work[j]));
    if (i < 0) break;
    steps.push({ pid: i, work: [...work], need: N[i] }); alloc[i].forEach((v, j) => (work[j] += v)); fin[i] = true; seq.push(i);
  }
  return { safe: fin.every(Boolean), seq, steps, finish: fin, work };
}
export function request(avail, alloc, max, pid, req) {
  if (!Number.isInteger(pid) || pid < 0 || pid >= alloc.length) return { granted: false, reason: 'Invalid process ID.' };
  if (!Array.isArray(req) || req.length !== avail.length || req.some(v => !Number.isInteger(v) || v < 0)) return { granted: false, reason: 'Request must contain one non-negative integer per resource.' };
  if (avail.length !== 3 || alloc.some(r => r.length !== avail.length) || max.some(r => r.length !== avail.length)) return { granted: false, reason: 'Resource vector dimensions do not match.' };
  const N = need(max, alloc);
  if (req.some((v, j) => v > N[pid][j])) return { granted: false, reason: 'Request exceeds maximum claim (Need).' };
  if (req.some((v, j) => v > avail[j])) return { granted: false, reason: 'Resources unavailable: process must wait.' };
  const a2 = avail.map((v, j) => v - req[j]), al2 = alloc.map((r, i) => (i === pid ? r.map((v, j) => v + req[j]) : r)), s = safety(a2, al2, max);
  return s.safe ? { granted: true, avail: a2, alloc: al2, seq: s.seq, reason: 'Tentative allocation is safe; committed.' } : { granted: false, reason: 'Tentative allocation leaves UNSAFE state; rolled back.' };
}
