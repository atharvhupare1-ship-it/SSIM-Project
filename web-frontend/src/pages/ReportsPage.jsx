import { useState } from "react";
import API from "../api/axios";
import {
    MdAssessment,
    MdDownload,
    MdInventory2,
    MdCategory,
    MdLocalShipping,
    MdWarning,
    MdShowChart,
    MdHistory,
    MdAttachMoney,
    MdListAlt,
    MdArrowBack,
} from "react-icons/md";

// ─── Report Type Definitions ────────────────────────────────────────
const REPORT_TYPES = [
    {
        id: "full_inventory",
        label: "Full Inventory Report",
        description: "Complete overview of all products, categories, suppliers, stock levels, and recent movements.",
        icon: <MdAssessment />,
        color: "#16a085",
        gradient: "linear-gradient(135deg, #16a085, #1abc9c)",
    },
    {
        id: "low_stock",
        label: "Low Stock Report",
        description: "Products running low on stock that need to be reordered urgently.",
        icon: <MdWarning />,
        color: "#e74c3c",
        gradient: "linear-gradient(135deg, #e74c3c, #ff6b6b)",
    },
    {
        id: "stock_summary",
        label: "Stock Summary Report",
        description: "Stock levels grouped by category with totals and distribution overview.",
        icon: <MdShowChart />,
        color: "#e67e22",
        gradient: "linear-gradient(135deg, #e67e22, #f39c12)",
    },
    {
        id: "product_catalogue",
        label: "Product Catalogue",
        description: "Complete product listing with prices, categories, and supplier details.",
        icon: <MdInventory2 />,
        color: "#2980b9",
        gradient: "linear-gradient(135deg, #2980b9, #3498db)",
    },
    {
        id: "supplier_directory",
        label: "Supplier Directory",
        description: "All supplier contact details and the products they supply.",
        icon: <MdLocalShipping />,
        color: "#8e44ad",
        gradient: "linear-gradient(135deg, #8e44ad, #9b59b6)",
    },
    {
        id: "stock_movement",
        label: "Stock Movement Report",
        description: "Audit trail of all recent stock increases and decreases with timestamps.",
        icon: <MdHistory />,
        color: "#2c3e50",
        gradient: "linear-gradient(135deg, #2c3e50, #34495e)",
    },
    {
        id: "category_report",
        label: "Category-wise Report",
        description: "Detailed breakdown of products and stock per category.",
        icon: <MdCategory />,
        color: "#27ae60",
        gradient: "linear-gradient(135deg, #27ae60, #2ecc71)",
    },
    {
        id: "valuation_report",
        label: "Inventory Valuation",
        description: "Total monetary value of current inventory based on price × quantity.",
        icon: <MdAttachMoney />,
        color: "#f39c12",
        gradient: "linear-gradient(135deg, #f39c12, #f1c40f)",
    },
];

