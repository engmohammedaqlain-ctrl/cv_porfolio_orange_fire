import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Portfolio from './Portfolio';
import Dashboard from './dashboard/Dashboard';
import ProductCatalog from './catalog/ProductCatalog';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portfolio />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/catalog" element={<ProductCatalog />} />
      </Routes>
    </BrowserRouter>
  );
}

