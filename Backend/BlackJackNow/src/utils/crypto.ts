import crypto from 'crypto';

export const generateRoomUrl = (): string => {
  return `bjn${crypto.randomBytes(4).toString('hex')}`; // Generates an 8-character hex string
};
