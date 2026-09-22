export interface ThemeColor { name: string; hex: string; paint?: string }
export interface BudgetRange { basic: string; premium: string; luxury: string; ultraLuxury: string }
export interface RoomInspiration { room: string; images: string[] }
export interface Theme {
  slug: string; name: string; tagline: string; description: string;
  coverImage: string; galleryImages: string[]; category: string; tags: string[];
  collections: string[]; budget: BudgetRange; estimatedTimeline: string;
  colors: ThemeColor[]; materials: string[]; furniture: string[]; lighting: string[];
  rooms: RoomInspiration[]; philosophy: string; history: string;
  keyCharacteristics: string[]; bestFor: string[]; pros: string[]; cons: string[];
  maintenance: string; similarThemes: string[]; roomCount: number;
  isNew?: boolean; isTrending?: boolean; isEditorPick?: boolean;
}
