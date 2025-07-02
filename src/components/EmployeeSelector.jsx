import React, { useState, useEffect } from 'react';
import '../styles/EmployeeSelector.css';

const EmployeeSelector = ({ selectedShop, onEmployeesChange, onValidate }) => {
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem(`employees_${selectedShop}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [newEmployee, setNewEmployee] = useState('');

  useEffect(() => {
    localStorage.setItem(`employees_${selectedShop}`, JSON.stringify(employees));
    console.log(`EmployeeSelector: Employees updated for ${selectedShop}:`, employees);
    onEmployeesChange(employees);
  }, [employees, selectedShop, onEmployeesChange]);

  const handleAddEmployee = () => {
    if (newEmployee.trim() && !employees.includes(newEmployee.trim().toUpperCase())) {
      const updatedEmployees = [...employees, newEmployee.trim().toUpperCase()];
      setEmployees(updatedEmployees);
      setNewEmployee('');
      console.log(`EmployeeSelector: Added employee ${newEmployee.trim().toUpperCase()} for ${selectedShop}`);
    } else {
      console.log('EmployeeSelector: Add employee cancelled - Empty or duplicate name');
    }
  };

  const handleResetEmployees = () => {
    setEmployees([]);
    setNewEmployee('');
    console.log(`EmployeeSelector: Employees reset for ${selectedShop}`);
  };

  const handleSelectEmployee = () => {
    if (employees.length > 0) {
      onValidate();
      console.log(`EmployeeSelector: Validated employees for ${selectedShop}:`, employees);
    } else {
      console.log('EmployeeSelector: No employees to validate');
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
              onClick={handleSelectEmployee}
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
          onChange={(e) => setNewEmployee(e.target.value)}
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
        <button onClick={handleResetEmployees} className="reset-employee-button">
          <i className="fas fa-trash"></i> Réinitialiser
        </button>
      )}
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Nicolas Lefèvre 2025 Klick Planning
      </p>
    </div>
  );
};

export default EmployeeSelector;