import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ShopSelector from './components/ShopSelector';
import WeekSelector from './components/WeekSelector';
import EmployeeSelector from './components/EmployeeSelector';
import PlanningTable from './components/PlanningTable';
import Modal from './components/Modal';
import './App.css';

function App() {
  const [shopsData, setShopsData] = useState(() => {
    const savedShops = localStorage.getItem('shopsData');
    return savedShops
      ? JSON.parse(savedShops)
      : { 'PORT GRIMAUD': ['CHRISTINE', 'VALOU', 'MANON'] };
  });
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isValidated, setIsValidated] = useState(false);

  useEffect(() => {
    localStorage.setItem('shopsData', JSON.stringify(shopsData));
    console.log('App: Shops data updated in localStorage:', shopsData);
  }, [shopsData]);

  const resetShops = () => {
    console.log('App: Réinitialisation des boutiques déclenchée');
    setShopsData({});
    setSelectedShop('');
    setSelectedWeek(null);
    setIsValidated(false);
    localStorage.setItem('shopsData', JSON.stringify({}));
    console.log('App: Boutiques réinitialisées');
  };

  const goBackToShop = () => {
    console.log('App: Retour à la sélection de la boutique');
    setSelectedShop('');
    setSelectedWeek(null);
    setIsValidated(false);
  };

  const goBackToWeek = () => {
    console.log('App: Retour à la sélection de la semaine');
    setSelectedWeek(null);
    setIsValidated(false);
  };

  const goBackToEmployees = () => {
    console.log('App: Retour à la sélection des employés');
    setIsValidated(false);
  };

  const getWeekRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} au ${end.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  };

  return (
    <div className="app-container">
      <h1>Gestion du Planning</h1>
      {selectedShop && selectedWeek && (
        <div className="header-info">
          <div><strong>{selectedShop}</strong></div>
          <div><strong>{getWeekRange(selectedWeek)}</strong></div>
        </div>
      )}
      {!selectedShop && (
        <>
          <ShopSelector
            key={Object.keys(shopsData).length}
            shops={Object.keys(shopsData)}
            onShopChange={setSelectedShop}
            onAddShop={(newShop) => {
              if (newShop.trim() && !Object.keys(shopsData).includes(newShop.trim().toUpperCase())) {
                setShopsData((prev) => ({
                  ...prev,
                  [newShop.trim().toUpperCase()]: [],
                }));
                console.log('App: Added shop:', newShop.trim().toUpperCase());
              } else {
                console.warn('App: Shop name is empty or already exists');
              }
            }}
          />
          <button onClick={resetShops} className="reset-button">
            Réinitialiser les boutiques
          </button>
        </>
      )}
      {selectedShop && !selectedWeek && (
        <>
          <WeekSelector onWeekChange={(date) => {
            console.log('App: Semaine sélectionnée:', date);
            setSelectedWeek(date);
          }} />
          <button onClick={goBackToShop} className="reset-button">
            Retour
          </button>
        </>
      )}
      {selectedShop && selectedWeek && !isValidated && (
        <>
          <EmployeeSelector
            selectedShop={selectedShop}
            selectedWeek={selectedWeek}
            onEmployeesChange={(newEmployees) => {
              setShopsData((prev) => ({
                ...prev,
                [selectedShop]: newEmployees,
              }));
            }}
            onValidate={() => {
              console.log('App: Validation des employés, passage à PlanningTable');
              setIsValidated(true);
            }}
          />
          <div>
            <button onClick={goBackToWeek} className="reset-button">
              Retour
            </button>
          </div>
        </>
      )}
      {isValidated && shopsData[selectedShop] && Array.isArray(shopsData[selectedShop]) && shopsData[selectedShop].length > 0 && (
        <div style={{ textAlign: 'left' }}>
          <PlanningTable
            employees={shopsData[selectedShop]}
            selectedWeek={selectedWeek}
            selectedShop={selectedShop}
          />
          <button onClick={goBackToEmployees} className="reset-button">
            Retour
          </button>
        </div>
      )}
      
    </div>
  );
}

export default App;