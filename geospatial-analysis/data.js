// ============================================================
//  GeoInsight Pro — Global + India Dataset
//  Regions: india-north, india-south, india-east, india-west,
//           apac, europe, americas, mea
// ============================================================

/* ---------- Active Store Locations ---------- */
const STORE_LOCATIONS = [
  // ── India – Metro / Tier-1 ──────────────────────────────────
  { id:  1, city: "Mumbai",       country: "India", lat:  19.0760, lng:  72.8777, revenue: 52000000, region: "india-west",  growth: 18, category: "flagship" },
  { id:  2, city: "Delhi NCR",    country: "India", lat:  28.6139, lng:  77.2090, revenue: 48000000, region: "india-north", growth: 22, category: "flagship" },
  { id:  3, city: "Bangalore",    country: "India", lat:  12.9716, lng:  77.5946, revenue: 61000000, region: "india-south", growth: 31, category: "flagship" },
  { id:  4, city: "Hyderabad",    country: "India", lat:  17.3850, lng:  78.4867, revenue: 38000000, region: "india-south", growth: 26, category: "standard" },
  { id:  5, city: "Chennai",      country: "India", lat:  13.0827, lng:  80.2707, revenue: 31000000, region: "india-south", growth: 20, category: "standard" },
  { id:  6, city: "Pune",         country: "India", lat:  18.5204, lng:  73.8567, revenue: 28000000, region: "india-west",  growth: 24, category: "standard" },
  { id:  7, city: "Kolkata",      country: "India", lat:  22.5726, lng:  88.3639, revenue: 22000000, region: "india-east",  growth: 12, category: "standard" },
  { id:  8, city: "Ahmedabad",    country: "India", lat:  23.0225, lng:  72.5714, revenue: 19500000, region: "india-west",  growth: 17, category: "standard" },
  { id:  9, city: "Jaipur",       country: "India", lat:  26.9124, lng:  75.7873, revenue: 14000000, region: "india-north", growth: 14, category: "standard" },
  { id: 10, city: "Kochi",        country: "India", lat:   9.9312, lng:  76.2673, revenue: 11000000, region: "india-south", growth: 19, category: "small"    },
  { id: 11, city: "Chandigarh",   country: "India", lat:  30.7333, lng:  76.7794, revenue:  9500000, region: "india-north", growth: 13, category: "small"    },
  { id: 12, city: "Surat",        country: "India", lat:  21.1702, lng:  72.8311, revenue:  8800000, region: "india-west",  growth: 16, category: "small"    },
  // ── Asia-Pacific ─────────────────────────────────────────────
  { id: 13, city: "Singapore",    country: "Singapore", lat:  1.3521, lng: 103.8198, revenue: 44000000, region: "apac",    growth: 11, category: "flagship" },
  { id: 14, city: "Tokyo",        country: "Japan",     lat: 35.6762, lng: 139.6503, revenue: 67000000, region: "apac",    growth:  7, category: "flagship" },
  { id: 15, city: "Sydney",       country: "Australia", lat:-33.8688, lng: 151.2093, revenue: 39000000, region: "apac",    growth:  9, category: "standard" },
  { id: 16, city: "Bangkok",      country: "Thailand",  lat: 13.7563, lng: 100.5018, revenue: 21000000, region: "apac",    growth: 18, category: "standard" },
  { id: 17, city: "Seoul",        country: "South Korea",lat:37.5665, lng: 126.9780, revenue: 41000000, region: "apac",    growth: 10, category: "flagship" },
  // ── Europe ───────────────────────────────────────────────────
  { id: 18, city: "London",       country: "UK",        lat: 51.5074, lng:  -0.1278, revenue: 72000000, region: "europe",  growth:  6, category: "flagship" },
  { id: 19, city: "Paris",        country: "France",    lat: 48.8566, lng:   2.3522, revenue: 58000000, region: "europe",  growth:  5, category: "flagship" },
  { id: 20, city: "Frankfurt",    country: "Germany",   lat: 50.1109, lng:   8.6821, revenue: 34000000, region: "europe",  growth:  8, category: "standard" },
  { id: 21, city: "Amsterdam",    country: "Netherlands",lat:52.3676, lng:   4.9041, revenue: 26000000, region: "europe",  growth:  9, category: "standard" },
  // ── Americas ─────────────────────────────────────────────────
  { id: 22, city: "New York",     country: "USA",       lat: 40.7128, lng: -74.0060, revenue: 88000000, region: "americas",growth: 10, category: "flagship" },
  { id: 23, city: "São Paulo",    country: "Brazil",    lat:-23.5505, lng: -46.6333, revenue: 31000000, region: "americas",growth: 15, category: "standard" },
  { id: 24, city: "Toronto",      country: "Canada",    lat: 43.6532, lng: -79.3832, revenue: 29000000, region: "americas",growth: 11, category: "standard" },
  // ── MEA ──────────────────────────────────────────────────────
  { id: 25, city: "Dubai",        country: "UAE",       lat: 25.2048, lng:  55.2708, revenue: 47000000, region: "mea",     growth: 23, category: "flagship" },
  { id: 26, city: "Nairobi",      country: "Kenya",     lat: -1.2921, lng:  36.8219, revenue: 12000000, region: "mea",     growth: 28, category: "small"    },
];

