import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import '../styles/PlanningTable.css';

const PlanningTable = ({ employees, selectedWeek }) => {
  const [filter, setFilter] = useState('all');
  const [planning, setPlanning] = useState(() => {
    const saved = localStorage.getItem('planning');
    return saved ? JSON.parse(saved) : {};
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tableRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('planning', JSON.stringify(planning));
  }, [planning]);

  // Générer toutes les tranches horaires
  const timeSlots = [];
  for (let hour = 9; hour <= 23; hour++) {
    timeSlots.push(`${hour}:00-${hour}:30`);
    timeSlots.push(`${hour}:30-${(hour + 1)}:00`);
  }
  timeSlots.push('23:30-24:00');
  console.log('Total time slots:', timeSlots.length); // Débogage

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const getCouleurCellule = (employeIndex) => {
    const couleurs = ["#d4eaff", "#e7f9d0", "#ffe5cc", "#f6e5f9", "#fff9c4", "#d1f3f9"];
    return couleurs[employeIndex % couleurs.length];
  };

  const toggleTimeSlot = (employee, day, timeRange) => {
    const key = `${day}_${timeRange}_${employee}`;
    setPlanning((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key]; // Décocher
      } else {
        updated[key] = true; // Cocher
      }
      console.log(`Toggled ${employee} on ${day} at ${timeRange} - New state for key ${key}:`, updated[key]); // Débogage
      return { ...updated };
    });
  };

  const calculateDailyHours = (employee, day) => {
    let total = 0;
    timeSlots.forEach((timeRange) => {
      const key = `${day}_${timeRange}_${employee}`;
      if (planning[key]) total += 0.5;
    });
    return total.toFixed(1);
  };

  const calculateWeeklyHours = (employee) => {
    let total = 0;
    days.forEach((day) => {
      timeSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${employee}`;
        if (planning[key]) total += 0.5;
      });
    });
    return total;
  };

  const resetSchedules = () => {
    setPlanning({});
    setIsModalOpen(false);
  };

  return (
    <div className="planning-container">
      <h2>Création du Planning</h2>
      <div className="filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          <i className="fas fa-clock"></i> Toutes les heures
        </button>
        <button
          className={filter === 'hideEmpty' ? 'active' : ''}
          onClick={() => setFilter('hideEmpty')}
        >
          <i className="fas fa-eye-slash"></i> Masquer vides
        </button>
        <button
          className={filter === 'onlyEmpty' ? 'active' : ''}
          onClick={() => setFilter('onlyEmpty')}
        >
          <i className="fas fa-eye"></i> Uniquement vides
        </button>
        <button className="reset-btn" onClick={() => setIsModalOpen(true)}>
          <i className="fas fa-trash"></i> Réinitialiser
        </button>
      </div>
      <div className="total-hours-fixed">
        {employees.map((employee, index) => (
          <button key={employee} className="total-btn" disabled>
            {employee}: {calculateWeeklyHours(employee)}h
          </button>
        ))}
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={resetSchedules}
        message="Voulez-vous vraiment réinitialiser tous les créneaux ?"
      />
      <div className="table-container">
        <div className="table-wrapper" ref={tableRef}>
          <table className="planning-table">
            <thead>
              <tr>
                <th className="fixed-col day-header">Jour</th>
                <th className="fixed-col">Employé</th>
                <th className="fixed-col">Total h/jour</th>
                {timeSlots.map((timeRange, index) => (
                  <th key={index} className="scrollable-col">
                    {timeRange.split('-')[0]}<br />{timeRange.split('-')[1]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((jour) => (
                <React.Fragment key={jour}>
                  <tr>
                    <td className="fixed-col day-header-row" colSpan="1">
                      {jour}
                    </td>
                    <td colSpan={timeSlots.length + 2}></td> {/* Remplit le reste */}
                  </tr>
                  {employees.map((employee, index) => (
                    <tr key={`${jour}-${employee}-${index}`}>
                      <td className="fixed-col day-cell">{jour}</td> {/* Jour sous l’en-tête */}
                      <td className="fixed-col">{employee}</td>
                      <td className="fixed-col">{calculateDailyHours(employee, jour)} h</td>
                      {timeSlots.map((timeRange) => {
                        const key = `${jour}_${timeRange}_${employee}`;
                        const isActive = !!planning[key];
                        return (
                          <td
                            key={key}
                            className="scrollable-col"
                            onClick={() => toggleTimeSlot(employee, jour, timeRange)}
                            style={{
                              backgroundColor: isActive ? getCouleurCellule(index) : 'transparent',
                              cursor: 'pointer',
                              padding: '10px',
                            }}
                          >
                            {isActive && '✔'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr><td colSpan={timeSlots.length + 3} className="interline"></td></tr>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="weekly-recap">
        <h3>Récapitulatif Hebdomadaire</h3>
        {employees.map((employee, index) => (
          <div key={employee} className="employee-recap">
            <strong>{employee}</strong>: {calculateWeeklyHours(employee)} heures
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlanningTable;