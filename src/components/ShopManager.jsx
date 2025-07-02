// src/components/ShopManager.jsx
import React, { useState } from 'react';
import '../styles/ShopManager.css'; // Crée un fichier CSS si nécessaire

const ShopManager = ({ onShopsUpdate }) => {
  const [shopName, setShopName] = useState('');
  const [shops, setShops] = useState([]); // Liste des boutiques choisies

  const handleAddShop = (e) => {
    e.preventDefault();
    if (shopName.trim() && !shops.includes(shopName.trim())) {
      const newShops = [...shops, shopName.trim()];
      setShops(newShops);
      setShopName('');
      onShopsUpdate(newShops); // Informer le parent des changements
    }
  };

  const handleRemoveShop = (shop) => {
    const newShops = shops.filter((s) => s !== shop);
    setShops(newShops);
    onShopsUpdate(newShops);
  };

  return (
    <div className="shop-manager">
      <h2>Gérer les boutiques</h2>
      <form onSubmit={handleAddShop}>
        <input
          type="text"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          placeholder="Nom de la boutique"
        />
        <button type="submit">Ajouter</button>
      </form>
      <ul>
        {shops.length === 0 ? (
          <li>Aucune boutique ajoutée</li>
        ) : (
          shops.map((shop) => (
            <li key={shop}>
              {shop} <button onClick={() => handleRemoveShop(shop)}>Supprimer</button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ShopManager;