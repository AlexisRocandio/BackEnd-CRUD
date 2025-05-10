import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const encryptPassword = async (password) => {
  const hash = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(password, hash);
};

export const checkPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};
