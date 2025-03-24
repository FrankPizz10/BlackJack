import { Card, isBlackjack } from './Card';
import { createDeck, Deck, draw, shuffle } from './Deck';
import { Hand, computeHandCount } from './Hand';
import { Seat } from './Seat';
import { ActionType } from './ActionType';
import { Action } from './Action';
import { Bet } from './Bet';
import { Player } from './Player';
import { RoomWithUsersAndSeats, UserRoomWithSeat } from '../db/UserRoom';

/**
 * Represents the state of the game
 * @type {GameState}
 * @property {number} rommDbId - ID of the room in the database
 * @property {number} gameTableDbId - ID of the game table in the database
 * @property {ReadonlyArray<Card>} dealerHand - Array of cards in the dealer's hand
 * @property {number} turnIndex - Index of the current turn
 * @property {ReadonlyArray<Seat>} seats - Array of seats in the game
 * @property {boolean} roundOver - Whether the round is over
 * @property {number} timeToAct - Time left for the current player to act
 * @property {number} timeToBet - Time left for the current player to bet
 * @property {Deck} deck - The deck of cards used in the game
 * @property {boolean} shuffle - Whether the deck needs to be shuffled
 */
export type GameState = Readonly<{
  rommDbId: number;
  gameTableDbId: number;
  dealerHand: ReadonlyArray<Card>;
  turnIndex: number;
  seats: ReadonlyArray<Seat>;
  roundOver: boolean;
  timeToAct: number;
  timeToBet: number;
  deck: Readonly<Deck>;
  shuffle: boolean;
  players: ReadonlyArray<Player>;
}>;

const drawCard = (
  deck: Deck,
  gs: GameState
): { card: Card; gs: GameState } | null => {
  const drawResult = draw(deck);
  if (!drawResult) return null;
  let card = drawResult.card;
  const newDeck = drawResult.deck;
  if (card && card.suit === 'CUT') {
    const drawCutResult = draw(newDeck);
    if (!drawCutResult) return null;
    card = drawCutResult.card;
    return { card, gs: { ...gs, deck: drawCutResult.deck, shuffle: true } };
  }
  return { card, gs: { ...gs, deck: newDeck } };
};

// Helper method to check eligible actions for a Seat
export const checkEligibleAction = (gs: GameState): ActionType[] => {
  const seat = gs.seats[gs.turnIndex];
  const player = gs.players.find((player) =>
    player.seatIndexes.includes(gs.turnIndex)
  );
  const hand = seat.hands[seat.handIndex];
  if (!hand) return [];

  const total = computeHandCount(hand.cards);
  const actions: ActionType[] = [];

  if (total === 21) {
    actions.push('Stand');
  }

  // Allow Hit and Stand for all hands under 21
  if (total < 21) {
    actions.push('Hit', 'Stand');
  }

  // Allow Split if hand has two of the same card and the player has enough stack
  if (
    hand.cards.length === 2 &&
    hand.cards[0].value === hand.cards[1].value &&
    player &&
    player.stack >= hand.bet
  ) {
    actions.push('Split');
  }

  // Allow Double Down if the hand total is 9, 10, 11 (without an Ace) or 16-18 (with an Ace) and the player has enough stack
  const hasAce = hand.cards.some((card) => card.value === 'A');
  if (
    ((!hasAce && [9, 10, 11].includes(total)) ||
      (hasAce && [16, 17, 18].includes(total))) &&
    player &&
    player.stack >= hand.bet &&
    hand.cards.length === 2
  ) {
    actions.push('Double Down');
  }

  return actions;
};

