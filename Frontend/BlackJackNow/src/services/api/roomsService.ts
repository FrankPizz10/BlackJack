import axios from 'axios';

export const fetchRooms = async () => {
  const response = await axios.get('http://localhost:4000/api/rooms');
  return response.data;
};

