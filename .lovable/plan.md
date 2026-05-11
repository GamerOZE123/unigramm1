## Goal

Turn the existing **Layers** strip in the Campus Map editor into a proper side directory of everything drawn inside the university's boundary — so you can scan all buildings / zones / paths / landmarks / restricted areas at a glance, toggle each one's visibility, and nudge a landmark's marker without redrawing it.

## What changes (admin editor only)

All work happens in `src/components/admin/campus-map/CampusMapEditor.tsx`. No DB schema changes — `shapes` JSONB already stores everything we need.

### 1. Group the list by type

Replace the flat list with collapsible groups in this order:

```text
🏛 Buildings (n)
🟦 Zones (n)
🚶 Paths (n)
📍 Landmarks (n)
⛔ Restricted (n)
```

Each row keeps the existing controls (select, reorder ↑/↓, hide 👁) and adds:
- A tiny color swatch from `style.strokeColor` for quick visual ID.
- For landmarks: the emoji icon next to the label.

### 2. "Inside boundary only" filter

A toggle at the top of the panel: **"Only show items inside boundary"**.

When ON and a boundary polygon exists, run a point-in-polygon check (ray-casting, no new dep) against `boundary_coordinates`:
- Landmark → test its single point.
- Polygon/polyline → test the centroid.

Items outside the boundary are shown dimmed under a collapsed **"Outside boundary"** group so nothing is lost.

### 3. Quick search

A small search input filters the list by `label` (case-insensitive) across all groups.

### 4. Nudge a marker (landmarks only)

When a landmark is selected, the Properties panel gets a 4-direction nudge pad:

```text
        ▲
    ◀  •  ▶
        ▼
```

Each press shifts `coordinates[0]` by a small delta (default ≈ 0.00002° ≈ 2 m). A step selector lets you switch between 1 m / 5 m / 20 m. Holding Shift uses the larger step.

Polygons/paths are not nudgeable here — those still use Leaflet's existing vertex-edit mode.

### 5. Bulk visibility

Each group header gets a single 👁 toggle that hides/shows all items in that group at once (sets `hidden` on every shape of that type).

### 6. Click-to-focus

Clicking a row already selects the shape. Add: also pan the Leaflet map to its centroid (use the existing `mapRef` and `map.panTo`). For landmarks, also bump the zoom to at least 18.

## Out of scope

- Mobile app rendering (the existing `shapes` payload is already complete; mobile can group by `type` on its side).
- Drag-to-move on the map itself (only nudge buttons in this pass).
- Renaming the saved DB shape order — `order` field still drives layering via the existing ↑/↓ buttons.

## Files touched

- `src/components/admin/campus-map/CampusMapEditor.tsx` — replace the Layers `<Section>` block (around lines 585–606), add the nudge pad inside the landmark properties block (around lines 557–578), add a small `pointInPolygon` helper.

No new packages, no migration, no edge-function changes.
