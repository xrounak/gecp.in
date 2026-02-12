import { supabase } from './supabase';

export interface NotificationParams {
    userId: string;
    clubId: string;
    type: 'notification_club_approved' | 'notification_club_rejected' | 'notification_event_created' | 'notification_join_approved' | 'notification_join_rejected' | 'notification_admin_promoted';
    title: string;
    message: string;
    link?: string;
}

/**
 * Creates a notification using the existing `updates` table
 * Notifications are distinguished by type prefix 'notification_'
 */
export async function createNotification({
    userId,
    clubId,
    type,
    title,
    message,
    link
}: NotificationParams) {
    try {
        const { error } = await supabase.from('updates').insert({
            club_id: clubId,
            type: type,
            title: title,
            body: message,
            redirect_url: link || null,
            is_published: true,
            is_pinned: false,
            created_by: userId
        });

        if (error) {
            console.error('Error creating notification:', error);
            return { success: false, error };
        }

        return { success: true };
    } catch (err) {
        console.error('Unexpected error creating notification:', err);
        return { success: false, error: err };
    }
}

/**
 * Fetches notifications for a specific user
 * Returns updates where type starts with 'notification_'
 */
export async function getUserNotifications(_userId: string, limit = 10) {
    try {
        const { data, error } = await supabase
            .from('updates')
            .select('*, clubs(name, slug)')
            .ilike('type', 'notification_%')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching notifications:', error);
            return { data: [], error };
        }

        return { data: data || [], error: null };
    } catch (err) {
        console.error('Unexpected error fetching notifications:', err);
        return { data: [], error: err };
    }
}

/**
 * Notifies all subscribers of a club about a new event
 */
export async function notifyClubSubscribers(clubId: string, clubName: string, eventTitle: string, eventId: string) {
    try {
        // Get all subscribers
        const { data: subscribers, error: subError } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('club_id', clubId);

        if (subError) {
            console.error('Error fetching subscribers:', subError);
            return { success: false, error: subError };
        }

        if (!subscribers || subscribers.length === 0) {
            return { success: true, message: 'No subscribers to notify' };
        }

        // Create notification for each subscriber
        const notifications = subscribers.map(sub => ({
            club_id: clubId,
            type: 'notification_event_created',
            title: 'New Event',
            body: `${clubName} posted a new event: ${eventTitle}`,
            redirect_url: `/events/${eventId}`,
            is_published: true,
            is_pinned: false,
            created_by: sub.user_id
        }));

        const { error: insertError } = await supabase
            .from('updates')
            .insert(notifications);

        if (insertError) {
            console.error('Error creating subscriber notifications:', insertError);
            return { success: false, error: insertError };
        }

        return { success: true, count: subscribers.length };
    } catch (err) {
        console.error('Unexpected error notifying subscribers:', err);
        return { success: false, error: err };
    }
}
