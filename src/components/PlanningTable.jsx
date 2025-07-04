import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { FaCopy, FaPaste, FaEraser, FaUndo } from 'react-icons/fa';
import { format, addDays, isMonday } from 'date-fns';
import { fr } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/PlanningTable.css';

const PlanningTable = ({ employees, selectedWeek, selectedShop, onBackToShop, onBackToWeek, onBackToEmployees, onWeekChange }) => {
  const [localEmployees, setLocalEmployees] = useState(() => {
    const saved = localStorage.getItem(`employees_${selectedShop}`);
    console.log('PlanningTable: Initializing employees from localStorage:', saved);
    return saved ? JSON.parse(saved) : employees;
  });

  const [selectedWeekDate, setSelectedWeekDate] = useState(() => {
    if (selectedWeek && isMonday(new Date(selectedWeek))) {
      return new Date(selectedWeek);
    }
    return null;
  });
  const [previewWeek, setPreviewWeek] = useState('');
  const [previewPlanning, setPreviewPlanning] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [planning, setPlanning] = useState(() => {
    if (selectedShop && selectedWeek) {
      const key = `planning_${selectedShop}_${selectedWeek}`;
      const saved = localStorage.getItem(key);
      console.log('PlanningTable: Initializing planning from localStorage:', saved, 'key:', key);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [sourceDay, setSourceDay] = useState('');
  const [targetDays, setTargetDays] = useState([]);
  const [showConfirmPaste, setShowConfirmPaste] = useState(false);

  useEffect(() => {
    console.log('PlanningTable: Received employees:', employees, 'Local employees:', localEmployees);
  }, [employees, localEmployees]);

  useEffect(() => {
    if (selectedShop && selectedWeekDate) {
      const key = `planning_${selectedShop}_${selectedWeekDate.toISOString().split('T')[0]}`;
      console.log(`PlanningTable: Saving planning to localStorage for ${key}:`, planning);
      localStorage.setItem(key, JSON.stringify(planning));
    }
  }, [planning, selectedShop, selectedWeekDate]);

  const timeSlots = useMemo(() => ({
    morning: [
      '9:00-9:30', '9:30-10:00', '10:00-10:30', '10:30-11:00',
      '11:00-11:30', '11:30-12:00', '12:00-12:30', '12:30-13:00',
      '13:00-13:30', '13:30-14:00'
    ],
    afternoon: [
      '14:00-14:30', '14:30-15:00', '15:00-15:30', '15:30-16:00',
      '16:00-16:30', '16:30-17:00', '17:00-17:30', '17:30-18:00',
      '18:00-18:30', '18:30-19:00'
    ],
    evening: [
      '19:00-19:30', '19:30-20:00', '20:00-20:30', '20:30-21:00',
      '21:00-21:30', '21:30-22:00', '22:00-22:30', '22:30-23:00',
      '23:00-23:30', '23:30-24:00'
    ]
  }), []);

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

  const calculateDailyHours = (employee, day, planningData = planning) => {
    let total = 0;
    const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    allSlots.forEach((timeRange) => {
      const key = `${day}_${timeRange}_${employee}`;
      if (planningData[key]) total += 0.5;
    });
    return total.toFixed(1);
  };

  const calculateWeeklyHours = (employee, planningData = planning) => {
    let total = 0;
    days.forEach((day) => {
      const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
      allSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${employee}`;
        if (planningData[key]) total += 0.5;
      });
    });
    return total.toFixed(1);
  };

  const calculateTotalDailyHours = () => {
    return localEmployees && localEmployees.length
      ? localEmployees.reduce((sum, employee) => sum + parseFloat(calculateDailyHours(employee, selectedDay)), 0).toFixed(1)
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
    setCopiedData(null);
    setCopyFeedback('Sélections réinitialisées.');
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log('Copy-paste selections reset');
  };

  const copyDay = (day, mode = 'all', sourceEmployee = null) => {
    console.log('copyDay: Starting copy for day:', day, 'mode:', mode, 'sourceEmployee:', sourceEmployee);
    if (!day) {
      setCopyFeedback('Veuillez sélectionner un jour source.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.warn('copyDay: No day selected');
      return;
    }
    const dayData = {};
    const allSlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening];
    if (mode === 'all') {
      localEmployees.forEach((emp) => {
        allSlots.forEach((timeRange) => {
          const key = `${day}_${timeRange}_${emp}`;
          if (planning[key]) dayData[key] = true;
        });
      });
    } else if (mode === 'individual' && sourceEmployee) {
      allSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${sourceEmployee}`;
        if (planning[key]) dayData[key] = true;
      });
    } else if (mode === 'employeeToEmployee' && sourceEmployee) {
      allSlots.forEach((timeRange) => {
        const key = `${day}_${timeRange}_${sourceEmployee}`;
        if (planning[key]) dayData[key] = true;
      });
    }
    console.log('copyDay: Collected dayData:', dayData);
    setCopiedData(dayData);
    if (Object.keys(dayData).length === 0) {
      setCopyFeedback('Aucune donnée à copier pour ce jour.');
    } else {
      setCopyFeedback(`Données copiées pour ${day} (${mode === 'all' ? 'tous les employés' : mode === 'individual' ? 'individuel' : 'd’un employé à un autre'})`);
    }
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log(`Copied ${mode} for ${day} from ${sourceEmployee || 'all'}`);
  };

  const pasteDay = (targetDays, targetEmp = null) => {
    console.log('pasteDay: Starting paste for targetDays:', targetDays, 'targetEmp:', targetEmp, 'copiedData:', copiedData);
    if (!copiedData) {
      setCopyFeedback('Aucune donnée à coller.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.warn('pasteDay: No copied data available');
      return;
    }
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
      console.log('pasteDay: Updated planning:', updated);
      setCopyFeedback(`Données collées sur ${targetDays.join(', ')} ${targetEmp ? `pour ${targetEmp}` : ''}`);
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`Pasted to ${targetDays.join(', ')} for ${targetEmp || 'all'}`);
      return updated;
    });
    setCopiedData(null);
  };

  const copyPreviousWeek = () => {
    console.log('copyPreviousWeek: Starting copy for previousWeek:', previousWeek);
    if (!previousWeek) {
      setCopyFeedback('Veuillez sélectionner une semaine précédente.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.warn('copyPreviousWeek: No previous week selected');
      return;
    }
    const previousKey = `planning_${selectedShop}_${previousWeek}`;
    const saved = localStorage.getItem(previousKey);
    if (saved) {
      const previousPlanning = JSON.parse(saved);
      console.log('copyPreviousWeek: Collected data:', previousPlanning);
      setCopiedData(previousPlanning);
      if (Object.keys(previousPlanning).length === 0) {
        setCopyFeedback('Aucune donnée à copier pour cette semaine.');
      } else {
        setCopyFeedback(`Semaine du ${format(new Date(previousWeek), 'dd/MM/yy', { locale: fr })} copiée.`);
      }
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`Copied entire week from: ${previousKey}`);
    } else {
      setCopyFeedback('Aucun planning trouvé pour la semaine sélectionnée.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.log(`No planning found for ${previousKey}`);
    }
  };

  const pastePreviousWeek = () => {
    console.log('pastePreviousWeek: Starting paste, copiedData:', copiedData);
    if (!copiedData) {
      setCopyFeedback('Aucune donnée à coller.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.warn('pastePreviousWeek: No copied data');
      return;
    }
    setShowConfirmPaste(true);
    console.log('pastePreviousWeek: Showing confirmation in previous-week-copy section');
  };

  const confirmPastePreviousWeek = () => {
    console.log('confirmPastePreviousWeek: Confirming paste, copiedData:', copiedData);
    if (!selectedShop || !selectedWeekDate) {
      console.warn('confirmPastePreviousWeek: Missing selectedShop or selectedWeekDate', { selectedShop, selectedWeekDate });
      setCopyFeedback('Erreur : Boutique ou semaine non sélectionnée.');
      setTimeout(() => setCopyFeedback(''), 2000);
      setShowConfirmPaste(false);
      return;
    }
    setPlanning((prev) => {
      const updated = { ...prev };
      Object.keys(copiedData).forEach((key) => {
        updated[key] = copiedData[key];
      });
      console.log('confirmPastePreviousWeek: Updated planning:', updated);
      const key = `planning_${selectedShop}_${selectedWeekDate.toISOString().split('T')[0]}`;
      localStorage.setItem(key, JSON.stringify(updated));
      console.log(`confirmPastePreviousWeek: Saved to localStorage for ${key}:`, updated);
      return updated;
    });
    setCopyFeedback('Semaine collée avec succès.');
    setTimeout(() => setCopyFeedback(''), 2000);
    setShowConfirmPaste(false);
    setCopiedData(null);
    console.log('Pasted entire week to current week');
  };

  const showPreview = (week) => {
    console.log('showPreview: Attempting to show preview for week:', week);
    if (!week) {
      setCopyFeedback('Veuillez sélectionner une semaine pour l’aperçu.');
      setTimeout(() => setCopyFeedback(''), 2000);
      console.warn('showPreview: No week selected');
      return;
    }
    const saved = localStorage.getItem(`planning_${selectedShop}_${week}`);
    const previewData = saved ? JSON.parse(saved) : {};
    console.log('showPreview: Preview data loaded:', previewData);
    setPreviewPlanning(previewData);
    setPreviewWeek(week);
    setIsPreviewModalOpen(true);
    console.log('showPreview: Modal opened with isPreviewModalOpen:', true);
  };

  const getAvailableWeeks = () => {
    const weeks = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(`planning_${selectedShop}_`)) {
        const weekDate = key.split('_')[2];
        if (weekDate) {
          const date = new Date(weekDate);
          if (isMonday(date)) {
            const monday = date;
            const sunday = addDays(monday, 6);
            const label = `Semaine du lundi ${format(monday, 'dd/MM/yy', { locale: fr })} au dimanche ${format(sunday, 'dd/MM/yy', { locale: fr })}`;
            weeks.push({ value: weekDate, label });
          }
        }
      }
    }
    return weeks.sort((a, b) => new Date(b.value) - new Date(a.value));
  };

  const handleWeekChange = (e) => {
    const newWeek = e.target.value;
    console.log('PlanningTable: Preview week selected:', newWeek);
    if (newWeek) {
      showPreview(newWeek);
    } else {
      setPreviewPlanning(null);
      setPreviewWeek('');
      setIsPreviewModalOpen(false);
    }
  };

  const isSlotActive = (employee, day, timeRange, planningData = planning) => {
    const key = `${day}_${timeRange}_${employee}`;
    return !!planningData[key];
  };

  const getEmployeeWeeklySchedule = (employee, planningData = planning) => {
    const schedule = [];
    days.forEach((day, index) => {
      const dailySlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening]
        .filter((timeRange) => isSlotActive(employee, day, timeRange, planningData))
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

  const getShopDailySchedule = (planningData = planning) => {
    const schedule = [];
    days.forEach((day, index) => {
      const dailyData = {
        day,
        employees: [],
        color: getCouleurJour(index),
      };
      localEmployees && localEmployees.forEach((employee) => {
        const dailySlots = [...timeSlots.morning, ...timeSlots.afternoon, ...timeSlots.evening]
          .filter((timeRange) => isSlotActive(employee, day, timeRange, planningData))
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
          selectedWeekDate
            ? `lundi ${format(new Date(selectedWeekDate), 'dd/MM/yy', { locale: fr })} au dimanche ${format(addDays(new Date(selectedWeekDate), 6), 'dd/MM/yy', { locale: fr })}`
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
          selectedWeekDate
            ? `lundi ${format(new Date(selectedWeekDate), 'dd/MM/yy', { locale: fr })} au dimanche ${format(addDays(new Date(selectedWeekDate), 6), 'dd/MM/yy', { locale: fr })}`
            : '-'
        }`,
        20,
        35,
      );

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Cumul horaire hebdomadaire:', 20, 50);
      const employeeHoursData = localEmployees && localEmployees.length ? localEmployees.map((employee) => [
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

  const handleEmployeeClick = (employee) => {
    console.log(`Opening weekly schedule for ${employee}`);
    setSelectedEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleShopRecapClick = () => {
    console.log(`Opening shop recap for ${selectedShop}`);
    setIsShopModalOpen(true);
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

  const renderTimeSlotTable = (slots, title) => (
    <div className="time-slot-section">
      <h3 className="time-slot-title">{title}</h3>
      <div className="table-wrapper">
        <table className="planning-table" key={`${selectedDay}_${title}`}>
          <thead>
            <tr>
              <th className="fixed-col">Tranche horaire</th>
              {slots.map((timeRange, index) => (
                <th key={`${selectedDay}_${timeRange}_${index}`} className="scrollable-col">
                  {timeRange.split('-')[0]}<br />{timeRange.split('-')[1]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localEmployees.map((employee, index) => (
              <tr key={`${selectedDay}_${employee}_${index}`}>
                <td className="fixed-col" style={{ backgroundColor: getCouleurCellule(index) }}>
                  {employee} ({calculateDailyHours(employee, selectedDay)}h)
                </td>
                {slots.map((timeRange, slotIndex) => (
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
  );

  return (
    <div className="planning-container">
      <h2>Création du Planning</h2>
      <div className="week-selector">
        <label>Semaine :</label>
        <select
          value={previewWeek}
          onChange={handleWeekChange}
          className="week-select"
        >
          <option value="">Choisir une semaine pour aperçu</option>
          {getAvailableWeeks().map((week) => (
            <option key={week.value} value={week.value}>
              {week.label}
            </option>
          ))}
        </select>
      </div>
      <div className="total-hours-fixed">
        {localEmployees.map((employee, index) => (
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
                  Récapitulatif de {selectedEmployee} ({calculateWeeklyHours(employee)} h)
                </h3>
                <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
                  Boutique: {selectedShop || 'Non spécifié'}
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
                  Semaine: {selectedWeekDate ? `lundi ${format(new Date(selectedWeekDate), 'dd/MM/yy', { locale: fr })} au dimanche ${format(addDays(new Date(selectedWeekDate), 6), 'dd/MM/yy', { locale: fr })}` : '-'}
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
                Semaine: {selectedWeekDate ? `lundi ${format(new Date(selectedWeekDate), 'dd/MM/yy', { locale: fr })} au dimanche ${format(addDays(new Date(selectedWeekDate), 6), 'dd/MM/yy', { locale: fr })}` : '-'}
              </p>
              <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '10px 0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '100px', fontSize: '10px' }}>Employé</th>
                    <th style={{ padding: '6px', fontWeight: 'bold', textAlign: 'left', width: '80px', fontSize: '10px' }}>Heures hebdomadaires</th>
                  </tr>
                </thead>
                <tbody>
                  {localEmployees.map((employee) => (
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
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          console.log('Closing preview Modal');
          setIsPreviewModalOpen(false);
          setPreviewPlanning(null);
          setPreviewWeek('');
        }}
        message={
          previewPlanning ? (
            <div style={{ display: 'flex', justifyContent: 'left' }}>
              <div style={{ width: '600px', maxHeight: '60vh', overflowY: 'auto' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Aperçu du planning pour {selectedShop || 'Non spécifié'}
                </h3>
                <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '14px' }}>
                  Semaine: {previewWeek ? `lundi ${format(new Date(previewWeek), 'dd/MM/yy', { locale: fr })} au dimanche ${format(addDays(new Date(previewWeek), 6), 'dd/MM/yy', { locale: fr })}` : '-'}
                </p>
                {getShopDailySchedule(previewPlanning).map((dayData, index) => (
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
                <p className="copyright">© Nicolas Lefèvre 2025 Klick Planning</p>
              </div>
            </div>
          ) : (
            <p>Aucun planning disponible pour cette semaine.</p>
          )
        }
        style={{ width: '600px', padding: '20px' }}
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
      <p className="day-date">Jour : {getDayDate(selectedWeekDate, selectedDay)}</p>
      <div className="table-container">
        {renderTimeSlotTable(timeSlots.morning, 'Matinée (9:00-14:00)')}
        {renderTimeSlotTable(timeSlots.afternoon, 'Après-midi (14:00-19:00)')}
        {renderTimeSlotTable(timeSlots.evening, 'Soirée (19:00-24:00)')}
      </div>
      <div style={{ margin: '10px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            console.log('Returning to shop selection', { selectedShop, selectedWeek: selectedWeekDate });
            onBackToShop();
          }}
          className="reset-button"
          title="Retour à la sélection de la boutique"
        >
          <FaUndo style={{ marginRight: '5px' }} /> Retour à la boutique
        </button>
        <button
          onClick={() => {
            console.log('Returning to week selection', { selectedShop, selectedWeek: selectedWeekDate });
            onBackToWeek();
          }}
          className="reset-button"
          title="Retour à la sélection de la semaine"
        >
          <FaUndo style={{ marginRight: '5px' }} /> Retour à la semaine
        </button>
        <button
          onClick={() => {
            console.log('Returning to employee selection', { selectedShop, selectedWeek: selectedWeekDate });
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
                  {localEmployees.map((emp) => (
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
                    {localEmployees.map((emp) => (
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
                    {localEmployees.map((emp) => (
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
                onClick={() => {
                  console.log('Copy button clicked, sourceDay:', sourceDay);
                  copyDay(sourceDay, copyMode, selectedEmployee);
                }}
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
                  onChange={(e) => {
                    console.log('PlanningTable: Previous week selected:', e.target.value);
                    setPreviousWeek(e.target.value);
                  }}
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
              {showConfirmPaste ? (
                <div className="confirm-paste">
                  <p>Voulez-vous coller la semaine du {previousWeek ? format(new Date(previousWeek), 'iiii dd/MM/yy', { locale: fr }) : ''} ?</p>
                  <div className="button-group">
                    <button
                      onClick={confirmPastePreviousWeek}
                      className="confirm-btn"
                      title="Confirmer le collage de la semaine"
                    >
                      Confirmer
                    </button>
                    <button
                      onClick={() => {
                        console.log('Cancel paste previous week');
                        setShowConfirmPaste(false);
                      }}
                      className="cancel-btn"
                      title="Annuler le collage"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="button-group">
                  <button
                    onClick={copyPreviousWeek}
                    disabled={!previousWeek}
                    className="copy-btn"
                    title="Copier toute la semaine précédente"
                  >
                    <FaCopy style={{ marginRight: '5px' }} /> Copier
                  </button>
                  <button
                    onClick={pastePreviousWeek}
                    disabled={!copiedData}
                    className="paste-btn"
                    title="Coller la semaine copiée dans la semaine actuelle"
                  >
                    <FaPaste style={{ marginRight: '5px' }} /> Coller
                  </button>
                </div>
              )}
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