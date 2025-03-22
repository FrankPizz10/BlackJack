// GameState.test.ts

import {
    checkEligibleAction,
    handleDealer,
    handleHit,
    handleStay,
    handleDoubleDown,
    handleSplit,
    handleBet,
    takeAction,
    createNewGameState,
    dealCards,
    takeSeat,
    checkHandsWon,
    removeFaceDownCards,
    checkDealReady
  } from '../src/Game/GameState';
  
  import {
    baseGameState,
    seatBlackjack,
    seatUnder21,
    seatSplitEligible,
    seatSplitIneligible,
    seatEmptyHand,
    mockDeck
  } from './mocks/mockContextGameState';
  
  import { ActionType } from '../src/Game/ActionType';
  import { Suit } from '../src/Game/Suit';
  import { Card } from '../src/Game/Card';
  import { Player } from '../src/Game/Player';
  import { Action } from '../src/Game/Action';
  import { CardValueType } from '../src/Game/CardValue';
  import { Bet } from '../src/Game/Bet';
  import { RoomWithUsersAndSeats } from '../src/db/UserRoom';
  
  const card10: Card = { suit: Suit.Hearts, value: '10' as CardValueType, faceUp: true };
  const card5: Card = { suit: Suit.Spades, value: '5' as CardValueType, faceUp: true };
  const cardCut: Card = { suit: Suit.Cut, value: 'CUT' as CardValueType, faceUp: false };
  const cardHidden: Card = { suit: Suit.Hidden, value: 'HIDDEN' as CardValueType, faceUp: false };
  
  describe('GameState Methods', () => {
    describe('checkEligibleAction', () => {
      it('returns only Stand if total is 21 (Blackjack)', () => {
        const gs = { ...baseGameState, turnIndex: 0 };
        const result = checkEligibleAction(gs);
        expect(result).toEqual([ActionType.Stand]);
      });
  
      it('returns Hit and Stand if total is below 21', () => {
        const gs = { ...baseGameState, turnIndex: 1 };
        const result = checkEligibleAction(gs);
        expect(result).toContain(ActionType.Hit);
        expect(result).toContain(ActionType.Stand);
      });
  
      it('returns Split when eligible', () => {
        const gs = { ...baseGameState, turnIndex: 2 };
        const result = checkEligibleAction(gs);
        expect(result).toContain(ActionType.Split);
      });
  
      it('does not return Split when ineligible (low stack)', () => {
        const gs = { ...baseGameState, turnIndex: 3 };
        const result = checkEligibleAction(gs);
        expect(result).not.toContain(ActionType.Split);
      });
  
      it('returns empty array if no player or empty hand', () => {
        const gs = { ...baseGameState, turnIndex: 4 };
        const result = checkEligibleAction(gs);
        expect(result).toEqual([]);
      });
    });
  
    describe('handleDealer', () => {
      it('returns GameState after dealer plays', () => {
        const { gs } = handleDealer({ ...baseGameState, dealerHand: [card5] });
        expect(gs.dealerHand.length).toBeGreaterThanOrEqual(1);
      });
    });
  
    describe('handleHit', () => {
      it('adds a card to player hand', () => {
        const { gs } = handleHit({ ...baseGameState, turnIndex: 1 });
        expect(gs.seats[1].hands[0].cards.length).toBeGreaterThan(2);
      });
    });
  
    describe('handleStay', () => {
      it('marks hand as done', () => {
        const { gs } = handleStay({ ...baseGameState, turnIndex: 1 });
        expect(gs.seats[1].hands[0].isDone).toBe(true);
      });
    });
  
    describe('handleDoubleDown', () => {
      it('adds card, doubles bet, and ends hand', () => {
        const { gs } = handleDoubleDown({ ...baseGameState, turnIndex: 1 });
        expect(gs.seats[1].hands[0].cards.length).toBe(3);
        expect(gs.seats[1].hands[0].bet).toBe(200);
        expect(gs.seats[1].hands[0].isDone).toBe(true);
      });
    });
  
    describe('handleSplit', () => {
      it('splits a hand into two', () => {
        const { gs } = handleSplit({ ...baseGameState, turnIndex: 2 });
        expect(gs.seats[2].hands.length).toBe(2);
      });
    });
  
    describe('handleBet', () => {
      it('processes a bet action correctly', () => {
        const betAction = { bettingSeat: 1, betAmount: 50 };
        const { gs } = handleBet(baseGameState, betAction);
        expect(gs.seats[1].hands[0].bet).toBe(50);
        expect(gs.seats[1].player!.stack).toBeLessThan(baseGameState.seats[1].player!.stack);
      });
    });
  
    describe('takeAction', () => {
      it('handles HIT action and updates GameState', () => {
        const action: Action = { actionType: ActionType.Hit, seatIndex: 1, handIndex: 0 };
        const { gs } = takeAction(baseGameState, action);
        expect(gs.seats[1].hands[0].cards.length).toBeGreaterThan(2);
      });
  
      it('returns original GameState if action is invalid', () => {
        const action = { actionType: 'Invalid' as ActionType, seatIndex: 1, handIndex: 0 };
        const { gs } = takeAction(baseGameState, action);
        expect(gs).toEqual(baseGameState);
      });
    });
  
    describe('createNewGameState', () => {
      it('creates valid state from room structure', () => {
        const mockRoom: RoomWithUsersAndSeats = {
          id: 1,
          hostId: 1,
          name: 'Room 1',
          UserRooms: [],
        } as unknown as RoomWithUsersAndSeats;
        const result = createNewGameState(mockRoom);
        expect(result.deck.currentDeck.length).toBeGreaterThan(0);
        expect(result.seats.length).toBeGreaterThan(0);
      });
    });
  
    describe('dealCards', () => {
      it('deals 2 to players, 1 to dealer', () => {
        const gs = dealCards(baseGameState);
        for (const seat of gs.seats) {
          expect(seat.hands[0].cards.length).toBe(2);
        }
        expect(gs.dealerHand.length).toBe(1);
      });
    });
  
    describe('takeSeat', () => {
      it('adds player to a seat', () => {
        const newPlayer: Player = {
          user_ID: 55,
          stack: 500,
          userRoomDbId: 222,
          gameTableDbId: 100
        };
        const gs = takeSeat(baseGameState, newPlayer, 0);
        expect(gs.seats[0].player).toEqual(newPlayer);
      });
    });
  
    describe('checkHandsWon', () => {
      it('runs without crashing', () => {
        const gs = checkHandsWon(baseGameState);
        expect(gs.seats.length).toBe(baseGameState.seats.length);
      });
    });
  
    describe('removeFaceDownCards', () => {
      it('removes HIDDEN and CUT cards', () => {
        const gs = { ...baseGameState, dealerHand: [cardHidden, cardCut, card10] };
        const result = removeFaceDownCards(gs);
        const values = result.dealerHand.map(c => c.value);
        expect(values).not.toContain('HIDDEN');
        expect(values).not.toContain('CUT');
      });
    });
  
    describe('checkDealReady', () => {
      it('returns boolean', () => {
        const result = checkDealReady(baseGameState);
        expect(typeof result).toBe('boolean');
      });
    });
  });
  