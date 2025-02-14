import { AppContext } from '../context';

export const createGameTable = async (context: AppContext) => {
  try {
    const gameTableDb = await context.prisma.game_Table.create({
      data: {
        minBet: 1,
        maxBet: 100,
      },
    });
    return { gameTableDb };
  } catch (error) {
    console.error('Error creating game table:', error);
    throw error;
  }
};

