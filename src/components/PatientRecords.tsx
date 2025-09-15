import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface Patient {
  id: string;
  client_name: string;
  client_address: string;
  date_of_birth: string;
  civil_status: string;
  created_at: string;
  barangays?: {
    name: string;
    municipality: string;
    province: string;
  };
}

export function PatientRecords() {
  const { profile } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, [profile]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('patients')
        .select(`
          *,
          barangays:barangay_id (
            name,
            municipality,
            province
          )
        `)
        .order('created_at', { ascending: false });

      // Apply barangay filter for non-admin users
      if (profile?.role === 'barangay' && profile.barangay_id) {
        query = query.eq('barangay_id', profile.barangay_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(patient =>
    patient.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.client_address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const viewPatientDetails = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          barangays:barangay_id (
            name,
            municipality,
            province
          )
        `)
        .eq('id', patientId)
        .single();

      if (error) throw error;
      setSelectedPatient(data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error fetching patient details:', error);
    }
  };

  const PatientDetailsModal = () => {
    if (!selectedPatient || !showDetails) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Patient Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <div className="w-6 h-6 flex items-center justify-center">×</div>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <p className="text-gray-900">{selectedPatient.client_name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Address:</span>
                  <p className="text-gray-900">{selectedPatient.client_address}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
                  <p className="text-gray-900">
                    {formatDate(selectedPatient.date_of_birth)} (Age: {calculateAge(selectedPatient.date_of_birth)})
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Civil Status:</span>
                  <p className="text-gray-900 capitalize">{selectedPatient.civil_status?.replace('_', ' ')}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Number of Children:</span>
                  <p className="text-gray-900">{selectedPatient.number_of_children}</p>
                </div>
                {profile?.role === 'admin' && selectedPatient.barangays && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Barangay:</span>
                    <p className="text-gray-900">
                      {selectedPatient.barangays.name}, {selectedPatient.barangays.municipality}, {selectedPatient.barangays.province}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Screening Results */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Screening Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPatient.current_via_result && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">VIA Result:</span>
                    <p className="text-gray-900">{selectedPatient.current_via_result}</p>
                  </div>
                )}
                {selectedPatient.current_pap_smear_result && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Pap Smear Result:</span>
                    <p className="text-gray-900">{selectedPatient.current_pap_smear_result}</p>
                  </div>
                )}
                {selectedPatient.current_hpv_dna_result && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">HPV DNA Result:</span>
                    <p className="text-gray-900">{selectedPatient.current_hpv_dna_result}</p>
                  </div>
                )}
                {selectedPatient.current_cbe_result && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">CBE Result:</span>
                    <p className="text-gray-900">{selectedPatient.current_cbe_result}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Physical Examination */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">Physical Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedPatient.blood_pressure && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Blood Pressure:</span>
                    <p className="text-gray-900">{selectedPatient.blood_pressure}</p>
                  </div>
                )}
                {selectedPatient.height > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Height:</span>
                    <p className="text-gray-900">{selectedPatient.height} cm</p>
                  </div>
                )}
                {selectedPatient.weight > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Weight:</span>
                    <p className="text-gray-900">{selectedPatient.weight} kg</p>
                  </div>
                )}
                {selectedPatient.bmi > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">BMI:</span>
                    <p className="text-gray-900">{selectedPatient.bmi}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Medical History */}
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Medical History</h3>
              <div className="space-y-2">
                {selectedPatient.family_history_cancer && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Family History of Cancer:</span>
                    <p className="text-gray-900">Yes - {selectedPatient.family_history_details}</p>
                  </div>
                )}
                {selectedPatient.smoking && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Smoking:</span>
                    <p className="text-gray-900">
                      Yes - Started in {selectedPatient.smoking_year_started}, {selectedPatient.cigarettes_per_day} sticks/day
                    </p>
                  </div>
                )}
                {selectedPatient.current_medication && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Current Medications:</span>
                    <p className="text-gray-900">{selectedPatient.current_medication_details}</p>
                  </div>
                )}
                {selectedPatient.allergies && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Allergies:</span>
                    <p className="text-gray-900">{selectedPatient.allergies_details}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Referral */}
            {selectedPatient.referral_needed && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-orange-800 mb-3">Referral</h3>
                <p className="text-gray-900">{selectedPatient.referral_details}</p>
              </div>
            )}

            <div className="text-sm text-gray-500">
              <p>Record created on: {formatDate(selectedPatient.created_at)}</p>
              {selectedPatient.updated_at !== selectedPatient.created_at && (
                <p>Last updated: {formatDate(selectedPatient.updated_at)}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Patient Records</h1>
        <p className="text-gray-600">
          {profile?.role === 'admin' ? 'All patient records across BARMM' : 'Patient records from your barangay'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search patients by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Patient Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Civil Status
                </th>
                {profile?.role === 'admin' && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barangay
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Registered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={profile?.role === 'admin' ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? 'No patients found matching your search.' : 'No patient records found.'}
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{patient.client_name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {patient.client_address}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {calculateAge(patient.date_of_birth)}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">
                      {patient.civil_status?.replace('_', ' ')}
                    </td>
                    {profile?.role === 'admin' && (
                      <td className="px-4 py-3 text-gray-600">
                        {patient.barangays ? 
                          `${patient.barangays.name}, ${patient.barangays.municipality}` : 
                          'N/A'
                        }
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(patient.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewPatientDetails(patient.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Details Modal */}
      <PatientDetailsModal />
    </div>
  );
}