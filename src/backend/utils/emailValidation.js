const EMAIL_REGEX =
  /^(?=.{3,254}$)(?=.{1,64}@)[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,63}$/i;

export const normalizeEmail = (email) => {
  if (typeof email !== "string") return null;
  const normalized = email.trim().toLowerCase();
  return EMAIL_REGEX.test(normalized) ? normalized : null;
};
