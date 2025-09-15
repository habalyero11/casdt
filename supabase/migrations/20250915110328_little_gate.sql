/*
  # BARMM CASDT Database Schema

  1. New Tables
    - `barangays`
      - `id` (uuid, primary key)  
      - `name` (text)
      - `municipality` (text)
      - `province` (text)
      - `created_at` (timestamp)
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text)
      - `role` (text, 'admin' or 'barangay')
      - `barangay_id` (uuid, references barangays)
      - `full_name` (text)
      - `created_at` (timestamp)
    - `patients`
      - `id` (uuid, primary key)
      - `barangay_id` (uuid, references barangays)
      - `created_by` (uuid, references users)
      - Client Information fields
      - History Taking fields
      - Physical Examination fields
      - Screening Results fields
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
*/

CREATE TABLE IF NOT EXISTS barangays (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality text NOT NULL,
  province text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'barangay')),
  barangay_id uuid REFERENCES barangays(id),
  full_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay_id uuid NOT NULL REFERENCES barangays(id),
  created_by uuid NOT NULL REFERENCES users(id),
  
  -- I. Client Information
  client_name text NOT NULL,
  client_address text NOT NULL,
  date_of_birth date NOT NULL,
  number_of_children integer DEFAULT 0,
  civil_status text CHECK (civil_status IN ('single', 'married', 'widowed', 'living_together', 'separated')),
  
  -- II. History Taking
  -- A. OB-GYNE History
  -- 1. Menstrual History
  first_menstrual_period date,
  last_menstrual_period date,
  age_of_gestation integer,
  menstrual_pattern text CHECK (menstrual_pattern IN ('regular', 'irregular')),
  pads_per_day integer,
  
  -- 2. Pregnancy History
  gravida integer DEFAULT 0,
  parity integer DEFAULT 0,
  full_term integer DEFAULT 0,
  pre_term integer DEFAULT 0,
  abortion integer DEFAULT 0,
  living_children integer DEFAULT 0,
  age_first_pregnancy integer,
  
  -- 3. Contraceptives
  contraceptives_use boolean DEFAULT false,
  contraceptives_duration_years integer DEFAULT 0,
  contraceptives_duration_months integer DEFAULT 0,
  
  -- 4. Previous Screening History
  previous_cervical_screening boolean DEFAULT false,
  via_result text,
  pap_smear_result text,
  hpv_dna_result text,
  previous_breast_screening boolean DEFAULT false,
  cbe_result text,
  mammography_result text,
  breast_ultrasound_result text,
  
  -- 5. Symptoms
  abnormal_vaginal_discharge boolean DEFAULT false,
  abnormal_vaginal_bleeding boolean DEFAULT false,
  
  -- B. Sexual History
  age_first_intercourse integer,
  number_sexual_partners integer,
  partner_circumcised boolean,
  sti_history_client boolean DEFAULT false,
  sti_history_client_details text,
  sti_history_partner boolean DEFAULT false,
  sti_history_partner_details text,
  
  -- C. Family and Social History
  family_history_cancer boolean DEFAULT false,
  family_history_details text,
  smoking boolean DEFAULT false,
  smoking_year_started integer,
  cigarettes_per_day integer,
  
  -- D. Medical History
  current_medication boolean DEFAULT false,
  current_medication_details text,
  allergies boolean DEFAULT false,
  allergies_details text,
  abdominal_surgery boolean DEFAULT false,
  abdominal_surgery_details text,
  
  -- III. Physical Examination
  -- Vital Signs
  blood_pressure text,
  temperature decimal,
  heart_rate integer,
  respiratory_rate integer,
  
  -- Anthropometric
  height decimal,
  weight decimal,
  bmi decimal,
  
  -- Skin
  skin_pallor boolean DEFAULT false,
  skin_rashes boolean DEFAULT false,
  skin_jaundice boolean DEFAULT false,
  
  -- HEENT
  anicteric_sclerae boolean DEFAULT false,
  aural_discharge boolean DEFAULT false,
  nasal_discharge boolean DEFAULT false,
  neck_findings text,
  
  -- Chest and Lungs
  clear_breath_sounds boolean DEFAULT false,
  crackles_rales boolean DEFAULT false,
  wheezes boolean DEFAULT false,
  
  -- Heart
  normal_heart_rate boolean DEFAULT false,
  regular_rhythm boolean DEFAULT false,
  murmur boolean DEFAULT false,
  
  -- Abdomen
  abdominal_scars boolean DEFAULT false,
  stretch_marks boolean DEFAULT false,
  abdominal_mass boolean DEFAULT false,
  enlarged_liver boolean DEFAULT false,
  abdominal_tenderness boolean DEFAULT false,
  fluid_wave boolean DEFAULT false,
  
  -- Breast Examination
  breast_mass boolean DEFAULT false,
  nipple_discharge boolean DEFAULT false,
  skin_orange_peel boolean DEFAULT false,
  enlarged_lymph_nodes boolean DEFAULT false,
  breast_findings_right text,
  breast_findings_left text,
  
  -- Pelvic Examination
  vulva_inflammation boolean DEFAULT false,
  vulva_tenderness boolean DEFAULT false,
  vulva_ulcers boolean DEFAULT false,
  vulva_warts boolean DEFAULT false,
  vulva_cyst boolean DEFAULT false,
  vulva_skin_tags boolean DEFAULT false,
  vulva_other_mass text,
  
  bartholin_swelling boolean DEFAULT false,
  bartholin_tenderness boolean DEFAULT false,
  bartholin_discharge boolean DEFAULT false,
  
  vaginal_cervical_lesion boolean DEFAULT false,
  vaginal_tears boolean DEFAULT false,
  vaginal_ulcers boolean DEFAULT false,
  vaginal_other_abnormalities text,
  
  -- For Medical Providers
  uterus_size_shape_position text,
  cervical_motion_tenderness boolean DEFAULT false,
  adnexal_masses boolean DEFAULT false,
  rectovaginal_findings text,
  
  -- VI. Screening Results
  via_findings_positive boolean DEFAULT false,
  via_findings_negative boolean DEFAULT false,
  via_scj_outline text,
  via_white_epithelium text,
  via_cervical_os text,
  via_suspect_lesions text,
  
  -- Current screening results
  current_pap_smear_result text,
  current_hpv_dna_result text,
  current_cbe_result text,
  current_via_result text,
  
  -- VII. Referral
  referral_needed boolean DEFAULT false,
  referral_details text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE barangays ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policies for barangays
CREATE POLICY "Admins can manage all barangays"
  ON barangays FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Barangay users can view their barangay"
  ON barangays FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT barangay_id FROM users 
      WHERE users.id = auth.uid()
    )
  );

-- Policies for users
CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policies for patients
CREATE POLICY "Admins can manage all patients"
  ON patients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Barangay users can manage their barangay patients"
  ON patients FOR ALL
  TO authenticated
  USING (
    barangay_id IN (
      SELECT barangay_id FROM users 
      WHERE users.id = auth.uid() AND users.role = 'barangay'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for patients table
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();