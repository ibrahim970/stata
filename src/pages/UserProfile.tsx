import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Award, Phone, MapPin, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<'student' | 'alumni'>('student');

  useEffect(() => {
    if (userId) {
      loadProfile();
    }
  }, [userId]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        navigate('/');
        return;
      }

      setProfile(data);
      await fetchUserStatus(data.batch);
    } catch (error) {
      console.error('Error loading profile:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStatus = async (batch: string | null) => {
    try {
      if (!batch) return;

      const { data: settings } = await supabase
        .from('admin_settings')
        .select('current_student_batches')
        .maybeSingle();

      const currentBatches = settings?.current_student_batches || [];
      const status = currentBatches.includes(batch) ? 'student' : 'alumni';
      setUserStatus(status);
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-4">Profile not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-[#2F5BEA] hover:text-[#F39C12] font-semibold"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-start -mt-16 mb-8">
              <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-16 h-16 text-[#2F5BEA]" />
                )}
              </div>
              <div className="ml-6 mt-8 flex-grow">
                <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">
                  {profile.full_name}
                </h1>
                <div className="flex items-center gap-3 flex-wrap">
                  {profile.role === 'admin' && (
                    <span className="inline-block bg-[#F39C12] text-white text-sm px-3 py-1 rounded-full font-medium">
                      Admin
                    </span>
                  )}
                  <span className={`inline-block text-sm px-3 py-1 rounded-full font-medium ${
                    userStatus === 'student'
                      ? 'bg-[#2ECC71] text-white'
                      : 'bg-[#2F5BEA] text-white'
                  }`}>
                    {userStatus === 'student' ? 'Current Student' : 'Alumni'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                  <Mail className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-700">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                  <Calendar className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Batch</p>
                    <p className="font-medium text-gray-700">{profile.batch}</p>
                  </div>
                </div>

                {profile.phone_number && (
                  <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                    <Phone className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium text-gray-700">{profile.country_code} {profile.phone_number}</p>
                    </div>
                  </div>
                )}

                {userStatus === 'alumni' && profile.job_title && (
                  <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                    <Award className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Job Title</p>
                      <p className="font-medium text-gray-700">{profile.job_title}</p>
                    </div>
                  </div>
                )}

                {userStatus === 'alumni' && profile.designation && (
                  <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                    <Award className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Designation</p>
                      <p className="font-medium text-gray-700">{profile.designation}</p>
                    </div>
                  </div>
                )}

                {profile.address && (
                  <div className="flex items-center space-x-3 bg-[#F5F7FA] p-4 rounded-lg">
                    <MapPin className="w-5 h-5 text-[#2F5BEA] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium text-gray-700">{profile.address}</p>
                    </div>
                  </div>
                )}
              </div>

              {profile.bio && (
                <div className="bg-[#F5F7FA] p-6 rounded-lg border-l-4 border-[#2F5BEA]">
                  <h3 className="font-semibold text-[#1F2A44] mb-3">About</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
