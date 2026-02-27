export interface Profile {
  id: string;
  slug: string;
  name: string;
  phone: string | null;
  gender: 'male' | 'female';
  measurements: Record<string, number>;
  measurement_unit: 'inches' | 'cm';
  measurements_updated_at: string | null;
  style_notes: string;
  theme: 'dark' | 'light';
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  profile_id: string;
  tailor_name: string;
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
export const MALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body
  { key: 'neck', label: 'Neck', section: 'Upper Body' },
  { key: 'chest', label: 'Chest', section: 'Upper Body' },
  { key: 'shoulder', label: 'Shoulder', section: 'Upper Body' },
  { key: 'back_width', label: 'Back Width', section: 'Upper Body' },
  { key: 'armhole', label: 'Armhole', section: 'Upper Body' },
  // Arms
  { key: 'bicep', label: 'Bicep', section: 'Arms' },
  { key: 'sleeve', label: 'Sleeve Length', section: 'Arms' },
  { key: 'wrist', label: 'Wrist', section: 'Arms' },
  // Torso
  { key: 'waist', label: 'Waist', section: 'Torso' },
  { key: 'hips', label: 'Hips', section: 'Torso' },
  { key: 'torso_length', label: 'Torso Length', section: 'Torso' },
  // Lower body
  { key: 'inseam', label: 'Inseam', section: 'Lower Body' },
  { key: 'outseam', label: 'Outseam', section: 'Lower Body' },
  { key: 'thigh', label: 'Thigh', section: 'Lower Body' },
  { key: 'knee', label: 'Knee', section: 'Lower Body' },
  { key: 'ankle', label: 'Ankle', section: 'Lower Body' },
  { key: 'crotch_depth', label: 'Crotch Depth', section: 'Lower Body' },
];

// Women's measurements grouped by body section
export const FEMALE_MEASUREMENTS: MeasurementField[] = [
  // Upper body
  { key: 'neck', label: 'Neck', section: 'Upper Body' },
  { key: 'bust', label: 'Bust', section: 'Upper Body' },
  { key: 'underbust', label: 'Underbust', section: 'Upper Body' },
  { key: 'shoulder', label: 'Shoulder', section: 'Upper Body' },
  { key: 'back_width', label: 'Back Width', section: 'Upper Body' },
  { key: 'armhole', label: 'Armhole', section: 'Upper Body' },
  // Arms
  { key: 'bicep', label: 'Bicep', section: 'Arms' },
  { key: 'bodice_length', label: 'Bodice Length', section: 'Arms' },
  { key: 'sleeve', label: 'Sleeve Length', section: 'Arms' },
  { key: 'wrist', label: 'Wrist', section: 'Arms' },
  // Torso
  { key: 'waist', label: 'Waist', section: 'Torso' },
  { key: 'hips', label: 'Hips', section: 'Torso' },
  { key: 'high_hip', label: 'High Hip', section: 'Torso' },
  { key: 'torso_length', label: 'Torso Length', section: 'Torso' },
  // Lower body
  { key: 'inseam', label: 'Inseam', section: 'Lower Body' },
  { key: 'outseam', label: 'Outseam', section: 'Lower Body' },
  { key: 'thigh', label: 'Thigh', section: 'Lower Body' },
  { key: 'knee', label: 'Knee', section: 'Lower Body' },
  { key: 'ankle', label: 'Ankle', section: 'Lower Body' },
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
