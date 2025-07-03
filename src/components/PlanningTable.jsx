import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { FaCopy, FaPaste, FaEraser, FaUndo } from 'react-icons/fa';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/PlanningTable.css';

const PlanningTable = ({ employees, selectedWeek, selectedShop, onBackToShop, onBackToWeek, onBackToEmployees, onWeekChange }) => {
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [planning, setPlanning] = useState(() => {
    const saved = localStorage.getItem(`planning_${selectedShop}_${selectedWeek ? new Date(selectedWeek).toISOString().split('T')[0] : ''}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmCopyModalOpen, setIsConfirmCopyModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [copiedData, setCopiedData] = useState(null);
  const [copyMode, setCopyMode] = useState('all');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [resetFeedback, setResetFeedback] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [showCopyPaste, setShowCopyPaste] = useState(true);
  const [showPreviousWeekCopy, setShowPreviousWeekCopy] = useState(true);
  const [previousWeek, setPreviousWeek] = useState('');
  const [selectedPreviousDays, setSelectedPreviousDays] = useState([]);
  const [sourceDay, setSourceDay] = useState('');
  const [targetDays, setTargetDays] = useState([]);

  useEffect(() => {
    const key = `planning_${selectedShop}_${selectedWeek ? new Date(selectedWeek).toISOString().split('T')[0] : ''}`;
    localStorage.setItem(key, JSON.stringify(planning));
    console.log(`Planning updated for ${selectedShop}, ${selectedWeek}, ${selectedDay}:`, planning);
  }, [planning, selectedShop, selectedWeek]);

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 9; hour <= 23; hour++) {
      slots.push(`${hour}:00-${hour}:30`);
      slots.push(`${hour}:30-${(hour + 1)}:00`);
    }
    slots.push('23:30-24:00');
    return slots;
  }, []);

  const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  const getCouleurCellule = (employeIndex) => {
    const couleurs = ["#d4eaff", "#e7f9d0", "#ffe5cc", "#f6e5f9", "#fff9c4", "#d1f3f9"];
    return couleurs[employeIndex % couleurs.length];
  };

  const getCouleurJour = (dayIndex) => {
    const couleurs = ["#e6f3ff", "#e9f7e2", "#fff2e6", "#f9e6f9", "#fffde6", "#e6f9ff", "#f0e6ff"];
    return couleurs[dayIndex % couleurs.length];
  };

  const getDayDate = (weekStart, day) => {
    if (!weekStart) return 'Date non sélectionnée';
    const dayIndex = days.indexOf(day);
    if (dayIndex === -1) return 'Jour invalide';
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const toggleTimeSlot = (employee, day, timeRange) => {
    if (day !== selectedDay) {
      console.warn(`Attempted to toggle ${employee} on ${day} while selected day is ${selectedDay}. Ignoring.`);
      return;
    }
    const key = `${day}_${timeRange}_${employee}`;
    setPlanning((prev) => {
      const updated = { ...prev };
      if (updated[key]) {
        delete updated[key];
      } else {
        updated[key] = true;
      }
      console.log(`Toggled ${employee} on ${day} at ${timeRange} - Key: ${key}`, updated[key]);
      return updated;
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
    return total.toFixed(1);
  };

  const calculateTotalDailyHours = () => {
    return employees && employees.length
      ? employees.reduce((sum, employee) => sum + parseFloat(calculateDailyHours(employee, selectedDay)), 0).toFixed(1)
      : '0.0';
  };

  const resetSchedules = () => {
    console.log('resetSchedules: Resetting planning');
    setPlanning({});
    setIsModalOpen(false);
    setCopiedData(null);
    setCopyFeedback('');
    setResetFeedback('Planning effacé avec succès !');
    setTimeout(() => setResetFeedback(''), 2000);
    console.log('resetSchedules: Planning reset to', {});
  };

  const resetCopyPasteSelections = () => {
    setCopyMode('all');
    setSelectedEmployee(null);
    setTargetEmployee(null);
    setSourceDay('');
    setTargetDays([]);
    setPreviousWeek('');
    setSelectedPreviousDays([]);
    setCopiedData(null);
    setCopyFeedback('Sélections réinitialisées.');
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log('Copy-paste selections reset');
  };

  const copyDay = (day, mode = 'all', sourceEmployee = null) => {
    const dayData = {};
    if (mode === 'all') {
      employees.forEach((emp) => {
        timeSlots.forEach((timeRange) => {
          const key = `${day}_${timeRange}_${emp}`;
          if (planning[key]) dayData[key] = true;
        });
      });
    } else if (mode === 'individual' && sourceEmployee) {
      timeSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${sourceEmployee}`;
        if (planning[key]) dayData[key] = true;
      });
    } else if (mode === 'employeeToEmployee' && sourceEmployee) {
      timeSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${sourceEmployee}`;
        if (planning[key]) dayData[key] = true;
      });
    }
    setCopiedData(dayData);
    setCopyFeedback(`Données copiées pour ${day} (${mode === 'all' ? 'tous les employés' : mode === 'individual' ? 'individuel' : 'd’un employé à un autre'})`);
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log(`Copied ${mode} for ${day} from ${sourceEmployee || 'all'}`);
  };

  const pasteDay = (targetDays, targetEmp = null) => {
    if (!copiedData) return;
    setPlanning((prev) => {
      const updated = { ...prev };
      targetDays.forEach((day) => {
        Object.keys(copiedData).forEach((key) => {
          const [sourceDay, timeRange, sourceEmp] = key.split('_');
          const newKey = `${day}_${timeRange}_${targetEmp || sourceEmp}`;
          if (copyMode === 'all' || !targetEmp || (copyMode === 'employeeToEmployee' && targetEmp)) {
            updated[newKey] = copiedData[key];
          }
        });
      });
      setCopyFeedback(`Données collées sur ${targetDays.join(', ')} ${targetEmp ? `pour ${targetEmp}` : ''}`);
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`Pasted to ${targetDays.join(', ')} for ${targetEmp || 'all'}`);
      return updated;
    });
    setCopiedData(null);
  };

  const copyPreviousWeek = (selectedDays) => {
    if (!previousWeek) {
      setCopyFeedback('Veuillez sélectionner une semaine précédente.');
      setTimeout(() => setCopyFeedback(''), 2000);
      return;
    }
    if (!selectedDays.length) {
      setCopyFeedback('Veuillez sélectionner au moins un jour à copier.');
      setTimeout(() => setCopyFeedback(''), 2000);
      return;
    }
    const previousKey = `planning_${selectedShop}_${previousWeek}`;
    const saved = localStorage.getItem(previousKey);
    if (saved) {
      const previousPlanning = JSON.parse(saved);
      const dayData = {};
      selectedDays.forEach((day) => {
        Object.keys(previousPlanning).forEach((key) => {
          const [sourceDay, timeRange, emp] = key.split('_');
          if (selectedDays.includes(sourceDay)) {
            const newKey = `${day}_${timeRange}_${emp}`;
            dayData[newKey] = previousPlanning[key];
          }
        });
      });
      setCopiedData(dayData);
      setCopyFeedback(`Données copiées pour les jours ${selectedDays.join(', ')} de la semaine du ${previousWeek}`);
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`Copied days ${selectedDays.join(', ')} from week: ${previousKey}`);
    } else {
      setCopyFeedback('Aucun planning trouvé pour la semaine sélectionnée.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`No planning found for ${previousKey}`);
    }
  };

  const pastePreviousWeek = () => {
    if (!copiedData) {
      setCopyFeedback('Aucune donnée à coller.');
      setTimeout(() => setCopyFeedback(''), 2000);
      return;
    }
    setIsConfirmCopyModalOpen(true);
  };

  const confirmCopyPreviousWeek = () => {
    setPlanning((prev) => {
      const updated = { ...prev };
      Object.keys(copiedData).forEach((key) => {
        updated[key] = copiedData[key];
      });
      return updated;
    });
    setCopyFeedback(`Jours ${selectedPreviousDays.join(', ')} collés avec succès.`);
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log(`Pasted days ${selectedPreviousDays.join(', ')} to current week`);
    setIsConfirmCopyModalOpen(false);
    setCopiedData(null);
  };

  const toggleCopyPaste = () => {
    const newShowCopyPaste = !showCopyPaste;
    setShowCopyPaste(newShowCopyPaste);
    console.log(`Copy-paste section ${newShowCopyPaste ? 'shown' : 'hidden'}`);
  };

  const togglePreviousWeekCopy = () => {
    const newShowPreviousWeekCopy = !showPreviousWeekCopy;
    setShowPreviousWeekCopy(newShowPreviousWeekCopy);
    console.log(`Previous week copy section ${newShowPreviousWeekCopy ? 'shown' : 'hidden'}`);
  };

  const handleEmployeeClick = (employee) => {
    console.log(`Opening weekly schedule for ${employee}`);
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleShopRecapClick = () => {
    console.log(`Opening shop recap for ${selectedShop}`);
    setIsShopModalOpen(true);
  };

  const isSlotActive = (employee, day, timeRange) => {
    const key = `${day}_${timeRange}_${employee}`;
    return !!planning[key];
  };

  const getEmployeeWeeklySchedule = (employee) => {
    const schedule = [];
    days.forEach((day, index) => {
      const dailySlots = timeSlots
        .filter((timeRange) => isSlotActive(employee, day, timeRange))
        .sort((a, b) => {
          const [startA] = a.split('-');
          const [startB] = b.split('-');
          return startA.replace(':', '') - startB.replace(':', '');
        });
      if (dailySlots.length === 0) {
        schedule.push({
          day,
          arrival: 'Repos',
          departure: '-',
          return: '-',
          end: '-',
          totalHours: '0.0',
          color: getCouleurJour(index),
        });
      } else {
        let arrival = dailySlots[0].split('-')[0];
        let end = dailySlots[dailySlots.length - 1].split('-')[1];
        let departure = '-';
        let returnTime = '-';
        let foundBreak = false;
        for (let i = 0; i < dailySlots.length - 1; i++) {
          const currentEnd = dailySlots[i].split('-')[1];
          const nextStart = dailySlots[i + 1].split('-')[0];
          const currentEndTime = parseInt(currentEnd.replace(':', ''));
          const nextStartTime = parseInt(nextStart.replace(':', ''));
          if (nextStartTime - currentEndTime >= 100) {
            departure = currentEnd;
            returnTime = nextStart;
            foundBreak = true;
            break;
          }
        }
        if (!foundBreak) {
          departure = end;
        }
        const totalHours = (dailySlots.length * 0.5).toFixed(1);
        schedule.push({
          day,
          arrival,
          departure,
          return: returnTime,
          end,
          totalHours,
          color: getCouleurJour(index),
        });
      }
    });
    return schedule;
  };

  const getShopDailySchedule = () => {
    const schedule = [];
    days.forEach((day, index) => {
      const dailyData = {
        day,
        employees: [],
        color: getCouleurJour(index),
      };
      employees && employees.forEach((employee) => {
        const dailySlots = timeSlots
          .filter((timeRange) => isSlotActive(employee, day, timeRange))
          .sort((a, b) => {
            const [startA] = a.split('-');
            const [startB] = b.split('-');
            return startA.replace(':', '') - startB.replace(':', '');
          });
        if (dailySlots.length === 0) {
          dailyData.employees.push({
            name: employee,
            arrival: 'Repos',
            departure: '-',
            return: '-',
            end: '-',
            totalHours: '0.0',
          });
        } else {
          let arrival = dailySlots[0].split('-')[0];
          let end = dailySlots[dailySlots.length - 1].split('-')[1];
          let departure = '-';
          let returnTime = '-';
          let foundBreak = false;
          for (let i = 0; i < dailySlots.length - 1; i++) {
            const currentEnd = dailySlots[i].split('-')[1];
            const nextStart = dailySlots[i + 1].split('-')[0];
            const currentEndTime = parseInt(currentEnd.replace(':', ''));
            const nextStartTime = parseInt(nextStart.replace(':', ''));
            if (nextStartTime - currentEndTime >= 100) {
              departure = currentEnd;
              returnTime = nextStart;
              foundBreak = true;
              break;
            }
          }
          if (!foundBreak) {
            departure = end;
          }
          const totalHours = (dailySlots.length * 0.5).toFixed(1);
          dailyData.employees.push({
            name: employee,
            arrival,
            departure,
            return: returnTime,
            end,
            totalHours,
          });
        }
      });
      schedule.push(dailyData);
    });
    return schedule;
  };

  const exportEmployeeScheduleToPDF = (employee) => {
    console.log(`exportEmployeeScheduleToPDF: Generating PDF for ${employee}`);
    try {
      const doc = new jsPDF();
      console.log('jsPDF instance created:', doc);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(18);
      doc.text(`Récapitulatif de ${employee} (${calculateWeeklyHours(employee)} h)`, 20, 20);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Boutique: ${selectedShop || 'Non spécifié'}`, 20, 35);
      doc.text(
        `Semaine: ${
          selectedWeek
            ? new Date(selectedWeek).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }) +
              ' au ' +
              new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : '-'
        }`,
        20,
        45,
      );

      const tableData = getEmployeeWeeklySchedule(employee).map(({ day, arrival, departure, return: returnTime, end, totalHours }) => [
        { content: day, styles: { fontStyle: 'bold' } },
        { content: arrival, styles: { fontStyle: 'normal' } },
        { content: departure, styles: { fontStyle: 'normal' } },
        { content: returnTime, styles: { fontStyle: 'normal' } },
        { content: end, styles: { fontStyle: 'normal' } },
        { content: totalHours, styles: { fontStyle: 'normal' } },
      ]);

      console.log('Table data prepared:', tableData);
      autoTable(doc, {
        startY: 55,
        head: [['Jour', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
        body: tableData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 30 },
          2: { cellWidth: 30 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const dayIndex = days.indexOf(data.row.raw[0].content);
            if (dayIndex >= 0) {
              data.row.cells[0].styles.fillColor = getCouleurJour(dayIndex);
              data.row.cells[1].styles.fillColor = getCouleurJour(dayIndex);
              data.row.cells[2].styles.fillColor = getCouleurJour(dayIndex);
              data.row.cells[3].styles.fillColor = getCouleurJour(dayIndex);
              data.row.cells[4].styles.fillColor = getCouleurJour(dayIndex);
              data.row.cells[5].styles.fillColor = getCouleurJour(dayIndex);
            }
          }
        },
      });

      doc.setFontSize(10);
      doc.text('© Nicolas Lefèvre 2025 Klick Planning', 20, doc.lastAutoTable.finalY + 15);
      doc.save(`recap_${employee}.pdf`);
      console.log(`exportEmployeeScheduleToPDF: PDF saved for ${employee}`);
    } catch (error) {
      console.error(`exportEmployeeScheduleToPDF: Error generating PDF for ${employee}`, error);
    }
  };

  const exportShopScheduleToPDF = () => {
    console.log(`exportShopScheduleToPDF: Generating PDF for shop ${selectedShop}`);
    try {
      const doc = new jsPDF();
      console.log('jsPDF instance created:', doc);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(18);
      doc.text(`Récapitulatif de ${selectedShop || 'Non spécifié'}`, 20, 20);
      doc.text(
        `Semaine: ${
          selectedWeek
            ? new Date(selectedWeek).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              }) +
              ' au ' +
              new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })
            : '-'
        }`,
        20,
        35,
      );

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cumul horaire hebdomadaire:', 20, 50);
      const employeeHoursData = employees && employees.length ? employees.map((employee) => [
        { content: employee, styles: { fontStyle: 'bold' } },
        { content: `${calculateWeeklyHours(employee)} h`, styles: { fontStyle: 'normal' } },
      ]) : [];
      autoTable(doc, {
        startY: 60,
        head: [['Employé', 'Heures hebdomadaires']],
        body: employeeHoursData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 90 } },
      });

      let currentY = doc.lastAutoTable.finalY + 10;

      const shopSchedule = getShopDailySchedule();
      shopSchedule.forEach((dayData) => {
        const tableData = dayData.employees.map((emp) => [
          { content: dayData.day, styles: { fontStyle: 'bold' } },
          { content: emp.name, styles: { fontStyle: 'bold' } },
          { content: emp.arrival, styles: { fontStyle: 'normal' } },
          { content: emp.departure, styles: { fontStyle: 'normal' } },
          { content: emp.return, styles: { fontStyle: 'normal' } },
          { content: emp.end, styles: { fontStyle: 'normal' } },
          { content: emp.totalHours, styles: { fontStyle: 'normal' } },
        ]);

        doc.setFontSize(12);
        doc.text(`Planning du ${dayData.day}`, 20, currentY);
        currentY += 10;

        autoTable(doc, {
          startY: currentY,
          head: [['Jour', 'Employé', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
          body: tableData,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { textColor: [0, 0, 0] },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 25 },
            4: { cellWidth: 25 },
            5: { cellWidth: 25 },
            6: { cellWidth: 25 },
          },
          didParseCell: (data) => {
            if (data.section === 'body') {
              const dayIndex = days.indexOf(data.row.raw[0].content);
              if (dayIndex >= 0) {
                data.row.cells[0].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[1].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[2].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[3].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[4].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[5].styles.fillColor = getCouleurJour(dayIndex);
                data.row.cells[6].styles.fillColor = getCouleurJour(dayIndex);
            }
          }
        },
      });

      currentY = doc.lastAutoTable.finalY + 10;
    });

    doc.setFontSize(10);
    doc.text('© Nicolas Lefèvre 2025 Klick Planning', 20, currentY + 5);
    doc.save(`recap_boutique_${selectedShop}.pdf`);
    console.log(`exportShopScheduleToPDF: PDF saved for shop ${selectedShop}`);
  } catch (error) {
    console.error(`exportShopScheduleToPDF: Error generating PDF for shop ${selectedShop}`, error);
  }
};

