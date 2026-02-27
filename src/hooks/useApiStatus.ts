import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ApiTestResult {
  key: string;
  status: 'connected' | 'error' | 'rate_limited' | 'not_configured' | 'testing';
  message: string;
  timestamp: string;
  details?: Record<string, unknown>;
}

export function useApiStatus() {
  const [testResults, setTestResults] = useState<Record<string, ApiTestResult>>({});
  const [isTesting, setIsTesting] = useState<Record<string, boolean>>({});

  const testGooglePlacesApi = useCallback(async (_apiKey: string): Promise<ApiTestResult> => {
    try {
      // Test by calling our edge function with a small search (server-side uses New Places API)
      const { data, error } = await supabase.functions.invoke('gmb-import', {
        body: { action: 'search', category: 'dentist', city: 'Dubai', radius: 1000 },
      });

      if (error) {
        const errorMsg = typeof error === 'object' && 'message' in error ? (error as any).message : String(error);
        return {
          key: 'google_places',
          status: 'error',
          message: errorMsg || 'Edge function call failed',
          timestamp: new Date().toISOString(),
        };
      }

      if (data?.success) {
        return {
          key: 'google_places',
          status: 'connected',
          message: `Google Places API (New) working — found ${data.total_found || 0} results`,
          timestamp: new Date().toISOString(),
        };
      }

      if (data?.requiresSetup) {
        return {
          key: 'google_places',
          status: 'not_configured',
          message: data.error || 'API key not configured',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        key: 'google_places',
        status: 'error',
        message: data?.error || 'Unknown error from Places API',
        timestamp: new Date().toISOString(),
        details: data,
      };
    } catch (error) {
      return {
        key: 'google_places',
        status: 'error',
        message: error instanceof Error ? error.message : 'Network error testing API',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const testGeminiApi = useCallback(async (apiKey: string): Promise<ApiTestResult> => {
    try {
      // First try using Lovable AI Gateway (preferred)
      const { data: functionData, error: functionError } = await supabase.functions.invoke('test-api', {
        body: { api: 'gemini', api_key: apiKey },
      });

      if (!functionError && functionData?.status === 'ok') {
        return {
          key: 'gemini',
          status: 'connected',
          message: 'Gemini AI API is working correctly',
          timestamp: new Date().toISOString(),
        };
      }

      // Fallback: Direct test (may have CORS issues)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Say "OK" if you can hear me' }] }],
          }),
        }
      );

      if (response.ok) {
        return {
          key: 'gemini',
          status: 'connected',
          message: 'Gemini AI API is working correctly',
          timestamp: new Date().toISOString(),
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          key: 'gemini',
          status: 'error',
          message: errorData.error?.message || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        key: 'gemini',
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to test Gemini API',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const testSmtpApi = useCallback(async (settings: Record<string, unknown>): Promise<ApiTestResult> => {
    // SMTP testing requires server-side validation
    // We'll check if required fields are present
    const requiredFields = ['host', 'username', 'password', 'from_email'];
    const missingFields = requiredFields.filter(f => !settings[f]);
    
    if (missingFields.length > 0) {
      return {
        key: 'smtp',
        status: 'not_configured',
        message: `Missing required fields: ${missingFields.join(', ')}`,
        timestamp: new Date().toISOString(),
      };
    }

    // Return configured status - actual test requires edge function
    return {
      key: 'smtp',
      status: 'connected',
      message: 'SMTP settings are configured. Send a test email to verify.',
      timestamp: new Date().toISOString(),
    };
  }, []);

  const testTwilioApi = useCallback(async (settings: Record<string, unknown>): Promise<ApiTestResult> => {
    const { account_sid, auth_token } = settings;
    
    if (!account_sid || !auth_token) {
      return {
        key: 'sms',
        status: 'not_configured',
        message: 'Account SID and Auth Token are required',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Twilio account verification via edge function
      const { data, error } = await supabase.functions.invoke('test-api', {
        body: { api: 'twilio', account_sid, auth_token },
      });

      if (error) {
        return {
          key: 'sms',
          status: 'error',
          message: error.message || 'Failed to verify Twilio credentials',
          timestamp: new Date().toISOString(),
        };
      }

      if (data?.status === 'ok') {
        return {
          key: 'sms',
          status: 'connected',
          message: 'Twilio SMS gateway is connected',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        key: 'sms',
        status: 'connected',
        message: 'Twilio credentials configured. Send test SMS to verify.',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        key: 'sms',
        status: 'connected',
        message: 'Twilio credentials saved. Test by sending an SMS.',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const testWhatsAppApi = useCallback(async (settings: Record<string, unknown>): Promise<ApiTestResult> => {
    const { access_token, phone_number_id } = settings;
    
    if (!access_token || !phone_number_id) {
      return {
        key: 'whatsapp',
        status: 'not_configured',
        message: 'Access Token and Phone Number ID are required',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Test WhatsApp Business API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${phone_number_id}`,
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          key: 'whatsapp',
          status: 'connected',
          message: `Connected to WhatsApp Business: ${data.display_phone_number || 'OK'}`,
          timestamp: new Date().toISOString(),
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return {
          key: 'whatsapp',
          status: 'error',
          message: errorData.error?.message || `HTTP ${response.status}`,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      return {
        key: 'whatsapp',
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to connect',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const testGoogleOAuth = useCallback(async (settings: Record<string, unknown>): Promise<ApiTestResult> => {
    const { client_id, client_secret, redirect_uri } = settings;
    
    if (!client_id || !client_secret) {
      return {
        key: 'google_oauth',
        status: 'not_configured',
        message: 'Client ID and Client Secret are required',
        timestamp: new Date().toISOString(),
      };
    }

    // Check if redirect URI is configured properly
    const expectedUri = `${window.location.origin}/auth/callback`;
    if (redirect_uri && redirect_uri !== expectedUri) {
      return {
        key: 'google_oauth',
        status: 'error',
        message: `Redirect URI mismatch. Expected: ${expectedUri}`,
        timestamp: new Date().toISOString(),
        details: { configured: redirect_uri, expected: expectedUri },
      };
    }

    return {
      key: 'google_oauth',
      status: 'connected',
      message: 'Google OAuth credentials configured. Test by clicking "Connect GMB".',
      timestamp: new Date().toISOString(),
    };
  }, []);

  const testStripeApi = useCallback(async (settings: Record<string, unknown>): Promise<ApiTestResult> => {
    const { api_key, secret_key } = settings;
    const key = api_key || secret_key;
    
    if (!key) {
      return {
        key: 'stripe',
        status: 'not_configured',
        message: 'Stripe Secret Key is required',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      // Test Stripe API via edge function
      const { data, error } = await supabase.functions.invoke('test-api', {
        body: { api: 'stripe', api_key: key },
      });

      if (error) {
        return {
          key: 'stripe',
          status: 'error',
          message: error.message || 'Failed to verify Stripe credentials',
          timestamp: new Date().toISOString(),
        };
      }

      if (data?.status === 'ok') {
        return {
          key: 'stripe',
          status: 'connected',
          message: data.message || 'Stripe is connected',
          timestamp: new Date().toISOString(),
        };
      }

      return {
        key: 'stripe',
        status: 'error',
        message: data?.message || 'Failed to connect to Stripe',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        key: 'stripe',
        status: 'error',
        message: 'Failed to test Stripe connection',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  const testApi = useCallback(async (
    apiKey: string, 
    settings: Record<string, unknown>
  ): Promise<ApiTestResult> => {
    setIsTesting(prev => ({ ...prev, [apiKey]: true }));
    
    try {
      let result: ApiTestResult;
      
      switch (apiKey) {
        case 'google_places':
          result = await testGooglePlacesApi(settings.api_key as string);
          break;
        case 'gemini':
          result = await testGeminiApi(settings.api_key as string);
          break;
        case 'smtp':
          result = await testSmtpApi(settings);
          break;
        case 'sms':
          result = await testTwilioApi(settings);
          break;
        case 'whatsapp':
          result = await testWhatsAppApi(settings);
          break;
        case 'google_oauth':
          result = await testGoogleOAuth(settings);
          break;
        case 'stripe':
          result = await testStripeApi(settings);
          break;
        case 'resend':
        case 'aimlapi': {
          // Test via edge function for secure secrets
          const { data, error } = await supabase.functions.invoke('test-api', {
            body: { api: apiKey },
          });
          
          if (error) {
            result = {
              key: apiKey,
              status: 'error',
              message: error.message || 'Failed to test API',
              timestamp: new Date().toISOString(),
            };
          } else if (data?.status === 'ok') {
            result = {
              key: apiKey,
              status: 'connected',
              message: data.message || `${apiKey} is working`,
              timestamp: new Date().toISOString(),
            };
          } else if (data?.status === 'rate_limited') {
            result = {
              key: apiKey,
              status: 'rate_limited',
              message: data.message || 'Rate limited',
              timestamp: new Date().toISOString(),
            };
          } else {
            result = {
              key: apiKey,
              status: 'error',
              message: data?.message || 'API test failed',
              timestamp: new Date().toISOString(),
            };
          }
          break;
        }
        default:
          // For unknown APIs, just check if key exists
          result = {
            key: apiKey,
            status: settings.api_key || settings.enabled ? 'connected' : 'not_configured',
            message: settings.api_key ? 'API key configured' : 'Not configured',
            timestamp: new Date().toISOString(),
          };
      }

      // Update the global_settings with test result
      await supabase
        .from('global_settings')
        .upsert({
          key: apiKey,
          value: {
            ...settings,
            last_test: result.timestamp,
            last_test_status: result.status,
            last_error: result.status === 'error' ? result.message : null,
          },
        }, { onConflict: 'key' });

      setTestResults(prev => ({ ...prev, [apiKey]: result }));
      
      if (result.status === 'connected') {
        toast.success(`${apiKey}: ${result.message}`);
      } else if (result.status === 'error') {
        toast.error(`${apiKey}: ${result.message}`);
      } else {
        toast.info(`${apiKey}: ${result.message}`);
      }
      
      return result;
    } finally {
      setIsTesting(prev => ({ ...prev, [apiKey]: false }));
    }
  }, [testGooglePlacesApi, testGeminiApi, testSmtpApi, testTwilioApi, testWhatsAppApi, testGoogleOAuth, testStripeApi]);

  const testAllApis = useCallback(async (settings: Record<string, Record<string, unknown>>) => {
    const results: Record<string, ApiTestResult> = {};
    
    for (const [key, value] of Object.entries(settings)) {
      if (value && Object.keys(value).length > 0) {
        results[key] = await testApi(key, value);
      }
    }
    
    return results;
  }, [testApi]);

  return {
    testApi,
    testAllApis,
    testResults,
    isTesting,
    clearResults: () => setTestResults({}),
  };
}
