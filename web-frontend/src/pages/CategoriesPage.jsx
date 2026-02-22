import { useEffect, useState } from "react";
import API from "../api/axios";
import { MdAdd, MdEdit, MdDelete, MdCheck, MdClose } from "react-icons/md";

const CategoriesPage = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [form, setForm] = useState({ name: "", description: "" });
    const [deleteId, setDeleteId] = useState(null);
    const [error, setError] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await API.get("/categories");
            setCategories(res.data.categories);
        } catch (err) {
            console.error("Fetch categories error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, []);

    const resetForm = () => {
        setForm({ name: "", description: "" });
        setEditId(null);
        setShowForm(false);
        setError("");
    };

    const handleEdit = (cat) => {
        setForm({ name: cat.name, description: cat.description || "" });
        setEditId(cat.id);
        setShowForm(true);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name.trim()) {
            setError("Category name is required.");
            return;
        }

        try {
            if (editId) {
                await API.put(`/categories/${editId}`, form);
            } else {
                await API.post("/categories", form);
            }
            resetForm();
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save category.");
        }
    };

    const handleDelete = async () => {
        try {
            await API.delete(`/categories/${deleteId}`);
            setDeleteId(null);
            fetchCategories();
        } catch (err) {
            console.error("Delete category error:", err);
        }
    };

    if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Categories</h1>
                    <p className="page-subtitle">Organize your products by category</p>
                </div>
                {!showForm && (
                    <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                        <MdAdd /> Add Category
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {showForm && (
                <div className="card form-card">
                    <h3>{editId ? "Edit Category" : "New Category"}</h3>
                    {error && <div className="alert alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="cat-name">Name *</label>
                                <input
                                    id="cat-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="e.g. Pens"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="cat-desc">Description</label>
                                <input
                                    id="cat-desc"
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Brief description..."
                                />
                            </div>
                        </div>
                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                <MdClose /> Cancel
                            </button>
                            <button type="submit" className="btn btn-primary">
                                <MdCheck /> {editId ? "Update" : "Create"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories Table */}
            {categories.length > 0 ? (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Products</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map((c) => (
                                <tr key={c.id}>
                                    <td className="product-name">{c.name}</td>
                                    <td>{c.description || "—"}</td>
                                    <td><span className="badge">{c.product_count}</span></td>
                                    <td>{new Date(c.created_at).toLocaleDateString()}</td>
                                    <td className="actions">
                                        <button className="btn-icon edit" onClick={() => handleEdit(c)} title="Edit">
                                            <MdEdit />
                                        </button>
                                        <button className="btn-icon delete" onClick={() => setDeleteId(c.id)} title="Delete">
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="empty-state">
                    <MdCategory className="empty-icon" />
                    <h3>No categories yet</h3>
                    <p>Create your first category to organize products.</p>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Delete Category</h3>
                        <p>Products in this category will become uncategorized. Continue?</p>
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

export default CategoriesPage;
