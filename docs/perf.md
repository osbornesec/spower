# Content Script Startup Measurements

## Methodology
- Environment: Node.js v24.6.0 with the bundled `scripts/measure-content-init.js` harness.
- Harness spins up a JSDOM instance of `https://x.com/home`, enables the `spw_dev` flag, and executes the target `content.js` five times.
- Each run records `performance.now()` deltas from script injection to completion (including idle callbacks); timers/intervals are cleared after each run.
- Commands used:
  ```bash
  git show HEAD:content.js > /tmp/content-baseline.js
  node scripts/measure-content-init.js /tmp/content-baseline.js
  node scripts/measure-content-init.js content.js
  ```

## Results

| Build | Runs (ms) | Median | Average |
| --- | --- | --- | --- |
| Baseline (`HEAD`) | 21.16, 21.23, 21.87, 21.96, 25.08 | **21.87 ms** | 22.26 ms |
| Optimized (`content.js`) | 20.61, 21.60, 21.69, 21.98, 23.49 | **21.69 ms** | 21.87 ms |
The optimized startup stays well below the 50 ms target while retaining deterministic behaviour.


## Notes
- Measurement harness emits benign `XMLHttpRequest` warnings due to stubbed browser APIs; they do not affect the recorded timings.
- To enable verbose perf logging in-browser set `localStorage.setItem('spw_dev', '1')` before reloading an X page.