// Helper method to handle Dealer action
export const handleDealer = (
  gs: GameState
): { actionIsDone: boolean; gs: GameState } => {
  // Flip the dealer's face down card
  let updatedDealerHand = gs.dealerHand.map((card) => ({
    ...card,
    faceUp: true,
  }));
  let dealerTotal = computeHandCount(gs.dealerHand);
  let hasAce = updatedDealerHand.some((card) => card.value === 'A');
  let currentGs: GameState = { ...gs, dealerHand: updatedDealerHand };
  // Draw cards while the dealer total is less than or equal to 16
  while (dealerTotal <= 16 || (dealerTotal === 17 && hasAce)) {
    const cardResult = drawCard(currentGs.deck, currentGs);
    if (!cardResult) return { actionIsDone: true, gs: currentGs };
    const card = cardResult.card;
    currentGs = cardResult.gs;
    updatedDealerHand = [...updatedDealerHand, { ...card, faceUp: true }];
    dealerTotal = computeHandCount(updatedDealerHand);
    hasAce = updatedDealerHand.some((card) => card.value === 'A');
    currentGs = { ...currentGs, dealerHand: updatedDealerHand };
  }

  return { actionIsDone: true, gs: currentGs };
};

// Helper method for "Hit"
export const handleHit = (
  gs: GameState
): { actionIsDone: boolean; gs: GameState } => {
  const { deck, seats } = gs;
  const drawResult = drawCard(deck, gs);
  if (!drawResult) {
    return { actionIsDone: false, gs };
  }

  const currentHand = gs.seats[gs.turnIndex].handIndex;
  const card = drawResult.card;
  const hitGameState = drawResult.gs;
  const updatedHand: Hand = {
    ...seats[gs.turnIndex].hands[currentHand],
    cards: [
      ...seats[gs.turnIndex].hands[currentHand].cards,
      { ...card, faceUp: true },
    ],
  };

  const count = computeHandCount(updatedHand.cards);
  const actionIsDone = count >= 21;

  const updatedSeat: Seat = {
    ...seats[gs.turnIndex],
    hands: [
      ...seats[gs.turnIndex].hands.slice(0, currentHand),
      { ...updatedHand, isDone: actionIsDone },
      ...seats[gs.turnIndex].hands.slice(currentHand + 1),
    ],
  };

  return {
    actionIsDone: actionIsDone,
    gs: {
      ...hitGameState,
      seats: [
        ...seats.slice(0, gs.turnIndex),
        updatedSeat,
        ...seats.slice(gs.turnIndex + 1),
      ],
    },
  };
};

// Helper method for "Stay"
export const handleStay = (
  gs: GameState
): { actionIsDone: boolean; gs: GameState } => {
  const currentHand = gs.seats[gs.turnIndex].handIndex;
  // Update the hand to be done
  const updatedHand: Hand = {
    ...gs.seats[gs.turnIndex].hands[currentHand],
    isDone: true,
  };
  // Update the seat with the updated hand
  const updatedSeat: Seat = {
    ...gs.seats[gs.turnIndex],
    hands: [
      ...gs.seats[gs.turnIndex].hands.slice(0, currentHand),
      updatedHand,
      ...gs.seats[gs.turnIndex].hands.slice(currentHand + 1),
    ],
  };
  return {
    actionIsDone: true,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, gs.turnIndex),
        updatedSeat,
        ...gs.seats.slice(gs.turnIndex + 1),
      ],
    },
  };
};

// Helper method for "Double Down"
export const handleDoubleDown = (
  gs: GameState
): { actionIsDone: boolean; gs: GameState } => {
  const currentHand = gs.seats[gs.turnIndex].handIndex;
  const seat = gs.seats[gs.turnIndex];
  const player = gs.players.find((player) =>
    player.seatIndexes.includes(gs.turnIndex)
  );
  // Check if there is a player
  if (!player) return { actionIsDone: false, gs };

  const { deck } = gs;
  const cardResult = drawCard(deck, gs);
  if (!cardResult) {
    return { actionIsDone: false, gs };
  }
  const card = cardResult.card;
  const drawGameState = cardResult.gs;

  const updatedHand: Hand = {
    ...seat.hands[currentHand],
    cards: [...seat.hands[currentHand].cards, { ...card, faceUp: true }],
    isDone: true,
    bet: seat.hands[currentHand].bet * 2,
  };

  const updatedSeat: Seat = {
    ...seat,
    hands: [
      ...seat.hands.slice(0, currentHand),
      updatedHand,
      ...seat.hands.slice(currentHand + 1),
    ],
    // player: {
    //   ...seat.player,
    //   stack: seat.player.stack - seat.hands[currentHand].bet,
    // },
  };
  return {
    actionIsDone: true,
    gs: {
      ...drawGameState,
      seats: [
        ...drawGameState.seats.slice(0, gs.turnIndex),
        updatedSeat,
        ...drawGameState.seats.slice(gs.turnIndex + 1),
      ],
      players: [
        ...drawGameState.players.slice(0, gs.turnIndex),
        {
          ...player,
          stack: player.stack - seat.hands[currentHand].bet,
        },
        ...drawGameState.players.slice(gs.turnIndex + 1),
      ],
    },
  };
};

