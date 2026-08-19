import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Tracks how many study activities have been posted (by other members) since
 * the user last opened the feed, driving the "new activities" badge on the
 * feed shortcut. The "last seen" marker is stored on the user's profile so it
 * stays in sync across devices.
 */
export const useNewActivities = () => {
  const { user } = useAuth();
  const [newCount, setNewCount] = useState(0);
  const [seenAt, setSeenAt] = useState<string | null>(null);

  const fetchSeenAt = useCallback(async () => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('activities_seen_at')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching activities_seen_at:', error);
      return null;
    }

    setSeenAt(data.activities_seen_at);
    return data.activities_seen_at;
  }, [user]);

  const fetchNewCount = useCallback(
    async (since: string | null) => {
      if (!user || !since) return;

      // RLS restricts study_activities to the user's groups, so this count
      // only reflects activities the user can actually see in the feed.
      const { count, error } = await supabase
        .from('study_activities')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', since)
        .neq('user_id', user.id);

      if (error) {
        console.error('Error counting new activities:', error);
        return;
      }

      setNewCount(count || 0);
    },
    [user]
  );

  useEffect(() => {
    if (!user) {
      setNewCount(0);
      setSeenAt(null);
      return;
    }

    let currentSince: string | null = null;

    const init = async () => {
      currentSince = await fetchSeenAt();
      await fetchNewCount(currentSince);
    };

    void init();

    const channel = supabase
      .channel('new-activities')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'study_activities' },
        () => fetchNewCount(currentSince)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchSeenAt, fetchNewCount]);

  /** Mark the feed as seen: resets the badge and persists the timestamp. */
  const markActivitiesSeen = useCallback(async () => {
    if (!user) return;

    setNewCount(0);
    const now = new Date().toISOString();
    setSeenAt(now);

    const { error } = await supabase
      .from('profiles')
      .update({ activities_seen_at: now })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating activities_seen_at:', error);
    }
  }, [user]);

  return { newCount, markActivitiesSeen };
};
