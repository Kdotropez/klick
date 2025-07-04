import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import { fr } from 'date-fns/locale';
import '../styles/WeekSelector.css';

registerLocale('fr', fr);

const WeekSelector = ({ onWeekChange, selectedWeek }) => {
  const [selectedDate, setSelectedDate] = useState(selectedWeek ? new Date(selectedWeek) : null);

  const handleDateChange = (date) => {
    console.log('WeekSelector: Date selected:', date);
    setSelectedDate(date);
    if (date) {
      // Normaliser la date pour éviter les problèmes de fuseau horaire
      const normalizedDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const week = normalizedDate.toISOString().split('T')[0];
      console.log('WeekSelector: Calling onWeekChange with:', week);
      onWeekChange(week);
    }
  };

  return (
    <div className="week-selector">
      <h2>Sélection de la Semaine</h2>
      <DatePicker
        selected={selectedDate}
        onChange={handleDateChange}
        dateFormat="dd/MM/yyyy"
        filterDate={(date) => date.getDay() === 1}
        placeholderText="Choisissez un lundi"
        className="date-picker"
        locale="fr"
      />
      <p className="copyright">© Nicolas Lefèvre Klick Planning 2025</p>
    </div>
  );
};

export default WeekSelector;