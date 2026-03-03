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
  status: 'draft' | 'sent' | 'in_progress' | 'completed';
  completed_photo_url: string | null;
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
  label: string;
  section: string;
}

// Men's measurements grouped by body section
// Labels match the measurement guide diagrams
export const MALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body (Male Shirt / Top Guide)
  { key: 'torso_length', label: 'A. Shirt Length', section: 'Upper Body' },
  { key: 'chest', label: 'B. Chest', section: 'Upper Body' },
  { key: 'shoulder', label: 'C. Shoulder', section: 'Upper Body' },
  { key: 'neck', label: 'E. Neck', section: 'Upper Body' },
  { key: 'armhole', label: 'F. Armhole', section: 'Upper Body' },
  { key: 'belly', label: 'f. Belly', section: 'Upper Body' },
  // Arms
  { key: 'sleeve', label: 'D. Sleeve Length', section: 'Arms' },
  { key: 'bicep', label: 'G. Bicep', section: 'Arms' },
  { key: 'wrist', label: 'Wrist', section: 'Arms' },
  // Lower body (Male Trousers / Bottom Guide)
  { key: 'outseam', label: 'G. Trouser Length', section: 'Lower Body' },
  { key: 'waist', label: 'H. Waist', section: 'Lower Body' },
  { key: 'hips', label: 'I. Hips', section: 'Lower Body' },
  { key: 'thigh', label: 'J. Thigh', section: 'Lower Body' },
  { key: 'knee', label: 'K. Knee', section: 'Lower Body' },
  { key: 'ankle', label: 'L. Ankle', section: 'Lower Body' },
  { key: 'inseam', label: 'M. Inseam', section: 'Lower Body' },
];

// Women's measurements grouped by body section
// Labels match the measurement guide diagrams
export const FEMALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body (Female Top Guide)
  { key: 'bodice_length', label: 'N. Bodice Length', section: 'Upper Body' },
  { key: 'bust', label: 'O. Bust', section: 'Upper Body' },
  { key: 'underbust', label: 'P. Underbust', section: 'Upper Body' },
  { key: 'shoulder', label: 'Q. Shoulder', section: 'Upper Body' },
  { key: 'armhole', label: 'S. Armhole', section: 'Upper Body' },
  { key: 'belly', label: 'V. Belly', section: 'Upper Body' },
  // Arms
  { key: 'sleeve', label: 'R. Sleeve Length', section: 'Arms' },
  { key: 'bicep', label: 'T. Bicep', section: 'Arms' },
  { key: 'wrist', label: 'U. Wrist', section: 'Arms' },
  // Lower body (Female Bottom Guide)
  { key: 'waist', label: 'W. Waist', section: 'Lower Body' },
  { key: 'high_hip', label: 'X. High Hip', section: 'Lower Body' },
  { key: 'hips', label: 'Y. Hip', section: 'Lower Body' },
  { key: 'thigh', label: 'Z. Thigh', section: 'Lower Body' },
  { key: 'knee', label: 'AA. Knee', section: 'Lower Body' },
  { key: 'ankle', label: 'AB. Ankle', section: 'Lower Body' },
  { key: 'inseam', label: 'AC. Inseam', section: 'Lower Body' },
  { key: 'crotch_depth', label: 'AD. Crotch Depth', section: 'Lower Body' },
  { key: 'bottom_length', label: 'AE. Bottom Length', section: 'Lower Body' },
];

export function getMeasurementFields(gender: Gender): MeasurementField[] {
  return gender === 'male' ? MALE_MEASUREMENTS : FEMALE_MEASUREMENTS;
}

export function getMeasurementSections(gender: Gender): Record<string, MeasurementField[]> {
  const fields = getMeasurementFields(gender);
  const sections: Record<string, MeasurementField[]> = {};
  for (const field of fields) {
    if (!sections[field.section]) sections[field.section] = [];
    sections[field.section].push(field);
  }
  return sections;
}

// Key measurements shown in preview (most important for tailoring)
export const KEY_MEASUREMENTS_MALE = ['chest', 'waist', 'hips', 'shoulder', 'sleeve', 'inseam'];
export const KEY_MEASUREMENTS_FEMALE = ['bust', 'waist', 'hips', 'shoulder', 'sleeve', 'inseam'];

export function getKeyMeasurements(gender: Gender): string[] {
  return gender === 'male' ? KEY_MEASUREMENTS_MALE : KEY_MEASUREMENTS_FEMALE;
}
