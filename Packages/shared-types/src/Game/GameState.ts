import { Card } from './Card';
import { createDeck, Deck, draw, shuffle } from './Deck';
import { Hand, computeHandCount } from './Hand';
import { Seat } from './Seat';
import { ActionType } from './ActionType';
import { Action } from './Action';
import { Bet } from './Bet';
import { Player } from './Player';
import { RoomWithUsersAndSeats, UserRoomWithSeat } from '../db/UserRoom';

// GameState.ts will be stored in Redis Cache
// Redis Key for the Gamestate will look like Game:{roomId}
export type GameState = Readonly<{
  rommDbId: number;
  gameTableDbId: number;
  dealerHand: ReadonlyArray<Card>;
  seats: ReadonlyArray<Seat>; // Always 7 seats
  roundOver: boolean;
  timeToAct: number;
  timeToBet: number;
  deck: Readonly<Deck>;
  shuffle: boolean;
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
  const seat = gs.seats[gs.seats.findIndex((s) => s.isTurn)];
  const hand = seat.hands.find((h) => h.isCurrentHand);
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
    seat.player.stack >= hand.bet
  ) {
    actions.push('Split');
  }

  // Allow Double Down if the hand total is 9, 10, 11 (without an Ace) or 16-18 (with an Ace) and the player has enough stack
  const hasAce = hand.cards.some((card) => card.value === 'A');
  if (
    ((!hasAce && [9, 10, 11].includes(total)) ||
      (hasAce && [16, 17, 18].includes(total))) &&
    seat.player.stack >= hand.bet
  ) {
    actions.push('Double Down');
  }

  return actions;
};

// Helper method to handle Dealer action
export const handleDealer = (
  gs: GameState
): { isDone: boolean; gs: GameState } => {
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
    if (!cardResult) return { isDone: true, gs: currentGs };
    const card = cardResult.card;
    currentGs = cardResult.gs;
    updatedDealerHand = [...updatedDealerHand, { ...card, faceUp: true }];
    dealerTotal = computeHandCount(updatedDealerHand);
    hasAce = updatedDealerHand.some((card) => card.value === 'A');
    currentGs = { ...currentGs, dealerHand: updatedDealerHand };
  }

  return { isDone: true, gs: currentGs };
};

// Helper method for "Hit"
export const handleHit = (
  gs: GameState,
  seat: number,
  currentHand: number
): { isDone: boolean; gs: GameState } => {
  const { deck, seats } = gs;
  const drawResult = drawCard(deck, gs);
  if (!drawResult) {
    return { isDone: false, gs };
  }

  const card = drawResult.card;
  const hitGameState = drawResult.gs;
  const updatedHand: Hand = {
    ...seats[seat].hands[currentHand],
    cards: [...seats[seat].hands[currentHand].cards, { ...card, faceUp: true }],
  };

  const count = computeHandCount(updatedHand.cards);
  const isDone = count > 21;

  const updatedSeat: Seat = {
    ...seats[seat],
    hands: [
      ...seats[seat].hands.slice(0, currentHand),
      { ...updatedHand, isDone },
      ...seats[seat].hands.slice(currentHand + 1),
    ],
  };

  return {
    isDone,
    gs: {
      ...hitGameState,
      seats: [...seats.slice(0, seat), updatedSeat, ...seats.slice(seat + 1)],
    },
  };
};

// Helper method for "Stay"
export const handleStay = (
  gs: GameState,
  seat: number,
  currentHand: number
): { isDone: boolean; gs: GameState } => {
  // Update the hand to be done
  const updatedHand: Hand = {
    ...gs.seats[seat].hands[currentHand],
    isDone: true,
  };
  // Update the seat with the updated hand
  const updatedSeat: Seat = {
    ...gs.seats[seat],
    hands: [
      ...gs.seats[seat].hands.slice(0, currentHand),
      updatedHand,
      ...gs.seats[seat].hands.slice(currentHand + 1),
    ],
  };
  return {
    isDone: true,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, seat),
        updatedSeat,
        ...gs.seats.slice(seat + 1),
      ],
    },
  };
};

