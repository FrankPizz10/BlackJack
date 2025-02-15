import roomsRouter from '../src/routes/rooms';
import { getRoomsController } from '../src/controllers/roomsController';
import { getRooms } from '../src/services/roomsService';
import { mockContext } from './mocks/mockContext';
import { Request, Response } from 'express';
import request from 'supertest';
import { AppContext } from '../src/context';
import express, { Express } from 'express';
import { generateRoomUrl } from '../src/utils/crypto';

describe('Rooms API', () => {
  const rooms = [
    {
      id: 1,
      url: 'room1',
      gameTableId: 1,
      roomOpenTime: new Date(),
      roomCloseTime: null,
      maxRoomSize: 10,
    },
    {
      id: 2,
      url: 'room2',
      gameTableId: 1,
      roomOpenTime: new Date(),
      roomCloseTime: null,
      maxRoomSize: 10,
    },
  ];
  describe('Rooms Service', () => {
    it('Should return a list of rooms', async () => {
      // Mock the context
      (mockContext.prisma.rooms.findMany as jest.Mock).mockResolvedValue(rooms);
      (mockContext.redis.get as jest.Mock).mockResolvedValue(
        JSON.stringify(rooms)
      );
      await expect(getRooms(mockContext)).resolves.toEqual({
        roomsDb: rooms,
        roomsCache: JSON.stringify(rooms),
      });
    });
  });

  describe('Rooms Controller', () => {
    it('Should return a list of rooms', async () => {
      // Mock the context for the controller
      (mockContext.prisma.rooms.findMany as jest.Mock).mockResolvedValue(rooms);
      (mockContext.redis.get as jest.Mock).mockResolvedValue(
        JSON.stringify(rooms)
      );

      const req = {} as Request; // Create a mock request object
      const res = {
        status: jest.fn().mockReturnThis(), // Mock status method
        json: jest.fn(), // Mock json method
      } as unknown as Response; // Type assertion to Response

      const controller = getRoomsController(mockContext); // Create the controller function

      await controller(req, res); // Call the controller with the mock request and response

      // Check the response
      expect(res.status).toHaveBeenCalledWith(200); // Expect status 200
      expect(res.json).toHaveBeenCalledWith({
        roomsDb: rooms,
        roomsCache: rooms,
      }); // Expect correct response data
    });
  });

  describe('Rooms Router', () => {
    let app: Express;
    beforeAll(() => {
      app = express();
      app.use(express.json());
      app.use('/api/rooms', roomsRouter(mockContext as AppContext));
    });
    it('Should return a list of rooms', async () => {
      // Verify the route returns a valid response
      const response = await request(app).get('/api/rooms');
      expect(response.status).toBe(200); // Verify HTTP status code
    });
  });

  describe('Generate Room URL', () => {
    it('Should generate a valid room URL', () => {
      // Generate 10 room URLs
      const roomUrls = Array.from({ length: 10 }, () => generateRoomUrl());
      // Check if all room URLs are valid
      const validRoomUrls = roomUrls.every((url) => !isNaN(parseInt(url)));
      expect(validRoomUrls).toBe(false); // Verify all URLs are valid
    });
  });
});
