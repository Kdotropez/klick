import React, { useState, useEffect, useCallback } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import ShopSelector from './components/ShopSelector';
import WeekSelector from './components/WeekSelector';
import EmployeeSelector from './components/EmployeeSelector';
import PlanningTable from './components/PlanningTable';
import Modal from './components/Modal';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import './App.css';

function App() {
  const [shopsData, setShopsData] = useState(() => {
    const savedShops = localStorage.getItem('shopsData');
    console.log('App: Initializing shopsData from localStorage:', savedShops);
    const shops = savedShops ? JSON.parse(savedShops) : {};
    Object.keys(shops).forEach((shop) => {
      const savedEmployees = localStorage.getItem(`employees_${shop}`);
      if (savedEmployees) {
        shops[shop] = JSON.parse(savedEmployees);
      }
    });
    return shops;
  });
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [currentStep, setCurrentStep] = useState('shop');

  useEffect(() => {
    console.log('App: Saving shopsData to localStorage:', shopsData);
    localStorage.setItem('shopsData', JSON.stringify(shopsData));
  }, [shopsData]);

  const resetShops = () => {
    console.log('App: Réinitialisation des boutiques déclenchée', { shopsData, selectedShop, selectedWeek, currentStep });
    setShopsData({});
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    localStorage.setItem('shopsData', JSON.stringify({}));
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('employees_') || key.startsWith('planning_')) {
        localStorage.removeItem(key);
      }
    });
    console.log('App: Boutiques réinitialisées', { shopsData: {}, selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const clearLocalStorage = () => {
    Object.keys(localStorage).forEach((key) => localStorage.removeItem(key));
    console.log('App: localStorage cleared');
    setShopsData({});
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
  };

  const goBackToShop = () => {
    console.log('App: Retour à la sélection de la boutique', { shopsData, selectedShop, selectedWeek, currentStep });
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    console.log('App: Après retour à la boutique', { shopsData, selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const goBackToWeek = () => {
    console.log('App: Retour à la sélection de la semaine', { shopsData, selectedShop, selectedWeek, currentStep });
    setCurrentStep('week');
    console.log('App: Après retour à la semaine', { shopsData, selectedShop, selectedWeek, currentStep: 'week' });
  };

  const goBackToEmployees = () => {
    console.log('App: Retour à la sélection des employés', { shopsData, selectedShop, selectedWeek, currentStep });
    setCurrentStep('employees');
    console.log('App: Après retour aux employés', { shopsData, selectedShop, selectedWeek, currentStep: 'employees' });
  };

  const goBackToShopFromPlanning = () => {
    console.log('App: Retour direct à la sélection de la boutique depuis PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep });
    setSelectedShop('');
    setSelectedWeek(null);
    setCurrentStep('shop');
    console.log('App: Après retour à la boutique depuis PlanningTable', { shopsData, selectedShop: '', selectedWeek: null, currentStep: 'shop' });
  };

  const goBackToWeekFromPlanning = () => {
    console.log('App: Retour direct à la sélection de la semaine depuis PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep });
    setCurrentStep('week');
    console.log('App: Après retour à la semaine depuis PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep: 'week' });
  };

  const goBackToEmployeesFromPlanning = () => {
    console.log('App: Retour direct à la sélection des employés depuis PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep });
    setCurrentStep('employees');
    console.log('App: Après retour aux employés depuis PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep: 'employees' });
  };

  const handleWeekChange = (week) => {
    console.log('App: Semaine sélectionnée:', week);
    const date = new Date(week);
    const normalizedDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    console.log('App: Normalized date:', normalizedDate, 'Is Monday?', isMonday(normalizedDate));
    if (isMonday(normalizedDate)) {
      setSelectedWeek(week);
      setCurrentStep('employees');
    } else {
      console.warn('App: Selected week is not a Monday, ignoring:', week);
    }
  };

  const handleEmployeesChange = useCallback((newEmployees) => {
    console.log('App: Updating employees for shop:', selectedShop, newEmployees);
    setShopsData((prev) => {
      const updated = { ...prev, [selectedShop]: newEmployees };
      console.log('App: Updated shopsData:', updated);
      return updated;
    });
  }, [selectedShop]);

  const handleValidate = useCallback(() => {
    console.log('App: Validation des employés, passage à PlanningTable', { shopsData, selectedShop, selectedWeek, currentStep });
    console.log('App: Rendering conditions - selectedShop:', selectedShop, 'selectedWeek:', selectedWeek, 'shopsData[selectedShop]:', shopsData[selectedShop]);
    setCurrentStep('planning');
  }, [shopsData, selectedShop, selectedWeek]);

  const getWeekRange = (date) => {
    if (!date) return 'Semaine non sélectionnée';
    const start = new Date(date);
    const normalizedStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    if (!isMonday(normalizedStart)) {
      console.warn('App: getWeekRange received non-Monday date:', date);
      return 'Semaine non valide';
    }
    const end = new Date(normalizedStart);
    end.setDate(end.getDate() + 6);
    return `Semaine du lundi ${format(normalizedStart, 'dd/MM/yy', { locale: fr })} au dimanche ${format(end, 'dd/MM/yy', { locale: fr })}`;
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
              console.log('App: Boutique sélectionnée:', shop, { shopsData, currentStep: 'week' });
              setSelectedShop(shop);
              setCurrentStep('week');
            }}
            onAddShop={(newShop) => {
              if (newShop.trim() && !Object.keys(shopsData).includes(newShop.trim().toUpperCase())) {
                console.log('App: Adding shop:', newShop.trim().toUpperCase());
                setShopsData((prev) => ({
                  ...prev,
                  [newShop.trim().toUpperCase()]: prev[newShop.trim().toUpperCase()] || [],
                }));
              } else {
                console.warn('App: Shop name is empty or already exists:', newShop);
              }
            }}
          />
          <button onClick={resetShops} className="reset-button">
            Réinitialiser les boutiques
          </button>
          <button onClick={clearLocalStorage} className="reset-button">
            Nettoyer localStorage
          </button>
        </>
      )}
      {currentStep === 'week' && (
        <>
          <WeekSelector
            onWeekChange={handleWeekChange}
            selectedWeek={selectedWeek}
          />
          <button onClick={goBackToShop} className="reset-button">
            Retour
          </button>
        </>
      )}
      {currentStep === 'employees' && selectedShop && selectedWeek && (
        <>
          {console.log('App: Rendering EmployeeSelector with shopsData:', shopsData, 'selectedShop:', selectedShop, 'selectedWeek:', selectedWeek)}
          <EmployeeSelector
            selectedShop={selectedShop}
            selectedWeek={selectedWeek}
            onEmployeesChange={handleEmployeesChange}
            onValidate={handleValidate}
            onBack={goBackToWeek}
          />
        </>
      )}
      {currentStep === 'planning' && (
        <div style={{ textAlign: 'left' }}>
          {console.log('App: Rendering PlanningTable with employees:', shopsData[selectedShop], 'selectedShop:', selectedShop, 'selectedWeek:', selectedWeek)}
          <PlanningTable
            employees={shopsData[selectedShop] || []}
            selectedWeek={selectedWeek}
            selectedShop={selectedShop}
            onBackToShop={goBackToShopFromPlanning}
            onBackToWeek={goBackToWeekFromPlanning}
            onBackToEmployees={goBackToEmployeesFromPlanning}
            onWeekChange={handleWeekChange}
          />
        </div>
      )}
    </div>
  );
}

export default App;