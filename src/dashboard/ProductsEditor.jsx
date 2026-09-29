import { useState } from 'react';
import { client } from '../sanityClient';

export default function ProductsEditor({ products, onRefresh }) {
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});

    const handleEdit = (product) => {
        setEditingId(product._id);
        setFormData(product);
    };

    const handleCancel = () => {
        setEditingId(null);
        setFormData({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Handle price specifically to avoid NaN during typing
        if (name === 'price') {
            setFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSave = async () => {
        try {
            // Validate price
            const priceVal = formData.price === '' ? 0 : Number(formData.price);

            await client
                .patch(editingId)
                .set({
                    name: formData.name,
                    category: formData.category,
                    price: priceVal,
                    description: formData.description,
                })
                .commit();
            setEditingId(null);
            // onRefresh(); // Let real-time listener handle it
        } catch (err) {
            console.error('Save failed:', err);
            alert(`Error updating product: ${err.message}`);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try {
            await client.delete(id);
            onRefresh();
        } catch (err) {
            console.error(err);
            alert('Error deleting product');
        }
    };

    const handleAdd = async () => {
        const newProduct = {
            _type: 'product',
            name: 'New Product',
            category: 'ELECTRONICS',
            price: 0,
            description: 'Product description...',
        };
        try {
            await client.create(newProduct);
            onRefresh();
        } catch (err) {
            console.error(err);
            alert('Error creating product');
        }
    };

    return (
        <div className="editor-section">
            <h3>Product Catalog</h3>
            {products.map(product => (
                <div key={product._id} className="list-item">
                    {editingId === product._id ? (
                        <div className="editor-form" style={{ width: '100%', padding: '1rem' }}>
                            <div className="editor-group">
                                <label>Product Name</label>
                                <input name="name" className="editor-input" value={formData.name} onChange={handleChange} />
                            </div>
                            <div className="editor-group">
                                <label>Category</label>
                                <select name="category" className="editor-input" value={formData.category} onChange={handleChange}>
                                    <option value="ELECTRONICS">ELECTRONICS</option>
                                    <option value="CLOTHING">CLOTHING</option>
                                    <option value="BOOKS">BOOKS</option>
                                    <option value="HOME">HOME</option>
                                </select>
                            </div>
                            <div className="editor-group">
                                <label>Price ($)</label>
                                <input name="price" type="number" className="editor-input" value={formData.price} onChange={handleChange} />
                            </div>
                            <div className="editor-group">
                                <label>Description</label>
                                <textarea name="description" className="editor-textarea" value={formData.description} onChange={handleChange} />
                            </div>
                            <div className="list-actions">
                                <button className="save-btn" onClick={handleSave} style={{ marginTop: 0, padding: '0.5rem 1rem' }}>
                                    Save
                                </button>
                                <button className="icon-btn delete" onClick={handleCancel}>✕</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="list-item-content">
                                <h4>{product.name}</h4>
                                <p>{product.category} — ${product.price}</p>
                            </div>
                            <div className="list-actions">
                                <button className="icon-btn" onClick={() => handleEdit(product)}>✎</button>
                                <button className="icon-btn delete" onClick={() => handleDelete(product._id)}>🗑</button>
                            </div>
                        </>
                    )}
                </div>
            ))}
            <button className="add-btn" onClick={handleAdd}>+ Add New Product</button>
        </div>
    );
}