// ─── Text Export Helpers ─────────────────────────────────────────────
const buildTextReport = (reportType, data) => {
    const lines = [];
    const divider = "=".repeat(75);
    const thin = "-".repeat(75);
    const label = REPORT_TYPES.find((r) => r.id === reportType)?.label || "Report";

    lines.push(divider);
    lines.push(`  SSIM — ${label.toUpperCase()}`);
    lines.push(divider);
    lines.push(`  Generated: ${new Date(data.generated_at).toLocaleString()}`);
    lines.push("");

    if (data.summary) {
        lines.push(thin);
        lines.push("  SUMMARY");
        lines.push(thin);
        lines.push(`  Total Products    : ${data.summary.total_products}`);
        lines.push(`  Total Categories  : ${data.summary.total_categories}`);
        lines.push(`  Total Suppliers   : ${data.summary.total_suppliers}`);
        lines.push(`  Total Stock Units : ${data.summary.total_stock}`);
        lines.push(`  Low Stock Items   : ${data.summary.low_stock_count} (threshold: ≤${data.low_stock_threshold})`);
        if (data.summary.total_valuation !== undefined) {
            lines.push(`  Inventory Value   : ₹${parseFloat(data.summary.total_valuation).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`);
        }
        lines.push("");
    }

    if (data.stock_overview && data.stock_overview.length > 0) {
        lines.push(thin);
        lines.push("  STOCK BY CATEGORY");
        lines.push(thin);
        lines.push(`  ${"Category".padEnd(30)} ${"Products".padEnd(12)} Stock`);
        lines.push("  " + "-".repeat(55));
        data.stock_overview.forEach((r) => {
            lines.push(`  ${r.category.padEnd(30)} ${String(r.product_count).padEnd(12)} ${r.total_stock}`);
        });
        lines.push("");
    }

    if (data.low_stock_items && data.low_stock_items.length > 0) {
        lines.push(thin);
        lines.push("  ⚠ LOW STOCK ITEMS");
        lines.push(thin);
        lines.push(`  ${"Product".padEnd(30)} ${"Category".padEnd(20)} Qty`);
        lines.push("  " + "-".repeat(55));
        data.low_stock_items.forEach((i) => {
            lines.push(`  ${i.name.padEnd(30)} ${i.category_name.padEnd(20)} ${i.quantity}`);
        });
        lines.push("");
    }

    if (data.products && data.products.length > 0) {
        lines.push(thin);
        lines.push("  PRODUCTS");
        lines.push(thin);
        lines.push(`  ${"Name".padEnd(25)} ${"Category".padEnd(18)} ${"Supplier".padEnd(18)} ${"Price".padEnd(10)} Qty`);
        lines.push("  " + "-".repeat(80));
        data.products.forEach((p) => {
            lines.push(
                `  ${p.name.substring(0, 24).padEnd(25)} ${p.category_name.substring(0, 17).padEnd(18)} ${p.supplier_name.substring(0, 17).padEnd(18)} ₹${parseFloat(p.price).toFixed(2).padEnd(9)} ${p.quantity}`
            );
        });
        lines.push("");
    }

    if (data.suppliers && data.suppliers.length > 0) {
        lines.push(thin);
        lines.push("  SUPPLIERS");
        lines.push(thin);
        lines.push(`  ${"Name".padEnd(25)} ${"Phone".padEnd(16)} ${"Email".padEnd(25)} Products`);
        lines.push("  " + "-".repeat(75));
        data.suppliers.forEach((s) => {
            lines.push(
                `  ${s.name.substring(0, 24).padEnd(25)} ${(s.phone || "N/A").padEnd(16)} ${(s.email || "N/A").substring(0, 24).padEnd(25)} ${s.product_count}`
            );
        });
        lines.push("");
    }

    if (data.recent_stock_movements && data.recent_stock_movements.length > 0) {
        lines.push(thin);
        lines.push("  STOCK MOVEMENTS");
        lines.push(thin);
        lines.push(`  ${"Date".padEnd(22)} ${"Product".padEnd(22)} ${"Type".padEnd(6)} ${"Chg".padEnd(6)} ${"Prev".padEnd(6)} New`);
        lines.push("  " + "-".repeat(70));
        data.recent_stock_movements.forEach((m) => {
            const d = new Date(m.created_at).toLocaleString();
            lines.push(
                `  ${d.substring(0, 21).padEnd(22)} ${m.product_name.substring(0, 21).padEnd(22)} ${m.change_type.padEnd(6)} ${String(m.quantity_change).padEnd(6)} ${String(m.previous_quantity).padEnd(6)} ${m.new_quantity}`
            );
        });
        lines.push("");
    }

    if (data.valuation_by_category && data.valuation_by_category.length > 0) {
        lines.push(thin);
        lines.push("  VALUATION BY CATEGORY");
        lines.push(thin);
        lines.push(`  ${"Category".padEnd(30)} ${"Products".padEnd(12)} ${"Stock".padEnd(10)} Value (₹)`);
        lines.push("  " + "-".repeat(65));
        data.valuation_by_category.forEach((v) => {
            lines.push(
                `  ${v.category.padEnd(30)} ${String(v.product_count).padEnd(12)} ${String(v.total_stock).padEnd(10)} ₹${parseFloat(v.total_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            );
        });
        lines.push("");
    }

    lines.push(divider);
    lines.push("  END OF REPORT");
    lines.push(divider);
    return lines.join("\n");
};

// ─── Component ───────────────────────────────────────────────────────
const ReportsPage = () => {
    const [selectedType, setSelectedType] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const generateReport = async (typeId) => {
        setSelectedType(typeId);
        setReport(null);
        setLoading(true);
        setError("");
        try {
            const res = await API.get(`/reports/inventory?type=${typeId}`);
            setReport(res.data);
        } catch (err) {
            console.error("Report error:", err);
            const detail = err.response?.data?.error || err.response?.data?.message || err.message;
            setError(`Failed to generate report. ${detail ? `(${detail})` : "Please try again."}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadReport = () => {
        if (!report || !selectedType) return;
        const label = REPORT_TYPES.find((r) => r.id === selectedType)?.label || "Report";
        const text = buildTextReport(selectedType, report);
        const blob = new Blob([text], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SSIM_${label.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const goBack = () => {
        setSelectedType(null);
        setReport(null);
        setError("");
    };

    // ─── Report Type Selection View ──────────────
    if (!selectedType) {
        return (
            <div className="reports-page">
                <div className="page-header">
                    <div>
                        <h1>Reports</h1>
                        <p className="page-subtitle">Select a report type to generate</p>
                    </div>
                </div>

                <div className="report-type-grid">
                    {REPORT_TYPES.map((rt) => (
                        <button
                            key={rt.id}
                            className="report-type-card"
                            onClick={() => generateReport(rt.id)}
                            style={{ "--card-color": rt.color, "--card-gradient": rt.gradient }}
                        >
                            <div className="rtc-icon-wrap" style={{ background: rt.gradient }}>
                                {rt.icon}
                            </div>
                            <div className="rtc-info">
                                <h3>{rt.label}</h3>
                                <p>{rt.description}</p>
                            </div>
                            <span className="rtc-arrow">→</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // ─── Report Result View ──────────────────────
    const currentType = REPORT_TYPES.find((r) => r.id === selectedType);

    return (
        <div className="reports-page">
            <div className="page-header">
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button className="btn btn-secondary btn-sm" onClick={goBack}>
                        <MdArrowBack /> Back
                    </button>
                    <div>
                        <h1>{currentType?.label}</h1>
                        <p className="page-subtitle">{currentType?.description}</p>
                    </div>
                </div>
                {report && (
                    <div style={{ display: "flex", gap: 12 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => generateReport(selectedType)}>
                            <MdAssessment /> Refresh
                        </button>
                        <button id="download-report-btn" className="btn btn-secondary btn-sm" onClick={downloadReport}>
                            <MdDownload /> Download .txt
                        </button>
                    </div>
                )}
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            {loading && (
                <div className="loading-screen">
                    <div className="spinner"></div>
                    <p>Generating {currentType?.label}...</p>
                </div>
            )}

            {report && !loading && (
                <div className="report-preview">
                    {/* Gradient Header */}
                    <div className="report-header-card" style={{ background: currentType?.gradient }}>
                        <div className="report-title-section">
                            <MdAssessment className="report-main-icon" />
                            <div>
                                <h2>{currentType?.label}</h2>
                                <p className="report-timestamp">
                                    Generated on {new Date(report.generated_at).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Summary Stats (if present) */}
                    {report.summary && (
                        <div className="stat-cards">
                            <div className="stat-card" style={{ borderTopColor: "#16a085" }}>
                                <div className="stat-card-icon" style={{ color: "#16a085" }}><MdInventory2 /></div>
                                <div className="stat-card-info">
                                    <span className="stat-value">{report.summary.total_products}</span>
                                    <span className="stat-label">Products</span>
                                </div>
                            </div>
                            <div className="stat-card" style={{ borderTopColor: "#2980b9" }}>
                                <div className="stat-card-icon" style={{ color: "#2980b9" }}><MdCategory /></div>
                                <div className="stat-card-info">
                                    <span className="stat-value">{report.summary.total_categories}</span>
                                    <span className="stat-label">Categories</span>
                                </div>
                            </div>
                            <div className="stat-card" style={{ borderTopColor: "#8e44ad" }}>
                                <div className="stat-card-icon" style={{ color: "#8e44ad" }}><MdLocalShipping /></div>
                                <div className="stat-card-info">
                                    <span className="stat-value">{report.summary.total_suppliers}</span>
                                    <span className="stat-label">Suppliers</span>
                                </div>
                            </div>
                            <div className="stat-card" style={{ borderTopColor: "#e67e22" }}>
                                <div className="stat-card-icon" style={{ color: "#e67e22" }}><MdShowChart /></div>
                                <div className="stat-card-info">
                                    <span className="stat-value">{report.summary.total_stock}</span>
                                    <span className="stat-label">Total Stock</span>
                                </div>
                            </div>
                            {report.summary.low_stock_count !== undefined && (
                                <div className="stat-card" style={{ borderTopColor: report.summary.low_stock_count > 0 ? "#e74c3c" : "#27ae60" }}>
                                    <div className="stat-card-icon" style={{ color: report.summary.low_stock_count > 0 ? "#e74c3c" : "#27ae60" }}><MdWarning /></div>
                                    <div className="stat-card-info">
                                        <span className="stat-value">{report.summary.low_stock_count}</span>
                                        <span className="stat-label">Low Stock</span>
                                    </div>
                                </div>
                            )}
                            {report.summary.total_valuation !== undefined && (
                                <div className="stat-card" style={{ borderTopColor: "#f39c12" }}>
                                    <div className="stat-card-icon" style={{ color: "#f39c12" }}><MdAttachMoney /></div>
                                    <div className="stat-card-info">
                                        <span className="stat-value">₹{parseFloat(report.summary.total_valuation).toLocaleString("en-IN")}</span>
                                        <span className="stat-label">Inventory Value</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Low Stock Alert Table */}
                    {report.low_stock_items && report.low_stock_items.length > 0 && (
                        <div className="card report-section">
                            <h3><MdWarning style={{ color: "#e74c3c", marginRight: 8 }} /> Low Stock Items ({report.low_stock_items.length})</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Product</th><th>Category</th><th>Quantity</th></tr></thead>
                                    <tbody>
                                        {report.low_stock_items.map((item, i) => (
                                            <tr key={i}>
                                                <td>{item.name}</td>
                                                <td><span className="badge">{item.category_name}</span></td>
                                                <td><span className="qty-badge low">{item.quantity}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Stock by Category */}
                    {report.stock_overview && report.stock_overview.length > 0 && (
                        <div className="card report-section">
                            <h3><MdCategory style={{ color: "#2980b9", marginRight: 8 }} /> Stock by Category</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Category</th><th>Products</th><th>Total Stock</th></tr></thead>
                                    <tbody>
                                        {report.stock_overview.map((row, i) => (
                                            <tr key={i}>
                                                <td><span className="badge">{row.category}</span></td>
                                                <td>{row.product_count}</td>
                                                <td><strong>{row.total_stock}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Valuation by Category */}
                    {report.valuation_by_category && report.valuation_by_category.length > 0 && (
                        <div className="card report-section">
                            <h3><MdAttachMoney style={{ color: "#f39c12", marginRight: 8 }} /> Valuation by Category</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Category</th><th>Products</th><th>Stock</th><th>Value (₹)</th></tr></thead>
                                    <tbody>
                                        {report.valuation_by_category.map((v, i) => (
                                            <tr key={i}>
                                                <td><span className="badge">{v.category}</span></td>
                                                <td>{v.product_count}</td>
                                                <td>{v.total_stock}</td>
                                                <td><strong>₹{parseFloat(v.total_value).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Products Table */}
                    {report.products && report.products.length > 0 && (
                        <div className="card report-section">
                            <h3><MdInventory2 style={{ color: "#16a085", marginRight: 8 }} /> Products ({report.products.length})</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>Price</th><th>Qty</th></tr></thead>
                                    <tbody>
                                        {report.products.map((p) => (
                                            <tr key={p.id}>
                                                <td>{p.name}</td>
                                                <td><span className="badge">{p.category_name}</span></td>
                                                <td>{p.supplier_name}</td>
                                                <td>₹{parseFloat(p.price).toFixed(2)}</td>
                                                <td><span className={`qty-badge ${p.quantity <= 10 ? "low" : "ok"}`}>{p.quantity}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Suppliers Table */}
                    {report.suppliers && report.suppliers.length > 0 && (
                        <div className="card report-section">
                            <h3><MdLocalShipping style={{ color: "#8e44ad", marginRight: 8 }} /> Suppliers ({report.suppliers.length})</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Supplier</th><th>Phone</th><th>Email</th><th>Address</th><th>Products</th></tr></thead>
                                    <tbody>
                                        {report.suppliers.map((s) => (
                                            <tr key={s.id}>
                                                <td><strong>{s.name}</strong></td>
                                                <td>{s.phone || "—"}</td>
                                                <td>{s.email || "—"}</td>
                                                <td>{s.address || "—"}</td>
                                                <td>{s.product_count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Stock Movements Table */}
                    {report.recent_stock_movements && report.recent_stock_movements.length > 0 && (
                        <div className="card report-section">
                            <h3><MdHistory style={{ color: "#e67e22", marginRight: 8 }} /> Stock Movements</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Date</th><th>Product</th><th>Type</th><th>Change</th><th>Prev</th><th>New</th><th>Notes</th></tr></thead>
                                    <tbody>
                                        {report.recent_stock_movements.map((m, i) => (
                                            <tr key={i}>
                                                <td>{new Date(m.created_at).toLocaleDateString()}</td>
                                                <td>{m.product_name}</td>
                                                <td><span className={`change-badge ${m.change_type.toLowerCase()}`}>{m.change_type === "IN" ? "▲" : "▼"} {m.change_type}</span></td>
                                                <td>{m.quantity_change}</td>
                                                <td>{m.previous_quantity}</td>
                                                <td>{m.new_quantity}</td>
                                                <td>{m.notes || "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Categories Table */}
                    {report.categories && report.categories.length > 0 && (
                        <div className="card report-section">
                            <h3><MdListAlt style={{ color: "#27ae60", marginRight: 8 }} /> Categories ({report.categories.length})</h3>
                            <div className="table-wrapper">
                                <table>
                                    <thead><tr><th>Category</th><th>Description</th><th>Products</th><th>Total Stock</th></tr></thead>
                                    <tbody>
                                        {report.categories.map((c) => (
                                            <tr key={c.id}>
                                                <td><strong>{c.name}</strong></td>
                                                <td>{c.description || "—"}</td>
                                                <td>{c.product_count}</td>
                                                <td><strong>{c.total_stock}</strong></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReportsPage;
