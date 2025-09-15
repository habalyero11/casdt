import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Barangay {
  id: string;
  name: string;
  municipality: string;
  province: string;
}

export function PatientRegistration() {
  const { profile } = useAuth();
  const [barangays, setBarangays] = useState<Barangay[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [patientData, setPatientData] = useState({
    // I. Client Information
    client_name: '',
    client_address: '',
    date_of_birth: '',
    number_of_children: 0,
    civil_status: '',
    
    // II. History Taking - A. OB-GYNE History
    // 1. Menstrual History
    first_menstrual_period: '',
    last_menstrual_period: '',
    age_of_gestation: 0,
    menstrual_pattern: '',
    pads_per_day: 0,
    
    // 2. Pregnancy History
    gravida: 0,
    parity: 0,
    full_term: 0,
    pre_term: 0,
    abortion: 0,
    living_children: 0,
    age_first_pregnancy: 0,
    
    // 3. Contraceptives
    contraceptives_use: false,
    contraceptives_duration_years: 0,
    contraceptives_duration_months: 0,
    
    // 4. Previous Screening History
    previous_cervical_screening: false,
    via_result: '',
    pap_smear_result: '',
    hpv_dna_result: '',
    previous_breast_screening: false,
    cbe_result: '',
    mammography_result: '',
    breast_ultrasound_result: '',
    
    // 5. Symptoms
    abnormal_vaginal_discharge: false,
    abnormal_vaginal_bleeding: false,
    
    // B. Sexual History
    age_first_intercourse: 0,
    number_sexual_partners: 0,
    partner_circumcised: false,
    sti_history_client: false,
    sti_history_client_details: '',
    sti_history_partner: false,
    sti_history_partner_details: '',
    
    // C. Family and Social History
    family_history_cancer: false,
    family_history_details: '',
    smoking: false,
    smoking_year_started: 0,
    cigarettes_per_day: 0,
    
    // D. Medical History
    current_medication: false,
    current_medication_details: '',
    allergies: false,
    allergies_details: '',
    abdominal_surgery: false,
    abdominal_surgery_details: '',
    
    // III. Physical Examination
    // Vital Signs
    blood_pressure: '',
    temperature: 0,
    heart_rate: 0,
    respiratory_rate: 0,
    
    // Anthropometric
    height: 0,
    weight: 0,
    bmi: 0,
    
    // Skin
    skin_pallor: false,
    skin_rashes: false,
    skin_jaundice: false,
    
    // HEENT
    anicteric_sclerae: false,
    aural_discharge: false,
    nasal_discharge: false,
    neck_findings: '',
    
    // Chest and Lungs
    clear_breath_sounds: false,
    crackles_rales: false,
    wheezes: false,
    
    // Heart
    normal_heart_rate: false,
    regular_rhythm: false,
    murmur: false,
    
    // Abdomen
    abdominal_scars: false,
    stretch_marks: false,
    abdominal_mass: false,
    enlarged_liver: false,
    abdominal_tenderness: false,
    fluid_wave: false,
    
    // Breast Examination
    breast_mass: false,
    nipple_discharge: false,
    skin_orange_peel: false,
    enlarged_lymph_nodes: false,
    breast_findings_right: '',
    breast_findings_left: '',
    
    // Pelvic Examination
    vulva_inflammation: false,
    vulva_tenderness: false,
    vulva_ulcers: false,
    vulva_warts: false,
    vulva_cyst: false,
    vulva_skin_tags: false,
    vulva_other_mass: '',
    
    bartholin_swelling: false,
    bartholin_tenderness: false,
    bartholin_discharge: false,
    
    vaginal_cervical_lesion: false,
    vaginal_tears: false,
    vaginal_ulcers: false,
    vaginal_other_abnormalities: '',
    
    // For Medical Providers
    uterus_size_shape_position: '',
    cervical_motion_tenderness: false,
    adnexal_masses: false,
    rectovaginal_findings: '',
    
    // VI. Screening Results
    via_findings_positive: false,
    via_findings_negative: false,
    via_scj_outline: '',
    via_white_epithelium: '',
    via_cervical_os: '',
    via_suspect_lesions: '',
    
    // Current screening results
    current_pap_smear_result: '',
    current_hpv_dna_result: '',
    current_cbe_result: '',
    current_via_result: '',
    
    // VII. Referral
    referral_needed: false,
    referral_details: '',
  });

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchBarangays();
    }
  }, [profile]);

  // Calculate BMI when height and weight change
  useEffect(() => {
    if (patientData.height > 0 && patientData.weight > 0) {
      const heightInMeters = patientData.height / 100;
      const bmi = patientData.weight / (heightInMeters * heightInMeters);
      setPatientData(prev => ({ ...prev, bmi: Math.round(bmi * 10) / 10 }));
    }
  }, [patientData.height, patientData.weight]);

  const fetchBarangays = async () => {
    try {
      const { data, error } = await supabase
        .from('barangays')
        .select('*')
        .order('name');

      if (error) throw error;
      setBarangays(data || []);
    } catch (error) {
      console.error('Error fetching barangays:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setPatientData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (!profile) throw new Error('User not authenticated');

      const barangayId = profile.role === 'admin' 
        ? patientData.barangay_id 
        : profile.barangay_id;

      if (!barangayId) {
        throw new Error('Barangay not selected');
      }

      const { error } = await supabase
        .from('patients')
        .insert([{
          ...patientData,
          barangay_id: barangayId,
          created_by: profile.id,
        }]);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Patient registered successfully!' });
      
      // Reset form
      setPatientData({
        client_name: '',
        client_address: '',
        date_of_birth: '',
        number_of_children: 0,
        civil_status: '',
        first_menstrual_period: '',
        last_menstrual_period: '',
        age_of_gestation: 0,
        menstrual_pattern: '',
        pads_per_day: 0,
        gravida: 0,
        parity: 0,
        full_term: 0,
        pre_term: 0,
        abortion: 0,
        living_children: 0,
        age_first_pregnancy: 0,
        contraceptives_use: false,
        contraceptives_duration_years: 0,
        contraceptives_duration_months: 0,
        previous_cervical_screening: false,
        via_result: '',
        pap_smear_result: '',
        hpv_dna_result: '',
        previous_breast_screening: false,
        cbe_result: '',
        mammography_result: '',
        breast_ultrasound_result: '',
        abnormal_vaginal_discharge: false,
        abnormal_vaginal_bleeding: false,
        age_first_intercourse: 0,
        number_sexual_partners: 0,
        partner_circumcised: false,
        sti_history_client: false,
        sti_history_client_details: '',
        sti_history_partner: false,
        sti_history_partner_details: '',
        family_history_cancer: false,
        family_history_details: '',
        smoking: false,
        smoking_year_started: 0,
        cigarettes_per_day: 0,
        current_medication: false,
        current_medication_details: '',
        allergies: false,
        allergies_details: '',
        abdominal_surgery: false,
        abdominal_surgery_details: '',
        blood_pressure: '',
        temperature: 0,
        heart_rate: 0,
        respiratory_rate: 0,
        height: 0,
        weight: 0,
        bmi: 0,
        skin_pallor: false,
        skin_rashes: false,
        skin_jaundice: false,
        anicteric_sclerae: false,
        aural_discharge: false,
        nasal_discharge: false,
        neck_findings: '',
        clear_breath_sounds: false,
        crackles_rales: false,
        wheezes: false,
        normal_heart_rate: false,
        regular_rhythm: false,
        murmur: false,
        abdominal_scars: false,
        stretch_marks: false,
        abdominal_mass: false,
        enlarged_liver: false,
        abdominal_tenderness: false,
        fluid_wave: false,
        breast_mass: false,
        nipple_discharge: false,
        skin_orange_peel: false,
        enlarged_lymph_nodes: false,
        breast_findings_right: '',
        breast_findings_left: '',
        vulva_inflammation: false,
        vulva_tenderness: false,
        vulva_ulcers: false,
        vulva_warts: false,
        vulva_cyst: false,
        vulva_skin_tags: false,
        vulva_other_mass: '',
        bartholin_swelling: false,
        bartholin_tenderness: false,
        bartholin_discharge: false,
        vaginal_cervical_lesion: false,
        vaginal_tears: false,
        vaginal_ulcers: false,
        vaginal_other_abnormalities: '',
        uterus_size_shape_position: '',
        cervical_motion_tenderness: false,
        adnexal_masses: false,
        rectovaginal_findings: '',
        via_findings_positive: false,
        via_findings_negative: false,
        via_scj_outline: '',
        via_white_epithelium: '',
        via_cervical_os: '',
        via_suspect_lesions: '',
        current_pap_smear_result: '',
        current_hpv_dna_result: '',
        current_cbe_result: '',
        current_via_result: '',
        referral_needed: false,
        referral_details: '',
      });

    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'An error occurred' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Client Assessment, Screening, Diagnosis and Treatment (CASDT)
        </h1>
        <p className="text-gray-600">
          Complete this form for every client who decides to undergo cancer screening
        </p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* I. Client Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">I. Client Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === 'admin' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Barangay *
                </label>
                <select
                  value={patientData.barangay_id || ''}
                  onChange={(e) => handleInputChange('barangay_id', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Barangay</option>
                  {barangays.map((barangay) => (
                    <option key={barangay.id} value={barangay.id}>
                      {barangay.name}, {barangay.municipality}, {barangay.province}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client Name *
              </label>
              <input
                type="text"
                value={patientData.client_name}
                onChange={(e) => handleInputChange('client_name', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                value={patientData.client_address}
                onChange={(e) => handleInputChange('client_address', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth *
              </label>
              <input
                type="date"
                value={patientData.date_of_birth}
                onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Children
              </label>
              <input
                type="number"
                value={patientData.number_of_children}
                onChange={(e) => handleInputChange('number_of_children', parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Civil Status
              </label>
              <div className="flex flex-wrap gap-4">
                {['single', 'married', 'widowed', 'living_together', 'separated'].map((status) => (
                  <label key={status} className="flex items-center">
                    <input
                      type="radio"
                      value={status}
                      checked={patientData.civil_status === status}
                      onChange={(e) => handleInputChange('civil_status', e.target.value)}
                      className="mr-2"
                    />
                    <span className="capitalize">{status.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* II. History Taking - A. OB-GYNE History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">II. History Taking</h2>
          
          <h3 className="text-lg font-semibold text-blue-900 mb-3">A. OB-GYNE History</h3>
          
          {/* 1. Menstrual History */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">1. Menstrual History</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Menstrual Period (Menarche)
                </label>
                <input
                  type="date"
                  value={patientData.first_menstrual_period}
                  onChange={(e) => handleInputChange('first_menstrual_period', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Menstrual Period (LMP)
                </label>
                <input
                  type="date"
                  value={patientData.last_menstrual_period}
                  onChange={(e) => handleInputChange('last_menstrual_period', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age of Gestation (AOG) - if applicable
                </label>
                <input
                  type="number"
                  value={patientData.age_of_gestation}
                  onChange={(e) => handleInputChange('age_of_gestation', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Menstrual Bleeding Pattern
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="regular"
                      checked={patientData.menstrual_pattern === 'regular'}
                      onChange={(e) => handleInputChange('menstrual_pattern', e.target.value)}
                      className="mr-2"
                    />
                    Regular (23-35 day interval)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="irregular"
                      checked={patientData.menstrual_pattern === 'irregular'}
                      onChange={(e) => handleInputChange('menstrual_pattern', e.target.value)}
                      className="mr-2"
                    />
                    Irregular
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Pads/day
                </label>
                <input
                  type="number"
                  value={patientData.pads_per_day}
                  onChange={(e) => handleInputChange('pads_per_day', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* 2. Pregnancy History */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">2. Pregnancy History</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gravida</label>
                <input
                  type="number"
                  value={patientData.gravida}
                  onChange={(e) => handleInputChange('gravida', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Parity</label>
                <input
                  type="number"
                  value={patientData.parity}
                  onChange={(e) => handleInputChange('parity', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Term</label>
                <input
                  type="number"
                  value={patientData.full_term}
                  onChange={(e) => handleInputChange('full_term', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pre-Term</label>
                <input
                  type="number"
                  value={patientData.pre_term}
                  onChange={(e) => handleInputChange('pre_term', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Abortion</label>
                <input
                  type="number"
                  value={patientData.abortion}
                  onChange={(e) => handleInputChange('abortion', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Living Children</label>
                <input
                  type="number"
                  value={patientData.living_children}
                  onChange={(e) => handleInputChange('living_children', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age at First Full Term Pregnancy (high risk if below 17 years old)
              </label>
              <input
                type="number"
                value={patientData.age_first_pregnancy}
                onChange={(e) => handleInputChange('age_first_pregnancy', parseInt(e.target.value) || 0)}
                className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          {/* 3. Contraceptives */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">3. Oral Contraceptives Use</h4>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.contraceptives_use}
                  onChange={(e) => handleInputChange('contraceptives_use', e.target.checked)}
                  className="mr-2"
                />
                Currently using or previously used oral contraceptives
              </label>

              {patientData.contraceptives_use && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration - Years
                    </label>
                    <input
                      type="number"
                      value={patientData.contraceptives_duration_years}
                      onChange={(e) => handleInputChange('contraceptives_duration_years', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration - Months
                    </label>
                    <input
                      type="number"
                      value={patientData.contraceptives_duration_months}
                      onChange={(e) => handleInputChange('contraceptives_duration_months', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      max="11"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Previous Screening History */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">4. History of Previous Cancer Screening</h4>
            
            {/* Cervical Cancer Screening */}
            <div className="mb-4">
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Cervical Cancer Screening</h5>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={patientData.previous_cervical_screening}
                  onChange={(e) => handleInputChange('previous_cervical_screening', e.target.checked)}
                  className="mr-2"
                />
                Previous cervical cancer screening
              </label>

              {patientData.previous_cervical_screening && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">VIA Result</label>
                    <input
                      type="text"
                      value={patientData.via_result}
                      onChange={(e) => handleInputChange('via_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pap Smear Result</label>
                    <input
                      type="text"
                      value={patientData.pap_smear_result}
                      onChange={(e) => handleInputChange('pap_smear_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">HPV DNA Result</label>
                    <input
                      type="text"
                      value={patientData.hpv_dna_result}
                      onChange={(e) => handleInputChange('hpv_dna_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Breast Cancer Screening */}
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Breast Cancer Early Detection</h5>
              <label className="flex items-center mb-3">
                <input
                  type="checkbox"
                  checked={patientData.previous_breast_screening}
                  onChange={(e) => handleInputChange('previous_breast_screening', e.target.checked)}
                  className="mr-2"
                />
                Previous breast cancer screening
              </label>

              {patientData.previous_breast_screening && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CBE Result</label>
                    <input
                      type="text"
                      value={patientData.cbe_result}
                      onChange={(e) => handleInputChange('cbe_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mammography Result</label>
                    <input
                      type="text"
                      value={patientData.mammography_result}
                      onChange={(e) => handleInputChange('mammography_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breast Ultrasound Result</label>
                    <input
                      type="text"
                      value={patientData.breast_ultrasound_result}
                      onChange={(e) => handleInputChange('breast_ultrasound_result', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. Symptoms */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-800 mb-3">5. Symptoms</h4>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.abnormal_vaginal_discharge}
                  onChange={(e) => handleInputChange('abnormal_vaginal_discharge', e.target.checked)}
                  className="mr-2"
                />
                History of abnormal vaginal discharge
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.abnormal_vaginal_bleeding}
                  onChange={(e) => handleInputChange('abnormal_vaginal_bleeding', e.target.checked)}
                  className="mr-2"
                />
                History of abnormal vaginal bleeding
              </label>
            </div>
          </div>
        </div>

        {/* B. Sexual History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">B. Sexual History</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age at First Intercourse
              </label>
              <input
                type="number"
                value={patientData.age_first_intercourse}
                onChange={(e) => handleInputChange('age_first_intercourse', parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Sexual Partners
              </label>
              <input
                type="number"
                value={patientData.number_sexual_partners}
                onChange={(e) => handleInputChange('number_sexual_partners', parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Spouse/Partner Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="true"
                  checked={patientData.partner_circumcised === true}
                  onChange={() => handleInputChange('partner_circumcised', true)}
                  className="mr-2"
                />
                Circumcised
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="false"
                  checked={patientData.partner_circumcised === false}
                  onChange={() => handleInputChange('partner_circumcised', false)}
                  className="mr-2"
                />
                Uncircumcised
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">STI History</h5>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.sti_history_client}
                  onChange={(e) => handleInputChange('sti_history_client', e.target.checked)}
                  className="mr-2"
                />
                Client has STI history
              </label>
              {patientData.sti_history_client && (
                <input
                  type="text"
                  value={patientData.sti_history_client_details}
                  onChange={(e) => handleInputChange('sti_history_client_details', e.target.value)}
                  placeholder="Specify client STI details"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                />
              )}
            </div>

            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.sti_history_partner}
                  onChange={(e) => handleInputChange('sti_history_partner', e.target.checked)}
                  className="mr-2"
                />
                Partner has STI history
              </label>
              {patientData.sti_history_partner && (
                <input
                  type="text"
                  value={patientData.sti_history_partner_details}
                  onChange={(e) => handleInputChange('sti_history_partner_details', e.target.value)}
                  placeholder="Specify partner STI details"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                />
              )}
            </div>
          </div>
        </div>

        {/* C. Family and Social History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">C. Family and Social History</h3>
          
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Family History</h5>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.family_history_cancer}
                  onChange={(e) => handleInputChange('family_history_cancer', e.target.checked)}
                  className="mr-2"
                />
                Family history of cancer
              </label>
              {patientData.family_history_cancer && (
                <textarea
                  value={patientData.family_history_details}
                  onChange={(e) => handleInputChange('family_history_details', e.target.value)}
                  placeholder="Specify family history details"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                  rows={2}
                />
              )}
            </div>

            <div>
              <h5 className="text-sm font-semibold text-gray-700 mb-2">Smoking History</h5>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.smoking}
                  onChange={(e) => handleInputChange('smoking', e.target.checked)}
                  className="mr-2"
                />
                Smoking history
              </label>
              {patientData.smoking && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year Started
                    </label>
                    <input
                      type="number"
                      value={patientData.smoking_year_started}
                      onChange={(e) => handleInputChange('smoking_year_started', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1900"
                      max="2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cigarette Sticks per Day
                    </label>
                    <input
                      type="number"
                      value={patientData.cigarettes_per_day}
                      onChange={(e) => handleInputChange('cigarettes_per_day', parseInt(e.target.value) || 0)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* D. Medical History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">D. Medical History</h3>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.current_medication}
                  onChange={(e) => handleInputChange('current_medication', e.target.checked)}
                  className="mr-2"
                />
                Current medication
              </label>
              {patientData.current_medication && (
                <textarea
                  value={patientData.current_medication_details}
                  onChange={(e) => handleInputChange('current_medication_details', e.target.value)}
                  placeholder="Specify current medications"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                  rows={2}
                />
              )}
            </div>

            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.allergies}
                  onChange={(e) => handleInputChange('allergies', e.target.checked)}
                  className="mr-2"
                />
                Allergies
              </label>
              {patientData.allergies && (
                <textarea
                  value={patientData.allergies_details}
                  onChange={(e) => handleInputChange('allergies_details', e.target.value)}
                  placeholder="Specify allergies"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                  rows={2}
                />
              )}
            </div>

            <div>
              <label className="flex items-center mb-2">
                <input
                  type="checkbox"
                  checked={patientData.abdominal_surgery}
                  onChange={(e) => handleInputChange('abdominal_surgery', e.target.checked)}
                  className="mr-2"
                />
                History of abdominal surgery
              </label>
              {patientData.abdominal_surgery && (
                <textarea
                  value={patientData.abdominal_surgery_details}
                  onChange={(e) => handleInputChange('abdominal_surgery_details', e.target.value)}
                  placeholder="Specify abdominal surgery details"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ml-6"
                  rows={2}
                />
              )}
            </div>
          </div>
        </div>

        {/* III. Physical Examination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">III. Physical Examination</h2>
          
          {/* Vital Signs */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Vital Signs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={patientData.blood_pressure}
                  onChange={(e) => handleInputChange('blood_pressure', e.target.value)}
                  placeholder="120/80"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temperature (°C)
                </label>
                <input
                  type="number"
                  value={patientData.temperature}
                  onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Heart Rate (bpm)
                </label>
                <input
                  type="number"
                  value={patientData.heart_rate}
                  onChange={(e) => handleInputChange('heart_rate', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Respiratory Rate
                </label>
                <input
                  type="number"
                  value={patientData.respiratory_rate}
                  onChange={(e) => handleInputChange('respiratory_rate', parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Anthropometric */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Anthropometric</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={patientData.height}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={patientData.weight}
                  onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  BMI (calculated)
                </label>
                <input
                  type="number"
                  value={patientData.bmi}
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Physical Examination Findings */}
          <div className="space-y-6">
            {/* Skin */}
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">Skin</h3>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.skin_pallor}
                    onChange={(e) => handleInputChange('skin_pallor', e.target.checked)}
                    className="mr-2"
                  />
                  Pallor
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.skin_rashes}
                    onChange={(e) => handleInputChange('skin_rashes', e.target.checked)}
                    className="mr-2"
                  />
                  Rashes
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.skin_jaundice}
                    onChange={(e) => handleInputChange('skin_jaundice', e.target.checked)}
                    className="mr-2"
                  />
                  Jaundice
                </label>
              </div>
            </div>

            {/* HEENT */}
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">HEENT</h3>
              <div className="flex flex-wrap gap-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.anicteric_sclerae}
                    onChange={(e) => handleInputChange('anicteric_sclerae', e.target.checked)}
                    className="mr-2"
                  />
                  Anicteric sclerae
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.aural_discharge}
                    onChange={(e) => handleInputChange('aural_discharge', e.target.checked)}
                    className="mr-2"
                  />
                  Aural discharge
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={patientData.nasal_discharge}
                    onChange={(e) => handleInputChange('nasal_discharge', e.target.checked)}
                    className="mr-2"
                  />
                  Nasal discharge
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Neck Findings
                </label>
                <input
                  type="text"
                  value={patientData.neck_findings}
                  onChange={(e) => handleInputChange('neck_findings', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* For Healthcare Providers Only */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-orange-800 mb-3">
                For Doctors/Trained Health Care Providers
              </h3>
              
              {/* Chest and Lungs */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Chest and Lungs</h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.clear_breath_sounds}
                      onChange={(e) => handleInputChange('clear_breath_sounds', e.target.checked)}
                      className="mr-2"
                    />
                    Clear breath sounds
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.crackles_rales}
                      onChange={(e) => handleInputChange('crackles_rales', e.target.checked)}
                      className="mr-2"
                    />
                    Crackles/Rales
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.wheezes}
                      onChange={(e) => handleInputChange('wheezes', e.target.checked)}
                      className="mr-2"
                    />
                    Wheezes
                  </label>
                </div>
              </div>

              {/* Heart */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Heart</h4>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.normal_heart_rate}
                      onChange={(e) => handleInputChange('normal_heart_rate', e.target.checked)}
                      className="mr-2"
                    />
                    Normal rate
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.regular_rhythm}
                      onChange={(e) => handleInputChange('regular_rhythm', e.target.checked)}
                      className="mr-2"
                    />
                    Regular rhythm
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.murmur}
                      onChange={(e) => handleInputChange('murmur', e.target.checked)}
                      className="mr-2"
                    />
                    Murmur
                  </label>
                </div>
              </div>

              {/* Abdomen */}
              <div className="mb-4">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Abdomen</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.abdominal_scars}
                      onChange={(e) => handleInputChange('abdominal_scars', e.target.checked)}
                      className="mr-2"
                    />
                    Scars
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.stretch_marks}
                      onChange={(e) => handleInputChange('stretch_marks', e.target.checked)}
                      className="mr-2"
                    />
                    Stretch marks
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.abdominal_mass}
                      onChange={(e) => handleInputChange('abdominal_mass', e.target.checked)}
                      className="mr-2"
                    />
                    Presence of mass
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.enlarged_liver}
                      onChange={(e) => handleInputChange('enlarged_liver', e.target.checked)}
                      className="mr-2"
                    />
                    Enlarged liver
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.abdominal_tenderness}
                      onChange={(e) => handleInputChange('abdominal_tenderness', e.target.checked)}
                      className="mr-2"
                    />
                    Tenderness
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.fluid_wave}
                      onChange={(e) => handleInputChange('fluid_wave', e.target.checked)}
                      className="mr-2"
                    />
                    Presence of fluid wave
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Breast Examination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Breast Examination</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">General Findings</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.breast_mass}
                  onChange={(e) => handleInputChange('breast_mass', e.target.checked)}
                  className="mr-2"
                />
                Mass
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.nipple_discharge}
                  onChange={(e) => handleInputChange('nipple_discharge', e.target.checked)}
                  className="mr-2"
                />
                Nipple Discharge
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.skin_orange_peel}
                  onChange={(e) => handleInputChange('skin_orange_peel', e.target.checked)}
                  className="mr-2"
                />
                Skin-orange peel or dimpling
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.enlarged_lymph_nodes}
                  onChange={(e) => handleInputChange('enlarged_lymph_nodes', e.target.checked)}
                  className="mr-2"
                />
                Enlarged axillary lymph nodes
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Right Breast Findings
              </label>
              <textarea
                value={patientData.breast_findings_right}
                onChange={(e) => handleInputChange('breast_findings_right', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Left Breast Findings
              </label>
              <textarea
                value={patientData.breast_findings_left}
                onChange={(e) => handleInputChange('breast_findings_left', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Pelvic Examination */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Pelvic Examination</h2>
          
          {/* Vulva */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Vulva</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_inflammation}
                  onChange={(e) => handleInputChange('vulva_inflammation', e.target.checked)}
                  className="mr-2"
                />
                Redness (inflammation)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_tenderness}
                  onChange={(e) => handleInputChange('vulva_tenderness', e.target.checked)}
                  className="mr-2"
                />
                Tenderness
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_ulcers}
                  onChange={(e) => handleInputChange('vulva_ulcers', e.target.checked)}
                  className="mr-2"
                />
                Ulcers (blisters)
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_warts}
                  onChange={(e) => handleInputChange('vulva_warts', e.target.checked)}
                  className="mr-2"
                />
                Warts
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_cyst}
                  onChange={(e) => handleInputChange('vulva_cyst', e.target.checked)}
                  className="mr-2"
                />
                Cyst
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vulva_skin_tags}
                  onChange={(e) => handleInputChange('vulva_skin_tags', e.target.checked)}
                  className="mr-2"
                />
                Skin tags
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Mass
              </label>
              <input
                type="text"
                value={patientData.vulva_other_mass}
                onChange={(e) => handleInputChange('vulva_other_mass', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Bartholin's and Skene's glands */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Bartholin's and Skene's Glands</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.bartholin_swelling}
                  onChange={(e) => handleInputChange('bartholin_swelling', e.target.checked)}
                  className="mr-2"
                />
                Swelling
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.bartholin_tenderness}
                  onChange={(e) => handleInputChange('bartholin_tenderness', e.target.checked)}
                  className="mr-2"
                />
                Tenderness
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.bartholin_discharge}
                  onChange={(e) => handleInputChange('bartholin_discharge', e.target.checked)}
                  className="mr-2"
                />
                Discharge
              </label>
            </div>
          </div>

          {/* Speculum Exam */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Speculum Exam</h3>
            <div className="space-y-2 mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vaginal_cervical_lesion}
                  onChange={(e) => handleInputChange('vaginal_cervical_lesion', e.target.checked)}
                  className="mr-2"
                />
                Vaginal or cervical lesion
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vaginal_tears}
                  onChange={(e) => handleInputChange('vaginal_tears', e.target.checked)}
                  className="mr-2"
                />
                Tears
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={patientData.vaginal_ulcers}
                  onChange={(e) => handleInputChange('vaginal_ulcers', e.target.checked)}
                  className="mr-2"
                />
                Ulcers
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Other Abnormalities
              </label>
              <textarea
                value={patientData.vaginal_other_abnormalities}
                onChange={(e) => handleInputChange('vaginal_other_abnormalities', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* For Medical Providers */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-orange-800 mb-3">
              For Doctors/Trained Health Care Providers
            </h3>
            
            <div className="space-y-4">
              {/* Bimanual Exam */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">Bimanual Exam</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Size, shape, position of uterus
                  </label>
                  <input
                    type="text"
                    value={patientData.uterus_size_shape_position}
                    onChange={(e) => handleInputChange('uterus_size_shape_position', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.cervical_motion_tenderness}
                      onChange={(e) => handleInputChange('cervical_motion_tenderness', e.target.checked)}
                      className="mr-2"
                    />
                    Cervical motion tenderness
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.adnexal_masses}
                      onChange={(e) => handleInputChange('adnexal_masses', e.target.checked)}
                      className="mr-2"
                    />
                    Adnexal masses or tenderness
                  </label>
                </div>
              </div>

              {/* Recto-vaginal */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-2">
                  Recto-vaginal (if the bimanual is confusing)
                </h4>
                <textarea
                  value={patientData.rectovaginal_findings}
                  onChange={(e) => handleInputChange('rectovaginal_findings', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* VI. Screening Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">VI. Screening Results</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* VIA Findings */}
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">A. VIA Findings</h3>
              <div className="space-y-3">
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="positive"
                      checked={patientData.via_findings_positive}
                      onChange={(e) => {
                        handleInputChange('via_findings_positive', e.target.checked);
                        if (e.target.checked) handleInputChange('via_findings_negative', false);
                      }}
                      className="mr-2"
                    />
                    Positive
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="negative"
                      checked={patientData.via_findings_negative}
                      onChange={(e) => {
                        handleInputChange('via_findings_negative', e.target.checked);
                        if (e.target.checked) handleInputChange('via_findings_positive', false);
                      }}
                      className="mr-2"
                    />
                    Negative
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outline of SCJ
                  </label>
                  <input
                    type="text"
                    value={patientData.via_scj_outline}
                    onChange={(e) => handleInputChange('via_scj_outline', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    White Epithelium
                  </label>
                  <input
                    type="text"
                    value={patientData.via_white_epithelium}
                    onChange={(e) => handleInputChange('via_white_epithelium', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Cervical Os
                  </label>
                  <input
                    type="text"
                    value={patientData.via_cervical_os}
                    onChange={(e) => handleInputChange('via_cervical_os', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Suspect Lesions
                  </label>
                  <textarea
                    value={patientData.via_suspect_lesions}
                    onChange={(e) => handleInputChange('via_suspect_lesions', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Other Test Results */}
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-3">B. Other Screening Results</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Pap Smear Result
                  </label>
                  <input
                    type="text"
                    value={patientData.current_pap_smear_result}
                    onChange={(e) => handleInputChange('current_pap_smear_result', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current HPV DNA Result
                  </label>
                  <input
                    type="text"
                    value={patientData.current_hpv_dna_result}
                    onChange={(e) => handleInputChange('current_hpv_dna_result', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current CBE Result
                  </label>
                  <input
                    type="text"
                    value={patientData.current_cbe_result}
                    onChange={(e) => handleInputChange('current_cbe_result', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current VIA Result
                  </label>
                  <input
                    type="text"
                    value={patientData.current_via_result}
                    onChange={(e) => handleInputChange('current_via_result', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VII. Referral */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">VII. Referral</h2>
          
          <div className="space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={patientData.referral_needed}
                onChange={(e) => handleInputChange('referral_needed', e.target.checked)}
                className="mr-2"
              />
              Referral needed (Accomplish Cervical Cancer Referral Form)
            </label>

            {patientData.referral_needed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referral Details
                </label>
                <textarea
                  value={patientData.referral_details}
                  onChange={(e) => handleInputChange('referral_details', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Specify referral details, reason, and instructions"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Save size={20} className="mr-2" />
            {loading ? 'Saving...' : 'Save Patient Record'}
          </button>
        </div>
      </form>
    </div>
  );
}