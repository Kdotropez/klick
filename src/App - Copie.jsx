import React, { useState, useEffect } from 'react';
import ShopSelector from './components/ShopSelector';
import WeekSelector from './components/WeekSelector';
import EmployeeSelector from './components/EmployeeSelector';
import PlanningTable from './components/PlanningTable';
import Modal from './components/Modal';
import './App.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [isValidated, setIsValidated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [shops, setShops] = useState(() => {
    const savedShops = localStorage.getItem('shops');
    return savedShops ? JSON.parse(savedShops) : [];
  });

  useEffect(() => {
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
      const parsedEmployees = JSON.parse(savedEmployees);
      if (parsedEmployees.length > 0) {
        setEmployees(parsedEmployees);
        console.log('App: Employees restaurés depuis localStorage:', parsedEmployees);
      }
    }
    console.log('App: Initial employees state:', employees);
  }, []);

  useEffect(() => {
    localStorage.setItem('employees', JSON.stringify(employees));
    console.log('App: Employees mis à jour dans localStorage:', employees);
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('shops', JSON.stringify(shops));
    console.log('App: Shops mis à jour dans localStorage:', shops);
  }, [shops]);

  const resetShops = () => {
    console.log('App: Réinitialisation des boutiques déclenchée');
    setShops([]);
    localStorage.setItem('shops', JSON.stringify([]));
    setSelectedShop('');
    console.log('App: Boutiques réinitialisées:', []);
  };

  const goBackToShop = () => {
    console.log('App: Retour à la sélection de la boutique');
    setSelectedShop('');
    setSelectedWeek(null);
  };

  const goBackToWeek = () => {
    console.log('App: Retour à la sélection de la semaine');
    setSelectedWeek(null);
  };

  const goBackToEmployees = () => {
    console.log('App: Retour à la sélection des employés, employees avant:', employees);
    setIsValidated(false);
    const savedEmployees = localStorage.getItem('employees');
    if (savedEmployees) {
      const parsedEmployees = JSON.parse(savedEmployees);
      setEmployees(parsedEmployees);
      console.log('App: Employees restaurés depuis localStorage:', parsedEmployees);
    }
    console.log('App: Employees après retour:', employees);
  };

  const getWeekRange = (date) => {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} au ${end.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`;
  };

  const schedules = JSON.parse(localStorage.getItem('planning') || '{}');

  const calculateWeeklyHours = (employee) => {
    let total = 0;
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    days.forEach((day) => {
      const timeSlots = [];
      for (let hour = 9; hour <= 23; hour++) {
        timeSlots.push(`${hour}:00-${hour}:30`);
        timeSlots.push(`${hour}:30-${(hour + 1)}:00`);
      }
      timeSlots.push('23:30-24:00');
      timeSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${employee}`;
        if (schedules[key]) total += 0.5;
      });
    });
    return total.toFixed(1);
  };

  const handleReset = () => {
    setEmployees([]);
    setIsModalOpen(false);
    localStorage.setItem('employees', JSON.stringify([]));
    console.log('App: Employees réinitialisés:', []);
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
          <ShopSelector key={shops.length} shops={shops} onShopChange={setSelectedShop} />
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
            onEmployeesChange={setEmployees}
            onValidate={() => {
              console.log('App: Validation des employés, passage à PlanningTable');
              setIsValidated(true);
            }}
          />
          <div>
            <button onClick={goBackToWeek} className="reset-button">
              Retour
            </button>
            {employees.length > 0 && (
              <button onClick={() => setIsModalOpen(true)} className="reset-button">
                Réinitialiser
              </button>
            )}
          </div>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleReset}
            message="Voulez-vous réinitialiser la liste des employés ?"
          />
        </>
      )}
      {isValidated && employees.length > 0 && (
        <div style={{ textAlign: 'left' }}>
          <PlanningTable employees={employees} selectedWeek={selectedWeek} selectedShop={selectedShop} />
          <button onClick={goBackToEmployees} className="reset-button">
            Retour
          </button>
        </div>
      )}
    </div>
  );
}

export default App;