// Helper method for "Split"
export const handleSplit = (
  gs: GameState
): { actionIsDone: boolean; gs: GameState } => {
  const currentHand = gs.seats[gs.turnIndex].handIndex;
  // Split the current hand into two separate hands with the same bet amount and one card each
  const newHands: Hand[] = [
    {
      cards: [gs.seats[gs.turnIndex].hands[currentHand].cards[0]],
      bet: gs.seats[gs.turnIndex].hands[currentHand].bet,
      isDone: false,
    },
    {
      cards: [gs.seats[gs.turnIndex].hands[currentHand].cards[1]],
      bet: gs.seats[gs.turnIndex].hands[currentHand].bet,
      isDone: false,
    },
  ];

  // Update the seat with the new state
  const updatedSeat: Seat = {
    ...gs.seats[gs.turnIndex],
    hands: newHands,
  };

  return {
    actionIsDone: false,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, gs.turnIndex),
        updatedSeat,
        ...gs.seats.slice(gs.turnIndex + 1),
      ],
    },
  };
};

// Helper method to handle Bet action
export const handleBet = (
  gs: GameState,
  bet: Bet
): { actionIsDone: boolean; gs: GameState } => {
  if (!gs || !bet) return { actionIsDone: false, gs };
  const player = gs.players.find((player) =>
    player.seatIndexes.includes(bet.bettingSeat)
  );

  const seatPosition = bet.bettingSeat;
  if (!player) {
    console.error('Player not found at position', seatPosition);
    return { actionIsDone: false, gs };
  }

  if (bet.betAmount > player.stack) {
    console.log('Not enough stack');
    return { actionIsDone: false, gs };
  }

  // Deduct the bet amount from the player's stack
  // gs.seats[seatPosition].player.stack -= bet.betAmount;
  const updatedSeat: Seat = {
    ...gs.seats[seatPosition],
    hands: [
      {
        ...gs.seats[seatPosition].hands[0],
        bet: bet.betAmount,
      },
    ],
    // player: {
    //   ...gs.seats[seatPosition].player,
    //   stack: gs.seats[seatPosition].player.stack - bet.betAmount,
    // },
  };

  return {
    actionIsDone: true,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, seatPosition),
        updatedSeat,
        ...gs.seats.slice(seatPosition + 1),
      ],
      players: gs.players.map((p) => {
        if (p.seatIndexes.includes(seatPosition)) {
          return {
            ...p,
            stack: p.stack - bet.betAmount,
          };
        }
        return p;
      }),
    },
  };
};

const handleReset = (gs: GameState): GameState => {
  const updatedGameState: GameState = {
    ...gs,
    seats: gs.seats.map((seat) => ({
      ...seat,
      handIndex: 0,
      hands: seat.hands.map((hand) => ({
        ...hand,
        isDone: false,
        cards: [],
        isBlackjack: false,
        isPush: false,
        isWon: false,
        bet: 0,
      })),
    })),
    turnIndex: 0,
    roundOver: false,
    dealerHand: [],
  };
  return updatedGameState;
};

export interface ActionResult {
  gs: GameState;
  actionSuccess: boolean;
}

