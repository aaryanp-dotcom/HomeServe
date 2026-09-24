const fs = require('fs');
const path = require('path');

const THEME_METADATA = {
  'scandinavian': {
    colorFamilies: ['white', 'grey', 'neutral', 'wood', 'green'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Bathroom', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'japandi': {
    colorFamilies: ['beige', 'cream', 'neutral', 'wood', 'green', 'black'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Villa']
  },
  'minimalist': {
    colorFamilies: ['white', 'black', 'grey', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Bathroom', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor']
  },
  'modern': {
    colorFamilies: ['white', 'grey', 'black', 'terracotta', 'green'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Bathroom'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Villa', 'Penthouse']
  },
  'contemporary': {
    colorFamilies: ['white', 'grey', 'blue', 'beige', 'pink'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'industrial': {
    colorFamilies: ['grey', 'black', 'brown', 'terracotta', 'orange'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Penthouse']
  },
  'luxury-modern': {
    colorFamilies: ['white', 'black', 'yellow', 'grey', 'blue'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Bathroom', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Penthouse']
  },
  'mid-century-modern': {
    colorFamilies: ['brown', 'green', 'yellow', 'orange', 'cream', 'wood'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'wabi-sabi': {
    colorFamilies: ['beige', 'earthy', 'brown', 'cream', 'neutral', 'grey'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Bathroom'],
    suitablePropertyTypes: ['Apartment', 'Independent House', 'Villa']
  },
  'zen': {
    colorFamilies: ['white', 'green', 'wood', 'neutral', 'beige'],
    roomCategories: ['Living Room', 'Bedroom', 'Home Office', 'Pooja Room'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'rustic': {
    colorFamilies: ['brown', 'wood', 'earthy', 'terracotta', 'beige'],
    roomCategories: ['Living Room', 'Dining', 'Kitchen', 'Bedroom'],
    suitablePropertyTypes: ['Independent House', 'Villa', 'Builder Floor']
  },
  'farmhouse': {
    colorFamilies: ['white', 'cream', 'wood', 'black', 'neutral'],
    roomCategories: ['Living Room', 'Dining', 'Kitchen', 'Home Office', 'Bedroom'],
    suitablePropertyTypes: ['Independent House', 'Villa', 'Builder Floor']
  },
  'bohemian': {
    colorFamilies: ['orange', 'yellow', 'terracotta', 'red', 'pink', 'earthy'],
    roomCategories: ['Living Room', 'Bedroom', 'Balcony', 'Dining'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor']
  },
  'mediterranean': {
    colorFamilies: ['white', 'blue', 'terracotta', 'yellow', 'earthy'],
    roomCategories: ['Living Room', 'Dining', 'Balcony', 'Kitchen'],
    suitablePropertyTypes: ['Villa', 'Independent House', 'Penthouse']
  },
  'coastal': {
    colorFamilies: ['blue', 'white', 'beige', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Balcony'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Penthouse']
  },
  'tropical': {
    colorFamilies: ['green', 'wood', 'yellow', 'earthy', 'white'],
    roomCategories: ['Living Room', 'Bedroom', 'Balcony', 'Dining'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Independent House']
  },
  'traditional-indian': {
    colorFamilies: ['red', 'yellow', 'blue', 'cream', 'terracotta', 'earthy', 'wood'],
    roomCategories: ['Living Room', 'Bedroom', 'Pooja Room', 'Dining', 'Kitchen'],
    suitablePropertyTypes: ['Independent House', 'Villa', 'Builder Floor', 'Apartment']
  },
  'neo-classical': {
    colorFamilies: ['cream', 'white', 'yellow', 'blue', 'green'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Bathroom'],
    suitablePropertyTypes: ['Villa', 'Independent House', 'Penthouse']
  },
  'art-deco': {
    colorFamilies: ['black', 'yellow', 'green', 'red', 'cream'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen'],
    suitablePropertyTypes: ['Apartment', 'Penthouse', 'Builder Floor']
  },
  'french-country': {
    colorFamilies: ['cream', 'blue', 'yellow', 'white', 'neutral'],
    roomCategories: ['Living Room', 'Dining', 'Kitchen', 'Bedroom'],
    suitablePropertyTypes: ['Villa', 'Independent House', 'Builder Floor']
  },
  'moroccan': {
    colorFamilies: ['terracotta', 'blue', 'orange', 'red', 'yellow', 'earthy'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Balcony'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Independent House']
  },
  'urban-loft': {
    colorFamilies: ['grey', 'black', 'brown', 'terracotta', 'red'],
    roomCategories: ['Living Room', 'Kitchen', 'Dining', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Penthouse', 'Builder Floor']
  },
  'california-modern': {
    colorFamilies: ['white', 'beige', 'wood', 'green', 'neutral'],
    roomCategories: ['Living Room', 'Dining', 'Bathroom', 'Kitchen'],
    suitablePropertyTypes: ['Villa', 'Independent House', 'Apartment']
  },
  'nordic-luxury': {
    colorFamilies: ['white', 'grey', 'cream', 'wood', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Bathroom'],
    suitablePropertyTypes: ['Apartment', 'Penthouse', 'Builder Floor']
  },
  'contemporary-indian': {
    colorFamilies: ['terracotta', 'white', 'blue', 'yellow', 'wood', 'earthy'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Home Office', 'Pooja Room'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House', 'Villa']
  },
  'sustainable': {
    colorFamilies: ['green', 'earthy', 'brown', 'wood', 'neutral', 'white'],
    roomCategories: ['Living Room', 'Dining', 'Bedroom', 'Kitchen'],
    suitablePropertyTypes: ['Apartment', 'Independent House', 'Villa']
  },
  'smart-home': {
    colorFamilies: ['black', 'grey', 'white', 'blue', 'neutral'],
    roomCategories: ['Living Room', 'Kitchen', 'Bedroom', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Penthouse', 'Villa']
  },
  'monochrome': {
    colorFamilies: ['black', 'white', 'grey'],
    roomCategories: ['Living Room', 'Kitchen', 'Dining', 'Bedroom'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Penthouse']
  },
  'earthy-organic': {
    colorFamilies: ['earthy', 'brown', 'terracotta', 'beige', 'green', 'wood'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Bathroom'],
    suitablePropertyTypes: ['Apartment', 'Independent House', 'Villa']
  },
  'warm-minimalism': {
    colorFamilies: ['beige', 'cream', 'neutral', 'wood', 'white', 'earthy'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Kitchen'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'dark-luxury': {
    colorFamilies: ['black', 'grey', 'brown', 'yellow', 'purple'],
    roomCategories: ['Living Room', 'Bedroom', 'Home Office', 'Bathroom'],
    suitablePropertyTypes: ['Apartment', 'Penthouse', 'Villa']
  },
  'soft-luxury': {
    colorFamilies: ['pink', 'cream', 'white', 'beige', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Bathroom', 'Dining', 'Kitchen'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Villa']
  },
  'vintage': {
    colorFamilies: ['brown', 'green', 'yellow', 'red', 'cream', 'wood'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House']
  },
  'cottage': {
    colorFamilies: ['white', 'pink', 'green', 'cream', 'yellow'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom'],
    suitablePropertyTypes: ['Independent House', 'Villa', 'Builder Floor']
  },
  'bali-inspired': {
    colorFamilies: ['wood', 'green', 'earthy', 'brown', 'neutral', 'beige'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Dining', 'Balcony'],
    suitablePropertyTypes: ['Villa', 'Independent House', 'Apartment']
  },
  'eclectic': {
    colorFamilies: ['yellow', 'blue', 'red', 'green', 'pink', 'orange'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor']
  },
  'transitional': {
    colorFamilies: ['white', 'grey', 'beige', 'blue', 'wood', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Dining'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House', 'Villa']
  },
  'hotel-inspired': {
    colorFamilies: ['white', 'grey', 'beige', 'yellow', 'black', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Bathroom', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Penthouse', 'Villa']
  }
};

const INDIAN_NEW_THEMES = [
  {
    slug: 'modern-indian-luxury',
    name: 'Modern Indian Luxury',
    tagline: 'Regal Indian materiality meets Italian minimalist proportions',
    description: 'Modern Indian Luxury pairs fine Indian stone, fluted champagne brass, bespoke teak joinery, and rich jewel velvet tones with sleek contemporary silhouettes. Designed for discerning homeowners across Delhi NCR looking for refined opulence.',
    coverImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=900&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=900&q=80',
      'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=900&q=80',
      'https://images.unsplash.com/photo-1745429523617-0d837856ca35?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'luxury', 'brass', 'marble', 'teak', 'delhi-ncr', 'regal', 'contemporary'],
    collections: ['luxury-collection', 'editors-picks', 'trending', 'villas', 'premium-homes'],
    colorFamilies: ['yellow', 'cream', 'blue', 'terracotta', 'neutral', 'wood'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Pooja Room', 'Home Office'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Builder Floor', 'Penthouse'],
    budget: { basic: '₹18–28 L', premium: '₹28–45 L', luxury: '₹45–80 L', ultraLuxury: '₹80 L+' },
    estimatedTimeline: '10–16 weeks',
    colors: [
      { name: 'Imperial Champagne', hex: '#E5D3B3', paint: 'Asian Paints Imperial Gold', family: 'cream' },
      { name: 'Royal Peacock', hex: '#1B4B66', paint: 'Asian Paints Peacock Blue', family: 'blue' },
      { name: 'Sandalwood Ochre', hex: '#C68B45', paint: 'Dulux Golden Ochre', family: 'yellow' },
      { name: 'Makrana Ivory', hex: '#F9F7F2', paint: 'Berger Makrana Pearl', family: 'white' },
      { name: 'Deep Teak', hex: '#4A2E1B', paint: 'Nippon Dark Walnut', family: 'brown' }
    ],
    materials: ['Indian statuario marble', 'Champagne fluted brass', 'Burma teak veneer', 'Silk-velvet upholstery', 'Hand-knotted Mirzapur rug', 'Smoked mirror glass'],
    furniture: ['Curved jewel-tone sofa with brass plinth', 'Book-matched marble dining table with brass inlay', 'Bespoke pooja unit with backlit brass jali', 'Low-profile teak platform bed with fluted leather headboard', 'Minimalist brass console'],
    lighting: ['Sculptural brass branch chandelier', 'Concealed 3000K warm LED cove profiles', 'Handmade brass wall sconces', 'Backlit onyx pooja panel'],
    rooms: [],
    philosophy: 'True luxury in the modern Indian home is rooted in bespoke craftsmanship and authentic material depth rather than superfluous ornamentation. It honours our heritage while embracing clean international spatial flow.',
    history: 'Rooted in the design evolution of contemporary metropolitan Indian architecture, where global luxury finishes harmonise with indigenous stone, woodcraft, and metallic accents.',
    keyCharacteristics: ['Book-matched marble feature walls', 'Champagne brass profiles and inlay', 'Backlit modern jaali accents', 'Jewel-toned tactile fabrics', 'Integrated modern mandir/pooja alcove', 'Warm architectural lighting (3000K)'],
    bestFor: ['Luxury 3BHK/4BHK apartments in Gurgaon & Noida', 'Builder floors in South Delhi', 'Independent villas', 'Homeowners seeking premium understated opulence'],
    pros: ['High perceived visual value', 'Timeless cultural resonance', 'Seamless modern living', 'Strong appreciation & resale value'],
    cons: ['Requires master craftsmen for brass & stone inlay', 'Higher material investment', 'Requires regular maintenance of natural stone'],
    maintenance: 'Medium-High — marble surfaces require periodic pH-neutral sealing; brass accents need microfiber buffing.',
    similarThemes: ['contemporary-indian', 'luxury-modern', 'traditional-indian', 'hotel-inspired'],
    roomCount: 6,
    isTrending: true,
    isEditorPick: true,
    isNew: true
  },
  {
    slug: 'warm-indian-earth',
    name: 'Warm Indian Earth',
    tagline: 'Terracotta, handloom linens, natural wood, and sunlit courtyard warmth',
    description: 'Warm Indian Earth draws inspiration from vernacular Indian homes with terracotta clay tones, unpolished stone, handwoven jute, cane weaves, and sun-drenched earth pigments for a deeply comforting sanctuary.',
    coverImage: 'https://images.unsplash.com/photo-1712762139331-e29753380de3?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1712762139331-e29753380de3?w=900&q=80',
      'https://images.unsplash.com/photo-1685257814432-9cdc23a1119c?w=900&q=80',
      'https://images.unsplash.com/photo-1745429523617-0d837856ca35?w=900&q=80',
      'https://images.unsplash.com/photo-1682662046426-f7589013d25e?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'terracotta', 'earthy', 'handloom', 'natural', 'warm', 'cane'],
    collections: ['eco-friendly', 'trending', 'family-homes', 'editors-picks'],
    colorFamilies: ['terracotta', 'brown', 'earthy', 'beige', 'wood', 'green'],
    roomCategories: ['Living Room', 'Bedroom', 'Balcony', 'Dining', 'Pooja Room'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House', 'Villa'],
    budget: { basic: '₹8–14 L', premium: '₹14–22 L', luxury: '₹22–38 L', ultraLuxury: '₹38 L+' },
    estimatedTimeline: '7–11 weeks',
    colors: [
      { name: 'Kutch Terracotta', hex: '#C25E3E', paint: 'Asian Paints Terracotta Joy', family: 'terracotta' },
      { name: 'Raw Lime Plaster', hex: '#EFE7DA', paint: 'Dulux Lime Wash', family: 'cream' },
      { name: 'Mustard Ochre', hex: '#D99B26', paint: 'Berger Golden Clay', family: 'yellow' },
      { name: 'Deep Teak Brown', hex: '#5A3D28', paint: 'Nippon Earth Bark', family: 'brown' },
      { name: 'Foliage Green', hex: '#587052', paint: 'Asian Paints Betel Green', family: 'green' }
    ],
    materials: ['Handmade terracotta tiles', 'Lime plaster wall finishes', 'Reclaimed teak wood', 'Natural cane and wicker', 'Organic khadi and handloom cotton', 'Brass and clay planters'],
    furniture: ['Cane-back low lounge chairs', 'Solid teak dining table with organic edge', 'Hand-knotted jute floor rugs', 'Carved wooden chest (peti) coffee table', 'Minimalist teak platform bed'],
    lighting: ['Hand-thrown clay pendant fixtures', 'Warm ambient rattan floor lights', 'Soft cove lighting', 'Brass oil lamp (diya) niches'],
    rooms: [],
    philosophy: 'Living close to the earth fosters peace and grounded well-being. By embracing raw textures, breathing lime plasters, and natural clay, the home becomes a tranquil retreat from urban chaos.',
    history: 'Derived from ancient Indian courtyard architecture and vernacular design traditions across Gujarat, Rajasthan, and Kerala, reimagined for contemporary urban apartments.',
    keyCharacteristics: ['Terracotta and burnt clay accents', 'Breathable lime plaster finishes', 'Natural cane and wicker cabinetry', 'Indoor ficus and areca greens', 'Handcrafted ceramic decor', 'Warm organic textures throughout'],
    bestFor: ['Urban apartments seeking warmth', 'Eco-conscious homeowners', 'Families who appreciate natural materials', 'Compact and medium Delhi NCR flats'],
    pros: ['Extremely calming and cozy', 'Sustainable natural materials', 'Ages with beautiful organic patina', 'Cost-effective material options'],
    cons: ['Terracotta requires gentle cleaning', 'Natural cane needs care against direct monsoon moisture'],
    maintenance: 'Low-Medium — dust cane elements regularly; wipe terracotta with mild natural soap solutions.',
    similarThemes: ['earthy-organic', 'wabi-sabi', 'contemporary-indian', 'bali-inspired'],
    roomCount: 5,
    isTrending: true,
    isEditorPick: true,
    isNew: true
  },
  {
    slug: 'heritage-colonial-indian',
    name: 'Heritage Colonial Indian',
    tagline: 'High ceilings, louvered teak doors, vintage brass, and timeless Anglo-Indian grace',
    description: 'Heritage Colonial Indian celebrates the historic charm of colonial bungalows and havelis. Louvered teak doors, checkered marble or terrazzo floors, four-poster beds, vintage brass hardware, and arched transitions create an atmosphere of storied elegance.',
    coverImage: 'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=900&q=80',
      'https://images.unsplash.com/photo-1779019383502-8ef015ba0647?w=900&q=80',
      'https://images.unsplash.com/photo-1740989488591-55648f155236?w=900&q=80',
      'https://images.unsplash.com/photo-1654028132164-a2ff2d88ea3e?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'heritage', 'colonial', 'vintage', 'four-poster', 'brass', 'classic'],
    collections: ['luxury-collection', 'villas', 'most-saved', 'editors-picks'],
    colorFamilies: ['white', 'black', 'green', 'wood', 'cream', 'brown'],
    roomCategories: ['Living Room', 'Bedroom', 'Dining', 'Home Office', 'Balcony'],
    suitablePropertyTypes: ['Independent House', 'Villa', 'Builder Floor'],
    budget: { basic: '₹14–22 L', premium: '₹22–36 L', luxury: '₹36–65 L', ultraLuxury: '₹65 L+' },
    estimatedTimeline: '9–15 weeks',
    colors: [
      { name: 'Colonial Cream', hex: '#FAF6ED', paint: 'Asian Paints Chiffon Cream', family: 'cream' },
      { name: 'Regal Dark Walnut', hex: '#3B271A', paint: 'Dulux Rich Walnut', family: 'brown' },
      { name: 'Bottle Green', hex: '#1C3E2D', paint: 'Berger British Racing Green', family: 'green' },
      { name: 'Antique Brass', hex: '#B89742', paint: 'Asian Paints Brass Antique', family: 'yellow' },
      { name: 'Checkerboard Noir', hex: '#1C1C1C', paint: 'Nippon Jet Black', family: 'black' }
    ],
    materials: ['Solid Sheesham and teak wood', 'Black and white checkerboard marble', 'Cane-woven bed panels', 'Antique brass handles and latches', 'Louvered window shutters', 'Hand-printed botanical textiles'],
    furniture: ['Colonial four-poster teak bed', 'Planters easy chair with extendable armrests', 'Louvered wardrobe cabinets', 'Curved pedestal dining table with balloon-back chairs', 'Roll-top bureau desk'],
    lighting: ['Pendant milk glass schoolhouse globes', 'Antique brass nautical sconces', 'Warm Edison multi-arm ceiling fans with lights', 'Fabric-shade table lamps'],
    rooms: [],
    philosophy: 'Heritage design honors the narrative of architectural continuity. Every piece feels collected over generations, grounding the home in timeless poise and gracious hospitality.',
    history: 'Developed during the late 19th and early 20th centuries in India, combining British neoclassical furniture proportions with indigenous tropical woods and artisanal Indian carpentry techniques.',
    keyCharacteristics: ['Louvered doors and window shutters', 'Checkerboard or patterned floor borders', 'Carved four-poster beds', 'Antique brass hardware', 'Botanical artwork and framed heritage prints', 'Arched doorways and high skirtings'],
    bestFor: ['Independent houses & bungalows in Delhi NCR', 'Spacious floorplans with high ceilings', 'Lovers of vintage, colonial, and antique aesthetics'],
    pros: ['Distinctive architectural personality', 'High durability of solid hardwoods', 'Immense character and emotional depth', 'Never looks dated'],
    cons: ['Requires dedicated carpenter craftsmanship', 'Darker woods need good natural lighting to balance space'],
    maintenance: 'Medium — wood surfaces benefit from bi-annual beeswax polishing; brass hardware needs periodic dry wiping.',
    similarThemes: ['traditional-indian', 'vintage', 'french-country', 'transitional'],
    roomCount: 5,
    isTrending: false,
    isEditorPick: true,
    isNew: true
  },
  {
    slug: 'south-indian-contemporary',
    name: 'South Indian Contemporary',
    tagline: 'Chettinad woodwork, brass thooku vilakku, oxide finishes, and airy verandas',
    description: 'South Indian Contemporary harmoniously combines Chettinad architectural grandeur and Kerala courtyard serenity with contemporary uncluttered planning. Features rich rosewood accents, Athangudi-inspired tiles, soft oxide walls, and brass bell motifs.',
    coverImage: 'https://images.unsplash.com/photo-1682662046457-74fd5b199b92?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1682662046457-74fd5b199b92?w=900&q=80',
      'https://images.unsplash.com/photo-1745429523617-0d837856ca35?w=900&q=80',
      'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=900&q=80',
      'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'south-indian', 'chettinad', 'kerala', 'brass', 'wood', 'oxide'],
    collections: ['editors-picks', 'trending', 'villas', 'family-homes'],
    colorFamilies: ['yellow', 'red', 'wood', 'cream', 'terracotta', 'green'],
    roomCategories: ['Living Room', 'Dining', 'Pooja Room', 'Bedroom', 'Balcony'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House', 'Villa'],
    budget: { basic: '₹12–18 L', premium: '₹18–30 L', luxury: '₹30–55 L', ultraLuxury: '₹55 L+' },
    estimatedTimeline: '8–14 weeks',
    colors: [
      { name: 'Temple Ochre', hex: '#D2912B', paint: 'Asian Paints Temple Bell', family: 'yellow' },
      { name: 'Chettinad Oxide Red', hex: '#8C2D19', paint: 'Dulux Crimson Oxide', family: 'red' },
      { name: 'Coconut Shell Brown', hex: '#4B3320', paint: 'Berger Coffee Bean', family: 'brown' },
      { name: 'Cardamom Green', hex: '#637956', paint: 'Asian Paints Cardamom', family: 'green' },
      { name: 'Warm Jasmine White', hex: '#FDF9F0', paint: 'Nippon Jasmine Soft', family: 'white' }
    ],
    materials: ['Polished red oxide or microtopping', 'Athangudi patterned tile inlays', 'Pillared rosewood or teak frames', 'Spun bell-metal brass fixtures', 'Tanjore art frames', 'Coir and cotton upholstery'],
    furniture: ['Chettinad carved wooden pillar console', 'Low-height wooden swing (Oonjal) with brass chains', 'Solid wood diwan with bolsters', 'Minimalist brass pooja mandapam', 'Slatted wood dining bench'],
    lighting: ['Hanging brass temple oil lamps (Thooku Vilakku) with LED inserts', 'Warm beam spotlights highlighting woodwork', 'Handmade brass wall sconces', 'Backlit wood jaali'],
    rooms: [],
    philosophy: 'Rooted in the Dravidian tradition of proportion and spiritual harmony, this style invites natural ventilation, honest materials, and serene spaces meant for family togetherness.',
    history: 'Draws from the maritime trading mansions of Chettinad and the timber-framed Nalukettu homes of Kerala, adapting their majestic wooden pillars and vibrant floor tiles into sleek modern apartments.',
    keyCharacteristics: ['Brass hanging lamps with warm glows', 'Handcrafted Athangudi border tiles', 'Pillared wooden transitions or consoles', 'Traditional swing (Oonjal) integration', 'Custom brass pooja unit', 'Warm oxide and timber contrasts'],
    bestFor: ['Homeowners wanting authentic regional Indian charm', 'Apartments and villas in Delhi NCR', 'Spacious living rooms and dedicated pooja spaces'],
    pros: ['Immense cultural pride and character', 'Brass elements bring warmth and prosperity', 'Highly durable solid wood and oxide surfaces', 'Stunning conversation starter'],
    cons: ['Athangudi tiles and brass require authentic sourcing', 'Wood requires protection from extreme dry heat in Delhi winters'],
    maintenance: 'Medium — periodic brass polishing; wipe timber surfaces with conditioning oil every few months.',
    similarThemes: ['contemporary-indian', 'traditional-indian', 'warm-indian-earth', 'rustic'],
    roomCount: 5,
    isTrending: true,
    isEditorPick: true,
    isNew: true
  },
  {
    slug: 'rajasthani-haveli-revival',
    name: 'Rajasthani Haveli Revival',
    tagline: 'Jharokha arches, Jodhpur blue accents, Thikri mirrorwork, and sand stone serenity',
    description: 'Rajasthani Haveli Revival captures the royal romanticism of Jaipur and Jodhpur palaces in a fresh, contemporary format. Intricate Thikri glass inlay, sandstone wall panels, arched niches, and indigo pops blend with clean modern furnishings.',
    coverImage: 'https://images.unsplash.com/photo-1745429523617-0d837856ca35?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1745429523617-0d837856ca35?w=900&q=80',
      'https://images.unsplash.com/photo-1787390629829-abb32b3025c5?w=900&q=80',
      'https://images.unsplash.com/photo-1682662046426-f7589013d25e?w=900&q=80',
      'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'rajasthani', 'haveli', 'thikri', 'jharokha', 'stone', 'blue', 'jaipur'],
    collections: ['luxury-collection', 'villas', 'most-saved', 'editors-picks'],
    colorFamilies: ['blue', 'yellow', 'terracotta', 'cream', 'red', 'neutral'],
    roomCategories: ['Living Room', 'Bedroom', 'Pooja Room', 'Dining', 'Balcony'],
    suitablePropertyTypes: ['Apartment', 'Villa', 'Builder Floor', 'Penthouse'],
    budget: { basic: '₹15–24 L', premium: '₹24–38 L', luxury: '₹38–68 L', ultraLuxury: '₹68 L+' },
    estimatedTimeline: '9–15 weeks',
    colors: [
      { name: 'Jodhpur Royal Indigo', hex: '#1C3B68', paint: 'Asian Paints Royal Indigo', family: 'blue' },
      { name: 'Dholpur Sandstone', hex: '#D8C3A5', paint: 'Dulux Desert Sand', family: 'beige' },
      { name: 'Jaipur Terracotta Pink', hex: '#C67462', paint: 'Berger Jaipur Pink', family: 'pink' },
      { name: 'Marwar Marigold', hex: '#EAA32E', paint: 'Asian Paints Marigold', family: 'yellow' },
      { name: 'Pristine Haveli White', hex: '#FAF7F0', paint: 'Nippon Pearl Shell', family: 'white' }
    ],
    materials: ['Dholpur and Jaisalmer carved sandstone', 'Thikri hand-cut mirror glass art', 'Carved Sheesham wood', 'Block-printed cotton and silk drapes', 'Brass and bone inlay accents', 'Hand-knotted woolen carpet'],
    furniture: ['Jharokha-inspired arched wall mirror', 'Carved Sheesham low diwan with zardozi cushions', 'Bone-inlay accent coffee table', 'Handcrafted pooja alcove with brass bells', 'Upholstered high-back bedroom headboard with Jaipur motif'],
    lighting: ['Pierced brass Moroccan/Rajasthani filigree lanterns', 'Concealed LED uplights illuminating arched niches', 'Warm 2700K ambient chandelier', 'Fairy niches with warm accent diodes'],
    rooms: [],
    philosophy: 'Palatial grandeur when balanced with clean lines creates a deeply hospitable, royal sanctuary that honors North India’s greatest architectural craftsmanship.',
    history: 'Originating from the merchant havelis of Shekhawati and royal palaces of Jaipur, Marwar, and Mewar, adapted with lighter materials and clean contemporary spacing.',
    keyCharacteristics: ['Arched niche architecture (Mehrab)', 'Subtle Thikri mirror art feature panels', 'Dholpur sandstone feature wall or cladding', 'Rich indigo and marigold textile accents', 'Hand-cut brass lanterns casting intricate shadow patterns'],
    bestFor: ['Delhi NCR homes wanting rich cultural storytelling', 'Villa living rooms & grand entry foyers', 'Homeowners wanting high-impact accent spaces'],
    pros: ['Magnificent artistic atmosphere', 'Handcrafted Thikri mirrorwork catches ambient light brilliantly', 'Deeply celebrated North Indian aesthetic'],
    cons: ['Thikri and carved stone require authentic master artisans', 'Needs thoughtful color balancing to avoid visual heaviness'],
    maintenance: 'Medium — dust glass mirrorwork with soft dry microfiber; stone surfaces are durable and need minimal upkeep.',
    similarThemes: ['traditional-indian', 'contemporary-indian', 'moroccan', 'bohemian'],
    roomCount: 5,
    isTrending: true,
    isEditorPick: true,
    isNew: true
  },
  {
    slug: 'minimal-indian',
    name: 'Minimal Indian',
    tagline: 'Quiet Japandi simplicity infused with subtle Indian textures and brass serenity',
    description: 'Minimal Indian strips away excess clutter while preserving the warmth of Indian domesticity. Smooth off-white lime walls, light teak joinery, discrete brass accents, simple handloom fabrics, and an integrated minimal pooja niche create uncluttered calm.',
    coverImage: 'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=900&q=80',
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=900&q=80',
      'https://images.unsplash.com/photo-1567016376408-0226e4d0c1ea?w=900&q=80',
      'https://images.unsplash.com/photo-1745301558339-44eb3217d5da?w=900&q=80'
    ],
    category: 'Indian',
    tags: ['indian', 'minimal', 'zen', 'neutral', 'brass', 'clean', 'modern', 'delhi-ncr'],
    collections: ['compact-apartments', 'trending', 'editors-picks', 'small-spaces'],
    colorFamilies: ['white', 'beige', 'cream', 'neutral', 'wood', 'grey'],
    roomCategories: ['Living Room', 'Bedroom', 'Kitchen', 'Home Office', 'Pooja Room'],
    suitablePropertyTypes: ['Apartment', 'Builder Floor', 'Independent House'],
    budget: { basic: '₹9–14 L', premium: '₹14–22 L', luxury: '₹22–36 L', ultraLuxury: '₹36 L+' },
    estimatedTimeline: '6–10 weeks',
    colors: [
      { name: 'Kora Cotton White', hex: '#F7F5EE', paint: 'Asian Paints Absolute White', family: 'white' },
      { name: 'Khadi Beige', hex: '#E2DAC8', paint: 'Dulux Khadi Warmth', family: 'beige' },
      { name: 'Brushed Brass', hex: '#C29F47', paint: 'Asian Paints Brushed Brass', family: 'yellow' },
      { name: 'Natural Sand', hex: '#D2C1A8', paint: 'Berger Sand Dune', family: 'neutral' },
      { name: 'Charcoal Slag', hex: '#2E2E2E', paint: 'Nippon Deep Charcoal', family: 'black' }
    ],
    materials: ['Natural light teak veneer', 'Seamless matte lime plaster', 'Raw khadi cotton and linen', 'Slender brushed brass handles', 'Hand-turned terracotta vases', 'Natural kota stone or matte porcelain'],
    furniture: ['Low-profile beige sectional sofa', 'Floating light teak TV console with hidden storage', 'Minimalist timber platform bed with recessed side tables', 'Compact fluted pooja cabinet', 'Round solid wood coffee table'],
    lighting: ['Linear magnetic track lighting', 'Subtle 3000K warm cove strips', 'Minimal spun brass pendant over dining', 'Recessed floor wash lights'],
    rooms: [],
    philosophy: 'Clutter-free living does not have to mean sterile European coldness. By incorporating warm natural woods, breathable Indian weaves, and serene brass touches, minimalism becomes hospitable and soul-nourishing.',
    history: 'Pioneered by modern Indian architects who fused Le Corbusier and Geoffrey Bawa architectural discipline with indigenous materials for contemporary urban homes.',
    keyCharacteristics: ['Flush floor-to-ceiling concealed storage', 'Warm neutral monochromatic palette', 'Slender minimal brass hardware', 'Textural depth through raw handloom fabrics', 'Clean geometric lines with zero visual noise', 'Compact integrated modern pooja nook'],
    bestFor: ['2BHK/3BHK apartments in Noida & Gurgaon', 'Young professionals and modern families', 'Those wanting an easy-to-clean, tranquil home'],
    pros: ['Makes compact apartments feel 30% larger', 'Extremely easy to keep organized and clean', 'Timeless and peaceful atmosphere', 'Faster execution timeline'],
    cons: ['Requires strict clutter discipline from homeowners', 'Storage must be designed and built flawlessly'],
    maintenance: 'Very Low — smooth wipe-clean surfaces; low dust-collecting ornamental elements.',
    similarThemes: ['japandi', 'warm-minimalism', 'contemporary-indian', 'minimalist'],
    roomCount: 5,
    isTrending: true,
    isEditorPick: true,
    isNew: true
  }
];

// Read current data.ts
const dataFilePath = path.join(__dirname, '../src/lib/themes/data.ts');
let content = fs.readFileSync(dataFilePath, 'utf8');

// For each theme in THEME_METADATA, if its slug is found in RAW_THEMES, inject the fields if not already present
for (const [slug, meta] of Object.entries(THEME_METADATA)) {
  const slugRegex = new RegExp(`(slug:\\s*['"]${slug}['"][\\s\\S]*?collections:\\s*\\[[^\\]]*\\])(,?)`);
  if (slugRegex.test(content)) {
    const replacement = `$1,\n    colorFamilies:${JSON.stringify(meta.colorFamilies)},\n    roomCategories:${JSON.stringify(meta.roomCategories)},\n    suitablePropertyTypes:${JSON.stringify(meta.suitablePropertyTypes)}$2`;
    // Only replace if not already containing colorFamilies for this slug block
    const blockMatch = content.match(new RegExp(`slug:\\s*['"]${slug}['"][\\s\\S]*?roomCount:`));
    if (blockMatch && !blockMatch[0].includes('colorFamilies:')) {
      content = content.replace(slugRegex, replacement);
    }
  }
}

// Add the 5 new Indian themes before the end of RAW_THEMES array (before `];\n\nconst ROOM_ORDER`)
if (!content.includes('modern-indian-luxury')) {
  const rawThemesEndIndex = content.lastIndexOf('];\n\nconst ROOM_ORDER');
  if (rawThemesEndIndex !== -1) {
    const indianThemesStr = INDIAN_NEW_THEMES.map((t, idx) => {
      return `\n  // ${39 + idx} ─ ${t.name.toUpperCase()}\n  ` + JSON.stringify(t, null, 2).replace(/\n/g, '\n  ') + ',';
    }).join('\n');
    content = content.slice(0, rawThemesEndIndex) + indianThemesStr + '\n' + content.slice(rawThemesEndIndex);
  }
}

fs.writeFileSync(dataFilePath, content, 'utf8');
console.log('Successfully updated data.ts with color families, room categories, property types, and 5 Indian themes!');
