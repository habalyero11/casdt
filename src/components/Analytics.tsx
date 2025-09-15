import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface AnalyticsData {
  totalPatients: number;
  totalBarangays: number;
  screeningsByType: {
    via: number;
    papSmear: number;
    hpvDna: number;
    cbe: number;
  };
  ageGroupBreakdown: {
    '15-29': number;
    '30-49': number;
    '50-60': number;
    '60+': number;
  };
  positiveFindings: {
    via: number;
    cervicalLesions: number;
    breastMass: number;
    familyHistory: number;
  };
  referrals: number;
  monthlyRegistrations: Array<{
    month: string;
    count: number;
  }>;
}

export function Analytics() {
  const { profile } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalPatients: 0,
    totalBarangays: 0,
    screeningsByType: {
      via: 0,
      papSmear: 0,
      hpvDna: 0,
      cbe: 0,
    },
    ageGroupBreakdown: {
      '15-29': 0,
      '30-49': 0,
      '50-60': 0,
      '60+': 0,
    },
    positiveFindings: {
      via: 0,
      cervicalLesions: 0,
      breastMass: 0,
      familyHistory: 0,
    },
    referrals: 0,
    monthlyRegistrations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [profile]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Base query for patients
      let patientsQuery = supabase.from('patients').select('*');
      
      // Apply barangay filter for non-admin users
      if (profile?.role === 'barangay' && profile.barangay_id) {
        patientsQuery = patientsQuery.eq('barangay_id', profile.barangay_id);
      }

      const { data: patients, error: patientsError } = await patientsQuery;
      if (patientsError) throw patientsError;

      // Get barangays count (admin only)
      let totalBarangays = 0;
      if (profile?.role === 'admin') {
        const { data: barangays, error: barangaysError } = await supabase
          .from('barangays')
          .select('id');
        if (barangaysError) throw barangaysError;
        totalBarangays = barangays?.length || 0;
      }

      if (patients) {
        // Calculate analytics
        const totalPatients = patients.length;

        // Screening counts
        const screeningsByType = {
          via: patients.filter(p => p.current_via_result || p.via_findings_positive || p.via_findings_negative).length,
          papSmear: patients.filter(p => p.current_pap_smear_result || p.pap_smear_result).length,
          hpvDna: patients.filter(p => p.current_hpv_dna_result || p.hpv_dna_result).length,
          cbe: patients.filter(p => p.current_cbe_result || p.cbe_result).length,
        };

        // Age group breakdown
        const ageGroupBreakdown = {
          '15-29': 0,
          '30-49': 0,
          '50-60': 0,
          '60+': 0,
        };

        const today = new Date();
        const currentYear = today.getFullYear();

        patients.forEach(patient => {
          const birthYear = new Date(patient.date_of_birth).getFullYear();
          const age = currentYear - birthYear;

          if (age >= 15 && age <= 29) {
            ageGroupBreakdown['15-29']++;
          } else if (age >= 30 && age <= 49) {
            ageGroupBreakdown['30-49']++;
          } else if (age >= 50 && age <= 60) {
            ageGroupBreakdown['50-60']++;
          } else if (age > 60) {
            ageGroupBreakdown['60+']++;
          }
        });

        // Positive findings
        const positiveFindings = {
          via: patients.filter(p => p.via_findings_positive).length,
          cervicalLesions: patients.filter(p => p.vaginal_cervical_lesion).length,
          breastMass: patients.filter(p => p.breast_mass).length,
          familyHistory: patients.filter(p => p.family_history_cancer).length,
        };

        // Referrals
        const referrals = patients.filter(p => p.referral_needed).length;

        // Monthly registrations (last 6 months)
        const monthlyRegistrations = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          
          const count = patients.filter(p => {
            const createdAt = new Date(p.created_at);
            return createdAt >= monthStart && createdAt <= monthEnd;
          }).length;

          monthlyRegistrations.push({
            month: date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
            count,
          });
        }

        setAnalyticsData({
          totalPatients,
          totalBarangays,
          screeningsByType,
          ageGroupBreakdown,
          positiveFindings,
          referrals,
          monthlyRegistrations,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          {profile?.role === 'admin' 
            ? 'Comprehensive analytics across all BARMM regions' 
            : 'Analytics for your barangay cancer screening program'
          }
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Patients</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalPatients}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        {profile?.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Barangays</p>
                <p className="text-3xl font-bold text-gray-900">{analyticsData.totalBarangays}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <BarChart3 size={24} className="text-green-600" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">VIA Screenings</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.screeningsByType.via}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <FileText size={24} className="text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Referrals</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.referrals}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100">
              <TrendingUp size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Screening Types */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Screening Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">VIA</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalPatients > 0 ? (analyticsData.screeningsByType.via / analyticsData.totalPatients) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.screeningsByType.via}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pap Smear</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalPatients > 0 ? (analyticsData.screeningsByType.papSmear / analyticsData.totalPatients) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.screeningsByType.papSmear}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">HPV DNA</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalPatients > 0 ? (analyticsData.screeningsByType.hpvDna / analyticsData.totalPatients) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.screeningsByType.hpvDna}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">CBE</span>
              <div className="flex items-center">
                <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                  <div 
                    className="bg-orange-600 h-2 rounded-full" 
                    style={{ 
                      width: `${analyticsData.totalPatients > 0 ? (analyticsData.screeningsByType.cbe / analyticsData.totalPatients) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium">{analyticsData.screeningsByType.cbe}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Age Group Breakdown */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Age Group Distribution</h3>
          <div className="space-y-4">
            {Object.entries(analyticsData.ageGroupBreakdown).map(([ageGroup, count]) => (
              <div key={ageGroup} className="flex items-center justify-between">
                <span className="text-gray-600">Age {ageGroup}</span>
                <div className="flex items-center">
                  <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-teal-600 h-2 rounded-full" 
                      style={{ 
                        width: `${analyticsData.totalPatients > 0 ? (count / analyticsData.totalPatients) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Positive Findings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Factors & Positive Findings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">VIA Positive</span>
              <span className="text-sm font-medium bg-red-100 text-red-800 px-2 py-1 rounded">
                {analyticsData.positiveFindings.via}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Cervical Lesions</span>
              <span className="text-sm font-medium bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                {analyticsData.positiveFindings.cervicalLesions}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Breast Mass</span>
              <span className="text-sm font-medium bg-orange-100 text-orange-800 px-2 py-1 rounded">
                {analyticsData.positiveFindings.breastMass}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Family History of Cancer</span>
              <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {analyticsData.positiveFindings.familyHistory}
              </span>
            </div>
          </div>
        </div>

        {/* Monthly Registration Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Trend (6 Months)</h3>
          <div className="space-y-3">
            {analyticsData.monthlyRegistrations.map((month) => (
              <div key={month.month} className="flex items-center justify-between">
                <span className="text-gray-600">{month.month}</span>
                <div className="flex items-center">
                  <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full" 
                      style={{ 
                        width: `${Math.max(...analyticsData.monthlyRegistrations.map(m => m.count)) > 0 ? (month.count / Math.max(...analyticsData.monthlyRegistrations.map(m => m.count))) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{month.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Key Insights</h3>
        <div className="space-y-2 text-blue-800">
          <p>• {analyticsData.screeningsByType.via > 0 ? `${((analyticsData.screeningsByType.via / analyticsData.totalPatients) * 100).toFixed(1)}%` : '0%'} of patients have received VIA screening</p>
          <p>• {analyticsData.positiveFindings.via > 0 ? `${analyticsData.positiveFindings.via} patients` : 'No patients'} have positive VIA results requiring follow-up</p>
          <p>• {analyticsData.positiveFindings.familyHistory > 0 ? `${((analyticsData.positiveFindings.familyHistory / analyticsData.totalPatients) * 100).toFixed(1)}%` : '0%'} of patients have family history of cancer</p>
          <p>• {analyticsData.referrals > 0 ? `${analyticsData.referrals} patients` : 'No patients'} have been referred for further evaluation</p>
        </div>
      </div>
    </div>
  );
}