// Helper method for "Double Down"
export const handleDoubleDown = (
  gs: GameState,
  seat: number,
  current_hand: number
): { isDone: boolean; gs: GameState } => {
  const { deck } = gs;
  const cardResult = drawCard(deck, gs);
  if (!cardResult) {
    return { isDone: false, gs };
  }
  const card = cardResult.card;
  const drawGameState = cardResult.gs;

  const updatedHand: Hand = {
    ...drawGameState.seats[seat].hands[current_hand],
    cards: [
      ...drawGameState.seats[seat].hands[current_hand].cards,
      { ...card, faceUp: true },
    ],
    isDone: true,
    bet: drawGameState.seats[seat].hands[current_hand].bet * 2,
  };

  const updatedSeat: Seat = {
    ...drawGameState.seats[seat],
    hands: [
      ...drawGameState.seats[seat].hands.slice(0, current_hand),
      updatedHand,
      ...drawGameState.seats[seat].hands.slice(current_hand + 1),
    ],
  };
  return {
    isDone: true,
    gs: {
      ...drawGameState,
      seats: [
        ...drawGameState.seats.slice(0, seat),
        updatedSeat,
        ...drawGameState.seats.slice(seat + 1),
      ],
    },
  };
};

// Helper method for "Split"
export const handleSplit = (
  gs: GameState,
  seat: number,
  currentHand: number
): { isDone: boolean; gs: GameState } => {
  // Split the current hand into two separate hands with the same bet amount and one card each
  const newHands: Hand[] = [
    {
      cards: [gs.seats[seat].hands[currentHand].cards[0]],
      bet: gs.seats[seat].hands[currentHand].bet,
      isCurrentHand: true,
      isDone: false,
    },
    {
      cards: [gs.seats[seat].hands[currentHand].cards[1]],
      bet: gs.seats[seat].hands[currentHand].bet,
      isCurrentHand: false,
      isDone: false,
    },
  ];

  // Update the seat with the new state
  const updatedSeat: Seat = {
    ...gs.seats[seat],
    hands: newHands,
  };

  return {
    isDone: true,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, seat),
        updatedSeat,
        ...gs.seats.slice(seat + 1),
      ],
    },
  };
};

// Helper method to handle Bet action
export const handleBet = (
  gs: GameState,
  bet: Bet
): { isDone: boolean; gs: GameState } => {
  if (!gs || !bet) return { isDone: false, gs };

  const seatPosition = bet.bettingSeat;
  if (!gs.seats[seatPosition].player) {
    console.error('Player not found at position', seatPosition);
    return { isDone: false, gs };
  }

  if (bet.betAmount > gs.seats[seatPosition].player.stack) {
    console.log('Not enough stack');
    return { isDone: false, gs };
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
    player: {
      ...gs.seats[seatPosition].player,
      stack: gs.seats[seatPosition].player.stack - bet.betAmount,
    },
  };

  return {
    isDone: true,
    gs: {
      ...gs,
      seats: [
        ...gs.seats.slice(0, seatPosition),
        updatedSeat,
        ...gs.seats.slice(seatPosition + 1),
      ],
    },
  };
};

const handleReset = (gs: GameState): GameState => {
  const updatedGameState: GameState = {
    ...gs,
    seats: gs.seats.map((seat, seatIndex) => ({
      ...seat,
      hands: seat.hands.map((hand) => ({
        ...hand,
        isDone: false,
        cards: [],
        isCurrentHand: true,
        isBlackjack: false,
        isPush: false,
        isWon: false,
        bet: 0,
      })),
      isTurn: seatIndex === 0,
    })),
    roundOver: false,
    dealerHand: [],
  };
  return updatedGameState;
};

export interface ActionResult {
  gs: GameState;
  actionSuccess: boolean;
}

