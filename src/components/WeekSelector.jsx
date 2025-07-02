import React, { useState, useEffect } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { fr } from 'date-fns/locale';
import '../styles/WeekSelector.css';

registerLocale('fr', fr);

const WeekSelector = ({ onWeekChange, selectedWeek }) => {
  const [selectedDate, setSelectedDate] = useState(selectedWeek || null);

  useEffect(() => {
    console.log('WeekSelector: Mise à jour de selectedDate avec selectedWeek:', selectedWeek);
    setSelectedDate(selectedWeek || null);
  }, [selectedWeek]);

  const handleDateChange = (date) => {
    console.log('WeekSelector: Nouvelle date sélectionnée:', date);
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
        locale="fr"
      />
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666', textAlign: 'center' }}>
        © Nicolas Lefèvre 2025 Klick Planning
      </p>
    </div>
  );
};

export default WeekSelector;