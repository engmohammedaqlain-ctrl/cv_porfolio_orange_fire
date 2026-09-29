import { useEffect, useState } from 'react';
import { client, urlFor } from '../sanityClient';
import './catalog.css';

export default function ProductCatalog() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        client.fetch(`
      *[_type == "product"] | order(category asc) {
        _id,
        name,
        category,
        "imageUrl": image.asset->url,
        price,
        description
      }
    `).then(data => {
            setProducts(data);
            setLoading(false);
        });
    }, []);

    const handlePrint = () => {
        window.print();
    };

    const grouped = products.reduce((acc, p) => {
        if (!acc[p.category]) acc[p.category] = [];
        acc[p.category].push(p);
        return acc;
    }, {});

    if (loading) return <div>Loading Catalog...</div>;

    return (
        <div className="catalog-container">
            <div className="catalog-header">
                <h1>Product Catalog 2026</h1>
                <button onClick={handlePrint} className="no-print" style={{ padding: '10px', marginTop: '10px' }}>
                    Download as PDF
                </button>
            </div>

            {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="catalog-section">
                    <h2 className="category-title">{category}</h2>
                    <div className="product-grid">
                        {items.map(product => (
                            <div key={product._id} className="product-card">
                                <div className="product-image-container">
                                    {product.imageUrl ? (
                                        <img
                                            src={urlFor(product.imageUrl).width(400).url()}
                                            alt={product.name}
                                            className="product-image"
                                        />
                                    ) : (
                                        <div style={{ color: '#b3b3b3' }}>No Image</div>
                                    )}
                                </div>

                                <div className="product-info">
                                    <div className="product-name">{product.name}</div>
                                    <div className="product-desc">{product.description}</div>
                                </div>

                                <div className="price-bar">
                                    ${product.price}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