/* ---------- Expansion Opportunity Zones ---------- */
const EXPANSION_ZONES = [
  // ── India – Tier 2 High-Opportunity ──────────────────────────
  { id: 201, city: "Indore",           country: "India", lat: 22.7196, lng: 75.8577, demandScore: 91, presenceScore:  8, opportunityScore: 95, population: 3276697, medIncome: 310000,  growthRate: 29, region: "india-west",  currency: "INR", drivers: ["Fastest-growing Tier-2 city", "Strong FMCG demand", "IT/ITeS boom", "Young workforce"] },
  { id: 202, city: "Lucknow",          country: "India", lat: 26.8467, lng: 80.9462, demandScore: 88, presenceScore: 10, opportunityScore: 92, population: 3382000, medIncome: 290000,  growthRate: 24, region: "india-north", currency: "INR", drivers: ["State capital advantage", "Rising middle class", "Metro rail expansion", "Government schemes"] },
  { id: 203, city: "Nagpur",           country: "India", lat: 21.1458, lng: 79.0882, demandScore: 85, presenceScore:  7, opportunityScore: 89, population: 2497870, medIncome: 280000,  growthRate: 22, region: "india-west",  currency: "INR", drivers: ["Geographic center of India", "Smart City project", "Logistics hub", "MIHAN SEZ"] },
  { id: 204, city: "Coimbatore",       country: "India", lat: 11.0168, lng: 76.9558, demandScore: 84, presenceScore:  9, opportunityScore: 87, population: 2151466, medIncome: 320000,  growthRate: 20, region: "india-south", currency: "INR", drivers: ["Manchester of South India", "Textile & engineering hub", "Education cluster", "Growing IT corridor"] },
  { id: 205, city: "Bhopal",           country: "India", lat: 23.2599, lng: 77.4126, demandScore: 80, presenceScore:  6, opportunityScore: 85, population: 1883381, medIncome: 260000,  growthRate: 19, region: "india-west",  currency: "INR", drivers: ["State capital growth", "Smart City initiative", "Auto sector expansion", "Low competition"] },
  { id: 206, city: "Visakhapatnam",    country: "India", lat: 17.6868, lng: 83.2185, demandScore: 82, presenceScore: 11, opportunityScore: 83, population: 2035922, medIncome: 270000,  growthRate: 21, region: "india-east",  currency: "INR", drivers: ["Port city boom", "Steel & pharma hub", "New state capital proximity", "IT corridor growth"] },
  { id: 207, city: "Bhubaneswar",      country: "India", lat: 20.2961, lng: 85.8245, demandScore: 77, presenceScore:  5, opportunityScore: 82, population: 1006230, medIncome: 250000,  growthRate: 23, region: "india-east",  currency: "INR", drivers: ["Fastest-growing eastern city", "Smart City", "IT & startup ecosystem", "Low saturation"] },
  { id: 208, city: "Vadodara",         country: "India", lat: 22.3072, lng: 73.1812, demandScore: 78, presenceScore:  8, opportunityScore: 81, population: 2117491, medIncome: 295000,  growthRate: 18, region: "india-west",  currency: "INR", drivers: ["Industrial hub", "Defence corridor", "Petrochemical sector", "Growing retail demand"] },
  { id: 209, city: "Thiruvananthapuram",country:"India", lat:  8.5241, lng: 76.9366, demandScore: 74, presenceScore:  6, opportunityScore: 79, population:  957730, medIncome: 340000,  growthRate: 16, region: "india-south", currency: "INR", drivers: ["High literacy & income", "IT hub growth", "Tourism economy", "Gulf remittance market"] },
  { id: 210, city: "Patna",            country: "India", lat: 25.5941, lng: 85.1376, demandScore: 75, presenceScore:  4, opportunityScore: 78, population: 2046652, medIncome: 220000,  growthRate: 27, region: "india-east",  currency: "INR", drivers: ["Fastest-growing Bihar city", "PMAY housing demand", "Young demographics", "Underserved market"] },
  { id: 211, city: "Dehradun",         country: "India", lat: 30.3165, lng: 78.0322, demandScore: 72, presenceScore:  5, opportunityScore: 76, population:  803983, medIncome: 305000,  growthRate: 20, region: "india-north", currency: "INR", drivers: ["Uttarakhand capital", "Education hub", "Tourism gateway", "Growing affluent base"] },
  { id: 212, city: "Raipur",           country: "India", lat: 21.2514, lng: 81.6296, demandScore: 69, presenceScore:  3, opportunityScore: 74, population:  1010087,medIncome: 245000,  growthRate: 17, region: "india-east",  currency: "INR", drivers: ["Chhattisgarh capital", "Steel city", "Low retail penetration", "Infra build-out"] },
  // ── Global Expansion Targets ─────────────────────────────────
  { id: 213, city: "Ho Chi Minh City", country: "Vietnam",     lat: 10.8231, lng: 106.6297, demandScore: 89, presenceScore: 12, opportunityScore: 91, population: 9000000, medIncome: 6500,  growthRate: 34, region: "apac",    currency: "USD", drivers: ["Booming consumer class", "Young median age (30)", "E-commerce surge", "FDI gateway"] },
  { id: 214, city: "Jakarta",          country: "Indonesia",   lat: -6.2088, lng: 106.8456, demandScore: 87, presenceScore: 15, opportunityScore: 88, population:10770487, medIncome: 7200,  growthRate: 28, region: "apac",    currency: "USD", drivers: ["270M+ population market", "Rising middle class", "Digital economy growth", "ASEAN hub"] },
  { id: 215, city: "Manila",           country: "Philippines", lat: 14.5995, lng: 120.9842, demandScore: 83, presenceScore: 13, opportunityScore: 85, population: 1846700, medIncome: 5800,  growthRate: 25, region: "apac",    currency: "USD", drivers: ["BPO economy boom", "English-speaking market", "Strong remittance economy", "Young demographics"] },
  { id: 216, city: "Riyadh",           country: "Saudi Arabia",lat: 24.7136, lng:  46.6753, demandScore: 86, presenceScore: 18, opportunityScore: 84, population: 7600000, medIncome: 32000, growthRate: 19, region: "mea",    currency: "USD", drivers: ["Vision 2030 transformation", "High disposable income", "Tourism push", "Giga-project workforce"] },
  { id: 217, city: "Lagos",            country: "Nigeria",     lat:  6.5244, lng:   3.3792, demandScore: 82, presenceScore:  9, opportunityScore: 83, population:15400000, medIncome: 2100,  growthRate: 22, region: "mea",    currency: "USD", drivers: ["Africa's largest city", "Growing consumer class", "Fintech ecosystem", "Diaspora market"] },
  { id: 218, city: "Warsaw",           country: "Poland",      lat: 52.2297, lng:  21.0122, demandScore: 78, presenceScore: 14, opportunityScore: 79, population: 1794000, medIncome: 22000, growthRate: 15, region: "europe", currency: "USD", drivers: ["EU expansion hub", "Tech talent pool", "Lower operating costs", "Growing affluent class"] },
  { id: 219, city: "Mexico City",      country: "Mexico",      lat: 19.4326, lng: -99.1332, demandScore: 81, presenceScore: 16, opportunityScore: 80, population:21580000, medIncome: 12000, growthRate: 18, region: "americas",currency:"USD", drivers: ["Nearshoring boom", "Large consumer base", "US trade synergies", "Digital adoption surge"] },
  { id: 220, city: "Nairobi Suburbs",  country: "Kenya",       lat: -1.1717, lng:  36.9699, demandScore: 73, presenceScore:  4, opportunityScore: 77, population: 2500000, medIncome: 3800,  growthRate: 31, region: "mea",    currency: "USD", drivers: ["Tech hub of Africa", "Rapid urbanization", "M-Pesa financial inclusion", "Young demographics"] },
];

