import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const { login, signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            if (isSignup) {
                await signup(name, email, password);
                // Show success and switch to login form
                setSuccess("Account created successfully! Please sign in.");
                setIsSignup(false);
                setName("");
                setPassword("");
            } else {
                await login(email, password);
                navigate("/");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-left">
                    <div className="login-branding">
                        <span className="login-logo">📦</span>
                        <h1>SSIM</h1>
                        <p>Stationery Inventory Management System</p>
                        <div className="login-features">
                            <div className="feature-item">✓ Real-time stock tracking</div>
                            <div className="feature-item">✓ Category-wise organization</div>
                            <div className="feature-item">✓ Supplier management</div>
                            <div className="feature-item">✓ Low stock alerts</div>
                        </div>
                    </div>
                </div>

                <div className="login-right">
                    <form onSubmit={handleSubmit} className="login-form">
                        <h2>{isSignup ? "Create Admin Account" : "Welcome Back"}</h2>
                        <p className="login-subtitle">
                            {isSignup ? "Set up your admin account" : "Sign in to your dashboard"}
                        </p>

                        {error && <div className="alert alert-error">{error}</div>}
                        {success && <div className="alert alert-success">{success}</div>}

                        {isSignup && (
                            <div className="form-group">
                                <label htmlFor="name">Full Name</label>
                                <input
                                    id="name"
                                    type="text"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                            {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
                        </button>

                        <p className="login-toggle">
                            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
                            <button
                                type="button"
                                className="link-btn"
                                onClick={() => { setIsSignup(!isSignup); setError(""); setSuccess(""); }}
                            >
                                {isSignup ? "Sign In" : "Sign Up"}
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
