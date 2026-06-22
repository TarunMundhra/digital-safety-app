# Design Specification - Fraud Shield Map Split Integration

**Date:** 2026-06-22  
**Feature:** Split Layout for Citizen Fraud Shield with Interactive Leaflet Map  
**Status:** Approved by User  

---

## 1. Goal Description
The objective is to integrate the interactive Leaflet geospatial hotspots map directly into the **Fraud Shield** tab. This provides an analyst/citizen split view:
1. **Left Column (40% width)**: Paste transcript inputs and view threat risk analysis outputs in a scrollable sidebar.
2. **Right Column (60% width)**: Live Leaflet GIS map displaying real-time geographical threat points fetched from PostGIS.

The design uses a dark mode palette matching the platform theme.

---

## 2. Proposed Changes

### Frontend Component

#### [MODIFY] [shield-panel.tsx](file:///c:/Users/91934/Desktop/development/digitalSafety/frontend/src/components/shield/shield-panel.tsx)
- Import `leaflet/dist/leaflet.css` for Leaflet UI controls and tile displays.
- Import `MapContainer`, `TileLayer`, `CircleMarker`, and `Popup` from `react-leaflet`.
- Update the layout grid to split into a `grid-cols-1 lg:grid-cols-5` grid:
  - Left panel: `lg:col-span-2` containing input form and results within a `ScrollArea` of height `h-[calc(100vh-200px)]`.
  - Right panel: `lg:col-span-3` containing the `<MapContainer>` inside a matching dark border card.
- Set the map tile URL to CartoDB Dark Matter: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`.
- Query `/api/geo/hotspots?days=30` on mount to fetch geospatial scam telemetry.
- Render circular hotspot indicators dynamically scaled by report count.

---

## 3. Verification Plan

### Manual Verification
1. **Initial Load**: Visit the platform and open the Fraud Shield tab. Verify that the input form loads on the left and the dark map centered on India displays correctly on the right.
2. **Interactive Map**: Confirm that hotspot circles appear on the map and that clicking them triggers a popup showing city and report stats.
3. **AI Analysis**: Paste a mock digital arrest scam transcript and run the analysis. Check that the results card renders correctly below the input area and the sidebar is scrollable.