/**
 * Executes a game action and updates the game state accordingly.
 *
 * @param {GameState} gs - The current state of the game.
 * @param {Action} action - The action to be performed, including type and optional bet information.
 * @returns {ActionResult} - The result of the action, including the updated game state and a success flag.
 *
 * This function handles various game actions such as 'Bet', 'Hit', 'Stand', 'Double Down', 'Split', 'Deal',
 * 'Reset', and 'Dealer'. It validates the action, updates the game state, and determines if the round or
 * player's turn is over. If all seats have completed their actions, the dealer's hand is played, and the
 * round is concluded, including payout and deck shuffling if necessary.
 */

export const takeAction = (gs: GameState, action: Action): ActionResult => {
  if (action.actionType === 'Bet' && action.bet) {
    const betResult = handleBet(gs, action.bet);
    if (!betResult.actionIsDone) return { gs, actionSuccess: false };
    return { gs: betResult.gs, actionSuccess: true };
  }

  if (action.actionType === 'Reset') {
    const resetResult = handleReset(gs);
    if (!resetResult) return { gs, actionSuccess: false };
    return { gs: resetResult, actionSuccess: true };
  }

  if (gs.turnIndex < 0 || gs.turnIndex >= gs.seats.length)
    return { gs, actionSuccess: false }; // No active seat

  const elligbleActions = checkEligibleAction(gs);
  console.log('Eligible Action Types: ', elligbleActions);
  if (!elligbleActions.includes(action.actionType)) {
    return { gs, actionSuccess: false };
  }
  console.log('Eligible Action: ', action);
  // const currentHand = gs.seats[gs.turnIndex].handIndex;
  let actionIsDone = false;
  let gamestateAfterAction: GameState | null = null;
  switch (action.actionType) {
    case 'Hit': {
      const hitResult = handleHit(gs);
      actionIsDone = hitResult.actionIsDone;
      gamestateAfterAction = hitResult.gs;
      break;
    }
    case 'Stand': {
      const standResult = handleStay(gs);
      actionIsDone = standResult.actionIsDone;
      gamestateAfterAction = standResult.gs;
      break;
    }
    case 'Double Down': {
      const doubleDownResult = handleDoubleDown(gs);
      actionIsDone = doubleDownResult.actionIsDone;
      gamestateAfterAction = doubleDownResult.gs;
      break;
    }
    case 'Split': {
      const splitResult = handleSplit(gs);
      actionIsDone = splitResult.actionIsDone;
      gamestateAfterAction = splitResult.gs;
      break;
    }
    case 'Deal': {
      const dealResult = handleHit(gs);
      actionIsDone = dealResult.actionIsDone;
      gamestateAfterAction = dealResult.gs;
      break;
    }
    // case 'CheckHand':
    //   isDone = handleCheckHand(gs, seat, current_hand);
    //   break;
    case 'Dealer': {
      const dealerResult = handleDealer(gs);
      actionIsDone = dealerResult.actionIsDone;
      gamestateAfterAction = dealerResult.gs;
      break;
    }
    // case 'ForceShuffle':
    //   gs.shuffle = true;
    //   break;
  }
  // Return a new updated game state
  if (!actionIsDone && gamestateAfterAction) {
    return { gs: gamestateAfterAction, actionSuccess: true };
  }
  if (actionIsDone && gamestateAfterAction) {
    const updatedSeats: Seat[] = [];
    for (let i = 0; i < gamestateAfterAction.seats.length; i++) {
      if (i === gs.turnIndex) {
        updatedSeats.push({
          ...gamestateAfterAction.seats[i],
          handIndex: gamestateAfterAction.seats[i].handIndex + 1,
        });
      } else {
        updatedSeats.push(gamestateAfterAction.seats[i]);
      }
    }
    // Check if all hands are done
    if (!areAllHandsDone(gamestateAfterAction)) {
      return {
        gs: {
          ...gamestateAfterAction,
          seats: updatedSeats,
        },
        actionSuccess: true,
      };
    }
    if (areAllSeatsDone(gamestateAfterAction)) {
      // Play the dealer hand
      const updatedGsAfterDealer = handleDealer({
        ...gamestateAfterAction,
        seats: updatedSeats,
      });
      const updatedGsAfterCheck = checkHandsWon(updatedGsAfterDealer.gs);
      const updatedGsAfterPayout = payoutHands(updatedGsAfterCheck);

      return {
        gs: {
          ...updatedGsAfterPayout,
          deck: updatedGsAfterPayout.shuffle
            ? shuffle(updatedGsAfterPayout.deck)
            : updatedGsAfterPayout.deck,
          shuffle: false,
          roundOver: true,
        },
        actionSuccess: true,
      };
    }
    // Next player's turn
    else {
      // iterate through the gamestateAfterAction.seats to find the next player whose hand is not done
      const nextPlayerIndex = gamestateAfterAction.seats
        .slice(gamestateAfterAction.turnIndex + 1)
        .findIndex((seat) => !seat.hands.every((hand) => hand.isDone));
      if (nextPlayerIndex === -1) {
        console.error('No next player found and game is not over');
        return { gs, actionSuccess: false };
      }
      // This returns the sliced index i need the original index
      const nextPlayerIndexWithOffset =
        nextPlayerIndex + gamestateAfterAction.turnIndex + 1;
      return {
        gs: {
          ...gamestateAfterAction,
          seats: updatedSeats,
          turnIndex: nextPlayerIndexWithOffset,
        },
        actionSuccess: true,
      };
    }
  }

  return {
    gs,
    actionSuccess: false,
  };
};

