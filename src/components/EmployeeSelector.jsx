import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import '../styles/EmployeeSelector.css';

const EmployeeSelector = ({ selectedShop, selectedWeek, onEmployeesChange, onValidate, onBack }) => {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(`employees_${selectedShop}`);
    console.log('EmployeeSelector: Initializing employees from localStorage for', selectedShop, saved);
    return saved ? JSON.parse(saved) : [];
  });
  const [newEmployee, setNewEmployee] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  useEffect(() => {
    console.log('EmployeeSelector: Saving employees to localStorage for', selectedShop, employees);
    localStorage.setItem(`employees_${selectedShop}`, JSON.stringify(employees));
    console.log('EmployeeSelector: Notifying parent of employees update:', employees);
    onEmployeesChange(employees);
  }, [employees, selectedShop, onEmployeesChange]);

  const handleAddEmployee = () => {
    const employeeName = newEmployee.trim().toUpperCase();
    console.log('EmployeeSelector: Attempting to add employee:', employeeName);
    if (employeeName && !employees.includes(employeeName)) {
      const updatedEmployees = [...employees, employeeName];
      console.log('EmployeeSelector: Adding employee to state:', updatedEmployees);
      setEmployees(updatedEmployees);
      setNewEmployee('');
    } else {
      console.warn('EmployeeSelector: Cannot add employee - empty or duplicate:', employeeName);
    }
  };

  const handleRemoveEmployee = (employee) => {
    console.log('EmployeeSelector: Removing employee:', employee);
    setEmployees(employees.filter((emp) => emp !== employee));
  };

  const handleResetEmployees = () => {
    console.log('EmployeeSelector: Resetting employees');
    setEmployees([]);
    setNewEmployee('');
    setIsResetModalOpen(false);
  };

  return (
    <div className="employee-selector">
      <h2>Sélection des Employés pour {selectedShop}</h2>
      <div className="employee-list">
        {employees.length === 0 ? (
          <p>Aucun employé ajouté. Veuillez en ajouter un.</p>
        ) : (
          employees.map((employee) => (
            <button
              key={employee}
              onClick={() => handleRemoveEmployee(employee)}
              className="employee-button"
            >
              {employee}
            </button>
          ))
        )}
      </div>
      <div className="add-employee">
        <input
          type="text"
          value={newEmployee}
          onChange={(e) => {
            console.log('EmployeeSelector: Input changed:', e.target.value);
            setNewEmployee(e.target.value);
          }}
          placeholder="Nom de l'employé"
          className="employee-input"
        />
        <button
          onClick={handleAddEmployee}
          disabled={!newEmployee.trim()}
          className="add-employee-button"
        >
          <i className="fas fa-plus"></i> Ajouter
        </button>
      </div>
      <div className="button-group">
        <button
          onClick={() => {
            console.log('EmployeeSelector: Opening reset modal');
            setIsResetModalOpen(true);
          }}
          className="reset-employee-button"
          disabled={employees.length === 0}
        >
          <i className="fas fa-trash"></i> Réinitialiser
        </button>
        <button
          onClick={() => {
            console.log('EmployeeSelector: Navigating back');
            onBack();
          }}
          className="back-button"
        >
          Retour
        </button>
        <button
          onClick={() => {
            console.log('EmployeeSelector: Validating employees:', employees);
            onValidate();
          }}
          className="next-step-btn"
          disabled={employees.length === 0}
        >
          Étape suivante
        </button>
      </div>
      <p className="copyright">© Nicolas Lefèvre Klick Planning 2025</p>
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => {
          console.log('EmployeeSelector: Closing reset employees Modal');
          setIsResetModalOpen(false);
        }}
        onConfirm={() => {
          console.log('EmployeeSelector: Confirming reset employees');
          handleResetEmployees();
        }}
        message="Voulez-vous vraiment réinitialiser la liste des employés ?"
        style={{ width: '400px', padding: '20px' }}
      />
    </div>
  );
};

export default EmployeeSelector;