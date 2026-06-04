"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { boundsOf, toFeatureCollection, type MapPoint } from "@/lib/geo-points";
import { MapPlacePopup } from "./MapPlacePopup";

// Keyless, free, no-limit vector tiles. Positron = clean light basemap that
// lets the coral pins pop. (Protomaps-on-R2 is the self-host fallback.)
const STYLE_URL = "https://tiles.openfreemap.org/styles/positron";
const CORAL = "#c4422f";

// Per-anchor offsets so MapLibre can auto-flip the popup to whichever side has
// room (e.g. below a pin near the top edge) instead of always opening upward
// and getting clipped by the map card's rounded overflow. Pin is ~31px tall,
// anchored at its tip, so "bottom" (popup above) clears the pin top.
const POPUP_OFFSET: Record<string, [number, number]> = {
  top: [0, 12],
  "top-left": [0, 12],
  "top-right": [0, 12],
  bottom: [0, -38],
  "bottom-left": [0, -38],
  "bottom-right": [0, -38],
  left: [16, -16],
  right: [-16, -16],
  center: [0, -16],
};

// Teardrop pin (coral) with a white dot — reads as a location pin, on-brand.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="62" viewBox="0 0 48 62"><path d="M24 1C11.3 1 1 11.3 1 24c0 15.5 23 37 23 37s23-21.5 23-37C47 11.3 36.7 1 24 1z" fill="#f36756" stroke="#fff" stroke-width="2"/><circle cx="24" cy="24" r="8.5" fill="#fff"/></svg>`;

type Props = {
  points: MapPoint[];
  // Optional initial fit. When omitted, fits to all points. Lets the overlay
  // render ALL cities but open zoomed to the one the user picked.
  focusBounds?: [number, number, number, number] | null;
  className?: string;
};

export function CityMap({ points, focusBounds, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupNodeRef = useRef<HTMLDivElement | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  const bySlug = useMemo(() => {
    const m = new Map<string, MapPoint>();
    for (const p of points) m.set(p.slug, p);
    return m;
  }, [points]);
  const data = useMemo(() => toFeatureCollection(points), [points]);
  const fit = useMemo(() => focusBounds ?? boundsOf(points), [focusBounds, points]);

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE_URL,
      center: [0, 20],
      zoom: 1,
      attributionControl: { compact: true },
      scrollZoom: false, // don't trap page scroll on embedded maps
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    popupNodeRef.current = document.createElement("div");
    popupRef.current = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "none",
      // No fixed anchor → MapLibre picks the side that keeps the popup inside
      // the map; the per-anchor offsets clear the pin.
      offset: POPUP_OFFSET as maplibregl.PopupOptions["offset"],
      className: "lsc-map-popup",
    }).setDOMContent(popupNodeRef.current);
    popupRef.current.on("close", () => setSelectedSlug(null));

    map.on("load", () => {
      map.resize();
      map.addSource("places", {
        type: "geojson",
        data,
        cluster: true,
        clusterRadius: 48,
        clusterMaxZoom: 13,
      });

      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": CORAL,
          "circle-opacity": 0.92,
          "circle-radius": ["step", ["get", "point_count"], 16, 10, 21, 50, 28],
          "circle-stroke-width": 3,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "places",
        filter: ["has", "point_count"],
        layout: { "text-field": ["get", "point_count_abbreviated"], "text-font": ["Noto Sans Bold"], "text-size": 13 },
        paint: { "text-color": "#ffffff" },
      });

      // Pin icon for unclustered points.
      const img = new window.Image(48, 62);
      img.onload = () => {
        if (!map.hasImage("lsc-pin")) map.addImage("lsc-pin", img);
        map.addLayer({
          id: "pins",
          type: "symbol",
          source: "places",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": "lsc-pin",
            "icon-size": 0.5,
            "icon-anchor": "bottom",
            "icon-allow-overlap": true,
          },
        });
        map.on("click", "pins", (ev) => {
          const feat = ev.features?.[0];
          if (!feat) return;
          const slug = feat.properties?.slug as string;
          const coords = (feat.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
          setSelectedSlug(slug);
          if (popupRef.current && popupNodeRef.current) {
            popupRef.current.setLngLat(coords).setDOMContent(popupNodeRef.current).addTo(map);
          }
        });
        map.on("mouseenter", "pins", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "pins", () => (map.getCanvas().style.cursor = ""));
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(PIN_SVG);

      if (fit) {
        const [w, s, e, n] = fit;
        if (w === e && s === n) {
          map.setCenter([w, s]);
          map.setZoom(14);
        } else {
          map.fitBounds([[w, s], [e, n]], { padding: 70, maxZoom: 15, duration: 0 });
        }
      }

      map.on("click", "clusters", async (ev) => {
        const feat = map.queryRenderedFeatures(ev.point, { layers: ["clusters"] })[0];
        const clusterId = feat?.properties?.cluster_id;
        const src = map.getSource("places") as maplibregl.GeoJSONSource;
        if (clusterId == null || !src) return;
        const zoom = await src.getClusterExpansionZoom(clusterId);
        map.easeTo({ center: (feat.geometry as GeoJSON.Point).coordinates as [number, number], zoom });
      });
      map.on("mouseenter", "clusters", () => (map.getCanvas().style.cursor = "pointer"));
      map.on("mouseleave", "clusters", () => (map.getCanvas().style.cursor = ""));
    });

    return () => {
      ro.disconnect();
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
    // Map initialized once per mount; props are stable per mounted map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = selectedSlug ? bySlug.get(selectedSlug) : undefined;

  return (
    <div className={className ?? "relative h-[440px] w-full overflow-hidden rounded-3xl border border-blush"}>
      <div ref={containerRef} className="h-full w-full" />
      {selected && popupNodeRef.current
        ? createPortal(<MapPlacePopup point={selected} />, popupNodeRef.current)
        : null}
    </div>
  );
}
