"use client";

import { useEffect, useRef } from "react";
import createGlobe from "cobe";

// Each globe pin carries its own resolved city name + count, so there's no
// separate slug→name lookup that could miss and fall back to a raw slug.
export type GlobeCity = {
  slug: string;
  lat: number;
  lng: number;
  name: string;
  count?: number;
};

// cobe renders the rotating dotted sphere. It has no clickable markers, so we
// overlay our own dots and reposition them every frame from the rotation. Dots
// are VISUAL ONLY (pointer-events none) — hover + click are hit-tested against
// the nearest marker at the container level, so dense regions (Europe) are
// forgiving: you don't need a pixel-perfect tap, the closest city wins.
//
// Placement uses cobe's EXACT projection (from its shader): a marker lives at
// r = [-cos(lat)cos(lng-π), sin(lat), cos(lat)sin(lng-π)] in globe space, and
// f = L·r maps it to eye space (L = cobe's rotation). Projected to a disc of
// radius 0.4·size·zoom. scale (zoom) is fed straight back into cobe so the
// globe and the pins magnify together.
const DEG = Math.PI / 180;
const AUTO_SPIN = 0.0009;
const MIN_ZOOM = 1;
const MAX_ZOOM = 2.6;
const HOVER_R = 24; // px — snap radius for hover
const CLICK_R = 36; // px — snap radius for click

const CORAL: [number, number, number] = [0.965, 0.404, 0.337];
const BASE: [number, number, number] = [0.93, 0.84, 0.83];

type ScreenPos = { slug: string; name: string; count?: number; x: number; y: number; front: boolean };

type Props = {
  cities: GlobeCity[];
  onSelectCity: (slug: string) => void;
  active?: boolean; // false = overlay open → freeze + hide markers
};

