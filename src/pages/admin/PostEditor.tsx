import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database } from '../../lib/database.types';

export default function PostEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingPost, setLoadingPost] = useState(!!id);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
  });

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          title: data.title,
          content: data.content,
          image_url: data.image_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading post:', error);
      alert('Failed to load post');
      navigate('/admin/posts');
    } finally {
      setLoadingPost(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const updateData: Database['public']['Tables']['posts']['Update'] = {
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url || null,
        };

        const { error } = await supabase
          .from('posts')
          .update(updateData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const insertData: Database['public']['Tables']['posts']['Insert'] = {
          title: formData.title,
          content: formData.content,
          image_url: formData.image_url || null,
          author_id: user!.id,
        };

        const { error } = await supabase
          .from('posts')
          .insert(insertData);

        if (error) throw error;
      }

      navigate('/admin/posts');
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  if (loadingPost) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate('/admin/posts')}
          className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Posts
        </button>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-[#1F2A44] mb-6">
            {id ? 'Edit Post' : 'Create New Post'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Post Title
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                placeholder="Enter post title..."
              />
            </div>

            <div>
              <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL (Optional)
              </label>
              <input
                type="url"
                id="image_url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                placeholder="https://example.com/image.jpg"
              />
              {formData.image_url && (
                <div className="mt-4">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full max-h-64 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/800x400?text=Invalid+Image+URL';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Write your post content here..."
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/admin/posts')}
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
                {loading ? 'Saving...' : id ? 'Update Post' : 'Create Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
