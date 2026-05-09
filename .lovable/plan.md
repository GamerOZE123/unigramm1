# Campus Map SVG Editor

A new admin-only page that lets admins trace a campus on a Leaflet dark map, draw buildings/zones/paths/landmarks/restricted areas + a campus boundary, and export everything as an SVG saved to Supabase. The mobile app then fetches `svg_content` and renders it with `react-native-svg`'s `SvgXml`.

## 1. Database (migration)

New table `campus_svg_data`:
- `university_id` (uuid, unique, FK to `universities`)
- `svg_content` (text)
- `shapes` (jsonb) — array of `{id, type, label, coordinates, style, order}`
- `boundary_coordinates` (jsonb)
- `center_lat`, `center_lng`, `zoom_level`
- `last_edited_by` (text), `last_edited_at`, `created_at`
- RLS: only admins (via existing `is_admin(auth.uid())` / `user_roles` pattern) can SELECT/INSERT/UPDATE/DELETE. Public read **disabled** here — the mobile app reads via an `anon`-allowed SELECT policy on `svg_content, boundary_coordinates, center_lat, center_lng, zoom_level, university_id` only? Simpler: allow `authenticated` SELECT for all rows so any logged-in app user can fetch their university's map. Admins do writes.

Activity log entry on save reuses existing admin activity log table (insert row `"Campus map updated for {uni} by {admin}"`).

## 2. Admin sidebar

Add `'campus_maps'` to `AdminSection` union and to the `nav` array in `src/components/admin/AdminSidebar.tsx` under group `Config` (icon: `MapIcon` already imported, use `Map` from lucide for distinction → use `MapPinned`). Add to `verify-admin` `ACTION_SECTION_MAP` if any new server actions are added (not needed — direct DB writes via RLS).

Wire into `src/pages/Admin.tsx` section switcher to render the new editor component when `current === 'campus_maps'`. Also add route `/admin/campus-maps` in `App.tsx` that mounts `Admin` with the section preselected (use query param or a new wrapper).

## 3. Dependencies

```
bun add leaflet react-leaflet leaflet-draw react-leaflet-draw @turf/turf
bun add -d @types/leaflet @types/leaflet-draw
```

Import `leaflet/dist/leaflet.css` and `leaflet-draw/dist/leaflet.draw.css` in the editor component.

## 4. New files

```
src/components/admin/campus-map/
  CampusMapEditor.tsx        # main page; layout + state
  EditorSidebar.tsx          # left 280px: tools, properties, layers, export
  MapCanvas.tsx              # react-leaflet MapContainer + draw + reference image overlay
  ToolPalette.tsx            # tool buttons + active highlight
  PropertiesPanel.tsx        # selected shape editor
  LayersPanel.tsx            # reorderable list, visibility toggle
  ExportPanel.tsx            # preview / copy / save / download
  PreviewModal.tsx           # 400x400 SVG preview with sample pins
  ReferenceImageOverlay.tsx  # Leaflet ImageOverlay with corner setter + opacity
  useEditorState.ts          # shapes[], selectedId, history (undo/redo), tool, boundary
  useKeyboardShortcuts.ts
  geoToSvg.ts                # projection helpers + SVG string builder
  styles.ts                  # tool color presets, default styles
src/pages/AdminCampusMaps.tsx  # thin wrapper that renders <CampusMapEditor /> inside admin shell
```

## 5. Editor behavior

State shape (in `useEditorState`):
```ts
type Shape = {
  id: string;
  type: 'building' | 'zone' | 'path' | 'landmark' | 'restricted';
  label: string;
  coordinates: [number, number][]; // [lat,lng]
  style: { fillColor; fillOpacity; strokeColor; strokeOpacity; strokeWidth; strokeDash };
  order: number;
  hidden?: boolean;
};
```

- Tool palette buttons set `activeTool`. `react-leaflet-draw` `EditControl` is configured per tool (polygon for building/zone/restricted, polyline for path, marker for landmark, polygon for boundary).
- On `created`, push shape into state with the right default style preset; clear active tool.
- Selection: clicking a rendered `Polygon`/`Polyline`/`Marker` sets `selectedId`; vertex editing via Leaflet's edit mode toggles per shape.
- Undo/redo: history stack of shape arrays, capped at 50.
- Keyboard shortcuts via `useKeyboardShortcuts`: V/B/Z/P/L/R, Delete, Ctrl+Z, Ctrl+Y, Ctrl+S, Esc.
- Coordinate tooltip: `useMapEvents({ mousemove })` updates a small monospace pill at bottom-left.
- Mobile warning: show top banner when `window.innerWidth < 768`.

## 6. Reference image overlay

- "Upload Reference Image" button reads file → `URL.createObjectURL`.
- Admin places it: button "Set NW corner" then "Set SE corner" → on next two map clicks captures latlngs → `<ImageOverlay url bounds opacity>`.
- Opacity slider 0–100. Stored only in component state.

## 7. SVG export

`geoToSvg.ts`:
- `getBounds(boundary, shapes)` — fall back to shapes' bbox if no boundary.
- `projectShape(shape, bounds, size=800)` returns SVG points string.
- `buildSvg({ shapes, boundary, size=800 })` returns string:
  ```
  <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
    <rect width=800 height=800 fill="#080c17"/>
    <g class="grid">…faint grid lines…</g>
    <path class="boundary" d=… stroke=#4f8eff stroke-dasharray="4 4" fill="none"/>
    {polygons / polylines / landmark diamonds in shape.order}
    {labels as <text>}
  </svg>
  ```
- "Copy SVG", "Download .svg" (Blob → download), "Save to Database" upserts `campus_svg_data` row; "Preview" renders the same string in `<div dangerouslySetInnerHTML>` inside `PreviewModal` with a few example student/event pins drawn as additional SVG overlays.

## 8. Loading existing data

On university select: `select * from campus_svg_data where university_id = …`. If row exists, hydrate `shapes`, `boundary`, center/zoom, and show "Last edited {ts} by {name}". Otherwise empty editor, center on university coords (fall back to SNU `28.4595, 77.4977`).

## 9. RN app integration

Documented only — no RN code in this repo. The mobile team will:
```ts
const { data } = await supabase.from('campus_svg_data')
  .select('svg_content, boundary_coordinates, center_lat, center_lng')
  .eq('university_id', uniId).single();
```
and render with `<SvgXml xml={data.svg_content} … />`. Pins overlay separately.

## 10. Verification

- Build passes (Vite typecheck via harness).
- Admin sidebar shows "Campus Maps"; route `/admin/campus-maps` opens editor.
- Drawing tools all create shapes with correct default styles.
- Save → row appears in `campus_svg_data`; reopening reloads shapes.
- Activity log row inserted on save.
- Mobile viewport shows the warning banner.

## Out of scope

- React Native code (this repo is web-only).
- Multi-floor / 3D buildings.
- Versioning history beyond `last_edited_at`.
