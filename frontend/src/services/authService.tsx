export const getToken = () => {
  return sessionStorage.getItem("token");
};

export const getRoles = () => {
  return JSON.parse(
    sessionStorage.getItem("roles") || "[]"
  );
};

export const logout = () => {
  sessionStorage.clear();
};