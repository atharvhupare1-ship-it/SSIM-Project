import { useEffect, useState } from "react";
import API from "../api/axios";
import { MdTrendingUp, MdTrendingDown, MdWarning } from "react-icons/md";

const StockPage = () => {
    const [products, setProducts] = useState([]);
    const [history, setHistory] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [tab, setTab] = useState("adjust"); // adjust | history | low
    const [form, setForm] = useState({ product_id: "", quantity: "", notes: "", type: "increase" });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await API.get("/products?limit=200");
                setProducts(res.data.products);
            } catch (err) {
                console.error(err);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (tab === "history") fetchHistory();
        if (tab === "low") fetchLowStock();
    }, [tab]);

    const fetchHistory = async () => {
        try {
            const res = await API.get("/stock/history?limit=50");
            setHistory(res.data.history);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchLowStock = async () => {
        try {
            const res = await API.get("/stock/low");
            setLowStock(res.data.products);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        if (!form.product_id || !form.quantity || parseInt(form.quantity) <= 0) {
            setError("Select a product and enter a valid quantity.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                product_id: form.product_id,
                quantity: parseInt(form.quantity),
                notes: form.notes,
            };
            const res = await API.post(`/stock/${form.type}`, payload);
            setMessage(res.data.message);
            setForm({ ...form, quantity: "", notes: "" });

            // Refresh products list
            const prodRes = await API.get("/products?limit=200");
            setProducts(prodRes.data.products);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to update stock.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Stock Management</h1>
                    <p className="page-subtitle">Adjust inventory levels and monitor stock</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button className={`tab ${tab === "adjust" ? "active" : ""}`} onClick={() => setTab("adjust")}>
                    Adjust Stock
                </button>
                <button className={`tab ${tab === "history" ? "active" : ""}`} onClick={() => setTab("history")}>
                    Stock History
                </button>
                <button className={`tab ${tab === "low" ? "active" : ""}`} onClick={() => setTab("low")}>
                    Low Stock Alerts
                </button>
            </div>

            {/* Adjust Stock Tab */}
            {tab === "adjust" && (
                <div className="card form-card">
                    <h3>Adjust Stock Level</h3>
                    {error && <div className="alert alert-error">{error}</div>}
                    {message && <div className="alert alert-success">{message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="stock-product">Product *</label>
                                <select id="stock-product" value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} required>
                                    <option value="">Select Product</option>
                                    {products.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} (Current: {p.quantity})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock-type">Operation</label>
                                <div className="radio-group">
                                    <label className={`radio-label ${form.type === "increase" ? "active increase" : ""}`}>
                                        <input type="radio" name="type" value="increase" checked={form.type === "increase"} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                                        <MdTrendingUp /> Increase
                                    </label>
                                    <label className={`radio-label ${form.type === "decrease" ? "active decrease" : ""}`}>
                                        <input type="radio" name="type" value="decrease" checked={form.type === "decrease"} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                                        <MdTrendingDown /> Decrease
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock-qty">Quantity *</label>
                                <input id="stock-qty" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required placeholder="Enter quantity" />
                            </div>

                            <div className="form-group">
                                <label htmlFor="stock-notes">Notes</label>
                                <input id="stock-notes" type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="e.g. Restocked from supplier" />
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? "Updating..." : "Update Stock"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Stock History Tab */}
            {tab === "history" && (
                <div className="card">
                    <h3>Stock Change History</h3>
                    {history.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Type</th>
                                        <th>Change</th>
                                        <th>Before</th>
                                        <th>After</th>
                                        <th>Notes</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((h) => (
                                        <tr key={h.id}>
                                            <td>{h.product_name}</td>
                                            <td>
                                                <span className={`change-badge ${h.change_type === "IN" ? "in" : "out"}`}>
                                                    {h.change_type === "IN" ? <MdTrendingUp /> : <MdTrendingDown />}
                                                    {h.change_type}
                                                </span>
                                            </td>
                                            <td>{h.quantity_change}</td>
                                            <td>{h.previous_quantity}</td>
                                            <td>{h.new_quantity}</td>
                                            <td>{h.notes || "—"}</td>
                                            <td>{new Date(h.created_at).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="no-data">No stock changes recorded yet.</p>
                    )}
                </div>
            )}

            {/* Low Stock Tab */}
            {tab === "low" && (
                <div className="card">
                    <h3>
                        <MdWarning style={{ color: "#e74c3c", marginRight: 8 }} />
                        Low Stock Products (≤ 10 items)
                    </h3>
                    {lowStock.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Category</th>
                                        <th>Current Stock</th>
                                        <th>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStock.map((p) => (
                                        <tr key={p.id} className="low-stock-row">
                                            <td>{p.name}</td>
                                            <td><span className="badge">{p.category_name || "—"}</span></td>
                                            <td>
                                                <span className="qty-badge low">{p.quantity}</span>
                                            </td>
                                            <td>₹{parseFloat(p.price).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state success">
                            <h3>✅ All products are well stocked!</h3>
                            <p>No products are below the low stock threshold.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StockPage;
