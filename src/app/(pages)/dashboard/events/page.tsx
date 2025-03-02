'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import EventList from '@/components/Events/EventList';
import EventView from '@/components/Events/EventView';

export default function Events() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <EventList 
            onSelectEvent={handleSelectEvent}
            selectedEventId={selectedEventId}
          />
        </div>
        <div className="md:col-span-2">
          <EventView eventId={selectedEventId} />
        </div>
      </div>
    </div>
  );
}
