import { useEffect, useState } from 'react';
import { Save, Plus, X, Edit2, Trash2, Users, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FormerLeader = Database['public']['Tables']['former_leaders']['Row'];

const committeePositions = [
  { value: '', label: 'None' },
  { value: 'president', label: 'President' },
  { value: 'general_secretary', label: 'General Secretary' },
  { value: 'vice_president', label: 'Vice President' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'sports_secretary', label: 'Sports Secretary' },
  { value: 'cultural_secretary', label: 'Cultural Secretary' },
];

export default function ManagePeople() {
  const { isAdmin } = useAuth();
  const [members, setMembers] = useState<Profile[]>([]);
  const [formerLeaders, setFormerLeaders] = useState<FormerLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [showLeaderForm, setShowLeaderForm] = useState(false);
  const [editingLeader, setEditingLeader] = useState<string | null>(null);
  const [leaderFormData, setLeaderFormData] = useState({
    member_id: '',
    position: 'president',
    term_start: '',
    term_end: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      const [profilesResult, leadersResult] = await Promise.all([
        supabase.from('profiles').select('*').order('batch', { ascending: true }),
        supabase.from('former_leaders').select('*').order('term_end', { ascending: false }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (leadersResult.error) throw leadersResult.error;

      setMembers(profilesResult.data || []);
      setFormerLeaders(leadersResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePositionChange = async (memberId: string, position: string) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ committee_position: position || null })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.map(m =>
        m.id === memberId ? { ...m, committee_position: position || null } : m
      ));
      setMessage('Committee position updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating position:', error);
      setMessage('Failed to update position');
    } finally {
      setSaving(false);
    }
  };

  const handleLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const selectedMember = members.find(m => m.id === leaderFormData.member_id);
      if (!selectedMember) {
        setMessage('Please select a valid member');
        setSaving(false);
        return;
      }

      const leaderData: Database['public']['Tables']['former_leaders']['Insert'] = {
        name: selectedMember.full_name,
        position: leaderFormData.position,
        term_start: leaderFormData.term_start,
        term_end: leaderFormData.term_end,
        batch: selectedMember.batch,
      };

      if (editingLeader) {
        const { error } = await supabase
          .from('former_leaders')
          .update(leaderData)
          .eq('id', editingLeader);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('former_leaders')
          .insert(leaderData);

        if (error) throw error;
      }

      setLeaderFormData({ member_id: '', position: 'president', term_start: '', term_end: '' });
      setEditingLeader(null);
      setShowLeaderForm(false);
      loadData();
      setMessage('Former leader saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving leader:', error);
      setMessage('Failed to save former leader');
    } finally {
      setSaving(false);
    }
  };

  const handleEditLeader = (leader: FormerLeader) => {
    const member = members.find(m => m.full_name === leader.name);
    setLeaderFormData({
      member_id: member?.id || '',
      position: leader.position,
      term_start: leader.term_start,
      term_end: leader.term_end,
    });
    setEditingLeader(leader.id);
    setShowLeaderForm(true);
  };

  const handleDeleteLeader = async (leaderId: string) => {
    if (!confirm('Are you sure you want to delete this former leader?')) return;

    try {
      const { error } = await supabase
        .from('former_leaders')
        .delete()
        .eq('id', leaderId);

      if (error) throw error;

      setFormerLeaders(formerLeaders.filter(l => l.id !== leaderId));
      setMessage('Former leader deleted successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting leader:', error);
      setMessage('Failed to delete former leader');
    }
  };

  const handleCancelLeaderForm = () => {
    setLeaderFormData({ member_id: '', position: 'president', term_start: '', term_end: '' });
    setEditingLeader(null);
    setShowLeaderForm(false);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Manage People</h1>
        <p className="text-gray-600 mb-8">Assign committee positions and manage former leaders</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success')
              ? 'bg-[#2ECC71] text-white'
              : 'bg-[#E74C3C] text-white'
          }`}>
            {message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">Committee Positions</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F7FA] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Batch
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Committee Position
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-[#1F2A44]">{member.full_name}</div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {member.batch || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={member.committee_position || ''}
                        onChange={(e) => handlePositionChange(member.id, e.target.value)}
                        disabled={saving}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white text-sm"
                      >
                        {committeePositions.map((pos) => (
                          <option key={pos.value} value={pos.value}>
                            {pos.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#1F2A44]">Former Leaders</h2>
            {!showLeaderForm && (
              <button
                onClick={() => setShowLeaderForm(true)}
                className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Former Leader
              </button>
            )}
          </div>

          {showLeaderForm && (
            <form onSubmit={handleLeaderSubmit} className="mb-8 p-6 bg-[#F5F7FA] rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[#1F2A44]">
                  {editingLeader ? 'Edit Former Leader' : 'Add Former Leader'}
                </h3>
                <button
                  type="button"
                  onClick={handleCancelLeaderForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Member
                  </label>
                  <select
                    value={leaderFormData.member_id}
                    onChange={(e) => setLeaderFormData({ ...leaderFormData, member_id: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white"
                  >
                    <option value="">Choose a member...</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name} (Batch {member.batch || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <select
                    value={leaderFormData.position}
                    onChange={(e) => setLeaderFormData({ ...leaderFormData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  >
                    <option value="president">President</option>
                    <option value="general_secretary">General Secretary</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term Start
                  </label>
                  <input
                    type="text"
                    value={leaderFormData.term_start}
                    onChange={(e) => setLeaderFormData({ ...leaderFormData, term_start: e.target.value })}
                    required
                    placeholder="e.g., 2020"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term End
                  </label>
                  <input
                    type="text"
                    value={leaderFormData.term_end}
                    onChange={(e) => setLeaderFormData({ ...leaderFormData, term_end: e.target.value })}
                    required
                    placeholder="e.g., 2021"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={handleCancelLeaderForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving...' : editingLeader ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          )}

          {formerLeaders.length > 0 ? (
            <div className="space-y-4">
              {formerLeaders.map((leader) => (
                <div
                  key={leader.id}
                  className="flex items-center justify-between p-4 bg-[#F5F7FA] rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[#1F2A44]">{leader.name}</h3>
                    <p className="text-sm text-[#2F5BEA] font-medium">
                      {leader.position === 'president' ? 'President' : 'General Secretary'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Term: {leader.term_start} - {leader.term_end}
                      {leader.batch && ` • Batch ${leader.batch}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLeader(leader)}
                      className="p-2 text-[#2ECC71] hover:bg-[#2ECC71] hover:text-white rounded-lg transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteLeader(leader.id)}
                      className="p-2 text-[#E74C3C] hover:bg-[#E74C3C] hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No former leaders added yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
