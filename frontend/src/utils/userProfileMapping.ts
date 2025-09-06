
import { client } from '@/integrations/api/client';
import { UserProfile } from '@/types/database';

export const fetchUserProfiles = async (userIds: string[]): Promise<Record<string, UserProfile>> => {
  if (userIds.length === 0) return {};

  console.log('=== FETCHING USER PROFILES (SIMPLIFIED) ===');
  console.log('User IDs to fetch:', userIds);
  
  const { data: profilesData, error: profilesError } = await client
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds);

  console.log('=== PROFILES FETCH RESULT ===');
  console.log('Profiles data:', profilesData);
  console.log('Profiles error:', profilesError);
  
  const userProfilesMap: Record<string, UserProfile> = {};
  
  if (profilesError) {
    console.error('Profiles fetch error:', profilesError);
    return userProfilesMap;
  }
  
  if (profilesData && profilesData.length > 0) {
    profilesData.forEach(profile => {
      userProfilesMap[profile.id] = { 
        full_name: profile.full_name, 
        email: profile.email 
      };
      console.log(`✓ Mapped profile: ${profile.id} -> name: "${profile.full_name}", email: "${profile.email}"`);
    });
  }

  return userProfilesMap;
};

export const resolveUserName = (userId: string, userProfile: UserProfile | undefined, fallbackEmail?: string): string => {
  console.log(`=== USER NAME RESOLUTION (SIMPLIFIED) ===`);
  console.log(`User ID: ${userId}`);
  console.log(`Profile:`, userProfile);
  console.log(`Fallback email: ${fallbackEmail}`);
  
  // Priority 1: Use full_name if available and valid
  if (userProfile?.full_name && 
      userProfile.full_name.trim() !== '' && 
      userProfile.full_name !== 'null' &&
      userProfile.full_name.toLowerCase() !== 'unknown user') {
    const resolvedName = userProfile.full_name.trim();
    console.log(`✓ Using full_name: "${resolvedName}"`);
    return resolvedName;
  }
  
  // Priority 2: Use profile email if available
  if (userProfile?.email && 
      userProfile.email.trim() !== '' && 
      userProfile.email !== 'null') {
    const resolvedName = userProfile.email.trim();
    console.log(`✓ Using profile email: "${resolvedName}"`);
    return resolvedName;
  }
  
  // Priority 3: Use fallback email if provided
  if (fallbackEmail && 
      fallbackEmail.trim() !== '' && 
      fallbackEmail !== 'null') {
    const resolvedName = fallbackEmail.trim();
    console.log(`✓ Using fallback email: "${resolvedName}"`);
    return resolvedName;
  }
  
  console.log(`✗ No valid name found for user ${userId}, returning 'Unknown User'`);
  return 'Unknown User';
};
