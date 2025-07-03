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
    return savedShops ? JSON.parse(savedShops) : {};
  });
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentStep, setCurrentStep] = useState('shop'); // shop, week, employees, planning

  useEffect(() => {
    localStorage.setItem('shopsData', JSON.stringify(shopsData));
    console.log('App: Shops data updated in localStorage:', shopsData);
  }, [shopsData]);

  const resetShops = () => {
    console.log('App: Réinitialisation des boutiques déclenchée', { shopsData, selectedShop, selectedWeek, currentStep });
    setShopsData({});
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    localStorage.setItem('shopsData', JSON.stringify({}));
    console.log('App: Boutiques réinitialisées', { shopsData: {}, selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const goBackToShop = () => {
    console.log('App: Retour à la sélection de la boutique', { selectedShop, selectedWeek, currentStep });
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    console.log('App: Après retour à la boutique', { selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const goBackToWeek = () => {
    console.log('App: Retour à la sélection de la semaine', { selectedShop, selectedWeek, currentStep });
    setCurrentStep('week');
    console.log('App: Après retour à la semaine', { selectedShop, selectedWeek, currentStep: 'week' });
  };

  const goBackToEmployees = () => {
    console.log('App: Retour à la sélection des employés', { selectedShop, selectedWeek, currentStep });
    setCurrentStep('employees');
    console.log('App: Après retour aux employés', { selectedShop, selectedWeek, currentStep: 'employees' });
  };

  const goBackToShopFromPlanning = () => {
    console.log('App: Retour direct à la sélection de la boutique depuis PlanningTable', { selectedShop, selectedWeek, currentStep });
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    console.log('App: Après retour à la boutique depuis PlanningTable', { selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const goBackToWeekFromPlanning = () => {
    console.log('App: Retour direct à la sélection de la semaine depuis PlanningTable', { selectedShop, selectedWeek, currentStep });
    setCurrentStep('week');
    console.log('App: Après retour à la semaine depuis PlanningTable', { selectedShop, selectedWeek, currentStep: 'week' });
  };

  const goBackToEmployeesFromPlanning = () => {
    console.log('App: Retour direct à la sélection des employés depuis PlanningTable', { selectedShop, selectedWeek, currentStep });
    setCurrentStep('employees');
    console.log('App: Après retour aux employés depuis PlanningTable', { selectedShop, selectedWeek, currentStep: 'employees' });
  };

  const getWeekRange = (date) => {
    if (!date) return 'Semaine non sélectionnée';
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} au ${end.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  };

  return (
    <div className="app-container">
      <h1>Gestion du Planning (v3)</h1>
      {selectedShop && selectedWeek && (
        <div className="header-info">
          <div><strong>{selectedShop}</strong></div>
          <div><strong>{getWeekRange(selectedWeek)}</strong></div>
        </div>
      )}
      {currentStep === 'shop' && (
        <>
          <ShopSelector
            key={Object.keys(shopsData).length}
            shops={Object.keys(shopsData)}
            onShopChange={(shop) => {
              setSelectedShop(shop);
              setCurrentStep('week');
              console.log('App: Boutique sélectionnée:', shop, { currentStep: 'week' });
            }}
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
      {currentStep === 'week' && (
        <>
          <WeekSelector
            onWeekChange={(date) => {
              console.log('App: Semaine sélectionnée:', date);
              setSelectedWeek(date);
              setCurrentStep('employees');
            }}
            selectedWeek={selectedWeek}
          />
          <button onClick={goBackToShop} className="reset-button">
            Retour
          </button>
        </>
      )}
      {currentStep === 'employees' && selectedShop && selectedWeek && (
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
              setCurrentStep('planning');
            }}
          />
          <div>
            <button onClick={goBackToWeek} className="reset-button">
              Retour
            </button>
          </div>
        </>
      )}
      {currentStep === 'planning' && selectedShop && selectedWeek && shopsData[selectedShop] && Array.isArray(shopsData[selectedShop]) && shopsData[selectedShop].length > 0 && (
        <div style={{ textAlign: 'left' }}>
          <PlanningTable
            employees={shopsData[selectedShop]}
            selectedWeek={selectedWeek}
            selectedShop={selectedShop}
            onBackToShop={goBackToShopFromPlanning}
            onBackToWeek={goBackToWeekFromPlanning}
            onBackToEmployees={goBackToEmployeesFromPlanning}
          />
        </div>
      )}
    </div>
  );
}

export default App;