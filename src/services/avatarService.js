const AVATAR_BG = '2ECC71'; // green — contrasts against the dark nav

/**
 * Build a ui-avatars.com URL for a user's initials.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string} Absolute URL to the avatar image
 */
export function getAvatarUrl(firstName, lastName) {
  const initials = encodeURIComponent(
    `${(firstName?.[0] ?? '').toUpperCase()}${(lastName?.[0] ?? '').toUpperCase()}`,
  );
  return `https://ui-avatars.com/api/?name=${initials}&background=${AVATAR_BG}&color=fff&rounded=true&bold=true`;
}
