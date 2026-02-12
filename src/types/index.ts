export interface Profile {
    id: string;
    user_id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    roles?: {
        slug: string;
    };
    created_at: string;
}

export interface Club {
    id: string;
    name: string;
    slug: string;
    category: string;
    short_description: string;
    long_description?: string;
    logo_url?: string;
    banner_url?: string;
    website_url?: string;
    social_facebook?: string;
    social_instagram?: string;
    social_twitter?: string;
    email?: string;
    phone?: string;
    is_verified: boolean;
    is_active: boolean;
    website_clicks: number;
    created_by: string;
    created_at: string;
}

export interface ClubRequest {
    id: string;
    club_name: string;
    category: string;
    description: string;
    status: 'pending' | 'approved' | 'rejected';
    contact_name: string;
    contact_email: string;
    website_url?: string;
    social_facebook?: string;
    social_instagram?: string;
    social_twitter?: string;
    requested_by: string;
    reviewed_at?: string;
    reviewed_by?: string;
    review_notes?: string;
    created_at: string;
}

export interface ClubMember {
    id: string;
    club_id: string;
    user_id: string;
    is_admin: boolean;
    joined_at: string;
    profile?: Profile;
}

export interface ClubEvent {
    id: string;
    club_id: string;
    title: string;
    description?: string;
    start_time: string;
    end_time?: string;
    location?: string;
    is_online: boolean;
    is_published: boolean;
    registration_url?: string;
    image_url?: string;
    created_by: string;
    created_at: string;
    clubs?: {
        name: string;
        slug: string;
    };
}

export interface ClubUpdate {
    id: string;
    club_id: string;
    title: string;
    body: string;
    type: string;
    is_published: boolean;
    is_pinned: boolean;
    redirect_url?: string;
    published_at: string;
    created_by: string;
    created_at: string;
    clubs?: {
        name: string;
        slug: string;
    };
}

export interface AuthContextType {
    user: import('@supabase/supabase-js').User | null;
    profile: Profile | null;
    role: string | null;
    loading: boolean;
    signOut: () => Promise<void>;
}
