import { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, Award, Edit2, Save, X, Upload, Phone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadProfilePicture, deleteProfilePicture } from '../lib/imageUpload';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userStatus, setUserStatus] = useState<'student' | 'alumni'>('student');
  const [formData, setFormData] = useState({
    full_name: '',
    batch: '',
    phone_number: '',
    country_code: '+880',
    bio: '',
    job_title: '',
    designation: '',
    address: '',
    avatar_url: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        batch: profile.batch || '',
        phone_number: profile.phone_number || '',
        country_code: profile.country_code || '+880',
        bio: profile.bio || '',
        job_title: profile.job_title || '',
        designation: profile.designation || '',
        address: profile.address || '',
        avatar_url: profile.avatar_url || '',
      });
      setPreviewImage(profile.avatar_url || null);
      fetchUserStatus();
    }
  }, [profile]);

  const fetchUserStatus = async () => {
    try {
      if (!profile?.batch) return;

      const { data: settings } = await supabase
        .from('admin_settings')
        .select('current_student_batches')
        .maybeSingle();

      const currentBatches = (settings as { current_student_batches: string[] } | null)?.current_student_batches || [];
      const status = currentBatches.includes(profile.batch) ? 'student' : 'alumni';
      setUserStatus(status);
    } catch (error) {
      console.error('Error fetching user status:', error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      const publicUrl = await uploadProfilePicture(file, user!.id);
      setFormData({ ...formData, avatar_url: publicUrl });
      setMessage('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Failed to upload image. Please try again.');
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('Are you sure you want to delete your profile picture?')) return;

    try {
      await deleteProfilePicture(user!.id);
      setPreviewImage(null);
      setFormData({ ...formData, avatar_url: '' });
      setMessage('Profile picture deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      setMessage('Failed to delete profile picture.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone_number: formData.phone_number,
          country_code: formData.country_code,
          bio: formData.bio,
          job_title: formData.job_title || null,
          designation: formData.designation || null,
          address: formData.address || null,
          avatar_url: formData.avatar_url || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (!profile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] h-32"></div>
          <div className="px-8 pb-8">
            <div className="flex items-start justify-between -mt-16 mb-4">
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {previewImage ? (
                    <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-16 h-16 text-[#2F5BEA]" />
                  )}
                </div>
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-[#2F5BEA] hover:bg-[#F39C12] text-white p-2 rounded-full transition-colors"
                  >
                    <Upload className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="mt-20 bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <button
                  onClick={() => setEditing(false)}
                  className="mt-20 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('success') || message.includes('deleted')
                  ? 'bg-[#2ECC71] text-white'
                  : 'bg-[#E74C3C] text-white'
              }`}>
                {message}
              </div>
            )}

            {!editing ? (
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">
                    {profile.full_name}
                  </h1>
                  <div className="flex items-center gap-3">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Mail className="w-5 h-5 text-[#2F5BEA]" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{profile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-gray-600">
                    <Calendar className="w-5 h-5 text-[#2F5BEA]" />
                    <div>
                      <p className="text-sm text-gray-500">Batch</p>
                      <p className="font-medium">{profile.batch}</p>
                    </div>
                  </div>

                  {profile.phone_number && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Phone className="w-5 h-5 text-[#2F5BEA]" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{profile.country_code} {profile.phone_number}</p>
                      </div>
                    </div>
                  )}

                  {userStatus === 'alumni' && profile.job_title && (
                    <div className="flex items-center space-x-3 text-gray-600">
                      <Award className="w-5 h-5 text-[#2F5BEA]" />
                      <div>
                        <p className="text-sm text-gray-500">Job Title</p>
                        <p className="font-medium">{profile.job_title}</p>
                      </div>
                    </div>
                  )}
                </div>

                {profile.address && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-[#1F2A44] mb-2">Address</h3>
                    <p className="text-gray-600">{profile.address}</p>
                  </div>
                )}

                {profile.bio && (
                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-[#1F2A44] mb-2">Bio</h3>
                    <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="batch" className="block text-sm font-medium text-gray-700 mb-2">
                      Batch
                    </label>
                    <input
                      type="text"
                      id="batch"
                      name="batch"
                      value={formData.batch}
                      disabled
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                    />
                    <p className="text-xs text-gray-500 mt-1">Cannot be changed</p>
                  </div>

                  <div>
                    <label htmlFor="country_code" className="block text-sm font-medium text-gray-700 mb-2">
                      Country Code
                    </label>
                    <select
                      id="country_code"
                      name="country_code"
                      value={formData.country_code}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                    >
                      <option value="+880">+880 (Bangladesh)</option>
                      <option value="+1">+1 (USA)</option>
                      <option value="+44">+44 (UK)</option>
                      <option value="+91">+91 (India)</option>
                      <option value="+92">+92 (Pakistan)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  />
                </div>

                {userStatus === 'alumni' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          id="job_title"
                          name="job_title"
                          value={formData.job_title}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                          placeholder="e.g., Software Engineer"
                        />
                      </div>

                      <div>
                        <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                          Designation
                        </label>
                        <input
                          type="text"
                          id="designation"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                          placeholder="e.g., Senior Analyst"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                    placeholder="Your address"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {previewImage && (
                  <div className="flex items-center justify-between bg-[#F5F7FA] p-4 rounded-lg">
                    <span className="text-sm text-gray-600">Profile picture selected</span>
                    <button
                      type="button"
                      onClick={handleDeleteImage}
                      className="text-[#E74C3C] hover:text-[#C0392B] font-medium transition-colors"
                    >
                      Delete Image
                    </button>
                  </div>
                )}

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
