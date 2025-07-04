import React, { useState, useEffect } from 'react';
import '../styles/EmployeeSelector.css';

const EmployeeSelector = ({ selectedShop, selectedWeek, onEmployeesChange, onValidate, onBack }) => {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(`employees_${selectedShop}`);
    console.log('EmployeeSelector: Initializing employees from localStorage:', saved, 'selectedShop:', selectedShop);
    return saved ? JSON.parse(saved) : [];
  });
  const [newEmployee, setNewEmployee] = useState('');

  useEffect(() => {
    if (selectedShop) {
      console.log('EmployeeSelector: useEffect triggered, employees:', employees, 'selectedShop:', selectedShop, 'selectedWeek:', selectedWeek);
      localStorage.setItem(`employees_${selectedShop}`, JSON.stringify(employees));
      console.log('EmployeeSelector: Before calling onEmployeesChange, employees:', employees);
      onEmployeesChange(employees);
      console.log('EmployeeSelector: After calling onEmployeesChange, employees:', employees);
    }
  }, [employees, selectedShop, onEmployeesChange]);

  const handleAddEmployee = () => {
    if (newEmployee.trim() && !employees.includes(newEmployee.trim().toUpperCase())) {
      console.log('EmployeeSelector: Adding employee:', newEmployee.trim().toUpperCase());
      setEmployees([...employees, newEmployee.trim().toUpperCase()]);
      setNewEmployee('');
    } else {
      console.log('EmployeeSelector: Add employee cancelled - Empty or duplicate name');
    }
  };

  const handleResetEmployees = () => {
    console.log('EmployeeSelector: Resetting employees for:', selectedShop);
    setEmployees([]);
    setNewEmployee('');
  };

  const handleRemoveEmployee = (employee) => {
    console.log('EmployeeSelector: Removing employee:', employee);
    setEmployees(employees.filter((emp) => emp !== employee));
  };

  const handleNextStep = () => {
    console.log('EmployeeSelector: handleNextStep called, employees:', employees, 'selectedShop:', selectedShop, 'selectedWeek:', selectedWeek);
    console.log('EmployeeSelector: Button disabled status:', employees.length === 0 || !selectedShop || !selectedWeek);
    if (employees.length > 0 && selectedShop && selectedWeek) {
      console.log('EmployeeSelector: Calling onValidate with employees:', employees);
      onValidate();
    } else {
      console.log('EmployeeSelector: Cannot validate - employees:', employees, 'selectedShop:', selectedShop, 'selectedWeek:', selectedWeek);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      console.log('EmployeeSelector: Enter key pressed, adding employee:', newEmployee);
      handleAddEmployee();
    }
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
              className="employee-button"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>{employee}</span>
              <span
                onClick={() => handleRemoveEmployee(employee)}
                style={{ cursor: 'pointer', color: 'red', marginLeft: '10px' }}
                title="Supprimer l'employé"
              >
                ✕
              </span>
            </button>
          ))
        )}
      </div>
      <div className="add-employee">
        <input
          type="text"
          value={newEmployee}
          onChange={(e) => setNewEmployee(e.target.value)}
          onKeyPress={handleKeyPress}
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
      {employees.length > 0 && (
        <div className="employee-buttons">
          <button onClick={handleResetEmployees} className="reset-employee-button">
            <i className="fas fa-trash"></i> Réinitialiser
          </button>
          <button
            onClick={handleNextStep}
            disabled={employees.length === 0 || !selectedShop || !selectedWeek}
            className="next-button"
          >
            Suivant
          </button>
        </div>
      )}
      <button onClick={onBack} className="reset-button">
        Retour
      </button>
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Nicolas Lefèvre 2025 Klick Planning
      </p>
    </div>
  );
};

export default EmployeeSelector;