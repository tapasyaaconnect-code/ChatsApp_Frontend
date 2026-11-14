const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const getAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (/^https?:\/\//i.test(avatar) || avatar.startsWith("data:")) return avatar;

  try {
    return new URL(avatar, new URL(apiBaseUrl).origin).toString();
  } catch {
    return avatar;
  }
};
