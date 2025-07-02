import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import '../styles/ShopSelector.css';

const ShopSelector = ({ shops: propShops, onShopChange, onAddShop }) => {
  const [shops, setShops] = useState(() => {
    const savedShops = localStorage.getItem('shops');
    return savedShops ? JSON.parse(savedShops) : (propShops || []);
  });
  const [selectedShop, setSelectedShop] = useState('');
  const [newShop, setNewShop] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('ShopSelector: Initialisation des boutiques reçues:', propShops);
    if (propShops && JSON.stringify(propShops) !== JSON.stringify(shops)) {
      setShops(propShops);
    }
  }, [propShops]);

  useEffect(() => {
    localStorage.setItem('shops', JSON.stringify(shops));
    console.log('ShopSelector: shops mis à jour dans localStorage:', shops);
  }, [shops]);

  const handleSelectShop = (shop) => {
    console.log('ShopSelector: Sélection de la boutique:', shop);
    setSelectedShop(shop);
    onShopChange(shop);
  };

  const handleAddShop = () => {
    console.log('ShopSelector: Tentative d’ajout de la boutique:', newShop);
    if (newShop && !shops.includes(newShop)) {
      const updatedShops = [...shops, newShop.toUpperCase()];
      setShops(updatedShops);
      onAddShop(newShop.toUpperCase());
      setNewShop('');
      console.log('ShopSelector: Boutiques après ajout:', updatedShops);
    } else {
      console.log('ShopSelector: Ajout annulé - Nom vide ou déjà existant');
    }
  };

  const handleReset = () => {
    setSelectedShop('');
    onShopChange('');
    setIsModalOpen(false);
    console.log('ShopSelector: Sélection de la boutique réinitialisée');
  };

  return (
    <div className="shop-selector-container">
      <h2>Sélection de la Boutique</h2>
      <div className="shop-selector">
        {shops.length === 0 ? (
          <>
            <p>Aucune boutique disponible. Ajoutez-en une.</p>
            <div className="add-shop">
              <input
                type="text"
                value={newShop}
                onChange={(e) => setNewShop(e.target.value)}
                placeholder="Nouvelle boutique"
                className="shop-input"
              />
              <button onClick={handleAddShop} className="add-btn">
                <i className="fas fa-plus"></i> Ajouter
              </button>
            </div>
          </>
        ) : (
          <>
            {shops.map((shop) => (
              <button key={shop} onClick={() => handleSelectShop(shop)} className="shop-button">
                {shop}
              </button>
            ))}
            <div className="add-shop">
              <input
                type="text"
                value={newShop}
                onChange={(e) => setNewShop(e.target.value)}
                placeholder="Nouvelle boutique"
                className="shop-input"
              />
              <button onClick={handleAddShop} className="add-btn">
                <i className="fas fa-plus"></i> Ajouter
              </button>
            </div>
            {selectedShop && (
              <button onClick={() => setIsModalOpen(true)} className="reset-btn">
                <i className="fas fa-trash"></i> Réinitialiser
              </button>
            )}
          </>
        )}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleReset}
        message="Voulez-vous réinitialiser la sélection de la boutique ?"
      />
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Nicolas Lefevre 2025 Klick Planning
      </p>
    </div>
  );
};

export default ShopSelector;