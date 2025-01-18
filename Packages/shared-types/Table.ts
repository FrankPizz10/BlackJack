import { Player } from './Player';
import { createDeck, Deck } from './Deck';
import { CardPair } from './CardPair';

export type Table = {
  deck: Deck;
  seats: (Player | null)[];
  minimum_bet: number;
  maximum_bet: number;
  time_to_bet: number;
  player_time_to_act: number;
  player_max_afk_time: number;
  get_deck: () => Deck;
  set_deck: (newDeck: Deck) => void;
  get_seats: () => (Player | null)[];
  set_seat: (index: number, player: Player | null) => void;
  get_minimum_bet: () => number;
  set_minimum_bet: (value: number) => void;
  get_maximum_bet: () => number;
  set_maximum_bet: (value: number) => void;
  get_time_to_bet: () => number;
  set_time_to_bet: (value: number) => void;
  get_player_time_to_act: () => number;
  set_player_time_to_act: (value: number) => void;
  get_player_max_afk_time: () => number;
  set_player_max_afk_time: (value: number) => void;
  play_blackjack: () => void;
};

export const createTable = (
  numDecks: number,
  minimum_bet: number = 10,
  maximum_bet: number = 10000,
  time_to_bet: number = 10,
  player_time_to_act: number = 10,
  player_max_afk_time: number = 10
): Table => {
  const deck = createDeck(numDecks);
  const seats: (Player | null)[] = Array(7).fill(null);

  let tableMinimumBet = minimum_bet;
  let tableMaximumBet = maximum_bet;
  let tableTimeToBet = time_to_bet;
  let tablePlayerTimeToAct = player_time_to_act;
  let tablePlayerMaxAFKTime = player_max_afk_time;

  const get_deck = (): Deck => deck;

  const set_deck = (newDeck: Deck): void => {
    Object.assign(deck, newDeck);
  };

  const get_seats = (): (Player | null)[] => seats;

  const set_seat = (index: number, player: Player | null): void => {
    if (index >= 0 && index < seats.length) seats[index] = player;
  };

  const get_minimum_bet = (): number => tableMinimumBet;

  const set_minimum_bet = (value: number): void => {
    tableMinimumBet = value;
  };

  const get_maximum_bet = (): number => tableMaximumBet;

  const set_maximum_bet = (value: number): void => {
    tableMaximumBet = value;
  };

  const get_time_to_bet = (): number => tableTimeToBet;

  const set_time_to_bet = (value: number): void => {
    tableTimeToBet = value;
  };

  const get_player_time_to_act = (): number => tablePlayerTimeToAct;

  const set_player_time_to_act = (value: number): void => {
    tablePlayerTimeToAct = value;
  };

  const get_player_max_afk_time = (): number => tablePlayerMaxAFKTime;

  const set_player_max_afk_time = (value: number): void => {
    tablePlayerMaxAFKTime = value;
  };

  const play_blackjack = (): void => {
    console.log('Starting a new round of blackjack.');

    // Shuffle the deck
    deck.shuffle();

    // Phase 1: Betting phase
    console.log('Betting phase started. Players have time to place bets.');
    for (let i = 0; i < seats.length; i++) {
      const player = seats[i];
      if (player) {
        const bet = Math.random() * (tableMaximumBet - tableMinimumBet) + tableMinimumBet; // Example bet logic
        console.log(`Player ${player.get_user_ID()} bets ${bet.toFixed(2)}.`);
      }
    }

    // Phase 2: Dealing cards
    console.log('Dealing cards to all players.');
    seats.forEach((player) => {
      if (player) {
        const hand = [deck.draw(), deck.draw()];
        //player.set_hand([hand]);
        console.log(`Player ${player.get_user_ID()} receives: ${JSON.stringify(hand)}.`);
      }
    });

    // Phase 3: Player actions
    console.log('Players take turns to act.');
    for (let i = 0; i < seats.length; i++) {
      const player = seats[i];
      if (player) {
        const action = player.take_action('Hit'); // Example action
        console.log(`Player ${player.get_user_ID()} takes action: ${action}.`);
        if (action === 'Hit') {
          const card = deck.draw();
          player.get_hand()[0]?.push(card!);
          console.log(`Player ${player.get_user_ID()} draws ${JSON.stringify(card)}.`);
        }
      }
    }

    console.log('Round completed.');
  };

  return {
    deck,
    seats,
    minimum_bet: tableMinimumBet,
    maximum_bet: tableMaximumBet,
    time_to_bet: tableTimeToBet,
    player_time_to_act: tablePlayerTimeToAct,
    player_max_afk_time: tablePlayerMaxAFKTime,
    get_deck,
    set_deck,
    get_seats,
    set_seat,
    get_minimum_bet,
    set_minimum_bet,
    get_maximum_bet,
    set_maximum_bet,
    get_time_to_bet,
    set_time_to_bet,
    get_player_time_to_act,
    set_player_time_to_act,
    get_player_max_afk_time,
    set_player_max_afk_time,
    play_blackjack,
  };
};
