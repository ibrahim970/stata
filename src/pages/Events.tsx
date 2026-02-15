import { useEffect, useState } from 'react';
import { Calendar, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Event = Database['public']['Tables']['events']['Row'];

const eventTypeColors = {
  bbq: 'bg-[#F39C12]',
  iftar: 'bg-[#2ECC71]',
  tour: 'bg-[#2F5BEA]',
  cricket: 'bg-[#E74C3C]',
  football: 'bg-[#9B59B6]',
  other: 'bg-[#34495E]',
};

const eventTypeLabels = {
  bbq: 'BBQ Party',
  iftar: 'Iftar Mahfil',
  tour: 'Tour',
  cricket: 'Cricket Tournament',
  football: 'Football Tournament',
  other: 'Other Event',
};

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadEvents();
  }, []);

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

  const filteredEvents = filter === 'all'
    ? events
    : events.filter(event => event.event_type === filter);

  const upcomingEvents = filteredEvents.filter(event =>
    new Date(event.event_date) >= new Date()
  );
  const pastEvents = filteredEvents.filter(event =>
    new Date(event.event_date) < new Date()
  );

  return (
    <div>
      <section className="bg-gradient-to-r from-[#1F2A44] to-[#2F5BEA] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Events & Activities</h1>
          <p className="text-lg md:text-xl text-gray-200">
            Join us in creating memorable experiences and building lasting friendships
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-[#1F2A44] mb-4">Filter Events</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-[#2F5BEA] text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Events
            </button>
            {Object.entries(eventTypeLabels).map(([type, label]) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === type
                    ? 'bg-[#2F5BEA] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#2F5BEA] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {upcomingEvents.length > 0 && (
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">Upcoming Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {pastEvents.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-[#1F2A44] mb-6">Past Events</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastEvents.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            )}

            {filteredEvents.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">No events found for this category.</p>
              </div>
            )}
          </>
        )}
      </section>

      <section className="bg-gradient-to-r from-[#2ECC71] to-[#2F5BEA] py-16 px-4">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Want to Organize an Event?</h2>
          <p className="text-lg mb-8">
            If you have ideas for events or want to get involved in organizing activities, we'd love to hear from you!
          </p>
          <a
            href="/contact"
            className="bg-white text-[#2F5BEA] px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Contact Us
          </a>
        </div>
      </section>
    </div>
  );
}

function EventCard({ event }: { event: Event }) {
  const eventDate = new Date(event.event_date);
  const isUpcoming = eventDate >= new Date();

  return (
    <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
      {event.gallery_images && event.gallery_images.length > 0 && (
        <img
          src={event.gallery_images[0]}
          alt={event.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span
            className={`${eventTypeColors[event.event_type]} text-white text-xs px-3 py-1 rounded-full font-medium`}
          >
            {eventTypeLabels[event.event_type]}
          </span>
          {isUpcoming && (
            <span className="bg-[#2ECC71] text-white text-xs px-3 py-1 rounded-full font-medium">
              Upcoming
            </span>
          )}
        </div>
        <h3 className="text-xl font-semibold text-[#1F2A44] mb-3">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{eventDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}</span>
        </div>
      </div>
    </div>
  );
}
