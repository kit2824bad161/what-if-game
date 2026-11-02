const STORAGE_KEY = 'whatif_guest_identity_v1';

const ADJECTIVES = ['Quantum', 'Cinematic', 'Midnight', 'Solar', 'Cosmic', 'Shadow', 'Neon', 'Echo', 'Vortex', 'Astral'];
const NOUNS = ['Director', 'Spectator', 'Weaver', 'Traveler', 'Architect', 'Voyager', 'Chrononaut', 'Scout', 'Chronicler'];

function generateRandomName() {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${adj} ${noun} #${num}`;
}

function generateGuestId() {
  return 'gst_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function getGuestIdentity() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.warn('[GuestIdentity] Error reading localStorage:', err);
  }

  const newIdentity = {
    guestId: generateGuestId(),
    name: generateRandomName(),
    createdAt: new Date().toISOString(),
    preferences: {
      preferredLanguage: 'ta',
      theme: 'dark',
      soundEffects: true,
    },
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIdentity));
  } catch (err) {
    console.warn('[GuestIdentity] Error saving to localStorage:', err);
  }

  return newIdentity;
}

export function updateGuestName(newName) {
  const identity = getGuestIdentity();
  identity.name = newName.trim();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  return identity;
}
