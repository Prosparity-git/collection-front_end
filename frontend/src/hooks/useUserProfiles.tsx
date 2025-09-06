import { useState, useCallback, useRef } from 'react';
import { client } from '@/integrations/api/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
}

// Helper function to extract display name from email
export const extractDisplayNameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return email || 'Unknown User';
  }
  // Extract the part before @
  const localPart = email.split('@')[0];
  // Handle common email patterns
  if (localPart.includes('.')) {
    // Convert "john.doe" to "John Doe"
    return localPart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  } else if (localPart.includes('_')) {
    // Convert "john_doe" to "John Doe"
    return localPart
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  } else if (localPart.includes('-')) {
    // Convert "john-doe" to "John Doe"
    return localPart
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  } else {
    // Single word email, capitalize first letter
    return localPart.charAt(0).toUpperCase() + localPart.slice(1).toLowerCase();
  }
};

export const useUserProfiles = () => {
  const { user } = useAuth();
  const [profilesCache, setProfilesCache] = useState<Map<string, UserProfile>>(new Map());
  const [loading, setLoading] = useState(false);
  const fetchInProgressRef = useRef<Set<string>>(new Set());

  const fetchProfiles = useCallback(async (userIds: string[]) => {
    if (!user || userIds.length === 0) {
      console.log('No user or empty userIds, returning empty array');
      return [];
    }

    // Filter out user IDs that are already cached or currently being fetched
    const uncachedUserIds = userIds.filter(id => 
      !profilesCache.has(id) && !fetchInProgressRef.current.has(id)
    );
    
    if (uncachedUserIds.length === 0) {
      // Return cached profiles
      const cachedProfiles = userIds.map(id => profilesCache.get(id)).filter(Boolean) as UserProfile[];
      console.log('All profiles already cached, returning:', cachedProfiles.length);
      return cachedProfiles;
    }

    // Mark these IDs as being fetched
    uncachedUserIds.forEach(id => fetchInProgressRef.current.add(id));

    setLoading(true);
    try {
      console.log('=== FETCHING USER PROFILES ===');
      console.log('Fetching profiles for user IDs:', uncachedUserIds);
      
      const { data: profiles, error } = await client
        .from('profiles')
        .select('id, full_name, email')
        .in('id', uncachedUserIds);

      if (error) {
        console.error('Error fetching user profiles:', error);
        return [];
      }

      console.log('Fetched profiles from DB:', profiles);

      // Update cache with new profiles
      if (profiles && profiles.length > 0) {
        setProfilesCache(prevCache => {
          const newCache = new Map(prevCache);
          profiles.forEach(profile => {
            newCache.set(profile.id, profile);
            console.log(`✓ Cached profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
          });
          return newCache;
        });
      }

      // Return all requested profiles (both cached and newly fetched)
      const allProfiles = userIds.map(id => {
        const newProfile = profiles?.find(p => p.id === id);
        if (newProfile) return newProfile;
        return profilesCache.get(id);
      }).filter(Boolean) as UserProfile[];
      
      console.log('Returning total profiles:', allProfiles.length);
      return allProfiles;
    } catch (error) {
      console.error('Exception in fetchProfiles:', error);
      return [];
    } finally {
      // Remove IDs from fetch in progress
      uncachedUserIds.forEach(id => fetchInProgressRef.current.delete(id));
      setLoading(false);
    }
  }, [user, profilesCache]);

  const getUserName = useCallback((userId: string, fallbackEmail?: string): string => {
    const profile = profilesCache.get(userId);
    console.log(`=== GET USER NAME ===`);
    console.log(`User ID: ${userId}`);
    console.log(`Profile from cache:`, profile);
    console.log(`Fallback email: ${fallbackEmail}`);
    
    // Priority 1: Use full_name if available and valid
    if (profile?.full_name && 
        profile.full_name.trim() !== '' && 
        profile.full_name !== 'null' &&
        profile.full_name.toLowerCase() !== 'unknown user') {
      return profile.full_name.trim();
    }
    
    // Priority 2: Extract display name from profile email if available
    if (profile?.email && profile.email.trim() !== '' && profile.email !== 'null') {
      return extractDisplayNameFromEmail(profile.email.trim());
    }
    
    // Priority 3: Extract display name from fallback email if provided
    if (fallbackEmail && fallbackEmail.trim() !== '') {
      return extractDisplayNameFromEmail(fallbackEmail.trim());
    }
    
    console.log(`✗ Returning Unknown User for ${userId}`);
    return 'Unknown User';
  }, [profilesCache]);

  const clearCache = useCallback(() => {
    console.log('Clearing user profiles cache');
    setProfilesCache(new Map());
    fetchInProgressRef.current.clear();
  }, []);

  return {
    fetchProfiles,
    getUserName,
    profilesCache,
    loading,
    clearCache
  };
};
