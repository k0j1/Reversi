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
                const { error } = await supabase
                    .from('reversi_game_stats')
                    .select('fid')
                    .eq('fid', user.fid)
                    .maybeSingle();

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
                    address: user.custodyAddress,
                    verified_addresses: user.verifiedAddresses
                };

                // 1. farcaster_users テーブルへの同期
                const { data: existingUser } = await supabase
                    .from('farcaster_users')
                    .select('fid')
                    .eq('fid', user.fid)
                    .maybeSingle();
                
                if (existingUser) {
                    await supabase
                        .from('farcaster_users')
                        .update(profileData)
                        .eq('fid', user.fid);
                } else {
                    await supabase
                        .from('farcaster_users')
                        .insert(profileData);
                }

                // 2. reversi_game_stats テーブルへの同期（statsのみ）
                const { data: existingStats } = await supabase
                    .from('reversi_game_stats')
                    .select('fid')
                    .eq('fid', user.fid)
                    .maybeSingle();

                if (!existingStats) {
                    await supabase
                        .from('reversi_game_stats')
                        .insert({
                            fid: user.fid,
                            points: 0,
                            level_1: INITIAL_LEVEL_STATS,
                            level_2: INITIAL_LEVEL_STATS,
                            level_3: INITIAL_LEVEL_STATS,
                            level_4: INITIAL_LEVEL_STATS,
                            level_5: INITIAL_LEVEL_STATS
                        });
                }
            } catch (e) {
                console.warn("Unexpected error syncing user:", e);
                // Do not call onError here to avoid blocking startup
            }
        };

        syncUser();
    }, [user, connectedAddress, onError]);
};