import { AppContext } from 'src/context';

export const getUserIdFromToken = async (
  context: AppContext,
  decodedToken: string
): Promise<number | undefined> => {
  const userId = await context.prisma.users.findUnique({
    where: {
      uid: decodedToken,
    },
    select: {
      id: true,
    },
  });
  return userId?.id;
};