export function Globe({ cities, onSelectCity, active = true }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const positions = useRef<ScreenPos[]>([]);

  const phi = useRef(0);
  const theta = useRef(0.25);
  const zoom = useRef(1);
  const dragging = useRef(false);
  const hovering = useRef(false);
  const hoveredSlug = useRef<string | null>(null);
  const activeRef = useRef(active);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const moved = useRef(false);
  const pinchDist = useRef<number | null>(null);

  useEffect(() => {
    activeRef.current = active;
    if (!active) hoveredSlug.current = null;
  }, [active]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let size = container.clientWidth;

    const nearest = (x: number, y: number, maxD: number): string | null => {
      let best: string | null = null;
      let bestD = maxD * maxD;
      for (const p of positions.current) {
        if (!p.front) continue;
        const dx = p.x - x, dy = p.y - y;
        const d = dx * dx + dy * dy;
        if (d < bestD) { bestD = d; best = p.slug; }
      }
      return best;
    };

    const updateMarkers = () => {
      const R = size * 0.4 * zoom.current;
      const cx = size / 2;
      const cy = size / 2;
      const cosP = Math.cos(phi.current), sinP = Math.sin(phi.current);
      const cosT = Math.cos(theta.current), sinT = Math.sin(theta.current);
      const show = activeRef.current;
      const pos: ScreenPos[] = [];
      const hov = hoveredSlug.current;
      for (const c of cities) {
        const dot = dotRefs.current.get(c.slug);
        const lat = c.lat * DEG;
        const o = c.lng * DEG - Math.PI;
        const a = Math.cos(lat);
        const rx = -a * Math.cos(o), ry = Math.sin(lat), rz = a * Math.sin(o);
        const fx = cosP * rx + sinP * rz;
        const fy = sinP * sinT * rx + cosT * ry - cosP * sinT * rz;
        const fz = -sinP * cosT * rx + sinT * ry + cosP * cosT * rz;
        const px = cx + fx * R;
        const py = cy - fy * R;
        const front = show && fz > 0.04;
        pos.push({ slug: c.slug, name: c.name, count: c.count, x: px, y: py, front });
        if (!dot) continue;
        if (!front) { dot.style.opacity = "0"; continue; }
        const big = c.slug === hov;
        const s = big ? 15 : 9;
        dot.style.width = `${s}px`;
        dot.style.height = `${s}px`;
        dot.style.transform = `translate(-50%, -50%) translate(${px}px, ${py}px)`;
        dot.style.opacity = String(Math.min(1, 0.5 + fz));
        dot.style.zIndex = String(Math.round(fz * 20) + 10);
      }
      positions.current = pos;

      // JS-driven hover tooltip (dots are pointer-events-none, so no CSS :hover).
      const tip = tooltipRef.current;
      if (tip) {
        const h = hov ? pos.find((p) => p.slug === hov && p.front) : null;
        if (h) {
          tip.textContent = h.count ? `${h.name} · ${h.count}` : h.name;
          tip.style.transform = `translate(-50%, -100%) translate(${h.x}px, ${h.y - 12}px)`;
          tip.style.opacity = "1";
        } else {
          tip.style.opacity = "0";
        }
      }
    };

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: size * dpr,
      height: size * dpr,
      phi: 0,
      theta: theta.current,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 5,
      baseColor: BASE,
      markerColor: CORAL,
      glowColor: [1, 1, 1],
      opacity: 0.9,
      scale: 1,
      markers: [],
      onRender: (state) => {
        const paused = dragging.current || hovering.current || !activeRef.current;
        if (!paused) phi.current += AUTO_SPIN;
        state.phi = phi.current;
        state.theta = theta.current;
        state.scale = zoom.current;
        state.width = size * dpr;
        state.height = size * dpr;
        updateMarkers();
      },
    });

    const relPos = (e: { clientX: number; clientY: number }) => {
      const rect = container.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      moved.current = false;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      container.style.cursor = "grabbing";
    };
    const onDrag = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved.current = true;
      lastX.current = e.clientX;
      lastY.current = e.clientY;
      phi.current += dx * 0.005;
      theta.current = Math.max(-0.6, Math.min(0.9, theta.current + dy * 0.005));
    };
    const onUp = () => {
      dragging.current = false;
      container.style.cursor = "grab";
    };
    const onHover = (e: PointerEvent) => {
      if (dragging.current) return;
      const { x, y } = relPos(e);
      const slug = nearest(x, y, HOVER_R);
      hoveredSlug.current = slug;
      container.style.cursor = slug ? "pointer" : "grab";
    };
    const onClick = (e: MouseEvent) => {
      if (moved.current) return;
      const { x, y } = relPos(e);
      const slug = nearest(x, y, CLICK_R);
      if (slug) onSelectCity(slug);
    };
    const onEnter = () => (hovering.current = true);
    const onLeave = () => {
      hovering.current = false;
      dragging.current = false;
      hoveredSlug.current = null;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.current * (1 - e.deltaY * 0.0012)));
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2) return;
      e.preventDefault();
      dragging.current = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (pinchDist.current != null) {
        zoom.current = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom.current * (dist / pinchDist.current)));
      }
      pinchDist.current = dist;
    };
    const onTouchEnd = () => (pinchDist.current = null);

    container.addEventListener("pointerdown", onDown);
    container.addEventListener("pointermove", onHover);
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);
    container.addEventListener("click", onClick);
    container.addEventListener("wheel", onWheel, { passive: false });
    container.addEventListener("touchmove", onTouchMove, { passive: false });
    container.addEventListener("touchend", onTouchEnd);
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", onUp);

    const ro = new ResizeObserver(() => {
      size = container.clientWidth;
    });
    ro.observe(container);

    return () => {
      globe.destroy();
      ro.disconnect();
      container.removeEventListener("pointerdown", onDown);
      container.removeEventListener("pointermove", onHover);
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
      container.removeEventListener("click", onClick);
      container.removeEventListener("wheel", onWheel);
      container.removeEventListener("touchmove", onTouchMove);
      container.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("pointermove", onDrag);
      window.removeEventListener("pointerup", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative mx-auto aspect-square w-full max-w-[520px] cursor-grab touch-none select-none"
    >
      <canvas ref={canvasRef} className="h-full w-full" style={{ contain: "layout paint size" }} />
      <div className="pointer-events-none absolute inset-0">
        {cities.map((c) => (
          <div
            key={c.slug}
            ref={(el) => {
              if (el) dotRefs.current.set(c.slug, el);
              else dotRefs.current.delete(c.slug);
            }}
            className="absolute left-0 top-0 rounded-full bg-coral-bright ring-2 ring-white"
            style={{ width: 9, height: 9, opacity: 0 }}
          />
        ))}
        <div
          ref={tooltipRef}
          className="absolute left-0 top-0 z-40 whitespace-nowrap rounded-full bg-ink px-2 py-0.5 text-[11px] font-medium text-white shadow transition-opacity"
          style={{ opacity: 0 }}
        />
      </div>
    </div>
  );
}