/* ---------- Regional Aggregates ---------- */
const REGIONAL_DATA = {
  labels:   ["India", "APAC", "Europe", "Americas", "MEA"],
  revenues: [342800000, 212000000, 190000000, 148000000, 59000000],
  colors:   ["#ff9340", "#00f5a0", "#4a9eff", "#a855f7", "#ffd93d"],
  stores:   [12, 5, 4, 3, 2],
};

/* ---------- Monthly Trend (12 months — real-shaped curves) ---------- */
const TREND_DATA = {
  "12m": {
    labels: ["Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar","Apr","May"],
    india:    [22.1, 23.4, 24.8, 26.1, 28.7, 30.2, 29.0, 27.5, 28.9, 31.4, 33.8, 34.3],
    apac:     [16.2, 16.8, 17.1, 17.5, 18.0, 18.6, 17.8, 17.2, 17.9, 18.5, 19.8, 21.2],
    europe:   [15.1, 14.9, 15.4, 15.8, 16.2, 17.0, 16.1, 14.8, 15.5, 16.2, 17.4, 19.0],
    americas: [11.2, 11.5, 11.8, 12.0, 12.4, 12.9, 12.1, 11.8, 12.3, 13.2, 14.1, 14.8],
    mea:      [ 3.8,  4.1,  4.3,  4.6,  4.9,  5.4,  5.8,  5.2,  5.5,  5.7,  5.9,  5.9],
  },
  "6m": {
    labels: ["Dec","Jan","Feb","Mar","Apr","May"],
    india:    [29.0, 27.5, 28.9, 31.4, 33.8, 34.3],
    apac:     [17.8, 17.2, 17.9, 18.5, 19.8, 21.2],
    europe:   [16.1, 14.8, 15.5, 16.2, 17.4, 19.0],
    americas: [12.1, 11.8, 12.3, 13.2, 14.1, 14.8],
    mea:      [ 5.8,  5.2,  5.5,  5.7,  5.9,  5.9],
  },
  "2y": {
    labels: ["Jun'24","Sep'24","Dec'24","Mar'25","Jun'25","Sep'25","Dec'25","Mar'26","Jun'26","Sep'26","Dec'26","Mar'27"],
    india:    [12.0, 14.5, 17.0, 19.8, 22.1, 25.6, 29.0, 31.4, 34.3, 36.8, 39.2, 42.5],
    apac:     [11.0, 12.3, 13.8, 15.0, 16.2, 17.4, 17.8, 18.5, 21.2, 22.8, 24.1, 25.5],
    europe:   [12.5, 13.1, 14.2, 14.8, 15.1, 15.9, 16.1, 16.2, 19.0, 20.1, 21.3, 22.0],
    americas: [ 8.5,  9.2,  9.8, 10.5, 11.2, 11.8, 12.1, 13.2, 14.8, 15.9, 16.7, 17.8],
    mea:      [ 1.8,  2.1,  2.5,  3.0,  3.8,  4.4,  5.8,  5.7,  5.9,  7.2,  8.1,  9.4],
  },
};