const getAvailableWeeks = () => {
  const weeks = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(`planning_${selectedShop}_`)) {
      const weekDate = key.split('_')[2];
      if (weekDate) {
        const monday = new Date(weekDate);
        const sunday = addDays(monday, 6);
        const label = `Semaine du ${format(monday, 'iiii d MMMM', { locale: fr })} au ${format(sunday, 'iiii d MMMM', { locale: fr })}`;
        weeks.push({ value: weekDate, label });
      }
    }
  }
  return weeks.sort((a, b) => new Date(b.value) - new Date(a.value));
};

const handleWeekChange = (e) => {
  if (!onWeekChange) {
    console.warn('onWeekChange is not provided to PlanningTable');
    return;
  }
  const newWeek = e.target.value;
  onWeekChange(newWeek);
  setPlanning(() => {
    const saved = localStorage.getItem(`planning_${selectedShop}_${newWeek}`);
    return saved ? JSON.parse(saved) : {};
  });
  console.log(`Switched to week: ${newWeek}`);
};

return (
  <div className="planning-container">
    <h2>Création du Planning</h2>
    <div className="week-selector">
      <label>Semaine :</label>
      <select
        value={selectedWeek || ''}
        onChange={handleWeekChange}
        className="week-select"
      >
        <option value="">Choisir une semaine</option>
        {getAvailableWeeks().map((week) => (
          <option key={week.value} value={week.value}>
            {week.label}
          </option>
        ))}
      </select>
    </div>
    <div className="total-hours-fixed">
      {employees.map((employee, index) => (
        <button
          key={employee}
          className="total-btn"
          onClick={() => handleEmployeeClick(employee)}
        >
          Recap {employee}: <strong>{calculateWeeklyHours(employee)}h</strong>
        </button>
      ))}
      <button
        className="total-btn shop-recap-btn"
        onClick={handleShopRecapClick}
      >
        Recap Hebdomadaire
      </button>
    </div>
    <Modal
      isOpen={isModalOpen}
      onClose={() => {
        console.log('Closing reset Modal');
        setIsModalOpen(false);
      }}
      onConfirm={() => {
        console.log('Confirming reset schedules');
        resetSchedules();
      }}
      message="Voulez-vous vraiment effacer tous les créneaux ?"
      style={{ width: '400px', padding: '20px' }}
    />
    <Modal
      isOpen={isConfirmCopyModalOpen}
      onClose={() => {
        console.log('Closing confirm copy Modal');
        setIsConfirmCopyModalOpen(false);
      }}
      onConfirm={() => {
        console.log('Confirming paste previous week');
        confirmCopyPreviousWeek();
      }}
      message={`Voulez-vous coller les jours ${selectedPreviousDays.join(', ')} de la semaine du ${previousWeek ? format(new Date(previousWeek), 'iiii d MMMM', { locale: fr }) : ''} ?`}
      style={{ width: '400px', padding: '20px' }}
    />
    <Modal
      isOpen={isEmployeeModalOpen}
      onClose={() => {
        console.log('Closing employee schedule Modal');
        setIsEmployeeModalOpen(false);
        setSelectedEmployee(null);
      }}
      onConfirm={() => {
        console.log(`Calling exportEmployeeScheduleToPDF for ${selectedEmployee}`);
        if (selectedEmployee) {
          exportEmployeeScheduleToPDF(selectedEmployee);
        } else {
          console.error('No employee selected for PDF export');
        }
      }}
      message={
        selectedEmployee ? (
          <div style={{ display: 'flex', justifyContent: 'left' }}>
            <div style={{ width: '500px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                Récapitulatif de {selectedEmployee} ({calculateWeeklyHours(selectedEmployee)} h)
              </h3>
              <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
                Boutique: {selectedShop || 'Non spécifié'}
              </p>
              <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
                Semaine: {selectedWeek ? new Date(selectedWeek).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' au ' + new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
              </p>
              <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Jour</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Arrivée</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Sortie</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Retour</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Fin</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '80px', fontSize: '10px' }}>Heures effectives</th>
                  </tr>
                </thead>
                <tbody>
                  {getEmployeeWeeklySchedule(selectedEmployee).map(({ day, arrival, departure, return: returnTime, end, totalHours, color }, index) => (
                    <tr key={day} style={{ backgroundColor: color }}>
                      <td style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>{day}</td>
                      <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '10px' }}>{arrival}</td>
                      <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '10px' }}>{departure}</td>
                      <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '10px' }}>{returnTime}</td>
                      <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '10px' }}>{end}</td>
                      <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '80px', fontSize: '10px' }}>{totalHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>Voulez-vous exporter en PDF ?</p>
              <p className="copyright">© Nicolas Lefèvre 2025 Klick Planning</p>
            </div>
          </div>
        ) : null
      }
      style={{ width: '500px', padding: '20px' }}
    />
    <Modal
      isOpen={isShopModalOpen}
      onClose={() => {
        console.log('Closing shop recap Modal');
        setIsShopModalOpen(false);
      }}
      onConfirm={() => {
        console.log(`Calling exportShopScheduleToPDF for ${selectedShop}`);
        exportShopScheduleToPDF();
      }}
      message={
        <div style={{ display: 'flex', justifyContent: 'left' }}>
          <div style={{ width: '500px', maxHeight: '50vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
              Récapitulatif de {selectedShop || 'Non spécifié'}
            </h3>
            <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
              Semaine: {selectedWeek ? new Date(selectedWeek).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' au ' + new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
            </p>
            <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
              <thead>
                <tr style={{ backgroundColor: '#e5e5e5' }}>
                  <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '100px', fontSize: '10px' }}>Employé</th>
                  <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '80px', fontSize: '10px' }}>Heures hebdomadaires</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee}>
                    <td style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '100px', fontSize: '10px' }}>{employee}</td>
                    <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '80px', fontSize: '10px' }}>{calculateWeeklyHours(employee)} h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {getShopDailySchedule().map((dayData, index) => (
              <div key={dayData.day} style={{ marginBottom: '10px' }}>
                <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '0', backgroundColor: dayData.color }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e5e5e5' }}>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>Jour</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '90px', fontSize: '10px' }}>Employé</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>Arrivée</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>Sortie</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>Retour</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>Fin</th>
                      <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '10px' }}>Heures effectives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayData.employees.map((emp) => (
                      <tr key={emp.name}>
                        <td style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '10px' }}>{dayData.day}</td>
                        <td style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '90px', fontSize: '10px' }}>{emp.name}</td>
                        <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '10px' }}>{emp.arrival}</td>
                        <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '10px' }}>{emp.departure}</td>
                        <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '10px' }}>{emp.return}</td>
                        <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '10px' }}>{emp.end}</td>
                        <td style={{ padding: '6px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '10px' }}>{emp.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            <p style={{ marginTop: '10px', fontSize: '14px' }}>Voulez-vous exporter en PDF ?</p>
            <p className="copyright">© Nicolas Lefèvre 2025 Klick Planning</p>
          </div>
        </div>
      }
      style={{ width: '500px', padding: '20px' }}
    />
    <div className="day-navigation">
      {days.map((day) => (
        <button
          key={day}
          onClick={() => {
            setSelectedDay(day);
            console.log(`Switched to ${day}`);
          }}
          className={`total-btn ${selectedDay === day ? 'active' : ''}`}
        >
          {day}
        </button>
      ))}
    </div>
    <p className="day-date">Jour : {getDayDate(selectedWeek, selectedDay)}</p>
    <div className="table-container">
      <div className="table-wrapper">
        <table className="planning-table" key={selectedDay}>
          <thead>
            <tr>
              <th className="fixed-col">Tranche horaire</th>
              {timeSlots.map((timeRange, index) => (
                <th
                  key={`${selectedDay}_${timeRange}_${index}`}
                  className="scrollable-col"
                >
                  {timeRange.split('-')[0]}<br />{timeRange.split('-')[1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee, index) => (
              <tr key={`${selectedDay}_${employee}_${index}`}>
                <td
                  className="fixed-col"
                  style={{ backgroundColor: getCouleurCellule(index) }}
                >
                  {employee} ({calculateDailyHours(employee, selectedDay)}h)
                </td>
                {timeSlots.map((timeRange, slotIndex) => (
                  <td
                    key={`${selectedDay}_${timeRange}_${employee}_${slotIndex}`}
                    className="scrollable-col"
                    onClick={() => toggleTimeSlot(employee, selectedDay, timeRange)}
                    style={{
                      backgroundColor: isSlotActive(employee, selectedDay, timeRange)
                        ? getCouleurCellule(index)
                        : 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {isSlotActive(employee, selectedDay, timeRange) && '✔'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <div style={{ margin: '10px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
      <button
        onClick={() => {
          console.log('Returning to shop selection', { selectedShop, selectedWeek });
          onBackToShop();
        }}
        className="reset-button"
        title="Retour à la sélection de la boutique"
      >
        <FaUndo style={{ marginRight: '5px' }} /> Retour à la boutique
      </button>
      <button
        onClick={() => {
          console.log('Returning to week selection', { selectedShop, selectedWeek });
          onBackToWeek();
        }}
        className="reset-button"
        title="Retour à la sélection de la semaine"
      >
        <FaUndo style={{ marginRight: '5px' }} /> Retour à la semaine
      </button>
      <button
        onClick={() => {
          console.log('Returning to employee selection', { selectedShop, selectedWeek });
          onBackToEmployees();
        }}
        className="reset-button"
        title="Retour à la sélection des employés"
      >
        <FaUndo style={{ marginRight: '5px' }} /> Retour aux employés
      </button>
    </div>
    <div className="copy-paste-toggle">
      <label>
        <input
          type="checkbox"
          checked={showCopyPaste}
          onChange={toggleCopyPaste}
        />
        Afficher les options de copie/coller
      </label>
    </div>
    {showCopyPaste && (
      <div className="copy-paste-section">
        <h3>Copier/Coller par jour</h3>
        <div className="copy-paste-controls">
          <div className="control-group">
            <label>Mode de copie :</label>
            <select
              value={copyMode}
              onChange={(e) => setCopyMode(e.target.value)}
              className="copy-mode-select"
            >
              <option value="all">Tous les employés</option>
              <option value="individual">Employé individuel</option>
              <option value="employeeToEmployee">D’un employé à un autre</option>
            </select>
          </div>
          {copyMode === 'individual' && (
            <div className="control-group">
              <label>Employé :</label>
              <select
                value={selectedEmployee || ''}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="employee-select"
              >
                <option value="">Choisir un employé</option>
                {employees.map((emp) => (
                  <option key={emp} value={emp}>
                    {emp}
                  </option>
                ))}
              </select>
            </div>
          )}
          {copyMode === 'employeeToEmployee' && (
            <>
              <div className="control-group">
                <label>Employé source :</label>
                <select
                  value={selectedEmployee || ''}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="employee-select"
                >
                  <option value="">Choisir l’employé source</option>
                  {employees.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>
              <div className="control-group">
                <label>Employé cible :</label>
                <select
                  value={targetEmployee || ''}
                  onChange={(e) => setTargetEmployee(e.target.value)}
                  className="employee-select"
                >
                  <option value="">Choisir l’employé cible</option>
                  {employees.map((emp) => (
                    <option key={emp} value={emp}>
                      {emp}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="control-group">
            <label>Jour source :</label>
            <select
              value={sourceDay}
              onChange={(e) => setSourceDay(e.target.value)}
              className="day-select"
            >
              <option value="">Choisir un jour</option>
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div className="button-group">
            <button
              onClick={() => copyDay(sourceDay, copyMode, selectedEmployee)}
              disabled={!sourceDay || (copyMode === 'individual' && !selectedEmployee) || (copyMode === 'employeeToEmployee' && !selectedEmployee)}
              className="copy-btn"
              title="Copier les créneaux du jour sélectionné"
            >
              <FaCopy style={{ marginRight: '5px' }} /> Copier
            </button>
            <button
              onClick={() => pasteDay(targetDays, copyMode === 'employeeToEmployee' ? targetEmployee : null)}
              disabled={!copiedData || !targetDays.length || (copyMode === 'employeeToEmployee' && !targetEmployee)}
              className="paste-btn"
              title="Coller les créneaux sur les jours cibles"
            >
              <FaPaste style={{ marginRight: '5px' }} /> Coller
            </button>
            <button
              onClick={resetCopyPasteSelections}
              className="reset-selections-btn"
              title="Réinitialiser les sélections de copie/coller"
            >
              <FaUndo style={{ marginRight: '5px' }} /> Réinitialiser
            </button>
          </div>
          <div className="control-group">
            <label>Jours cibles :</label>
            <div className="target-days">
              {days.map((day) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={targetDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTargetDays([...targetDays, day]);
                      } else {
                        setTargetDays(targetDays.filter((d) => d !== day));
                      }
                    }}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>
          {copyFeedback && <span className="copy-feedback">{copyFeedback}</span>}
        </div>
        <div className="previous-week-toggle">
          <label>
            <input
              type="checkbox"
              checked={showPreviousWeekCopy}
              onChange={togglePreviousWeekCopy}
            />
            Afficher l’option de copie de semaine précédente
          </label>
        </div>
        {showPreviousWeekCopy && (
          <div className="previous-week-copy">
            <h3>Copier une semaine précédente</h3>
            <div className="control-group">
              <label>Semaine précédente :</label>
              <select
                value={previousWeek}
                onChange={(e) => setPreviousWeek(e.target.value)}
                className="previous-week-select"
              >
                <option value="">Choisir une semaine</option>
                {getAvailableWeeks().map((week) => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
            </div>
            {previousWeek && (
              <div className="control-group">
                <label>Jours à copier :</label>
                <div className="previous-days">
                  {days.map((day) => (
                    <label key={day}>
                      <input
                        type="checkbox"
                        checked={selectedPreviousDays.includes(day)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedPreviousDays([...selectedPreviousDays, day]);
                          } else {
                            setSelectedPreviousDays(selectedPreviousDays.filter((d) => d !== day));
                          }
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="button-group">
              <button
                onClick={() => copyPreviousWeek(selectedPreviousDays)}
                disabled={!previousWeek || !selectedPreviousDays.length}
                className="copy-btn"
                title="Copier les jours sélectionnés de la semaine précédente"
              >
                <FaCopy style={{ marginRight: '5px' }} /> Copier
              </button>
              <button
                onClick={pastePreviousWeek}
                disabled={!copiedData}
                className="paste-btn"
                title="Coller les jours copiés dans la semaine actuelle"
              >
                <FaPaste style={{ marginRight: '5px' }} /> Coller
              </button>
            </div>
            {copyFeedback && <span className="copy-feedback">{copyFeedback}</span>}
            {!getAvailableWeeks().length && (
              <p className="no-weeks">Aucune semaine précédente disponible.</p>
            )}
          </div>
        )}
        <div className="control-group">
          <button
            onClick={() => {
              console.log('Opening reset modal');
              setIsModalOpen(true);
            }}
            className="reset-button"
            title="Effacer tout le planning"
          >
            <FaEraser style={{ marginRight: '5px' }} /> Effacer le planning
          </button>
          {resetFeedback && <span className="copy-feedback">{resetFeedback}</span>}
        </div>
      </div>
    )}
    <p className="copyright">© Nicolas Lefèvre 2025 Klick Planning</p>
  </div>
);
};

export default PlanningTable;