import { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Calendar, X, Save, Upload } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { uploadEventImage } from '../../lib/imageUpload';
import { Database } from '../../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

const eventTypeLabels = {
  bbq: 'BBQ Party',
  iftar: 'Iftar Mahfil',
  tour: 'Tour',
  cricket: 'Cricket Tournament',
  football: 'Football Tournament',
  other: 'Other Event',
};

export default function ManageEvents() {
  const { isAdmin, user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'other' as Event['event_type'],
    gallery_images: '',
  });

  useEffect(() => {
    if (isAdmin) {
      loadEvents();
    }
  }, [isAdmin]);

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const eventData: Database['public']['Tables']['events']['Insert'] = {
      title: formData.title,
      description: formData.description,
      event_date: formData.event_date,
      event_type: formData.event_type,
      gallery_images: formData.gallery_images
        ? formData.gallery_images.split(',').map(url => url.trim()).filter(url => url)
        : [],
      created_by: user!.id,
    };

    try {
      if (editing) {
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', editing);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('events')
          .insert(eventData);

        if (error) throw error;
      }

      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_type: 'other',
        gallery_images: '',
      });
      setEditing(null);
      setShowForm(false);
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleEdit = (event: Event) => {
    setFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date.split('T')[0],
      event_type: event.event_type,
      gallery_images: event.gallery_images.join(', '),
    });
    setEditing(event.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setEvents(events.filter(event => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      event_type: 'other',
      gallery_images: '',
    });
    setEditing(null);
    setShowForm(false);
    setMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const publicUrl = await uploadEventImage(file, editing || 'new');
      const imageUrls = formData.gallery_images
        ? formData.gallery_images.split(',').map(u => u.trim())
        : [];
      imageUrls.push(publicUrl);
      setFormData({ ...formData, gallery_images: imageUrls.join(', ') });
      setMessage('Image uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2A44] mb-2">Manage Events</h1>
            <p className="text-gray-600">Create and manage STATA events and activities</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Event
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#1F2A44]">
                {editing ? 'Edit Event' : 'Create New Event'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {message && (
              <div className={`mb-6 p-4 rounded-lg ${
                message.includes('success')
                  ? 'bg-[#2ECC71] text-white'
                  : 'bg-[#E74C3C] text-white'
              }`}>
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="event_type" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Type
                  </label>
                  <select
                    id="event_type"
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value as Event['event_type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  >
                    {Object.entries(eventTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="event_date"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Images
                </label>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center mb-4"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="gallery_images_manual" className="block text-sm font-medium text-gray-700 mb-2">
                  Or paste image URLs (comma-separated)
                </label>
                <textarea
                  id="gallery_images_manual"
                  value={formData.gallery_images}
                  onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2F5BEA] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
                {formData.gallery_images && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-600 mb-2">Preview:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {formData.gallery_images.split(',').map((url, idx) => {
                        const trimmedUrl = url.trim();
                        return trimmedUrl ? (
                          <div key={idx} className="relative">
                            <img
                              src={trimmedUrl}
                              alt={`Gallery ${idx + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                              onError={(e) => {
                                e.currentTarget.src = 'https://via.placeholder.com/200x150?text=Invalid';
                              }}
                            />
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#2F5BEA] hover:bg-[#F39C12] text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {editing ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                {event.gallery_images && event.gallery_images.length > 0 && (
                  <img
                    src={event.gallery_images[0]}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#2F5BEA]">
                      {eventTypeLabels[event.event_type]}
                    </span>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-[#1F2A44] mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-[#2ECC71] hover:bg-[#27AE60] text-white rounded-lg font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="flex-1 flex items-center justify-center px-4 py-2 bg-[#E74C3C] hover:bg-[#C0392B] text-white rounded-lg font-medium transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 mb-4">No events yet. Create your first event!</p>
          </div>
        )}
      </div>
    </div>
  );
}
