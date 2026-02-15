import { useEffect, useState } from 'react';
import { Save, Plus, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

interface AdminSettings {
  id: string;
  current_student_batches: string[];
  updated_at: string;
}

export default function Settings() {
  const { isAdmin } = useAuth();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBatch, setNewBatch] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data as AdminSettings);
      } else {
        const insertData: Database['public']['Tables']['admin_settings']['Insert'] = {
          current_student_batches: [],
        };

        const { data: newSettings, error: createError } = await supabase
          .from('admin_settings')
          .insert(insertData)
          .select()
          .maybeSingle();

        if (createError) throw createError;
        if (newSettings) {
          setSettings(newSettings as AdminSettings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBatch = () => {
    if (!newBatch.trim()) return;

    if (!settings) return;

    if (settings.current_student_batches.includes(newBatch.trim())) {
      setMessage('This batch is already added');
      return;
    }

    setSettings({
      ...settings,
      current_student_batches: [...settings.current_student_batches, newBatch.trim()],
    });
    setNewBatch('');
    setMessage('');
  };

  const handleRemoveBatch = (batch: string) => {
    if (!settings) return;

    setSettings({
      ...settings,
      current_student_batches: settings.current_student_batches.filter(b => b !== batch),
    });
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setMessage('');

    try {
      const updateData: Database['public']['Tables']['admin_settings']['Update'] = {
        current_student_batches: settings.current_student_batches,
      };

      const { error } = await supabase
        .from('admin_settings')
        .update(updateData)
        .eq('id', settings.id);

      if (error) throw error;

      setMessage('Settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Access Denied</h2>
          <p className="text-gray-600">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Error</h2>
          <p className="text-gray-600">Unable to load settings. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Admin Settings</h1>
        <p className="text-gray-600 mb-8">Configure system-wide settings for STATA</p>

        <div className="bg-white rounded-lg shadow-md p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('success')
                ? 'bg-[#2ECC71] text-white'
                : 'bg-[#E74C3C] text-white'
            }`}>
              {message}
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1F2A44] mb-4">Current Student Batches</h2>
            <p className="text-gray-600 mb-6">
              Define which batches are considered current students. Users with batches not in this list will be marked as alumni.
            </p>

            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={newBatch}
                onChange={(e) => setNewBatch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddBatch()}
                placeholder="e.g., 2024, 2023"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
              />
              <button
                onClick={handleAddBatch}
                className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add
              </button>
            </div>

            {settings.current_student_batches.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {settings.current_student_batches.map((batch) => (
                  <div
                    key={batch}
                    className="bg-[#F5F7FA] border border-[#2F5BEA] rounded-lg p-4 flex items-center justify-between"
                  >
                    <span className="font-medium text-[#1F2A44]">{batch}</span>
                    <button
                      onClick={() => handleRemoveBatch(batch)}
                      className="text-[#E74C3C] hover:text-[#C0392B] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#FFF3CD] border border-[#F39C12] rounded-lg p-4 mb-6 text-[#1F2A44]">
                No batches configured. All users will be marked as alumni.
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              <Save className="w-5 h-5 mr-2" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h3 className="text-lg font-semibold text-[#1F2A44] mb-4">How it works</h3>
            <ul className="space-y-2 text-gray-600 list-disc list-inside">
              <li>Add batch years that should be marked as "Current Students"</li>
              <li>All other batches will automatically be marked as "Alumni"</li>
              <li>This status is computed when users sign up or view profiles</li>
              <li>Changes apply to all users immediately</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
