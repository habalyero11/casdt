import React, { useState, useEffect } from 'react';
import { Users, FileText, Activity, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface DashboardStats {
  totalPatients: number;
  viaScreenings: number;
  hpvDnaScreenings: number;
  papSmearScreenings: number;
  cbeScreenings: number;
}

interface AgeGroupFilters {
  'all': string;
  '15-29': string;
  '30-49': string;
  '50-60': string;
  '60+': string;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    viaScreenings: 0,
    hpvDnaScreenings: 0,
    papSmearScreenings: 0,
    cbeScreenings: 0,
  });
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<keyof AgeGroupFilters>('all');
  const [loading, setLoading] = useState(true);

  const ageGroupFilters: AgeGroupFilters = {
    'all': 'All Ages',
    '15-29': 'Age 15–29',
    '30-49': 'Age 30–49',
    '50-60': 'Age 50–60',
    '60+': 'Age 60+',
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [selectedAgeGroup, profile]);

  const getAgeFilter = () => {
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (selectedAgeGroup) {
      case '15-29':
        return `date_of_birth >= '${currentYear - 29}-01-01' AND date_of_birth <= '${currentYear - 15}-12-31'`;
      case '30-49':
        return `date_of_birth >= '${currentYear - 49}-01-01' AND date_of_birth <= '${currentYear - 30}-12-31'`;
      case '50-60':
        return `date_of_birth >= '${currentYear - 60}-01-01' AND date_of_birth <= '${currentYear - 50}-12-31'`;
      case '60+':
        return `date_of_birth <= '${currentYear - 60}-12-31'`;
      default:
        return null;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('patients')
        .select('*');

      // Apply barangay filter for non-admin users
      if (profile?.role === 'barangay' && profile.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id);
      }

      // Apply age filter
      const ageFilter = getAgeFilter();
      if (ageFilter) {
        query = query.or(ageFilter);
      }

      const { data: patients, error } = await query;

      if (error) throw error;

      if (patients) {
        const totalPatients = patients.length;
        
        const viaScreenings = patients.filter(p => 
          p.current_via_result || p.via_findings_positive || p.via_findings_negative
        ).length;
        
        const hpvDnaScreenings = patients.filter(p => 
          p.current_hpv_dna_result || p.hpv_dna_result
        ).length;
        
        const papSmearScreenings = patients.filter(p => 
          p.current_pap_smear_result || p.pap_smear_result
        ).length;
        
        const cbeScreenings = patients.filter(p => 
          p.current_cbe_result || p.cbe_result
        ).length;

        setStats({
          totalPatients,
          viaScreenings,
          hpvDnaScreenings,
          papSmearScreenings,
          cbeScreenings,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Patients',
      value: stats.totalPatients,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'VIA Screenings',
      value: stats.viaScreenings,
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      title: 'HPV-DNA Tests',
      value: stats.hpvDnaScreenings,
      icon: Activity,
      color: 'bg-purple-500',
    },
    {
      title: 'Pap Smear Tests',
      value: stats.papSmearScreenings,
      icon: AlertCircle,
      color: 'bg-orange-500',
    },
    {
      title: 'CBE Screenings',
      value: stats.cbeScreenings,
      icon: FileText,
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {profile?.role === 'admin' ? 'Regional Dashboard' : 'Barangay Dashboard'}
        </h1>
        <p className="text-gray-600">
          Cancer screening program overview and statistics
        </p>
      </div>

      {/* Age Group Filters */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter by Age Group</h3>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ageGroupFilters) as Array<keyof AgeGroupFilters>).map((key) => (
            <button
              key={key}
              onClick={() => setSelectedAgeGroup(key)}
              className={`
                px-4 py-2 rounded-lg font-medium transition-colors
                ${selectedAgeGroup === key
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {ageGroupFilters[key]}
            </button>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {statCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.color}`}>
                  <card.icon size={24} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Additional Information */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">About BARMM CASDT</h3>
        <p className="text-blue-800">
          The Client Assessment, Screening, Diagnosis and Treatment (CASDT) system helps track 
          and manage cancer screening programs across BARMM. This dashboard shows screening 
          statistics {selectedAgeGroup !== 'all' ? `for ${ageGroupFilters[selectedAgeGroup].toLowerCase()}` : 'for all age groups'}.
        </p>
      </div>
    </div>
  );
}