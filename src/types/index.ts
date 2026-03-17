export interface Profile {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  pin: string | null;
  gender: 'male' | 'female';
  measurements: Record<string, number>;
  measurement_unit: 'inches' | 'cm';
  measurements_updated_at: string | null;
  measurement_notes: string;
  style_notes: string;
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  profile_id: string;
  tailor_name: string;
  tailor_phone: string | null;
  tailor_city: string;
  description: string;
  fit_notes: string;
  deadline: string | null;
  status: 'draft' | 'sent' | 'in_progress' | 'completed';
  completed_photo_url: string | null;
  completed_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderAttachment {
  id: string;
  order_id: string;
  url: string;
  type: 'inspiration' | 'screenshot' | 'completed';
  visible_to_tailor: boolean;
  created_at: string;
}

export interface ProfilePhoto {
  id: string;
  profile_id: string;
  url: string;
  sort_order: number;
  created_at: string;
}

export type Gender = 'male' | 'female';
export type MeasurementUnit = 'inches' | 'cm';

export interface MeasurementField {
  key: string;
  label: string;       // English fallback, keep for safety
  sectionKey: string;  // e.g. 'upperBody', 'arms', 'lowerBody', 'fullBody'
  section: string;     // English fallback, keep for safety
}

// Men's measurements grouped by body section
// Labels match the measurement guide diagrams
export const MALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body (Male Shirt / Top Guide)
  { key: 'torso_length', label: 'A. Shirt Length', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'chest', label: 'B. Chest', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'shoulder', label: 'C. Shoulder', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'neck', label: 'E. Neck', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'armhole', label: 'F. Armhole', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'belly', label: 'f. Belly', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'back_width', label: 'Across Back', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'nape_to_waist', label: 'Nape to Waist', section: 'Upper Body', sectionKey: 'upperBody' },
  // Arms
  { key: 'sleeve', label: 'D. Short Sleeve', section: 'Arms', sectionKey: 'arms' },
  { key: 'long_sleeve', label: 'Long Sleeve', section: 'Arms', sectionKey: 'arms' },
  { key: 'bicep', label: 'G. Bicep', section: 'Arms', sectionKey: 'arms' },
  { key: 'wrist', label: 'Wrist', section: 'Arms', sectionKey: 'arms' },
  // Lower body (Male Trousers / Bottom Guide)
  { key: 'outseam', label: 'G. Trouser Length', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'waist', label: 'H. Waist', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'hips', label: 'I. Hips', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'thigh', label: 'J. Thigh', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'knee', label: 'K. Knee', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'ankle', label: 'L. Ankle', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'inseam', label: 'M. Inseam', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'crotch_depth', label: 'Crotch Depth', section: 'Lower Body', sectionKey: 'lowerBody' },
];

// Women's measurements grouped by body section
// Labels match the measurement guide diagrams
export const FEMALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body (Female Top Guide)
  { key: 'bodice_length', label: 'N. Bodice Length', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'bust', label: 'O. Bust', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'underbust', label: 'P. Underbust', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'shoulder', label: 'Q. Shoulder', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'armhole', label: 'S. Armhole', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'belly', label: 'V. Belly', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'back_width', label: 'Across Back', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'bust_point', label: 'Bust Point Distance', section: 'Upper Body', sectionKey: 'upperBody' },
  { key: 'back_waist_length', label: 'Back Waist Length', section: 'Upper Body', sectionKey: 'upperBody' },
  // Arms
  { key: 'sleeve', label: 'R. Short Sleeve', section: 'Arms', sectionKey: 'arms' },
  { key: 'long_sleeve', label: 'Long Sleeve', section: 'Arms', sectionKey: 'arms' },
  { key: 'bicep', label: 'T. Bicep', section: 'Arms', sectionKey: 'arms' },
  { key: 'wrist', label: 'U. Wrist', section: 'Arms', sectionKey: 'arms' },
  // Full body (common for dresses, gowns, iro & buba)
  { key: 'across_front', label: 'AF. Across Front', section: 'Full Body', sectionKey: 'fullBody' },
  { key: 'across_back', label: 'Across Back', section: 'Full Body', sectionKey: 'fullBody' },
  { key: 'shoulder_to_waist', label: 'AG. Shoulder to Waist', section: 'Full Body', sectionKey: 'fullBody' },
  { key: 'shoulder_to_floor', label: 'AH. Shoulder to Floor', section: 'Full Body', sectionKey: 'fullBody' },
  // Lower body (Female Bottom Guide)
  { key: 'waist', label: 'W. Waist', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'high_hip', label: 'X. High Hip', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'hips', label: 'Y. Hip', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'thigh', label: 'Z. Thigh', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'knee', label: 'AA. Knee', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'ankle', label: 'AB. Ankle', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'inseam', label: 'AC. Inseam', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'crotch_depth', label: 'AD. Crotch Depth', section: 'Lower Body', sectionKey: 'lowerBody' },
  { key: 'bottom_length', label: 'AE. Bottom Length', section: 'Lower Body', sectionKey: 'lowerBody' },
];

export function getMeasurementFields(gender: Gender): MeasurementField[] {
  return gender === 'male' ? MALE_MEASUREMENTS : FEMALE_MEASUREMENTS;
}

export function getMeasurementSections(gender: Gender): Record<string, MeasurementField[]> {
  const fields = getMeasurementFields(gender);
  const sections: Record<string, MeasurementField[]> = {};
  for (const field of fields) {
    if (!sections[field.sectionKey]) sections[field.sectionKey] = [];
    sections[field.sectionKey].push(field);
  }
  return sections;
}

// Key measurements shown in preview (most important for tailoring)
export const KEY_MEASUREMENTS_MALE = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'inseam'];
export const KEY_MEASUREMENTS_FEMALE = ['bust', 'waist', 'hips', 'shoulder', 'sleeve', 'inseam'];

export function getKeyMeasurements(gender: Gender): string[] {
  return gender === 'male' ? KEY_MEASUREMENTS_MALE : KEY_MEASUREMENTS_FEMALE;
}
