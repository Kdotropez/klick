import React, { useState } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import '../styles/WeekSelector.css';

// Enregistrer la locale française
registerLocale('fr', fr);

const WeekSelector = ({ onWeekChange }) => {
  const [selectedDate, setSelectedDate] = useState(null);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (date) onWeekChange(date);
  };

  return (
    <div className="week-selector-container">
      <h2>Sélectionner une semaine</h2>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        filterDate={(date) => date.getDay() === 1}
        placeholderText="Choisissez un lundi"
        className="date-picker"
        locale="fr" // Utiliser la locale française
      />
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Nicolas Lefèvre 2025 Klick Planning
      </p>
    </div>
  );
};

export default WeekSelector;