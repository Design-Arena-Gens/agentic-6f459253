/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Direction = "down" | "up";

function useAutoScroll() {
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<number>(250); // pixels per second
  const [direction, setDirection] = useState<Direction>("down");
  const [loop, setLoop] = useState<boolean>(true);

  const stop = useCallback(() => {
    setRunning(false);
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    lastTsRef.current = null;
  }, []);

  const step = useCallback(
    (ts: number) => {
      if (!running) return;
      const last = lastTsRef.current ?? ts;
      const dt = Math.max(0, ts - last) / 1000;
      lastTsRef.current = ts;

      const dir = direction === "down" ? 1 : -1;
      const delta = speed * dt * dir;
      const prevY = window.scrollY;
      window.scrollBy({ top: delta, left: 0, behavior: "auto" });

      const maxScroll = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      );
      const atTop = window.scrollY <= 0;
      const atBottom =
        Math.ceil(window.scrollY + window.innerHeight) >= maxScroll;

      if ((dir > 0 && atBottom) || (dir < 0 && atTop)) {
        if (loop) {
          window.scrollTo({
            top: dir > 0 ? 0 : maxScroll,
            behavior: "auto"
          });
        } else {
          stop();
          return;
        }
      } else if (Math.abs(window.scrollY - prevY) < 0.1 && dt > 0) {
        // No movement possible (probably short page). Stop unless loop is on.
        if (!loop) {
          stop();
          return;
        }
      }

      rafIdRef.current = requestAnimationFrame(step);
    },
    [direction, loop, running, speed, stop]
  );

  const start = useCallback(() => {
    if (running) return;
    setRunning(true);
    rafIdRef.current = requestAnimationFrame(step);
  }, [running, step]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return {
    running,
    speed,
    setSpeed,
    direction,
    setDirection,
    loop,
    setLoop,
    start,
    stop
  };
}

function buildBookmarklet(options: {
  speed: number;
  direction: Direction;
  loop: boolean;
}) {
  const s = Math.max(1, Math.min(20000, Math.floor(options.speed)));
  const dir = options.direction === "down" ? 1 : -1;
  const loopFlag = options.loop ? "true" : "false";
  const code = `(function(){try{var prev=window.__autoScroller__;if(prev&&prev.stop){prev.stop()}var speed=${s},dir=${dir},loop=${loopFlag};var state={running:true,last:null,raf:0};function step(ts){if(!state.running)return;var last=state.last??ts;var dt=(ts-last)/1000;state.last=ts;var delta=speed*dt*dir;var before=window.scrollY;window.scrollBy({top:delta,left:0,behavior:'auto'});var max=Math.max(document.documentElement.scrollHeight,document.body.scrollHeight);var atTop=window.scrollY<=0;var atBottom=Math.ceil(window.scrollY+window.innerHeight)>=max;if((dir>0&&atBottom)||(dir<0&&atTop)){if(loop){window.scrollTo({top:dir>0?0:max,behavior:'auto'})}else{state.running=false;cancelAnimationFrame(state.raf);return}}else if(Math.abs(window.scrollY-before)<0.1&&dt>0){if(!loop){state.running=false;cancelAnimationFrame(state.raf);return}}state.raf=requestAnimationFrame(step)}function stop(){state.running=false;cancelAnimationFrame(state.raf)}window.__autoScroller__={stop};state.raf=requestAnimationFrame(step)}catch(e){console.error('AutoScroller bookmarklet error',e)}})();`;
  return `javascript:${code}`;
}

function buildStopBookmarklet() {
  const code = `(function(){try{var s=window.__autoScroller__;if(s&&s.stop){s.stop()}}catch(e){}})();`;
  return `javascript:${code}`;
}

