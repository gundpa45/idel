// Network helper utilities
import { API_BASE_URL } from '../config';

export const testServerConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    return response.ok;
  } catch (error) {
    console.log('Server connection test failed:', error);
    return false;
  }
};

export const getNetworkStatus = async () => {
  const isConnected = await testServerConnection();
  return {
    isConnected,
    serverUrl: API_BASE_URL,
    message: isConnected 
      ? 'Connected to server' 
      : 'Working offline - server not reachable'
  };
};