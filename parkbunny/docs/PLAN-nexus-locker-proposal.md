# PROPOSAL: Nexus Locker Presentation

## Goal
Create a password-protected, interactive presentation page for the "Nexus Portfolio" locker proposal. The page will display locker locations on a map, calculate dynamic pricing based on proximity to city centres, and present the data in a "visually pleasing" ParkBunny-branded interface.

## User Review Required
> [!IMPORTANT]
> **Dynamic Pricing Logic**: Distance is calculated between the *Site Postcode* and the *Named City Center* (geocoded via Nominatim).
> - Range: £1,600 (City Centre) <-> £900 (Far).
> - Formula: Linear decay or tiered?
> - **Proposal**: Linear interpolation.
>   - 0 miles = £1,600
>   - 5+ miles = £900 (Floor)
>   - *Note*: I will stick to a simple linear scale capped at 5 miles for the drop-off unless specified otherwise. This assumes "City Centre" value is high.

> [!NOTE]
> **Data Source**: `public/lockers.xlsx`.
> **Geocoding**: We will use `postcodes.io` for Site Postcodes and `Nominatim` for City Centers. To avoid slow rendering, we will cache these coordinates or fetch them server-side with aggressive caching (Next.js Data Cache).

## Proposed Changes

### Dependencies
- `xlsx`: To parse the Excel file.
- `leaflet` & `react-leaflet`: For the map.
- `geolib` (optional) or manual Haversine: For distance calc.

### New Route: `/nexuslockerproposal`
#### [NEW] [page.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/nexuslockerproposal/page.tsx)
- Server Component.
- Reads `public/lockers.xlsx`.
- Extracts unique Cities and Site Postcodes.
- Performs Geocoding (Bulk Postcode + Individual City).
- Calculates Distances & Prices.
- Passes clean data to the Client Component.

#### [NEW] [ClientProposal.tsx](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/app/nexuslockerproposal/ClientProposal.tsx)
- **Password Gate**: Simple input checking against `nexuspb2026`.
- **UI**:
  - Hero Section (ParkBunny branding, "Last Mile Logistic Lockers").
  - Map Section (Leaflet, standard OSM tiles).
  - Info Panel/List (Bottom).
  - Interactvity: Clicking list zooms map; Clicking map highlights list.

### Shared Lib
#### [NEW] [locker-logic.ts](file:///Users/mbeckett/Documents/codeprojects/pb-reports/parkbunny/src/lib/locker-logic.ts)
- Functions to parse Excel and perform pricing math.

## Verification Plan
### Automated Tests
- None planned for this rapid prototype.

### Manual Verification
1. **Password**: Access `/nexuslockerproposal`, try wrong/right password.
2. **Data Accuracy**: Check if ~10-20 sites load from Excel.
3. **Map**: Verify markers appear.
4. **Pricing**: Check if sites in "Leeds" are ~£1600 if postcode is central, and cheaper if outer.
