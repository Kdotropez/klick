import React from 'react';
import Modal from './Modal';
import jsPDF from 'jspdf';
import '../styles/RecapCollectif.css';

const RecapEmploye = ({ isOpen, onClose, employees, schedules, shops }) => {
  if (!isOpen) return null;

  const calculateWeeklyHours = (employee) => {
    let total = 0;
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const timeSlots = [];
    for (let hour = 9; hour <= 23; hour++) {
      timeSlots.push(`${hour}:00-${hour}:30`);
      timeSlots.push(`${hour}:30-${(hour + 1)}:00`);
    }
    timeSlots.push('23:30-24:00');
    days.forEach(day => {
      timeSlots.forEach(timeRange => {
        const key = `${day}_${timeRange}_${employee}`;
        if (schedules[key]) total += 0.5;
      });
    });
    return total.toFixed(1);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('Récapitulatif par Employé', 10, 10);

    let y = 20;
    const headers = ['Employé', 'Boutique', 'Total Hebdo (h)'];
    doc.text(headers.join(' '), 10, y + 10);
    y += 20;

    employees.forEach(employee => {
      const totalHours = calculateWeeklyHours(employee);
      const row = [employee, shops[0] || '-', totalHours];
      doc.text(row.join(' '), 10, y);
      y += 10;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save('recap_employe.pdf');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ width: '500px', padding: '20px' }}>
      <div className="recap-collectif-container">
        <h2>Récapitulatif par Employé</h2>
        <button className="export-btn" onClick={exportToPDF}>
          Exporter en PDF
        </button>
        <table className="recap-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Boutique</th>
              <th>Total Hebdo (h)</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee => (
              <tr key={employee}>
                <td>{employee}</td>
                <td>{shops[0] || '-'}</td>
                <td>{calculateWeeklyHours(employee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default RecapEmploye;