import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Calendar, Users, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [stats, setStats] = useState({
    posts: 0,
    events: 0,
    users: 0,
  });

  useEffect(() => {
    if (isAdmin) {
      loadStats();
    }
  }, [isAdmin]);

  const loadStats = async () => {
    try {
      const [postsResult, eventsResult, usersResult] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);

      setStats({
        posts: postsResult.count || 0,
        events: eventsResult.count || 0,
        users: usersResult.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your STATA website content</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#2F5BEA] rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-[#1F2A44]">{stats.posts}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Total Posts</h3>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#2ECC71] rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-[#1F2A44]">{stats.events}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Total Events</h3>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#F39C12] rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-[#1F2A44]">{stats.users}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/admin/posts"
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-[#2F5BEA] rounded-lg flex items-center justify-center group-hover:bg-[#F39C12] transition-colors">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#F39C12] transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Manage Posts</h2>
            <p className="text-gray-600">Create, edit, and delete blog posts and announcements</p>
          </Link>

          <Link
            to="/admin/events"
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-[#2ECC71] rounded-lg flex items-center justify-center group-hover:bg-[#F39C12] transition-colors">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <Plus className="w-6 h-6 text-gray-400 group-hover:text-[#F39C12] transition-colors" />
            </div>
            <h2 className="text-2xl font-bold text-[#1F2A44] mb-2">Manage Events</h2>
            <p className="text-gray-600">Create and manage STATA events and activities</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
