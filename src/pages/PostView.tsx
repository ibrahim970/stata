import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Send, ArrowLeft, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Database } from '../lib/database.types';

type Post = Database['public']['Tables']['posts']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

type Comment = Database['public']['Tables']['comments']['Row'] & {
  profiles: Database['public']['Tables']['profiles']['Row'];
};

export default function PostView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
      loadComments();
      loadLikes();
    }
  }, [id]);

  const loadPost = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*)')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        navigate('/');
        return;
      }
      setPost(data as Post);
    } catch (error) {
      console.error('Error loading post:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, profiles(*)')
        .eq('post_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data as Comment[]);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const loadLikes = async () => {
    if (!id) return;
    try {
      const { data, error} = await supabase
        .from('likes')
        .select('user_id')
        .eq('post_id', id);

      if (error) throw error;
      setLikes(data.map(like => like.user_id));
    } catch (error) {
      console.error('Error loading likes:', error);
    }
  };

  const handleLike = async () => {
    if (!user || !id) {
      navigate('/login');
      return;
    }

    const isLiked = likes.includes(user.id);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setLikes(likes.filter(userId => userId !== user.id));
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({
            post_id: id,
            user_id: user.id,
          });

        if (error) throw error;
        setLikes([...likes, user.id]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || !id) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: id,
          user_id: user.id,
          content: newComment.trim(),
        });

      if (error) throw error;

      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  const isLiked = user && likes.includes(user.id);

  return (
    <div className="min-h-[calc(100vh-4rem)] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-[#2F5BEA] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <article className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-96 object-cover"
            />
          )}
          <div className="p-8">
            <h1 className="text-4xl font-bold text-[#1F2A44] mb-4">{post.title}</h1>
            <div className="flex items-center text-gray-600 mb-6">
              <span className="font-medium">{post.profiles.full_name}</span>
              <span className="mx-2">•</span>
              <span>{new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {post.content}
            </div>
          </div>

          <div className="border-t border-gray-200 px-8 py-4">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleLike}
                className={`flex items-center space-x-2 ${
                  isLiked ? 'text-[#E74C3C]' : 'text-gray-600 hover:text-[#E74C3C]'
                } transition-colors`}
              >
                <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{likes.length}</span>
              </button>
              <div className="flex items-center space-x-2 text-gray-600">
                <MessageCircle className="w-6 h-6" />
                <span className="font-medium">{comments.length}</span>
              </div>
            </div>
          </div>
        </article>

        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">
            Comments ({comments.length})
          </h2>

          {user ? (
            <form onSubmit={handleCommentSubmit} className="mb-8">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="flex-grow">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="mt-2 bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-8 bg-[#F5F7FA] p-4 rounded-lg text-center">
              <p className="text-gray-600">
                Please <a href="/login" className="text-[#2F5BEA] hover:text-[#F39C12] font-medium">login</a> to comment.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {comments.length > 0 ? (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <div className="w-10 h-10 bg-[#2F5BEA] rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-medium">
                      {comment.profiles.full_name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-grow">
                    <div className="bg-[#F5F7FA] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-[#1F2A44]">
                          {comment.profiles.full_name}
                        </span>
                        {user && (user.id === comment.user_id || profile?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-gray-400 hover:text-[#E74C3C] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment.content}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(comment.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
