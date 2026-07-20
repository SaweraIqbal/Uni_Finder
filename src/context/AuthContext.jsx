import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (!storedUser) {
      setLoading(false);
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(storedUser);
      setUser(parsed);
    } catch (err) {
      console.error("Error parsing stored user:", err);
      sessionStorage.removeItem("user");
      setLoading(false);
      return;
    }
    setLoading(false);



    if (parsed?.id) {
      fetch(`http://localhost:5000/api/auth/user/${parsed.id}`)
        .then((r) => r.json())
        .then((u) => {
          if (!u || !u.id) return;
          const merged = {
            ...parsed,
            name: u.name ?? parsed.name,
            username: u.username ?? parsed.username,
            assigned_id: u.assigned_id ?? parsed.assigned_id,
            avatar: u.avatar_url
              ? `http://localhost:5000${u.avatar_url}`
              : parsed.avatar,
          };
          setUser(merged);
          sessionStorage.setItem("user", JSON.stringify(merged));
        })
        .catch(() => {});
    }
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
        assigned_id: completeUser.assigned_id,
        avatar: completeUser.avatar_url
          ? `http://localhost:5000${completeUser.avatar_url}`
          : undefined,
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


  const updateUser = (patch) => {
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      sessionStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
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
