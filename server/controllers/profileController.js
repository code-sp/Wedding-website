import { User } from '../models.js';
import { issueAccessToken } from '../security/session.js';

const sanitizeText = (value, max) => String(value ?? '')
  .replace(/[<>]/g, '')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, max);

const allowedDietaryPreferences = new Set([
  'vegetarian', 'vegan', 'jain', 'non-vegetarian', 'other'
]);

export const getProfile = async (req, res) => {
  const user = await User.findById(req.auth.userId).select('name role clientId profile profile_complete');
  if (!user) return res.status(404).json({ error: 'User not found' });

  return res.json({
    profile: user.profile || {},
    isProfileComplete: Boolean(user.profile_complete)
  });
};

export const completeProfile = async (req, res) => {
  try {
    const fullName = sanitizeText(req.body.fullName, 100);
    const relationToCouple = sanitizeText(req.body.relationToCouple, 80);
    const dietaryPreference = sanitizeText(req.body.dietaryPreference, 30).toLowerCase();
    const phone = sanitizeText(req.body.phone, 20).replace(/[^+\d -]/g, '');

    if (!fullName || !relationToCouple || !phone) {
      return res.status(400).json({ error: 'Name, relation and phone are required' });
    }
    if (!allowedDietaryPreferences.has(dietaryPreference)) {
      return res.status(400).json({ error: 'Invalid dietary preference' });
    }
    if (!/^\+?[0-9][0-9 -]{7,18}$/.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }

    const user = await User.findById(req.auth.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.name = fullName;
    user.profile = { fullName, relationToCouple, dietaryPreference, phone };
    user.profile_complete = true;
    await user.save();

    // Refresh the short-lived cookie immediately so route guards see onboarding completion.
    issueAccessToken(res, user);

    return res.json({
      success: true,
      profile: user.profile,
      isProfileComplete: true
    });
  } catch (error) {
    console.error('Profile completion failed', error);
    return res.status(500).json({ error: 'Unable to save profile' });
  }
};
