import { useEffect, useState } from "react";
import API from "../api/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend,
} from "recharts";
import { MdInventory2, MdCategory, MdLocalShipping, MdWarning, MdShowChart } from "react-icons/md";

const CHART_COLORS = ["#16a085", "#2980b9", "#8e44ad", "#e67e22", "#e74c3c", "#1abc9c", "#3498db", "#f39c12"];

const DashboardPage = () => {
    const [stats, setStats] = useState(null);
    const [recent, setRecent] = useState([]);
    const [stockOverview, setStockOverview] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, recentRes, overviewRes] = await Promise.all([
                    API.get("/dashboard/stats"),
                    API.get("/dashboard/recent"),
                    API.get("/dashboard/stock-overview"),
                ]);
                setStats(statsRes.data);
                setRecent(recentRes.data.recent_products);
                setStockOverview(overviewRes.data.stock_overview);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="loading-screen"><div className="spinner"></div><p>Loading dashboard...</p></div>;

    const statCards = [
        { label: "Total Products", value: stats?.total_products || 0, icon: <MdInventory2 />, color: "#16a085" },
        { label: "Categories", value: stats?.total_categories || 0, icon: <MdCategory />, color: "#2980b9" },
        { label: "Suppliers", value: stats?.total_suppliers || 0, icon: <MdLocalShipping />, color: "#8e44ad" },
        { label: "Total Stock", value: stats?.total_stock || 0, icon: <MdShowChart />, color: "#e67e22" },
        { label: "Low Stock Items", value: stats?.low_stock_count || 0, icon: <MdWarning />, color: stats?.low_stock_count > 0 ? "#e74c3c" : "#27ae60" },
    ];

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <h1>Dashboard</h1>
                <p className="page-subtitle">Overview of your inventory</p>
            </div>

            {/* Stat Cards */}
            <div className="stat-cards">
                {statCards.map((card) => (
                    <div key={card.label} className="stat-card" style={{ borderTopColor: card.color }}>
                        <div className="stat-card-icon" style={{ color: card.color }}>{card.icon}</div>
                        <div className="stat-card-info">
                            <span className="stat-value">{card.value}</span>
                            <span className="stat-label">{card.label}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts */}
            <div className="dashboard-charts">
                <div className="chart-card">
                    <h3>Stock by Category</h3>
                    {stockOverview.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={stockOverview}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip
                                    contentStyle={{ borderRadius: 8, border: "1px solid #eee" }}
                                />
                                <Bar dataKey="total_stock" fill="#16a085" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="no-data">No data available yet</p>
                    )}
                </div>

                <div className="chart-card">
                    <h3>Products per Category</h3>
                    {stockOverview.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={stockOverview}
                                    dataKey="product_count"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    label={({ category, product_count }) => `${category} (${product_count})`}
                                >
                                    {stockOverview.map((_, i) => (
                                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="no-data">No data available yet</p>
                    )}
                </div>
            </div>

            {/* Recent Products */}
            <div className="card">
                <h3>Recently Added Products</h3>
                {recent.length > 0 ? (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Added</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recent.map((p) => (
                                    <tr key={p.id}>
                                        <td>{p.name}</td>
                                        <td><span className="badge">{p.category_name || "—"}</span></td>
                                        <td>₹{parseFloat(p.price).toFixed(2)}</td>
                                        <td>
                                            <span className={`qty-badge ${p.quantity <= 10 ? "low" : "ok"}`}>
                                                {p.quantity}
                                            </span>
                                        </td>
                                        <td>{new Date(p.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="no-data">No products added yet</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;
