import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";

const ProductFormPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [form, setForm] = useState({
        name: "", category_id: "", price: "", quantity: "", supplier_id: "", image_url: "",
    });
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [catRes, supRes] = await Promise.all([
                    API.get("/categories"),
                    API.get("/suppliers"),
                ]);
                setCategories(catRes.data.categories);
                setSuppliers(supRes.data.suppliers);

                if (isEdit) {
                    const res = await API.get(`/products/${id}`);
                    const p = res.data.product;
                    setForm({
                        name: p.name || "",
                        category_id: p.category_id || "",
                        price: p.price || "",
                        quantity: p.quantity || "",
                        supplier_id: p.supplier_id || "",
                        image_url: p.image_url || "",
                    });
                }
            } catch (err) {
                setError("Failed to load data.");
            }
        };
        loadData();
    }, [id, isEdit]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.name || !form.price) {
            setError("Product name and price are required.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...form,
                price: parseFloat(form.price),
                quantity: parseInt(form.quantity) || 0,
                category_id: form.category_id || null,
                supplier_id: form.supplier_id || null,
            };

            if (isEdit) {
                await API.put(`/products/${id}`, payload);
            } else {
                await API.post("/products", payload);
            }
            navigate("/products");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to save product.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <h1>{isEdit ? "Edit Product" : "Add Product"}</h1>
                <button className="btn btn-secondary" onClick={() => navigate("/products")}>
                    Back to Products
                </button>
            </div>

            <div className="card form-card">
                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="name">Product Name *</label>
                            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required placeholder="e.g. Cello Butterflow" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="category_id">Category</label>
                            <select id="category_id" name="category_id" value={form.category_id} onChange={handleChange}>
                                <option value="">Select Category</option>
                                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="price">Price (₹) *</label>
                            <input id="price" name="price" type="number" step="0.01" min="0" value={form.price} onChange={handleChange} required placeholder="0.00" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="quantity">Quantity</label>
                            <input id="quantity" name="quantity" type="number" min="0" value={form.quantity} onChange={handleChange} placeholder="0" />
                        </div>

                        <div className="form-group">
                            <label htmlFor="supplier_id">Supplier</label>
                            <select id="supplier_id" name="supplier_id" value={form.supplier_id} onChange={handleChange}>
                                <option value="">Select Supplier</option>
                                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="image_url">Image URL</label>
                            <input id="image_url" name="image_url" type="url" value={form.image_url} onChange={handleChange} placeholder="https://..." />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => navigate("/products")}>Cancel</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProductFormPage;
