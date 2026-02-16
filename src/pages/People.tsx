import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Filter, Award, Users as UsersIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { useAuth } from '../contexts/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FormerLeader = Database['public']['Tables']['former_leaders']['Row'];

type Category = 'all' | 'committee' | 'former';

const committeePositionLabels: Record<string, string> = {
  president: 'President',
  general_secretary: 'General Secretary',
  vice_president: 'Vice President',
  treasurer: 'Treasurer',
  sports_secretary: 'Sports Secretary',
  cultural_secretary: 'Cultural Secretary',
};

export default function People() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category>('all');
  const [members, setMembers] = useState<Profile[]>([]);
  const [formerLeaders, setFormerLeaders] = useState<FormerLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profilesResult, leadersResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .order('batch', { ascending: true }),
        supabase
          .from('former_leaders')
          .select('*')
          .order('term_end', { ascending: false }),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (leadersResult.error) throw leadersResult.error;

      setMembers(profilesResult.data || []);
      setFormerLeaders(leadersResult.data || []);

      const uniqueBatches = Array.from(
        new Set(
          profilesResult.data
            ?.map(p => p.batch)
            .filter(b => b !== null) as string[]
        )
      ).sort();
      setBatches(uniqueBatches);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMemberClick = (memberId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/user/${memberId}`);
  };

  const filteredMembers = members.filter(member => {
    if (selectedBatch !== 'all' && member.batch !== selectedBatch) {
      return false;
    }
    if (category === 'committee') {
      return member.committee_position !== null;
    }
    return true;
  });

  const committeeMembers = filteredMembers.filter(m => m.committee_position !== null);
  const allMembers = filteredMembers;

  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our People</h1>
          <p className="text-lg md:text-xl text-gray-200">
            Meet the members and leaders of STATA
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setCategory('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === 'all'
                  ? 'bg-[#2F5BEA] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Members
            </button>
            <button
              onClick={() => setCategory('committee')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === 'committee'
                  ? 'bg-[#2F5BEA] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Current Committee
            </button>
            <button
              onClick={() => setCategory('former')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                category === 'former'
                  ? 'bg-[#2F5BEA] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Former Leaders
            </button>
          </div>

          {category !== 'former' && (
            <div className="flex items-center gap-2 md:ml-auto">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all bg-white"
              >
                <option value="all">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    Batch {batch}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {category === 'committee' && (
              <div>
                <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">Current Committee</h2>
                {committeeMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {committeeMembers.map((member) => (
                      <MemberCard key={member.id} member={member} onClick={handleMemberClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No committee members assigned yet.</p>
                  </div>
                )}
              </div>
            )}

            {category === 'all' && (
              <div>
                <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">
                  All Members {selectedBatch !== 'all' && `- Batch ${selectedBatch}`}
                </h2>
                {allMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {allMembers.map((member) => (
                      <MemberCard key={member.id} member={member} onClick={handleMemberClick} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No members found for this batch.</p>
                  </div>
                )}
              </div>
            )}

            {category === 'former' && (
              <div>
                <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">Former Leaders</h2>
                {formerLeaders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formerLeaders.map((leader) => (
                      <FormerLeaderCard key={leader.id} leader={leader} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg">
                    <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No former leaders recorded yet.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function MemberCard({ member, onClick }: { member: Profile; onClick: (id: string) => void }) {
  return (
    <div
      onClick={() => onClick(member.id)}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
    >
      <div className="p-6">
        <div className="w-20 h-20 mx-auto mb-4 bg-[#2F5BEA] rounded-full flex items-center justify-center overflow-hidden">
          {member.avatar_url ? (
            <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-white" />
          )}
        </div>
        <h3 className="text-lg font-semibold text-[#1F2A44] text-center mb-2">
          {member.full_name}
        </h3>
        {member.committee_position && (
          <div className="bg-[#F39C12] text-white text-xs px-3 py-1 rounded-full text-center mb-2">
            {committeePositionLabels[member.committee_position] || member.committee_position}
          </div>
        )}
        {member.batch && (
          <p className="text-sm text-gray-600 text-center">Batch {member.batch}</p>
        )}
      </div>
    </div>
  );
}

function FormerLeaderCard({ leader }: { leader: FormerLeader }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-[#2F5BEA] rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-6 h-6 text-white" />
        </div>
        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-[#1F2A44] mb-1">{leader.name}</h3>
          <p className="text-[#2F5BEA] font-medium mb-2">
            {leader.position === 'president' ? 'President' : 'General Secretary'}
          </p>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Term: {leader.term_start} - {leader.term_end}</span>
            {leader.batch && (
              <>
                <span>•</span>
                <span>Batch {leader.batch}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