const areAllSeatsDone = (gs: GameState): boolean => {
  const activeSeats = getActiveSeats(gs);
  return activeSeats.every((seat) => seat.hands.every((hand) => hand.isDone));
};

const areAllHandsDone = (gs: GameState): boolean => {
  const currentSeat = gs.seats[gs.turnIndex];
  return currentSeat.hands.every((hand) => hand.isDone);
};

const payoutHands = (gs: GameState): GameState => {
  // Create a new seats array
  const updatedSeatsAndPlayers = gs.seats.map((seat, index) => {
    // Create a new hands array
    const updatedHands = seat.hands.map((hand) => ({
      ...hand,
      bet: 0, // Reset the bet
    }));

    // Calculate the payout for each hand
    const winnings = calculateSeatWinnings(seat.hands);

    const player = gs.players.find((player) =>
      player.seatIndexes.includes(index)
    );

    if (!player) {
      return { seat, player: null };
    }

    // Return the updated seat object and player
    return {
      seat: {
        ...seat,
        hands: updatedHands,
      },
      player: {
        ...player,
        stack: player.stack + winnings,
      },
    };
  });
  // Return the updated game state object
  return {
    ...gs,
    seats: updatedSeatsAndPlayers.map((seatAndPlayer) => seatAndPlayer.seat),
    players: gs.players.map(
      (player) =>
        updatedSeatsAndPlayers.find(
          (seatAndPlayer) => seatAndPlayer.player?.userId === player.userId
        )?.player ?? player
    ),
  };
};

const calculateSeatWinnings = (hands: ReadonlyArray<Hand>): number => {
  return hands.reduce((total, hand) => {
    if (hand.isBlackjack) {
      return total + 2.5 * hand.bet;
    } else if (hand.isPush) {
      return total + hand.bet;
    } else if (hand.isWon) {
      return total + 2 * hand.bet;
    }
    return total;
  }, 0);
};

export const createNewGameState = (
  roomInfo: RoomWithUsersAndSeats
): GameState => {
  return {
    rommDbId: roomInfo.id,
    gameTableDbId: roomInfo.gameTableId,
    dealerHand: [],
    turnIndex: 0,
    seats: [...createSeats()],
    roundOver: false,
    timeToAct: 20,
    timeToBet: 15,
    deck: shuffle(createDeck()),
    players: [...loadPlayers(roomInfo.UserRooms)],
    shuffle: false,
  };
};

const createSeats = (
  totalSeats: number = 7 // Define the total number of seats at the table
): Seat[] => {
  // Initialize seats with empty placeholders
  const seats: Seat[] = Array.from({ length: totalSeats }, () => ({
    handIndex: 0,
    hands: [
      {
        cards: [],
        bet: 0,
        isDone: false,
      },
    ],
  }));

  return seats;
};

