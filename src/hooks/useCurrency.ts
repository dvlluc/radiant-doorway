import { useState, useEffect } from 'react';
import { getCurrencyFromLocation } from '@/utils/currency';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CurrencyInfo {
  symbol: string;
  code: string;
}

/**
 * Hook to get user's currency based on their profile location or IP geolocation
 * Priority: 1. User profile location, 2. IP-based geolocation, 3. Default USD
 */
export const useCurrency = () => {
  const { user } = useAuth();
  const [currency, setCurrency] = useState<CurrencyInfo>({ symbol: '$', code: 'USD' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        // Try to get location from user profile
        if (user) {
          // Try business profile first
          const { data: businessData } = await supabase
            .from('business_profiles')
            .select('address')
            .eq('user_id', user.id)
            .maybeSingle();

          if (businessData?.address) {
            const userCurrency = getCurrencyFromLocation(businessData.address);
            setCurrency(userCurrency);
            setLoading(false);
            return;
          }

          // Try brand profile
          const { data: brandData } = await supabase
            .from('brand_profiles')
            .select('address')
            .eq('user_id', user.id)
            .maybeSingle();

          if (brandData?.address) {
            const userCurrency = getCurrencyFromLocation(brandData.address);
            setCurrency(userCurrency);
            setLoading(false);
            return;
          }

          // Try charitable profile
          const { data: charityData } = await supabase
            .from('charitable_profiles')
            .select('address')
            .eq('user_id', user.id)
            .maybeSingle();

          if (charityData?.address) {
            const userCurrency = getCurrencyFromLocation(charityData.address);
            setCurrency(userCurrency);
            setLoading(false);
            return;
          }
        }

        // Fallback to IP-based geolocation
        const ipCurrency = await getIPBasedCurrency();
        setCurrency(ipCurrency);
      } catch (error) {
        console.error('Error fetching currency:', error);
        // Default to USD on error
        setCurrency({ symbol: '$', code: 'USD' });
      } finally {
        setLoading(false);
      }
    };

    fetchCurrency();
  }, [user]);

  return { currency, loading };
};

/**
 * Get currency based on IP geolocation
 */
const getIPBasedCurrency = async (): Promise<CurrencyInfo> => {
  try {
    // Use ipapi.co for free IP geolocation (no API key required)
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.country_name) {
      return getCurrencyFromLocation(data.country_name);
    }
  } catch (error) {
    console.error('IP geolocation failed:', error);
  }
  
  // Default to USD
  return { symbol: '$', code: 'USD' };
};