// Main method: take_action
export const takeAction = (gs: GameState, action: Action): ActionResult => {
  if (action.actionType === 'Bet' && action.bet) {
    const betResult = handleBet(gs, action.bet);
    if (!betResult.isDone) return { gs, actionSuccess: false };
    return { gs: betResult.gs, actionSuccess: true };
  }

  if (action.actionType === 'Reset') {
    const resetResult = handleReset(gs);
    if (!resetResult) return { gs, actionSuccess: false };
    return { gs: resetResult, actionSuccess: true };
  }

  const seat = gs.seats.findIndex((s) => s.isTurn);
  if (seat === -1) return { gs, actionSuccess: false }; // No active seat

  const elligbleActions = checkEligibleAction(gs);
  console.log('Eligible Action Types: ', elligbleActions);
  if (!elligbleActions.includes(action.actionType)) {
    return { gs, actionSuccess: false };
  }
  console.log('Eligible Action: ', action);
  const currentHand = gs.seats[seat].hands.findIndex((h) => h.isCurrentHand);
  if (currentHand === -1) return { gs, actionSuccess: false }; // No current hand
  console.log('Current Hand: ', gs.seats[seat].hands[currentHand]);
  let isDone = false;
  let gamestateAfterAction: GameState | null = null;
  switch (action.actionType) {
    case 'Hit': {
      const hitResult = handleHit(gs, seat, currentHand);
      isDone = hitResult.isDone;
      gamestateAfterAction = hitResult.gs;
      break;
    }
    case 'Stand': {
      const standResult = handleStay(gs, seat, currentHand);
      isDone = standResult.isDone;
      gamestateAfterAction = standResult.gs;
      break;
    }
    case 'Double Down': {
      const doubleDownResult = handleDoubleDown(gs, seat, currentHand);
      isDone = doubleDownResult.isDone;
      gamestateAfterAction = doubleDownResult.gs;
      break;
    }
    case 'Split': {
      const splitResult = handleSplit(gs, seat, currentHand);
      isDone = splitResult.isDone;
      gamestateAfterAction = splitResult.gs;
      break;
    }
    case 'Deal': {
      const dealResult = handleHit(gs, seat, currentHand);
      isDone = dealResult.isDone;
      gamestateAfterAction = dealResult.gs;
      break;
    }
    // case 'CheckHand':
    //   isDone = handleCheckHand(gs, seat, current_hand);
    //   break;
    case 'Dealer': {
      const dealerResult = handleDealer(gs);
      isDone = dealerResult.isDone;
      gamestateAfterAction = dealerResult.gs;
      break;
    }
    // case 'ForceShuffle':
    //   gs.shuffle = true;
    //   break;
  }
  // Return a new updated game state
  if (!isDone && gamestateAfterAction) {
    return { gs: gamestateAfterAction, actionSuccess: true };
  }
  if (isDone && gamestateAfterAction) {
    const updatedSeats = gamestateAfterAction.seats.map((s, index) => {
      if (index === seat) {
        return {
          ...s,
          hands: s.hands.map((h, hIndex) =>
            hIndex === currentHand ? { ...h, isCurrentHand: false } : h
          ),
          isTurn: false,
        };
      }
      if (index === seat + 1) {
        return { ...s, isTurn: true };
      }
      return s;
    });

    if (seat === gamestateAfterAction.seats.length - 1) {
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
  }

  return {
    gs,
    actionSuccess: false,
  };
};

const payoutHands = (gs: GameState): GameState => {
  // Create a new seats array
  const updatedSeats = gs.seats.map((seat) => {
    // Create a new hands array
    const updatedHands = seat.hands.map((hand) => ({
      ...hand,
      bet: 0, // Reset the bet
    }));

    // Calculate the payout for each hand
    const winnings = seat.hands.reduce((total, hand) => {
      if (hand.isBlackjack) {
        return total + 2.5 * hand.bet;
      } else if (hand.isPush) {
        return total + hand.bet;
      } else if (hand.isWon) {
        return total + 2 * hand.bet;
      }
      return total;
    }, 0);

    // Create a new player object with the updated stack
    const updatedPlayer = {
      ...seat.player,
      stack: seat.player.stack + winnings,
    };

    // Return the updated seat object
    return {
      ...seat,
      player: updatedPlayer,
      hands: updatedHands,
    };
  });
  // Return the updated game state object
  return {
    ...gs,
    seats: updatedSeats,
  };
};

export const createNewGameState = (
  roomInfo: RoomWithUsersAndSeats
): GameState => {
  return {
    rommDbId: roomInfo.id,
    gameTableDbId: roomInfo.gameTableId,
    dealerHand: [],
    seats: [...createSeats(roomInfo.UserRooms, roomInfo.gameTableId)],
    roundOver: false,
    timeToAct: 20,
    timeToBet: 15,
    deck: shuffle(createDeck()),
    shuffle: false,
  };
};

const createSeats = (
  userRooms: UserRoomWithSeat[],
  gameTableId: number
): Seat[] => {
  return userRooms.flatMap((userRoom) =>
    userRoom.UserSeats.map((seat) => ({
      hands: [
        {
          cards: [],
          bet: 0,
          isCurrentHand: true,
          isDone: false,
        },
      ],
      isTurn: seat.position === 1,
      isAfk: false,
      player: {
        user_ID: userRoom.userId,
        stack: userRoom.initialStack,
        userRoomDbId: userRoom.roomId,
        gameTableDbId: gameTableId,
      },
    }))
  );
};

// Begin to deal cards for the game
export const dealCards = (gs: GameState): GameState => {
  // First round: deal one face-up card to each player
  let currentGs = gs;
  const newSeats: Seat[] = currentGs.seats.map((seat) => {
    const cardResult = drawCard(gs.deck, gs);
    if (!cardResult) return seat;
    currentGs = cardResult.gs;
    return {
      ...seat,
      hands: seat.hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              cards: [...hand.cards, { ...cardResult.card, faceUp: true }],
            }
          : hand
      ),
    };
  });

  // Deal one face-up card to the dealer
  const dealerCardResult1 = drawCard(currentGs.deck, currentGs);
  if (!dealerCardResult1) return currentGs;
  currentGs = dealerCardResult1.gs;
  const updatedDealerHand = [
    ...currentGs.dealerHand,
    { ...dealerCardResult1.card, faceUp: true },
  ];

  // Second round: deal one face-up card to each player
  const updatedSeats = newSeats.map((seat) => {
    const cardResult = drawCard(currentGs.deck, currentGs);
    if (!cardResult) return seat;
    currentGs = cardResult.gs;
    return {
      ...seat,
      hands: seat.hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              cards: [...hand.cards, { ...cardResult.card, faceUp: true }],
            }
          : hand
      ),
    };
  });

  // Deal one face-down card to the dealer
  const dealerCardResult2 = drawCard(currentGs.deck, currentGs);
  if (!dealerCardResult2) return currentGs;
  currentGs = dealerCardResult2.gs;
  const finalDealerHand = [
    ...updatedDealerHand,
    { ...dealerCardResult2.card, faceUp: false },
  ];

  // Check for Blackjacks in player hands
  const updatedSeatsWithBlackjack = updatedSeats.map((seat) => {
    const hand = seat.hands[0];
    if (computeHandCount(hand.cards) === 21) {
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
  let updatedSeatsWithPush = updatedSeatsWithBlackjack;
  let roundOver = false;

  if (computeHandCount(finalDealerHand) === 21) {
    updatedSeatsWithPush = updatedSeatsWithBlackjack.map((seat) => ({
      ...seat,
      hands: seat.hands.map((hand, index) =>
        index === 0
          ? {
              ...hand,
              isDone: true,
              isWon: false,
              isBlackjack: false,
              isPush: computeHandCount(hand.cards) === 21,
            }
          : hand
      ),
    }));
    roundOver = true;
  }

  // Check if the round is over (all players are done)
  if (updatedSeatsWithPush.every((seat) => seat.hands[0].isDone)) {
    roundOver = true;
    return payoutHands({
      ...currentGs,
      dealerHand: finalDealerHand,
      seats: updatedSeatsWithPush,
      roundOver,
    });
  }

  return {
    ...currentGs,
    dealerHand: finalDealerHand,
    seats: updatedSeatsWithPush,
    roundOver,
  };
};

export const addPlayer = (gs: GameState, player: Player): GameState => {
  // Return new game state
  return {
    ...gs,
    seats: [
      ...gs.seats,
      {
        hands: [
          {
            cards: [],
            bet: 0,
            isCurrentHand: true,
            isDone: false,
          },
        ],
        isTurn: false,
        isAfk: false,
        player,
      },
    ],
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
  return (
    gameState.seats.every((seat) =>
      seat.hands.every((hand) => hand.bet > 0 && hand.cards.length < 1)
    ) && !gameState.roundOver
  );
};