/**
 * Creates an array of `Player` objects from an array of `UserRoomWithSeat`
 * objects. The `Player` objects are populated with the `userId`, `stack`, and
 * `userRoomDbId` properties from the `UserRoomWithSeat` objects. The
 * `seatIndexes` property is populated with an array of seat indexes from the
 * `UserSeats` array of each `UserRoomWithSeat` object.
 * @param userRooms The array of `UserRoomWithSeat` objects to create the `Player`
 * objects from
 * @returns An array of `Player` objects
 */
const loadPlayers = (userRooms: UserRoomWithSeat[]): Player[] => {
  const playerSeatIndexes = userRooms.map((userRoom) =>
    userRoom.UserSeats.map((seat) => seat.position - 1)
  );
  return userRooms.map((userRoom, index) => ({
    userId: userRoom.userId,
    stack: userRoom.initialStack,
    userRoomDbId: userRoom.id,
    isAfk: false,
    seatIndexes: playerSeatIndexes[index],
  }));
};

/**
 * Retrieves the indexes of active seats where players have a stack greater than 0.
 *
 * @param {GameState} gs - The current state of the game.
 * @returns {number[]} An array of indexes corresponding to active seats.
 */
const getActiveSeatIndexes = (gs: GameState): number[] => {
  return gs.players.reduce((acc, player) => {
    if (player.stack > 0) {
      acc.push(...player.seatIndexes);
    }
    return acc;
  }, [] as number[]);
};

/**
 * Retrieves an array of active seats where players have a stack greater than 0.
 * @param {GameState} gs - The current state of the game.
 * @returns {Seat[]} An array of active seats.
 */
const getActiveSeats = (gs: GameState): Seat[] => {
  return getActiveSeatIndexes(gs).map((seatIndex) => gs.seats[seatIndex]);
};

// Begin to deal cards for the game
export const dealCards = (gs: GameState): GameState => {
  let currentGs = gs;
  const activeSeatIndexes = getActiveSeatIndexes(currentGs);

  // First round: deal one face-up card to each player
  const newSeats: Seat[] = [];
  for (let i = 0; i < gs.seats.length; i++) {
    if (!activeSeatIndexes.includes(i)) {
      newSeats.push(gs.seats[i]);
      continue;
    }
    const originalSeat = currentGs.seats[activeSeatIndexes[i]];
    const cardResult = drawCard(currentGs.deck, currentGs);
    if (!cardResult) {
      newSeats.push(originalSeat);
      continue;
    }
    currentGs = cardResult.gs;
    newSeats.push({
      ...originalSeat,
      hands: originalSeat.hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              cards: [...hand.cards, { ...cardResult.card, faceUp: true }],
            }
          : hand
      ),
    });
  }

  // Deal one face-up card to the dealer
  const dealerCardResult1 = drawCard(currentGs.deck, currentGs);
  if (!dealerCardResult1) return currentGs;
  currentGs = dealerCardResult1.gs;
  const updatedDealerHand = [
    ...currentGs.dealerHand,
    { ...dealerCardResult1.card, faceUp: true },
  ];

  // Second round: deal one face-up card to each player
  for (let i = 0; i < newSeats.length; i++) {
    if (!activeSeatIndexes.includes(i)) {
      continue;
    }
    const cardResult = drawCard(currentGs.deck, currentGs);
    if (!cardResult) continue;
    currentGs = cardResult.gs;
    newSeats[i] = {
      ...newSeats[i],
      hands: newSeats[i].hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              cards: [...hand.cards, { ...cardResult.card, faceUp: true }],
            }
          : hand
      ),
    };
  }

  // Deal one face-down card to the dealer
  const dealerCardResult2 = drawCard(currentGs.deck, currentGs);
  if (!dealerCardResult2) return currentGs;
  currentGs = dealerCardResult2.gs;
  const finalDealerHand = [
    ...updatedDealerHand,
    { ...dealerCardResult2.card, faceUp: false },
  ];

  // Check for Blackjacks in player hands
  let updatedSeatsWithBlackjack = newSeats.map((seat) => {
    const hand = seat.hands[0];
    if (isBlackjack(hand.cards)) {
      return {
        ...seat,
        hands: seat.hands.map((h, index) =>
          index === 0
            ? { ...h, isDone: true, isWon: true, isBlackjack: true }
            : h
        ),
      };
    }
    return seat;
  });

  // Check if dealer has a blackjack
  let roundOver = false;

  if (isBlackjack(finalDealerHand)) {
    updatedSeatsWithBlackjack = updatedSeatsWithBlackjack.map((seat) => ({
      ...seat,
      hands: seat.hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              isDone: true,
              isWon: false,
              isBlackjack: false,
              isPush: isBlackjack(hand.cards),
            }
          : hand
      ),
    }));
    roundOver = true;
  }

  // Check if the round is over (all players are done)
  if (
    updatedSeatsWithBlackjack.every(
      (seat, index) =>
        !activeSeatIndexes.includes(index) || seat.hands[0].isDone
    )
  ) {
    roundOver = true;
    return payoutHands({
      ...currentGs,
      dealerHand: finalDealerHand,
      seats: updatedSeatsWithBlackjack,
      roundOver,
    });
  }

  return {
    ...currentGs,
    dealerHand: finalDealerHand,
    seats: updatedSeatsWithBlackjack,
    roundOver,
  };
};

