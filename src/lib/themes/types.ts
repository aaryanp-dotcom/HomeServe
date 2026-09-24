export type ColorFamily =
  | 'white'
  | 'beige'
  | 'cream'
  | 'grey'
  | 'black'
  | 'brown'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'orange'
  | 'red'
  | 'pink'
  | 'purple'
  | 'terracotta'
  | 'wood'
  | 'neutral'
  | 'earthy';

export type RoomCategory =
  | 'Living Room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Dining'
  | 'Home Office'
  | 'Pooja Room'
  | 'Balcony';

export type PropertyType =
  | 'Apartment'
  | 'Builder Floor'
  | 'Independent House'
  | 'Villa'
  | 'Penthouse';

export interface ThemeColor {
  name: string;
  hex: string;
  paint?: string;
  family?: ColorFamily;
}

export interface BudgetRange {
  basic: string;
  premium: string;
  luxury: string;
  ultraLuxury: string;
}

export interface RoomInspiration {
  room: string;
  images: string[];
}

export interface Theme {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  galleryImages: string[];
  category: string;
  tags: string[];
  collections: string[];
  colorFamilies: ColorFamily[];
  roomCategories?: RoomCategory[];
  suitablePropertyTypes?: PropertyType[];
  budget: BudgetRange;
  estimatedTimeline: string;
  colors: ThemeColor[];
  materials: string[];
  furniture: string[];
  lighting: string[];
  rooms: RoomInspiration[];
  philosophy: string;
  history: string;
  keyCharacteristics: string[];
  bestFor: string[];
  pros: string[];
  cons: string[];
  maintenance: string;
  similarThemes: string[];
  roomCount: number;
  isNew?: boolean;
  isTrending?: boolean;
  isEditorPick?: boolean;
}
