import { Platform } from 'react-native';

// Default URLs:
// - Android Emulator: 10.0.2.2:5000
// - iOS Simulator / Expo Web: localhost:5000
// - Real Device: User's LAN IP (e.g. 192.168.1.x:5000)
export const getDefaultApiUrl = () => {
  if (Platform.OS === 'android') {
    return 'https://sfw-forum-qxct.onrender.com/api/v1';
  }
  return 'https://sfw-forum-qxct.onrender.com/api/v1';
};

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@mini_forum_access_token',
  REFRESH_TOKEN: '@mini_forum_refresh_token',
  USER_DATA: '@mini_forum_user_data',
  API_URL: '@mini_forum_api_url',
};
