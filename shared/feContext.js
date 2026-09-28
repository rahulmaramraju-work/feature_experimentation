// Builds the Wingify FE user context from a Lumen user.
// The browser SDK and the server SDK both use this, so targeting behaves identically on each side.
export function buildFeContext(user) {
  if (!user) return null;
  const daysSinceSignup = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / 86_400_000);
  return {
    id: user.id,
    customVariables: {
      plan: user.plan,
      country: user.country,
      company_size: user.companySize,
      role: user.role,
      is_internal: user.role === 'admin',
      days_since_signup: daysSinceSignup,
      user_type: daysSinceSignup <= 14 ? 'new' : 'returning',
    },
  };
}

export const FE_ENVIRONMENTS = ['dev', 'staging', 'prod'];