/**
 * Take a seat in the game
 * @param gs The current game state
 * @param player The player taking the seat
 * @param seatPosition The position of the seat
 * @returns The new game state
 * */
export const takeSeat = (
  gs: GameState,
  player: Player,
  seatPosition: number
): GameState => {
  const gameStatePlayer = gs.players.find((p) => p.userId === player.userId);
  if (!gameStatePlayer) return gs;
  const updatedPlayer = {
    ...gameStatePlayer,
    stack: player.stack,
    userRoomDbId: player.userRoomDbId,
    isAfk: player.isAfk,
    seatIndexes: [...new Set([...gameStatePlayer.seatIndexes, seatPosition])], // Append new seat index if not duplicate
  };

  return {
    ...gs,
    players: [...gs.players, updatedPlayer],
  };
};

// Check and populate winners
export const checkHandsWon = (gs: GameState): GameState => {
  const dealerTotal = computeHandCount(gs.dealerHand);
  // return gs;
  return {
    ...gs,
    seats: gs.seats.map((seat) => ({
      ...seat,
      hands: seat.hands.map((hand) => {
        const total = computeHandCount(hand.cards);

        return {
          ...hand,
          isDone: true,
          isWon:
            (dealerTotal > 21 && total <= 21) ||
            (total > dealerTotal && total <= 21),
          isBlackjack: total === 21 && hand.cards.length === 2,
          isPush: total === dealerTotal && total !== 21,
        };
      }),
    })),
  };
};

// Return a new game state with face down cards removed
export const removeFaceDownCards = (gameState: GameState): GameState => {
  // return newGameState;
  return {
    ...gameState,
    seats: gameState.seats.map((seat) => ({
      ...seat,
      hands: seat.hands.map((hand) => ({
        ...hand,
        cards: hand.cards.map((card) => ({
          ...card,
          value: card.faceUp ? card.value : 'HIDDEN',
          suit: card.faceUp ? card.suit : 'HIDDEN',
        })),
      })),
    })),
    dealerHand: gameState.dealerHand.map((card) => ({
      ...card,
      value: card.faceUp ? card.value : 'HIDDEN',
      suit: card.faceUp ? card.suit : 'HIDDEN',
    })),
    deck: {
      ...gameState.deck,
      currentDeck: gameState.deck.currentDeck.map((card) => ({
        ...card,
        value: card.faceUp ? card.value : 'HIDDEN',
        suit: card.faceUp ? card.suit : 'HIDDEN',
      })),
    },
  };
};

export const checkDealReady = (gameState: GameState) => {
  const occupiedSeats = getActiveSeats(gameState);
  return (
    occupiedSeats.every((seat) =>
      seat.hands.every((hand) => hand.bet > 0 && hand.cards.length < 1)
    ) && !gameState.roundOver
  );
};
