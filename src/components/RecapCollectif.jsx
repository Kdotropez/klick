import React from 'react';
import Modal from './Modal';
import jsPDF from 'jspdf';
import '../styles/RecapCollectif.css';

const RecapCollectif = ({ isOpen, onClose, employees, schedules }) => {
  if (!isOpen) return null;

  console.log('RecapCollectif rendered, isOpen:', isOpen, 'employees:', employees, 'schedules:', schedules);

  const getDailySchedule = (employee, day) => {
    const timeSlots = [];
    for (let hour = 9; hour <= 23; hour++) {
      timeSlots.push(`${hour}:00-${hour}:30`);
      timeSlots.push(`${hour}:30-${(hour + 1)}:00`);
    }
    timeSlots.push('23:30-24:00');

    const activeSlots = timeSlots.filter(timeRange => {
      const key = `${day}_${timeRange}_${employee}`;
      return schedules[key];
    }).sort();

    if (activeSlots.length === 0) {
      return { arrival: '-', departure: '-', return: '-', end: '-', total: '0.0' };
    }

    const arrival = activeSlots[0].split('-')[0] || '-';
    const departure = activeSlots.includes('12:00-12:30') ? '12:00' : '-';
    const returnTime = activeSlots.find(t => t.split('-')[0] > '12:00')?.split('-')[0] || '-';
    const end = activeSlots[activeSlots.length - 1].split('-')[1] || '-';
    const total = (activeSlots.length * 0.5).toFixed(1);

    return { arrival, departure, return: returnTime, end, total };
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(16);
    doc.text('Récapitulatif Collectif', 10, 10);

    let y = 20;
    const headers = ['Employé', 'Jour', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Total (h)'];
    doc.text(headers.join(' '), 10, y + 10);
    y += 20;

    employees.forEach(employee => {
      ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].forEach(day => {
        const { arrival, departure, return: returnTime, end, total } = getDailySchedule(employee, day);
        const row = [employee, day, arrival, departure, returnTime, end, total];
        doc.text(row.join(' '), 10, y);
        y += 10;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
    });

    doc.save('recap_collectif.pdf');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style={{ width: '800px', padding: '20px' }}>
      <div className="recap-collectif-container">
        <h2>Récapitulatif Collectif</h2>
        <button className="export-btn" onClick={exportToPDF}>
          Exporter en PDF
        </button>
        <table className="recap-table">
          <thead>
            <tr>
              <th>Employé</th>
              <th>Jour</th>
              <th>Arrivée</th>
              <th>Sortie</th>
              <th>Retour</th>
              <th>Fin</th>
              <th>Total (h)</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(employee =>
              ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'].map(day => {
                const { arrival, departure, return: returnTime, end, total } = getDailySchedule(employee, day);
                return (
                  <tr key={`${employee}-${day}`}>
                    <td>{employee}</td>
                    <td>{day}</td>
                    <td>{arrival}</td>
                    <td>{departure}</td>
                    <td>{returnTime}</td>
                    <td>{end}</td>
                    <td>{total}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
};

export default RecapCollectif;