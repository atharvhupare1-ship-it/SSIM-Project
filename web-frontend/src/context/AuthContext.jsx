import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedToken = localStorage.getItem("ssim_token");
        const savedUser = localStorage.getItem("ssim_user");
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        const res = await API.post("/auth/login", { email, password });
        const { token: newToken, user: userData } = res.data;
        localStorage.setItem("ssim_token", newToken);
        localStorage.setItem("ssim_user", JSON.stringify(userData));
        setToken(newToken);
        setUser(userData);
        return res.data;
    };

    // Signup does NOT auto-login — just creates the account
    const signup = async (name, email, password) => {
        const res = await API.post("/auth/signup", { name, email, password });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem("ssim_token");
        localStorage.removeItem("ssim_user");
        setToken(null);
        setUser(null);
    };

    const isAuthenticated = !!token;

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
};
