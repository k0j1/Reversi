
import { useState, useEffect, useCallback } from 'react';
import sdk from '@farcaster/frame-sdk';
import { FarcasterUser } from '../types';

export const useFarcaster = () => {
  const [user, setUser] = useState<FarcasterUser | undefined>();
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);

  // Initialize Farcaster Context
  useEffect(() => {
    const loadContext = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          const u = context.user as any;
          setUser({
            fid: context.user.fid,
            username: context.user.username ?? "",
            displayName: context.user.displayName ?? "",
            pfpUrl: context.user.pfpUrl ?? "",
            custodyAddress: u.custodyAddress,
            verifiedAddresses: u.verifiedAddresses,
          });
        }
        sdk.actions.ready();
      } catch (e) {
        console.error("Error loading Farcaster context:", e);
        sdk.actions.ready();
      }
    };

    if (sdk && !isSDKLoaded) {
      setIsSDKLoaded(true);
      loadContext();
    }
  }, [isSDKLoaded]);

  // Wallet Connection Logic
  const connectWallet = useCallback(async () => {
    try {
      const safeSdk = sdk as any;
      let provider = safeSdk.wallet?.ethProvider || safeSdk.actions?.ethProvider;

      // Fallback to window.ethereum for browser testing
      if (!provider && (window as any).ethereum) {
        provider = (window as any).ethereum;
      }

      if (!provider) {
        console.error("No wallet provider found.");
        // If no provider is available, we can't "connect", but we can fallback to known addresses for display
        // This fallback logic is handled in the return value or UI layer
        if (user?.verifiedAddresses?.[0]) {
            setConnectedAddress(user.verifiedAddresses[0]);
        } else if (user?.custodyAddress) {
            setConnectedAddress(user.custodyAddress);
        }
        return;
      }

      const result = await provider.request({ method: 'eth_requestAccounts' });
      if (result && Array.isArray(result) && result.length > 0) {
        setConnectedAddress(result[0]);
      }
    } catch (e) {
      console.error("Failed to connect wallet", e);
      // Fallback on error
      if (user?.verifiedAddresses?.[0]) {
        setConnectedAddress(user.verifiedAddresses[0]);
      }
    }
  }, [user]);

  return {
    user,
    isSDKLoaded,
    connectedAddress,
    connectWallet
  };
};