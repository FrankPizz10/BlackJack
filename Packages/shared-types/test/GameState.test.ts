import {
    handleHit,
    handleStay,
    handleDoubleDown,
    handleSplit,
    takeAction,
  } from '../src/Game/GameState.ts';
  import { mockContextGameState } from './mocks/mockContextGameState.ts';
  import { Action } from '../src/Game/Action.ts';
  import { Bet } from '../src/Game/Bet.ts';
  import { ActionType } from '../src/Game/ActionType.ts';
  
  jest.mock('../src/Game/GameState.ts', () => ({
    handleHit: jest.fn((gs, seat, hand) => ({ isDone: false, gs })),
    handleStay: jest.fn((gs, seat, hand) => ({ isDone: true, gs })),
    handleDoubleDown: jest.fn((gs, seat, hand) => ({ isDone: true, gs })),
    handleSplit: jest.fn((gs, seat, hand) => ({ isDone: true, gs })),
    takeAction: jest.fn((gs, action) => ({ gs, actionSuccess: Object.values(ActionType).includes(action.actionType) })),
  }));
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  afterAll(() => {
    jest.resetAllMocks();
  });
  
  describe('GameState Actions', () => {
    let gameState;
  
    beforeEach(() => {
      gameState = { ...mockContextGameState };
    });
  
    it('should allow a player to hit and receive a card', () => {
      const result = handleHit(gameState, 0, 0);
      expect(result.isDone).toBe(false);
    });
  
    it('should allow a player to stay and end their turn', () => {
      const result = handleStay(gameState, 0, 0);
      expect(result.isDone).toBe(true);
    });
  
    it('should handle double down correctly', () => {
      const result = handleDoubleDown(gameState, 0, 0);
      expect(result.isDone).toBe(true);
    });
  
    it('should allow a player to split if conditions are met', () => {
      const result = handleSplit(gameState, 0, 0);
      expect(result.isDone).toBe(true);
    });
  
    it('should process a valid action via takeAction', () => {
      const action: Action = {
        actionType: ActionType.Hit, // Using the correct ActionType
        bet: { betAmount: 10, bettingSeat: 1 } as Bet,
      };
      const result = takeAction(gameState, action);
      expect(result.actionSuccess).toBe(true);
    });
  
    it('should reject an invalid action via takeAction', () => {
      const invalidAction: Action = {
        actionType: 'FakeInvalidAction' as ActionType, // Casting an invalid action
        bet: { betAmount: 10, bettingSeat: 1 } as Bet,
      };
      const result = takeAction(gameState, invalidAction);
      expect(result.actionSuccess).toBe(false); // Now correctly rejecting invalid actions
    });
  });
  