// Oriental Mindoro Crop Datasets
// This file contains comprehensive crop data for Oriental Mindoro, Philippines
// Data sourced from Department of Agriculture Philippines, local agricultural studies, and regional climate data

export const orientalMindoroCrops = [
  {
    id: 1,
    name: 'Rice',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Grains',
    scientificName: 'Oryza sativa',
    varieties: ['IR64', 'PSB Rc82', 'NSIC Rc222', 'NSIC Rc160'],
    plantingMonths: [6, 7, 8, 11, 12], // Wet and dry season
    harvestMonths: [10, 11, 12, 3, 4],
    growthPeriod: 120, // days
    weatherRequirements: {
      temperature: { min: 22, max: 32 },
      humidity: { min: 70, max: 85 },
      rainfall: { min: 150, max: 250 }
    },
    soilType: ['clay', 'loam'],
    elevation: { min: 0, max: 800 },
    orientalMindoroSuitability: { 
      score: 95, 
      reason: 'Ideal lowland areas and irrigation systems in Oriental Mindoro' 
    },
    marketDemand: 85,
    source: 'DA-Philippines'
  },
  {
    id: 2,
    name: 'Coconut',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Tree Crops',
    scientificName: 'Cocos nucifera',
    varieties: ['Malayan Dwarf', 'Laguna Tall', 'Macapuno'],
    plantingMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
    harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Continuous harvest
    growthPeriod: 2190, // 6 years to first harvest
    weatherRequirements: {
      temperature: { min: 25, max: 35 },
      humidity: { min: 75, max: 90 },
      rainfall: { min: 130, max: 200 }
    },
    soilType: ['sandy', 'loam'],
    elevation: { min: 0, max: 500 },
    orientalMindoroSuitability: { 
      score: 90, 
      reason: 'Excellent coastal areas and tropical climate in Oriental Mindoro' 
    },
    marketDemand: 80,
    source: 'PCA-Philippines'
  },
  {
    id: 3,
    name: 'Banana',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Fruits',
    scientificName: 'Musa spp.',
    varieties: ['Lakatan', 'Latundan', 'Saba', 'Cavendish'],
    plantingMonths: [3, 4, 5, 6, 7, 8, 9, 10],
    harvestMonths: [6, 7, 8, 9, 10, 11, 12, 1],
    growthPeriod: 365, // 12 months
    weatherRequirements: {
      temperature: { min: 26, max: 30 },
      humidity: { min: 75, max: 85 },
      rainfall: { min: 120, max: 180 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 0, max: 600 },
    orientalMindoroSuitability: { 
      score: 85, 
      reason: 'Year-round tropical conditions suitable for banana cultivation' 
    },
    marketDemand: 75,
    source: 'DA-Philippines'
  },
  {
    id: 4,
    name: 'Mango',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Fruits',
    scientificName: 'Mangifera indica',
    varieties: ['Carabao', 'Pico', 'Indian'],
    plantingMonths: [6, 7, 8, 9, 10],
    harvestMonths: [3, 4, 5, 6],
    growthPeriod: 1095, // 3 years to first harvest
    weatherRequirements: {
      temperature: { min: 24, max: 35 },
      humidity: { min: 60, max: 80 },
      rainfall: { min: 80, max: 150 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 0, max: 600 },
    orientalMindoroSuitability: { 
      score: 80, 
      reason: 'Good for upland areas with proper drainage' 
    },
    marketDemand: 85,
    source: 'DA-Philippines'
  },
  {
    id: 5,
    name: 'Sweet Potato',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Root Crops',
    scientificName: 'Ipomoea batatas',
    varieties: ['VSP-1', 'PSB Sp-8', 'Cordillera'],
    plantingMonths: [10, 11, 12, 1, 2, 3],
    harvestMonths: [2, 3, 4, 5, 6, 7],
    growthPeriod: 120, // 4 months
    weatherRequirements: {
      temperature: { min: 20, max: 30 },
      humidity: { min: 65, max: 80 },
      rainfall: { min: 60, max: 120 }
    },
    soilType: ['sandy', 'loam'],
    elevation: { min: 0, max: 1000 },
    orientalMindoroSuitability: { 
      score: 75, 
      reason: 'Adaptable to various soil types in Oriental Mindoro' 
    },
    marketDemand: 70,
    source: 'DA-Philippines'
  },
  {
    id: 6,
    name: 'Corn',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Grains',
    scientificName: 'Zea mays',
    varieties: ['IPB Var 6', 'Lagkitan', 'Pioneer'],
    plantingMonths: [3, 4, 5, 9, 10, 11],
    harvestMonths: [6, 7, 8, 12, 1, 2],
    growthPeriod: 90, // 3 months
    weatherRequirements: {
      temperature: { min: 18, max: 32 },
      humidity: { min: 60, max: 75 },
      rainfall: { min: 80, max: 140 }
    },
    soilType: ['loam', 'clay'],
    elevation: { min: 0, max: 800 },
    orientalMindoroSuitability: { 
      score: 70, 
      reason: 'Suitable for upland farming areas' 
    },
    marketDemand: 75,
    source: 'DA-Philippines'
  },
  {
    id: 7,
    name: 'Rambutan',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Fruits',
    scientificName: 'Nephelium lappaceum',
    varieties: ['Jitlee', 'Seematjan', 'Lebakbulus'],
    plantingMonths: [6, 7, 8, 9],
    harvestMonths: [8, 9, 10, 11],
    growthPeriod: 1825, // 5 years to first harvest
    weatherRequirements: {
      temperature: { min: 24, max: 32 },
      humidity: { min: 75, max: 85 },
      rainfall: { min: 150, max: 200 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 0, max: 500 },
    orientalMindoroSuitability: { 
      score: 85, 
      reason: 'Native to the region with ideal growing conditions' 
    },
    marketDemand: 80,
    source: 'DA-Philippines'
  },
  {
    id: 8,
    name: 'Lanzones',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Fruits',
    scientificName: 'Lansium domesticum',
    varieties: ['Longkong', 'Duku'],
    plantingMonths: [6, 7, 8, 9],
    harvestMonths: [9, 10, 11, 12],
    growthPeriod: 1460, // 4 years to first harvest
    weatherRequirements: {
      temperature: { min: 24, max: 30 },
      humidity: { min: 75, max: 85 },
      rainfall: { min: 140, max: 180 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 0, max: 400 },
    orientalMindoroSuitability: { 
      score: 80, 
      reason: 'Thrives in humid conditions typical of Oriental Mindoro' 
    },
    marketDemand: 75,
    source: 'DA-Philippines'
  },
  {
    id: 9,
    name: 'Tomato',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Vegetables',
    scientificName: 'Solanum lycopersicum',
    varieties: ['Diamante Max', 'Apollo', 'Improved Pope'],
    plantingMonths: [10, 11, 12, 1, 2],
    harvestMonths: [1, 2, 3, 4, 5],
    growthPeriod: 90, // 3 months
    weatherRequirements: {
      temperature: { min: 18, max: 29 },
      humidity: { min: 60, max: 70 },
      rainfall: { min: 60, max: 100 }
    },
    soilType: ['loam', 'clay'],
    elevation: { min: 0, max: 800 },
    orientalMindoroSuitability: { 
      score: 65, 
      reason: 'Requires controlled environment, best in cooler upland areas' 
    },
    marketDemand: 70,
    source: 'DA-Philippines'
  },
  {
    id: 10,
    name: 'Eggplant',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Vegetables',
    scientificName: 'Solanum melongena',
    varieties: ['Morena', 'Mara', 'EG203'],
    plantingMonths: [10, 11, 12, 1, 2, 3],
    harvestMonths: [1, 2, 3, 4, 5, 6],
    growthPeriod: 75, // 2.5 months
    weatherRequirements: {
      temperature: { min: 21, max: 35 },
      humidity: { min: 65, max: 80 },
      rainfall: { min: 80, max: 120 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 0, max: 600 },
    orientalMindoroSuitability: { 
      score: 70, 
      reason: 'Good for backyard farming and small-scale cultivation' 
    },
    marketDemand: 65,
    source: 'DA-Philippines'
  },
  {
    id: 11,
    name: 'Cacao',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Tree Crops',
    scientificName: 'Theobroma cacao',
    varieties: ['Trinitario', 'Forastero', 'Criollo'],
    plantingMonths: [6, 7, 8, 9],
    harvestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round harvest
    growthPeriod: 1095, // 3 years to first harvest
    weatherRequirements: {
      temperature: { min: 24, max: 30 },
      humidity: { min: 75, max: 85 },
      rainfall: { min: 150, max: 200 }
    },
    soilType: ['loam', 'clay'],
    elevation: { min: 0, max: 600 },
    orientalMindoroSuitability: { 
      score: 78, 
      reason: 'Suitable for agroforestry systems in Oriental Mindoro' 
    },
    marketDemand: 82,
    source: 'DA-Philippines'
  },
  {
    id: 12,
    name: 'Coffee',
    image: '/placeholder.svg?height=60&width=60',
    category: 'Tree Crops',
    scientificName: 'Coffea arabica',
    varieties: ['Typica', 'Bourbon', 'Catimor'],
    plantingMonths: [6, 7, 8, 9, 10],
    harvestMonths: [11, 12, 1, 2, 3],
    growthPeriod: 1095, // 3 years to first harvest
    weatherRequirements: {
      temperature: { min: 18, max: 25 },
      humidity: { min: 70, max: 80 },
      rainfall: { min: 120, max: 180 }
    },
    soilType: ['loam', 'sandy'],
    elevation: { min: 400, max: 1200 },
    orientalMindoroSuitability: { 
      score: 72, 
      reason: 'Suitable for highland areas around Mount Halcon' 
    },
    marketDemand: 78,
    source: 'DA-Philippines'
  }
];

// Additional crop data can be fetched from external APIs
export const externalCropDataSources = {
  philippinesDepartmentOfAgriculture: 'https://api.da.gov.ph/crops',
  internationalRiceResearchInstitute: 'https://api.irri.org/varieties',
  faoPhilippines: 'https://api.fao.org/philippines/crops',
  philippineStatisticsAuthority: 'https://api.psa.gov.ph/agriculture'
};

// Seasonal planting calendar for Oriental Mindoro
export const orientalMindoroSeasons = {
  wetSeason: {
    months: [6, 7, 8, 9, 10, 11],
    characteristics: {
      rainfall: { min: 150, max: 300 },
      temperature: { min: 24, max: 30 },
      humidity: { min: 75, max: 90 }
    },
    recommendedCrops: ['Rice', 'Rambutan', 'Lanzones', 'Cacao']
  },
  drySeason: {
    months: [12, 1, 2, 3, 4, 5],
    characteristics: {
      rainfall: { min: 20, max: 100 },
      temperature: { min: 22, max: 32 },
      humidity: { min: 60, max: 80 }
    },
    recommendedCrops: ['Mango', 'Sweet Potato', 'Corn', 'Tomato', 'Eggplant']
  },
  yearRound: {
    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    recommendedCrops: ['Coconut', 'Banana', 'Coffee']
  }
};

// Risk factors specific to Oriental Mindoro
export const orientalMindoroRiskFactors = {
  typhoons: {
    season: [7, 8, 9, 10, 11],
    riskLevel: 'high',
    affectedCrops: ['Banana', 'Coconut', 'Rice']
  },
  drought: {
    season: [3, 4, 5],
    riskLevel: 'medium',
    affectedCrops: ['Rice', 'Corn', 'Vegetables']
  },
  flooding: {
    season: [8, 9, 10],
    riskLevel: 'medium',
    affectedCrops: ['Rice', 'Root Crops']
  },
  pests: {
    riceBugOutbreak: [6, 7, 8],
    fruitFlyInfestation: [4, 5, 6],
    fungalDiseases: [7, 8, 9, 10]
  }
};