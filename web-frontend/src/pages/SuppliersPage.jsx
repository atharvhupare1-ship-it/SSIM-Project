import { useEffect, useState } from "react";
import API from "../api/axios";
import { MdAdd, MdEdit, MdDelete, MdCheck, MdClose, MdLocalShipping } from "react-icons/md";

const SuppliersPage = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState("");

    const fetchSuppliers = async () => {
        try {
            const res = await API.get("/suppliers");
            setSuppliers(res.data.suppliers);
        } catch (err) {
            console.error("Fetch suppliers error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const resetForm = () => {
        setForm({ name: "", phone: "", email: "", address: "" });
        setEditId(null);
        setShowForm(false);
        setError("");
    };

    const handleEdit = (sup) => {
        setForm({
            name: sup.name || "",
            phone: sup.phone || "",
            email: sup.email || "",
            address: sup.address || "",
        });
        setEditId(sup.id);
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError("Supplier name is required.");
            return;
        }

        try {
            if (editId) {
                await API.put(`/suppliers/${editId}`, form);
            } else {
                await API.post("/suppliers", form);
            }
            resetForm();
            fetchSuppliers();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save supplier.");
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/suppliers/${deleteId}`);
            setDeleteId(null);
            fetchSuppliers();
        } catch (err) {
            console.error("Delete supplier error:", err);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Suppliers</h1>
                    <p className="page-subtitle">Manage your product suppliers</p>
                </div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <MdAdd /> Add Supplier
                    </button>
                )}
            </div>

            {/* Form */}
            {showForm && (
                <div className="card form-card">
                    <h3>{editId ? "Edit Supplier" : "New Supplier"}</h3>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="sup-name">Name *</label>
                                <input id="sup-name" type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Supplier name" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="sup-phone">Phone</label>
                                <input id="sup-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="sup-email">Email</label>
                                <input id="sup-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="supplier@email.com" />
                            </div>
                            <div className="form-group full-width">
                                <label htmlFor="sup-address">Address</label>
                                <textarea id="sup-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Full address" rows="2"></textarea>
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}><MdClose /> Cancel</button>
                            <button type="submit" className="btn btn-primary"><MdCheck /> {editId ? "Update" : "Create"}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Suppliers Table */}
            {suppliers.length > 0 ? (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>Email</th>
                                <th>Products</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((s) => (
                                <tr key={s.id}>
                                    <td className="product-name">{s.name}</td>
                                    <td>{s.phone || "—"}</td>
                                    <td>{s.email || "—"}</td>
                                    <td><span className="badge">{s.product_count}</span></td>
                                    <td className="actions">
                                        <button className="btn-icon edit" onClick={() => handleEdit(s)} title="Edit"><MdEdit /></button>
                                        <button className="btn-icon delete" onClick={() => setDeleteId(s.id)} title="Delete"><MdDelete /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <MdLocalShipping className="empty-icon" />
                    <h3>No suppliers yet</h3>
                    <p>Add your first supplier to get started.</p>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Supplier</h3>
                        <p>Products linked to this supplier will be unlinked. Continue?</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuppliersPage;
