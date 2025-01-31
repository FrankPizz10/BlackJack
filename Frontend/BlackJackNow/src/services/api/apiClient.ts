import axios from 'axios';
import { auth } from '../auth/firebaseAuthConfig';

// Function to get the Firebase ID token
const getIdToken = async () => {
  try {
    const token = await auth.currentUser?.getIdToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  } catch {
    return null;
  }
};

// Function to make API requests
export const apiClient = async (
  endpoint: string,
  method = 'GET',
  data = null
) => {
  try {
    const token = await getIdToken(); // Get the ID token

    const response = await axios({
      method,
      url: `${import.meta.env.VITE_SERVER_URL}/api/${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      data,
    });

    return response.data; // Return the data from the response
  } catch {
    return null;
  }
};