export default function Page() {
  const {
    running,
    speed,
    setSpeed,
    direction,
    setDirection,
    loop,
    setLoop,
    start,
    stop
  } = useAutoScroll();

  const [bmSpeed, setBmSpeed] = useState<number>(300);
  const [bmDirection, setBmDirection] = useState<Direction>("down");
  const [bmLoop, setBmLoop] = useState<boolean>(true);

  const bookmarkletHref = useMemo(
    () =>
      buildBookmarklet({
        speed: bmSpeed,
        direction: bmDirection,
        loop: bmLoop
      }),
    [bmDirection, bmLoop, bmSpeed]
  );
  const stopBookmarkletHref = useMemo(() => buildStopBookmarklet(), []);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    } catch {
      // fallback not required
    }
  }, []);

  return (
    <div className="container">
      <header style={{ marginBottom: 20 }}>
        <div className="badge mono">Auto Scroller</div>
        <h1 className="title">Automatically scroll any webpage</h1>
        <p className="subtitle">
          Start/stop scrolling this page or use a bookmarklet to scroll{" "}
          <strong>any</strong> site you open.
        </p>
      </header>

      <div className="grid">
        <section className="card">
          <h2 className="sectionTitle">Scroll this page</h2>
          <div className="row">
            <div className="muted">Speed</div>
            <input
              className="range"
              type="range"
              min={10}
              max={3000}
              step={10}
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            />
            <div className="mono">{speed} px/s</div>
          </div>
          <div className="row">
            <div className="muted">Direction</div>
            <div className="controls">
              <label>
                <input
                  type="radio"
                  name="dir"
                  checked={direction === "down"}
                  onChange={() => setDirection("down")}
                />{" "}
                Down
              </label>
              <label>
                <input
                  type="radio"
                  name="dir"
                  checked={direction === "up"}
                  onChange={() => setDirection("up")}
                />{" "}
                Up
              </label>
            </div>
            <div />
          </div>
          <div className="row">
            <div className="muted">Loop when end reached</div>
            <label className="controls">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />{" "}
              Enabled
            </label>
            <div />
          </div>
          <div className="controls" style={{ marginTop: 12 }}>
            {!running ? (
              <button className="btn btnPrimary" onClick={start}>
                Start scrolling
              </button>
            ) : (
              <button className="btn btnDanger" onClick={stop}>
                Stop scrolling
              </button>
            )}
            <span className="badge">
              Status:{" "}
              <span className="mono" style={{ marginLeft: 6 }}>
                {running ? "running" : "stopped"}
              </span>
            </span>
          </div>
        </section>

        <section className="card">
          <h2 className="sectionTitle">Bookmarklet (scroll any site)</h2>
          <div className="row">
            <div className="muted">Speed</div>
            <input
              className="range"
              type="range"
              min={10}
              max={3000}
              step={10}
              value={bmSpeed}
              onChange={(e) => setBmSpeed(parseInt(e.target.value, 10))}
            />
            <div className="mono">{bmSpeed} px/s</div>
          </div>
          <div className="row">
            <div className="muted">Direction</div>
            <div className="controls">
              <label>
                <input
                  type="radio"
                  name="bm-dir"
                  checked={bmDirection === "down"}
                  onChange={() => setBmDirection("down")}
                />{" "}
                Down
              </label>
              <label>
                <input
                  type="radio"
                  name="bm-dir"
                  checked={bmDirection === "up"}
                  onChange={() => setBmDirection("up")}
                />{" "}
                Up
              </label>
            </div>
            <div />
          </div>
          <div className="row">
            <div className="muted">Loop when end reached</div>
            <label className="controls">
              <input
                type="checkbox"
                checked={bmLoop}
                onChange={(e) => setBmLoop(e.target.checked)}
              />{" "}
              Enabled
            </label>
            <div />
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="controls" style={{ marginBottom: 8 }}>
              <a className="btn" href={bookmarkletHref}>
                Drag me to bookmarks: Auto Scroll
              </a>
              <a className="btn btnGhost" href={stopBookmarkletHref}>
                Drag to bookmarks: Stop Auto Scroll
              </a>
            </div>
            <details>
              <summary className="muted">Or copy the code</summary>
              <div style={{ marginTop: 8 }}>
                <div className="muted" style={{ marginBottom: 6 }}>
                  Auto Scroll bookmarklet code:
                </div>
                <textarea
                  className="input mono bookmarklet"
                  rows={4}
                  readOnly
                  value={bookmarkletHref}
                />
                <div className="controls" style={{ marginTop: 8 }}>
                  <button
                    className="btn"
                    onClick={() => copy(bookmarkletHref)}
                  >
                    Copy code
                  </button>
                </div>
              </div>
            </details>
          </div>
          <p className="footer">
            Tip: Open any site, click your bookmark, and it will start scrolling.
          </p>
        </section>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2 className="sectionTitle">Test area</h2>
        <p className="muted">
          This area has extra content so you can test auto-scrolling right on
          this page.
        </p>
        <div style={{ height: 1000 }} />
        <div style={{ height: 1000 }} />
        <div style={{ height: 1000 }} />
        <p className="muted">End of demo content.</p>
      </section>
    </div>
  );
}

