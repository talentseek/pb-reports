# PLAN: Buzz Bingo (Group Nexus) Portfolio Proposal

## Goal
Build a password-protected, multi-revenue stream proposal dashboard for the Buzz Bingo portfolio (23 sites). This leverages the architecture established in the previous Nexus Locker Presentation but expands beyond just lockers to include EV Charging, Car Washes, and Farmers Markets.

## Strategic Enhancements
- **Dynamic Portfolios**: The system should now support multiple revenue "categories" toggleable on the map.
- **Unified Branding**: Hero section must feature the **ParkBunny - Group Nexus - Buzz Bingo** triple-brand identity.
- **Revenue Summary**: A header "Total Estimated Portfolio Uplift" card calculating the cumulative value of all selected sites/streams.

## Technical Plan

### 1. Data Structure
- **Data Source**: Create `public/buzz-bingo-sites.xlsx` containing:
  - Site Name
  - Postcode
  - Lat/Long (Pre-cached)
  - Interest Flags (Locker, EV, CarWash, Market)
  - Baseline Revenue (£50k)

### 2. New Route: `/buzzbingoproposal`
- **Password Gate**: Password `nexusbuzz2026`.
- **UI Components**:
  - **Site Map**: Leaflet view showing all 23 Buzz Bingo sites.
  - **Stream Toggles**: Sidebar to turn on/off layers (e.g., "Show Car Wash Potential Sites").
  - **Revenue Calculator**: Interactive table allowing Nexus to select sites and see real-time revenue projection.
  - **Visuals**: High-quality 3m locker rendering integrated into the "Locker Info" modal.

### 3. Pricing Logic (Updated)
- **Lockers**: Fixed at £900/year per unit (Portfolio total £18k+).
- **Waterless Car Wash**: Estimated £18k/year per site (for the 6 target sites).
- **Tesla/EV**: Baseline of £45k-£50k/year for 5 spaces (initially 3 sites).
- **Farmers Markets**: Tiered (£1k - £2.5k per day).

## Antigravity Prompt
See the final report for the prompt to trigger this build.
