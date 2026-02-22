import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
    MdDashboard,
    MdInventory2,
    MdCategory,
    MdLocalShipping,
    MdShowChart,
    MdLogout,
} from "react-icons/md";

const navItems = [
    { path: "/", label: "Dashboard", icon: <MdDashboard /> },
    { path: "/products", label: "Products", icon: <MdInventory2 /> },
    { path: "/categories", label: "Categories", icon: <MdCategory /> },
    { path: "/suppliers", label: "Suppliers", icon: <MdLocalShipping /> },
    { path: "/stock", label: "Stock", icon: <MdShowChart /> },
];

const Sidebar = () => {
    const { user, logout } = useAuth();

    return (
        <aside className="sidebar">
            <div className="sidebar-brand">
                <span className="sidebar-logo">📦</span>
                <h2>SSIM</h2>
                <p className="sidebar-subtitle">Inventory Manager</p>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.path === "/"}
                        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    >
                        <span className="sidebar-icon">{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user">
                    <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase() || "A"}</div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || "Admin"}</span>
                        <span className="user-role">{user?.role || "ADMIN"}</span>
                    </div>
                </div>
                <button className="sidebar-logout" onClick={logout} title="Logout">
                    <MdLogout />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