/* ---------- Heatmap Points [lat, lng, intensity] ---------- */
const HEATMAP_POINTS = [
  // India – major demand clusters
  [19.07, 72.88, 1.0],  [18.95, 72.82, 0.85], [19.20, 72.85, 0.78],  // Mumbai metro
  [28.61, 77.21, 0.95], [28.45, 77.03, 0.80], [28.70, 77.10, 0.82],  // Delhi NCR
  [28.52, 77.41, 0.75], [29.00, 77.50, 0.60],                         // NCR suburbs
  [12.97, 77.59, 0.98], [12.85, 77.65, 0.88], [13.10, 77.55, 0.82],  // Bangalore
  [17.39, 78.49, 0.90], [17.50, 78.40, 0.80],                         // Hyderabad
  [13.08, 80.27, 0.85], [13.00, 80.20, 0.75],                         // Chennai
  [18.52, 73.86, 0.88], [18.60, 73.78, 0.78],                         // Pune
  [22.57, 88.36, 0.80], [22.65, 88.40, 0.70],                         // Kolkata
  [23.02, 72.57, 0.78],                                                 // Ahmedabad
  [26.91, 75.79, 0.72],                                                 // Jaipur
  // India – Tier-2 expansion zones (high demand)
  [22.72, 75.86, 0.88], [22.65, 75.80, 0.80],  // Indore
  [26.85, 80.95, 0.85], [26.90, 80.88, 0.78],  // Lucknow
  [21.15, 79.09, 0.82],                          // Nagpur
  [11.02, 76.96, 0.80],                          // Coimbatore
  [23.26, 77.41, 0.79],                          // Bhopal
  [17.69, 83.22, 0.80], [17.75, 83.30, 0.72],  // Visakhapatnam
  [20.30, 85.82, 0.76],                          // Bhubaneswar
  [22.31, 73.18, 0.74],                          // Vadodara
  [ 8.52, 76.94, 0.70],                          // Thiruvananthapuram
  [25.59, 85.14, 0.72],                          // Patna
  [21.25, 81.63, 0.68],                          // Raipur
  [30.32, 78.03, 0.66],                          // Dehradun
  // Asia-Pacific
  [ 1.35, 103.82, 0.90], [ 1.28, 103.85, 0.80],  // Singapore
  [35.68, 139.65, 0.92], [35.70, 139.75, 0.82],  // Tokyo
  [-33.87, 151.21, 0.82], [-33.90, 151.18, 0.72], // Sydney
  [13.76, 100.50, 0.78],                           // Bangkok
  [37.57, 126.98, 0.85],                           // Seoul
  [10.82, 106.63, 0.88], [10.79, 106.70, 0.80],   // Ho Chi Minh City
  [-6.21, 106.85, 0.85], [-6.18, 106.82, 0.78],   // Jakarta
  [14.60, 120.98, 0.80],                           // Manila
  // Europe
  [51.51, -0.13, 0.92], [51.50, -0.08, 0.82],   // London
  [48.86,  2.35, 0.88],                           // Paris
  [50.11,  8.68, 0.75],                           // Frankfurt
  [52.37,  4.90, 0.72],                           // Amsterdam
  [52.23, 21.01, 0.75], [52.25, 21.05, 0.68],   // Warsaw
  // Americas
  [40.71, -74.01, 0.95], [40.75, -73.98, 0.88], // New York
  [-23.55, -46.63, 0.82], [-23.60, -46.65, 0.75], // São Paulo
  [43.65, -79.38, 0.78],                          // Toronto
  [19.43, -99.13, 0.82], [19.40, -99.15, 0.75],  // Mexico City
  // MEA
  [25.20, 55.27, 0.90], [25.15, 55.22, 0.80],   // Dubai
  [-1.29, 36.82, 0.72],                           // Nairobi
  [24.71, 46.68, 0.82], [24.68, 46.72, 0.74],   // Riyadh
  [ 6.52,  3.38, 0.75],                           // Lagos
];

/* ---------- Region map config ---------- */
const REGION_VIEW = {
  "all":          { center: [20.0, 77.0],  zoom: 3 },
  "india-north":  { center: [28.5, 77.5],  zoom: 6 },
  "india-south":  { center: [12.5, 78.0],  zoom: 6 },
  "india-east":   { center: [22.5, 85.0],  zoom: 6 },
  "india-west":   { center: [21.5, 73.5],  zoom: 6 },
  "apac":         { center: [15.0, 115.0], zoom: 4 },
  "europe":       { center: [51.0, 10.0],  zoom: 4 },
  "americas":     { center: [10.0, -75.0], zoom: 3 },
  "mea":          { center: [20.0, 40.0],  zoom: 4 },
};

/* ---------- Computed KPIs ---------- */
const KPI = {
  totalRevenue:      STORE_LOCATIONS.reduce((s, l) => s + l.revenue, 0),
  activeLocations:   STORE_LOCATIONS.length,
  expansionTargets:  EXPANSION_ZONES.length,
  marketCoverage:    62,
  avgGrowth:         Math.round(STORE_LOCATIONS.reduce((s, l) => s + l.growth, 0) / STORE_LOCATIONS.length),
};
