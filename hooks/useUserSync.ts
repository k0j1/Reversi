import { useEffect } from 'react';
import { FarcasterUser } from '../types';
import { supabase } from '../lib/supabase';
import { INITIAL_LEVEL_STATS } from '../constants';

export const useUserSync = (
    user: FarcasterUser | undefined, 
    connectedAddress: string | null,
    onError: (error: any) => void
) => {
    useEffect(() => {
        if (!user) return;

        const syncUser = async () => {
            try {
                // Check if user exists to decide between update (profile only) or insert (init stats)
                const { data: existing, error } = await supabase
                    .from('reversi_game_stats')
                    .select('fid')
                    .eq('fid', user.fid)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.warn("User sync check failed (offline?):", error);
                    // Do not block app with onError for background sync issues
                    return;
                }

                const profileData = {
                    fid: user.fid,
                    username: user.username,
                    display_name: user.displayName,
                    pfp_url: user.pfpUrl,
                    custody_address: user.custodyAddress,
                    verified_addresses: user.verifiedAddresses
                    // connected_address removed to fix schema error
                };

                if (existing) {
                    // User exists: Update profile info only to preserve stats/points
                    const { error: updateError } = await supabase
                        .from('reversi_game_stats')
                        .update(profileData)
                        .eq('fid', user.fid);
                    
                    if (updateError) {
                        console.warn("Failed to update user profile:", updateError);
                    } else {
                        console.log("User profile synced to Supabase");
                    }
                } else {
                    // New user: Insert with initial stats (split into level columns)
                    const { error: insertError } = await supabase
                        .from('reversi_game_stats')
                        .insert({
                            ...profileData,
                            points: 0,
                            level_1: INITIAL_LEVEL_STATS,
                            level_2: INITIAL_LEVEL_STATS,
                            level_3: INITIAL_LEVEL_STATS,
                            level_4: INITIAL_LEVEL_STATS,
                            level_5: INITIAL_LEVEL_STATS
                        });

                    if (insertError) {
                         console.warn("Failed to create new user record:", insertError);
                    } else {
                        console.log("New user record created in Supabase");
                    }
                }
            } catch (e) {
                console.warn("Unexpected error syncing user:", e);
                // Do not call onError here to avoid blocking startup
            }
        };

        syncUser();
    }, [user, connectedAddress, onError]);
};