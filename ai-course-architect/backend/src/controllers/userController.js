/**
 * User Controller
 * 
 * Handles user settings including API configuration.
 */

import User from '../models/User.js';

/**
 * Get current user's settings
 * GET /api/users/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Fetch user with API settings (explicitly include apiKey since it's select: false)
    const userWithSettings = await User.findById(user._id).select('+apiSettings.apiKey');
    
    if (!userWithSettings) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return settings but mask the API key for security
    const apiSettings = userWithSettings.apiSettings || {};
    
    res.json({
      success: true,
      data: {
        apiSettings: {
          model: apiSettings.model || 'gemini-2.5-flash',
          baseUrl: apiSettings.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/',
          useCustomProvider: apiSettings.useCustomProvider || false,
          // Only return a masked version of the API key if it exists
          hasApiKey: !!apiSettings.apiKey,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current user's settings
 * PUT /api/users/settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const { apiSettings } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Validate that apiSettings exists
    if (!apiSettings || typeof apiSettings !== 'object') {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid settings format' 
      });
    }

    // Build update object - only include fields that are provided
    const updateFields = {};
    
    console.log('🔍 updateSettings - Received apiSettings:', JSON.stringify(apiSettings));
    
    // Get existing user to preserve apiKey if not provided
    const existingUser = await User.findById(user._id).select('+apiSettings.apiKey');
    const existingApiKey = existingUser?.apiSettings?.apiKey;
    console.log('🔍 updateSettings - Existing API key:', existingApiKey ? 'exists' : 'none');
    
    // Handle API key update
    // If apiKey is explicitly provided and not empty, use it
    // Otherwise, preserve existing key
    if (apiSettings.apiKey !== undefined) {
      if (apiSettings.apiKey !== '') {
        // New API key provided
        updateFields['apiSettings.apiKey'] = apiSettings.apiKey.trim();
        console.log('🔍 updateSettings - Setting new API key');
      } else if (existingApiKey) {
        // Empty string but we have existing key - keep it (don't update)
        console.log('🔍 updateSettings - Preserving existing API key (empty string received)');
      }
    }
    
    // Update other settings
    if (apiSettings.model !== undefined) {
      updateFields['apiSettings.model'] = apiSettings.model.trim() || 'gemini-2.5-flash';
    }
    
    if (apiSettings.baseUrl !== undefined) {
      updateFields['apiSettings.baseUrl'] = apiSettings.baseUrl.trim() || 'https://generativelanguage.googleapis.com/v1beta/openai/';
    }
    
    if (apiSettings.useCustomProvider !== undefined) {
      console.log('🔍 updateSettings - useCustomProvider raw value:', apiSettings.useCustomProvider);
      console.log('🔍 updateSettings - useCustomProvider type:', typeof apiSettings.useCustomProvider);
      updateFields['apiSettings.useCustomProvider'] = Boolean(apiSettings.useCustomProvider);
      console.log('🔍 updateSettings - useCustomProvider after Boolean():', updateFields['apiSettings.useCustomProvider']);
    }
    
    console.log('🔍 updateSettings - Update fields:', JSON.stringify(updateFields));

    // Update user settings
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('+apiSettings.apiKey');

    if (!updatedUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Return updated settings (masked)
    const settings = updatedUser.apiSettings || {};
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: {
        apiSettings: {
          model: settings.model || 'gemini-2.5-flash',
          baseUrl: settings.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/',
          useCustomProvider: settings.useCustomProvider || false,
          hasApiKey: !!settings.apiKey,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Test API settings by making a simple API call
 * POST /api/users/settings/test
 */
export const testSettings = async (req, res, next) => {
  try {
    const user = req.user;
    const { apiKey, model, baseUrl } = req.body;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Not authorized' });
    }

    // Validate required fields
    if (!apiKey || !model || !baseUrl) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: apiKey, model, baseUrl' 
      });
    }

    // Import OpenAI dynamically
    const OpenAI = (await import('openai')).default;
    
    // Create a temporary OpenAI client with the provided settings
    const testClient = new OpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    // Try to make a simple API call to test the connection
    try {
      const response = await testClient.models.list();
      
      res.json({
        success: true,
        message: 'API connection successful',
        data: {
          available: true,
          modelsCount: response.data?.length || 0,
        },
      });
    } catch (apiError) {
      console.error('API test error:', apiError.message);
      res.status(400).json({
        success: false,
        error: apiError.message || 'Failed to connect to API',
      });
    }
  } catch (error) {
    next(error);
  }
};
