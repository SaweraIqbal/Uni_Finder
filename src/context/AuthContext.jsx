import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Error parsing stored user:", err);
        sessionStorage.removeItem("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (userData) => {
    try {
      const userRes = await fetch(
        `http://localhost:5000/api/auth/user/${userData.id}`,
      );
      const completeUser = await userRes.json();

      const finalUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        name: completeUser.name,
        username: completeUser.username,
      };

      setUser(finalUser);
      sessionStorage.setItem("user", JSON.stringify(finalUser));
    } catch (err) {
      console.error("Error fetching user data:", err);
      setUser(userData);
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
