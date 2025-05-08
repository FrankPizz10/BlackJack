import { AppContext } from '../context';
import { z } from 'zod';

const MIN_BET = 1; // Minimum bet value
const MAX_BET = 100; // Maximum bet value

// This function creates a new game table in the database with default min and max bet values.
export const createGameTable = async (context: AppContext) => {
  try {
    const gameTableDb = await context.prisma.game_Table.create({
      data: {
        minBet: MIN_BET,
        maxBet: MAX_BET,
      },
    });
    return { gameTableDb };
  } catch (error) {
    console.error('Error creating game table:', error);
    throw error;
  }
};

// Zod schema for validating the update options
export const updateGameTableSchema = z.object({
  minBet: z.number().optional().default(MIN_BET),
  maxBet: z.number().optional().default(MAX_BET),
  maxSeats: z.number().optional(),
  timeToAct: z.number().optional(),
  timeToBet: z.number().optional(),
  maxAwayTime: z.number().optional(),
  numberOfDecks: z.number().optional(),
  shuffleFrequency: z.number().optional(),
  blackjackPayout: z.number().optional(),
  insurancePayout: z.number().optional(),
  surrender: z.boolean().optional(),
  doubleAfterSplit: z.boolean().optional(),
  maxSplits: z.number().optional(),
  resplitAces: z.boolean().optional(),
  soft17: z.boolean().optional(),
  sideBets: z.boolean().optional(),
  betOnOtherBoxes: z.boolean().optional(),
  rejoin: z.boolean().optional(),
});

const UpdateGameTableOptions = updateGameTableSchema.partial().strict();
export type UpdateGameTableOptions = z.infer<typeof UpdateGameTableOptions>;

export const updateGameTable = async (
  context: AppContext,
  gameTableId: number,
  options: UpdateGameTableOptions
) => {
  try {
    const gameTableDb = await context.prisma.game_Table.update({
      where: { id: gameTableId },
      data: options,
    });
    return { gameTableDb };
  } catch (error) {
    console.error('Error updating game table:', error);
    throw error;
  }
};
