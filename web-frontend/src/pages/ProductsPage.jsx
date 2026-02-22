import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../api/axios";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdVisibility } from "react-icons/md";

const ProductsPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState(null);
    const [viewProduct, setViewProduct] = useState(null);

    const fetchProducts = async (page = 1) => {
        try {
            setLoading(true);
            const params = new URLSearchParams({ page, limit: 10 });
            if (search) params.append("search", search);
            if (categoryFilter) params.append("category_id", categoryFilter);

            const res = await API.get(`/products?${params}`);
            setProducts(res.data.products);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Fetch products error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await API.get("/categories");
            setCategories(res.data.categories);
        } catch (err) {
            console.error("Fetch categories error:", err);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts(1);
    }, [search, categoryFilter]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await API.delete(`/products/${deleteId}`);
            setDeleteId(null);
            fetchProducts(pagination.page);
        } catch (err) {
            console.error("Delete product error:", err);
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1>Products</h1>
                    <p className="page-subtitle">Manage your stationery inventory</p>
                </div>
                <Link to="/products/new" className="btn btn-primary">
                    <MdAdd /> Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="filters">
                <div className="search-box">
                    <MdSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Products Table */}
            {loading ? (
                <div className="loading-screen"><div className="spinner"></div></div>
            ) : products.length > 0 ? (
                <>
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Category</th>
                                    <th>Supplier</th>
                                    <th>Price</th>
                                    <th>Quantity</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.id}>
                                        <td className="product-name">{p.name}</td>
                                        <td><span className="badge">{p.category_name || "—"}</span></td>
                                        <td>{p.supplier_name || "—"}</td>
                                        <td>₹{parseFloat(p.price).toFixed(2)}</td>
                                        <td>
                                            <span className={`qty-badge ${p.quantity <= 10 ? "low" : "ok"}`}>
                                                {p.quantity}
                                            </span>
                                        </td>
                                        <td className="actions">
                                            <button className="btn-icon view" title="View" onClick={() => setViewProduct(p)}>
                                                <MdVisibility />
                                            </button>
                                            <Link to={`/products/edit/${p.id}`} className="btn-icon edit" title="Edit">
                                                <MdEdit />
                                            </Link>
                                            <button className="btn-icon delete" title="Delete" onClick={() => setDeleteId(p.id)}>
                                                <MdDelete />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            className="btn btn-sm"
                            disabled={pagination.page <= 1}
                            onClick={() => fetchProducts(pagination.page - 1)}
                        >
                            Previous
                        </button>
                        <span className="page-info">
                            Page {pagination.page} of {pagination.totalPages} ({pagination.total} items)
                        </span>
                        <button
                            className="btn btn-sm"
                            disabled={pagination.page >= pagination.totalPages}
                            onClick={() => fetchProducts(pagination.page + 1)}
                        >
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <div className="empty-state">
                    <MdInventory2 className="empty-icon" />
                    <h3>No products found</h3>
                    <p>Try adjusting your search or add a new product.</p>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="modal-overlay" onClick={() => setDeleteId(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>Confirm Deletion</h3>
                        <p>Are you sure you want to delete this product? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
                            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* View Product Modal */}
            {viewProduct && (
                <div className="modal-overlay" onClick={() => setViewProduct(null)}>
                    <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
                        <h3>Product Details</h3>
                        <div className="detail-grid">
                            <div className="detail-item"><span className="detail-label">Name</span><span>{viewProduct.name}</span></div>
                            <div className="detail-item"><span className="detail-label">Category</span><span>{viewProduct.category_name || "—"}</span></div>
                            <div className="detail-item"><span className="detail-label">Supplier</span><span>{viewProduct.supplier_name || "—"}</span></div>
                            <div className="detail-item"><span className="detail-label">Price</span><span>₹{parseFloat(viewProduct.price).toFixed(2)}</span></div>
                            <div className="detail-item"><span className="detail-label">Quantity</span><span>{viewProduct.quantity}</span></div>
                            <div className="detail-item"><span className="detail-label">Added</span><span>{new Date(viewProduct.created_at).toLocaleString()}</span></div>
                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-secondary" onClick={() => setViewProduct(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductsPage;
