import { apiClient } from './apiClient';

export const fetchRooms = async () => {
  return await apiClient('rooms');
};

