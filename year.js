/*
Reusable Year Timeline Module

Features:
- Generate a continuous year scale from min/max or explicit range
- Map events (with dates/years) onto the scale
- Group events by year
- Render to HTML (vanilla) with accessible markup
- Lightweight state + API to update data, range, and filters
- Works in browser without bundlers

Usage:
<script src="year.js"></script>
<script>
  const timeline = YearTimeline.create({
    container: document.getElementById('timeline'),
    range: { start: 1990, end: 2024 }, // optional; will infer from data if missing
    step: 1, // optional year step (1, 5, 10)
    orientation: 'horizontal', // or 'vertical'
    compact: false, // true to reduce label density
    renderer: 'list', // 'list' | 'bar' | 'dots'
  });

  // events: [{ date: 'YYYY-MM-DD' | 'YYYY' | Date, title, description, id?, url?, meta? }]
  timeline.setData(events);

  // Later updates
  timeline.update({ step: 5 });
  timeline.render();
</script>
*/

(function (global) {
  const DEFAULTS = {
    range: null, // { start, end }
    step: 1,
    orientation: 'horizontal',
    compact: false,
    renderer: 'list',
    className: 'year-timeline',
  };

  function toYear(value) {
    if (value == null) return null;
    if (value instanceof Date) return value.getFullYear();
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      // Extract first 4-digit year
      const m = value.match(/(\d{4})/);
      return m ? parseInt(m[1], 10) : null;
    }
    return null;
  }

  function inferRange(events) {
    if (!events || events.length === 0) return null;
    let minY = Infinity, maxY = -Infinity;
    for (const e of events) {
      const y = toYear(e.date ?? e.year);
      if (typeof y === 'number') {
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (!isFinite(minY) || !isFinite(maxY)) return null;
    return { start: minY, end: maxY };
  }

  function buildScale(range, step) {
    if (!range) return [];
    const start = Math.min(range.start, range.end);
    const end = Math.max(range.start, range.end);
    const s = Math.max(1, step || 1);
    const years = [];
    for (let y = start; y <= end; y += s) years.push(y);
    return years;
  }

  function groupByYear(events) {
    const map = new Map();
    if (!Array.isArray(events)) return map;
    for (const e of events) {
      const y = toYear(e.date ?? e.year);
      if (y == null) continue;
      if (!map.has(y)) map.set(y, []);
      map.get(y).push(e);
    }
    // Sort events per year by date if available
    for (const [y, arr] of map) {
      arr.sort((a, b) => {
        const da = new Date(a.date ?? `${y}-01-01`).getTime();
        const db = new Date(b.date ?? `${y}-01-01`).getTime();
        return da - db;
      });
    }
    return map;
  }

  function ensureContainer(el) {
    if (!el) throw new Error('YearTimeline: container is required');
    // Clear only what we render (data-role attr)
    const existing = el.querySelector(':scope > [data-ytl-root]');
    if (existing) existing.remove();
  }

  function renderList(state) {
    const { container, years, eventsByYear, compact } = state;

    const root = document.createElement('div');
    root.dataset.ytlRoot = '1';
    root.className = `${state.className} ${state.className}--list`;

    const ul = document.createElement('ul');
    ul.className = `${state.className}__years`;

    for (const y of years) {
      const li = document.createElement('li');
      li.className = `${state.className}__year`;

      const header = document.createElement('div');
      header.className = `${state.className}__year-header`;
      header.textContent = String(y);
      li.appendChild(header);

      const items = eventsByYear.get(y) || [];
      if (!compact || items.length) {
        const inner = document.createElement('ul');
        inner.className = `${state.className}__events`;
        for (const ev of items) {
          const item = document.createElement('li');
          item.className = `${state.className}__event`;

          const title = document.createElement('div');
          title.className = `${state.className}__event-title`;
          title.textContent = ev.title ?? ev.name ?? '(untitled)';

          const meta = document.createElement('div');
          meta.className = `${state.className}__event-meta`;
          const d = ev.date ? new Date(ev.date) : null;
          meta.textContent = d && !isNaN(d) ? d.toISOString().slice(0, 10) : `${y}`;

          item.appendChild(title);
          item.appendChild(meta);

          if (ev.description) {
            const desc = document.createElement('div');
            desc.className = `${state.className}__event-desc`;
            desc.textContent = ev.description;
            item.appendChild(desc);
          }

          if (ev.url) {
            const link = document.createElement('a');
            link.href = ev.url;
            link.textContent = 'Details';
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.className = `${state.className}__event-link`;
            item.appendChild(link);
          }

          inner.appendChild(item);
        }
        li.appendChild(inner);
      }

      ul.appendChild(li);
    }

    root.appendChild(ul);
    container.appendChild(root);
  }

  function renderDots(state) {
    const { container, years, eventsByYear, orientation } = state;

    const root = document.createElement('div');
    root.dataset.ytlRoot = '1';
    root.className = `${state.className} ${state.className}--dots ${state.className}--${orientation}`;

    const axis = document.createElement('div');
    axis.className = `${state.className}__axis`;

    const start = years[0];
    const end = years[years.length - 1];
    const span = Math.max(1, end - start);

    const frag = document.createDocumentFragment();

    for (const [y, evs] of eventsByYear) {
      const pos = ((y - start) / span) * 100;
      for (const ev of evs) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = `${state.className}__dot`;
        dot.setAttribute('aria-label', `${ev.title ?? 'Event'} (${y})`);
        dot.style[orientation === 'horizontal' ? 'left' : 'top'] = `${pos}%`;
        dot.addEventListener('click', () => {
          alert(`${y}: ${ev.title ?? '(untitled)'}\n${ev.description ?? ''}`.trim());
        });
        frag.appendChild(dot);
      }
    }

    axis.appendChild(frag);

    const labels = document.createElement('div');
    labels.className = `${state.className}__labels`;
    for (const y of years) {
      const pos = ((y - start) / span) * 100;
      const lbl = document.createElement('div');
      lbl.className = `${state.className}__label`;
      lbl.textContent = String(y);
      lbl.style[orientation === 'horizontal' ? 'left' : 'top'] = `${pos}%`;
      labels.appendChild(lbl);
    }

    root.appendChild(axis);
    root.appendChild(labels);
    container.appendChild(root);
  }

  function renderBar(state) {
    const { container, years, eventsByYear, orientation } = state;
    const counts = years.map((y) => (eventsByYear.get(y) || []).length);
    const max = Math.max(1, ...counts);

    const root = document.createElement('div');
    root.dataset.ytlRoot = '1';
    root.className = `${state.className} ${state.className}--bar ${state.className}--${orientation}`;

    const grid = document.createElement('div');
    grid.className = `${state.className}__grid`;

    // Add a new parameter to specify the interval of the year bar
    const interval = state.interval || 1;

    years.forEach((y, i) => {
      const bar = document.createElement('div');
      bar.className = `${state.className}__bar`;
      const val = counts[i] / max;
      const start = y - (y % interval);
      const end = start + interval - 1;
      const barWidth = (end - start + 1) * 100 / (years[years.length - 1] - years[0] + 1);
      if (orientation === 'horizontal') {
        bar.style.height = `${Math.round(val * 100)}%`;
        bar.style.width = `${barWidth}%`;
        bar.style.left = `${start * 100 / (years[years.length - 1] - years[0] + 1) - (barWidth / 2)}%`;
      } else {
        bar.style.height = `${Math.round(val * 100)}%`;
        bar.style.width = `${barWidth}%`;
        bar.style.top = `${start * 100 / (years[years.length - 1] - years[0] + 1) - (barWidth / 2)}%`;
      }
      const caption = document.createElement('div');
      caption.className = `${state.className}__bar-caption`;
      caption.textContent = `${start}-${end} (${counts[i]})`;

      const cell = document.createElement('div');
      cell.className = `${state.className}__cell`;
      cell.appendChild(bar);
      cell.appendChild(caption);
      grid.appendChild(cell);
    });

    root.appendChild(grid);
    container.appendChild(root);
  }

  const renderers = {
    list: renderList,
    dots: renderDots,
    bar: renderBar,
  };

  function normalizeConfig(cfg) {
    return { ...DEFAULTS, ...(cfg || {}) };
  }

  function create(config) {
    const state = normalizeConfig(config);
    if (!state.container && typeof state.target === 'string') {
      state.container = document.querySelector(state.target);
    }
    if (!state.container) throw new Error('YearTimeline: missing container');

    state.events = [];
    state.eventsByYear = new Map();
    state.years = [];

    function compute() {
      const range = state.range || inferRange(state.events) || null;
      if (!range) {
        state.years = [];
        state.eventsByYear = new Map();
        return;
      }
      const years = buildScale(range, state.step);
      const byYear = groupByYear(state.events);
      // Ensure all years exist in map even with 0 events
      for (const y of years) if (!byYear.has(y)) byYear.set(y, []);

      state.years = years;
      state.eventsByYear = byYear;
    }

    function render() {
      ensureContainer(state.container);
      if (!state.years.length) {
        const root = document.createElement('div');
        root.dataset.ytlRoot = '1';
        root.className = `${state.className} ${state.className}--empty`;
        root.textContent = 'No timeline data';
        state.container.appendChild(root);
        return;
      }
      const r = renderers[state.renderer] || renderers.list;
      r(state);
    }

    // Public API
    return {
      setData(events) {
        state.events = Array.isArray(events) ? events.slice() : [];
        compute();
        render();
        return this;
      },
      update(patch) {
        Object.assign(state, patch || {});
        compute();
        render();
        return this;
      },
      setRange(start, end) {
        state.range = start != null && end != null ? { start, end } : null;
        compute();
        render();
        return this;
      },
      setRenderer(name) {
        state.renderer = name;
        render();
        return this;
      },
      getState() { return { ...state, eventsByYear: undefined }; },
    };
  }

  // Minimal CSS injector to make it usable out-of-the-box
  function injectStyles() {
    if (document.getElementById('year-timeline-styles')) return;
    const css = `
    .year-timeline { font-family: system-ui, Arial, sans-serif; color: #111; }
    .year-timeline--empty { padding: 0.75rem; color: #666; }

    /* list renderer */
    .year-timeline--list .year-timeline__years { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
    .year-timeline__year { border: 1px solid #e4e4e7; border-radius: 8px; padding: 8px 10px; background: #fff; }
    .year-timeline__year-header { font-weight: 700; margin-bottom: 6px; }
    .year-timeline__events { list-style: disc; margin: 0 0 0 18px; padding: 0; }
    .year-timeline__event { margin: 6px 0; }
    .year-timeline__event-title { font-weight: 600; }
    .year-timeline__event-meta { font-size: 12px; color: #475569; }
    .year-timeline__event-desc { font-size: 13px; color: #334155; margin-top: 2px; }
    .year-timeline__event-link { font-size: 12px; display: inline-block; margin-top: 4px; color: #2563eb; }

    /* dots renderer */
    .year-timeline--dots { position: relative; padding: 28px; }
    .year-timeline--dots .year-timeline__axis { position: relative; background: #e5e7eb; border-radius: 3px; }
    .year-timeline--dots.year-timeline--horizontal .year-timeline__axis { height: 8px; }
    .year-timeline--dots.year-timeline--vertical .year-timeline__axis { width: 8px; height: 360px; }
    .year-timeline__dot { position: absolute; width: 12px; height: 12px; border-radius: 999px; border: 2px solid #fff; background: #1d4ed8; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); transform: translate(-50%, -50%); cursor: pointer; }
    .year-timeline--vertical .year-timeline__dot { left: 50%; }
    .year-timeline__labels { position: relative; font-size: 12px; color: #334155; }
    .year-timeline--horizontal .year-timeline__labels { margin-top: 8px; height: 16px; }
    .year-timeline--vertical .year-timeline__labels { position: absolute; left: 16px; top: 0; height: 100%; }
    .year-timeline__label { position: absolute; transform: translate(-50%, 0); white-space: nowrap; }
    .year-timeline--vertical .year-timeline__label { transform: translate(0, -50%); }

    /* bar renderer */
    .year-timeline--bar .year-timeline__grid { display: grid; grid-auto-flow: column; align-items: end; gap: 8px; height: 200px; padding: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 6px; }
    .year-timeline--vertical.year-timeline--bar .year-timeline__grid { grid-auto-flow: row; width: 100%; height: auto; }
    .year-timeline__cell { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; }
    .year-timeline--vertical .year-timeline__cell { flex-direction: row; justify-content: flex-start; }
    .year-timeline__bar { width: 14px; background: linear-gradient(180deg, #60a5fa, #2563eb); border-radius: 4px; }
    .year-timeline--vertical .year-timeline__bar { height: 12px; }
    .year-timeline__bar-caption { font-size: 11px; color: #334155; }
    `;
    const style = document.createElement('style');
    style.id = 'year-timeline-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function autoInit() {
    injectStyles();
    const nodes = document.querySelectorAll('[data-year-timeline]');
    nodes.forEach((el) => {
      const rangeAttr = el.getAttribute('data-range'); // e.g., "1990-2020"
      const step = parseInt(el.getAttribute('data-step') || '1', 10);
      const orientation = el.getAttribute('data-orientation') || 'horizontal';
      const renderer = el.getAttribute('data-renderer') || 'list';

      let range = null;
      if (rangeAttr && /\d{4}\s*-\s*\d{4}/.test(rangeAttr)) {
        const [a, b] = rangeAttr.split('-').map((s) => parseInt(s.trim(), 10));
        range = { start: a, end: b };
      }

      const instance = create({ container: el, range, step, orientation, renderer });

      try {
        const json = el.getAttribute('data-events');
        if (json) {
          const events = JSON.parse(json);
          instance.setData(events);
        }
      } catch (e) {
        console.warn('YearTimeline: failed to parse data-events JSON', e);
      }

      // Expose instance on element for imperative control
      el._yearTimeline = instance;
    });
  }

  const YearTimeline = { create };
  global.YearTimeline = YearTimeline;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', autoInit);
    } else {
      autoInit();
    }
  }
})(typeof window !== 'undefined' ? window : this);
