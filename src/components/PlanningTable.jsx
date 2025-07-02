import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import '../styles/PlanningTable.css';

const PlanningTable = ({ employees, selectedWeek, selectedShop }) => {
  const [selectedDay, setSelectedDay] = useState('Lundi');
  const [planning, setPlanning] = useState(() => {
    const saved = localStorage.getItem(`planning_${selectedShop}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [targetEmployee, setTargetEmployee] = useState(null);
  const [copiedData, setCopiedData] = useState(null);
  const [copyMode, setCopyMode] = useState('all');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [showCopyPaste, setShowCopyPaste] = useState(true);

  useEffect(() => {
    localStorage.setItem(`planning_${selectedShop}`, JSON.stringify(planning));
    console.log(`Planning updated for ${selectedShop}, ${selectedDay}:`, planning);
  }, [planning, selectedShop]);

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
    console.log('resetSchedules: Planning reset to', {});
  };

  const copyDay = (day, mode = 'all', sourceEmployee = null) => {
    const dayData = {};
    if (mode === 'all') {
      employees && employees.forEach((emp) => {
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
    setCopyFeedback(`Copié pour ${day} (${mode === 'all' ? 'tous' : mode === 'individual' ? 'individuel' : mode === 'employeeToEmployee' ? 'employé vers employé' : ''})`);
    setTimeout(() => setCopyFeedback(''), 2000);
    console.log(`Copied ${mode} for ${day} from ${sourceEmployee || 'all'}`);
  };

  const pasteDay = (day, targetEmp = null) => {
    if (copiedData) {
      setPlanning((prev) => {
        const updated = { ...prev };
        Object.keys(copiedData).forEach((key) => {
          const [sourceDay, timeRange, sourceEmp] = key.split('_');
          const newKey = `${day}_${timeRange}_${targetEmp || sourceEmp}`;
          if (copyMode === 'all' || !targetEmp || (copyMode === 'employeeToEmployee' && targetEmp)) {
            updated[newKey] = copiedData[key];
          }
        });
        setCopyFeedback(`Collé sur ${day} ${targetEmp ? `pour ${targetEmp}` : ''}`);
        setTimeout(() => setCopyFeedback(''), 2000);
        console.log(`Pasted to ${day} for ${targetEmp || 'all'}`);
        return updated;
      });
      setCopiedData(null);
    }
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
        .sort();
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
        for (let i = 0; i < dailySlots.length - 1; i++) {
          const currentEnd = dailySlots[i].split('-')[1];
          const nextStart = dailySlots[i + 1].split('-')[0];
          if (currentEnd !== nextStart) {
            departure = currentEnd;
            returnTime = nextStart;
            break;
          }
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
          .sort();
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
          for (let i = 0; i < dailySlots.length - 1; i++) {
            const currentEnd = dailySlots[i].split('-')[1];
            const nextStart = dailySlots[i + 1].split('-')[0];
            if (currentEnd !== nextStart) {
              departure = currentEnd;
              returnTime = nextStart;
              break;
            }
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
      doc.setFontSize(16);
      doc.text(`Récapitulatif de ${employee} (${calculateWeeklyHours(employee)} h)`, 10, 10);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Boutique: ${selectedShop || 'Non spécifié'}`, 10, 20);
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
        10,
        30,
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
        startY: 40,
        head: [['Jour', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
        body: tableData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 20 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
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

      doc.setFontSize(8);
      doc.text('© Nicolas Lefèvre 2025 Klick Planning', 10, doc.lastAutoTable.finalY + 10);
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
      doc.setFontSize(16);
      doc.text(`Boutique: ${selectedShop || 'Non spécifié'}`, 10, 10);
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
        10,
        20,
      );

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Cumul horaire hebdomadaire:', 10, 30);
      const employeeHoursData = employees && employees.length ? employees.map((employee) => [
        { content: employee, styles: { fontStyle: 'bold' } },
        { content: `${calculateWeeklyHours(employee)} h`, styles: { fontStyle: 'normal' } },
      ]) : [];
      autoTable(doc, {
        startY: 35,
        head: [['Employé', 'Heures hebdomadaires']],
        body: employeeHoursData,
        theme: 'grid',
        styles: { font: 'helvetica', fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 60 } },
      });

      let currentY = doc.lastAutoTable.finalY + 2;

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

        autoTable(doc, {
          startY: currentY,
          head: [['Jour', 'Employé', 'Arrivée', 'Sortie', 'Retour', 'Fin', 'Heures effectives']],
          body: tableData,
          theme: 'grid',
          styles: { font: 'helvetica', fontSize: 7, cellPadding: 1 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
          bodyStyles: { textColor: [0, 0, 0] },
          columnStyles: {
            0: { cellWidth: 18 },
            1: { cellWidth: 26 },
            2: { cellWidth: 18 },
            3: { cellWidth: 18 },
            4: { cellWidth: 18 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
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

        currentY = doc.lastAutoTable.finalY + 2;
      });

      doc.setFontSize(8);
      doc.text('© Nicolas Lefèvre 2025 Klick Planning', 10, currentY + 10);
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
    setShowCopyPaste(!showCopyPaste);
    console.log(`Copy-paste section ${showCopyPaste ? 'hidden' : 'shown'}`);
  };

  if (!employees || !Array.isArray(employees)) {
    console.error('PlanningTable: Employees is undefined or not an array:', employees);
    return <div>Erreur : Aucune liste d'employés valide</div>;
  }

  return (
    <div className="planning-container">
      <h2>Création du Planning</h2>
      <div className="total-hours-fixed">
        {employees.map((employee, index) => (
          <button
            key={employee}
            className="total-btn"
            onClick={() => handleEmployeeClick(employee)}
          >
            {employee}: <strong>{calculateWeeklyHours(employee)}h</strong>
          </button>
        ))}
        <button
          className="total-btn shop-recap-btn"
          onClick={handleShopRecapClick}
        >
          Récapitulatif Boutique
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
        message="Voulez-vous vraiment réinitialiser tous les créneaux ?"
        style={{ width: '400px', padding: '15px' }}
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
                <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '12px' }}>
                  Boutique: {selectedShop || 'Non spécifié'}
                </p>
                <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '12px' }}>
                  Semaine: {selectedWeek ? new Date(selectedWeek).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' au ' + new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
                </p>
                <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#e5e5e5' }}>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Jour</th>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Arrivée</th>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Sortie</th>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Retour</th>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Fin</th>
                      <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '80px', fontSize: '8px' }}>Heures effectives</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEmployeeWeeklySchedule(selectedEmployee).map(({ day, arrival, departure, return: returnTime, end, totalHours, color }, index) => (
                      <tr key={day} style={{ backgroundColor: color }}>
                        <td style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>{day}</td>
                        <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '8px' }}>{arrival}</td>
                        <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '8px' }}>{departure}</td>
                        <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '8px' }}>{returnTime}</td>
                        <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '8px' }}>{end}</td>
                        <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '80px', fontSize: '8px' }}>{totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: '8px', fontSize: '12px' }}>Voulez-vous exporter en PDF ?</p>
                <p style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>© Nicolas Lefèvre 2025 Klick Planning</p>
              </div>
            </div>
          ) : null
        }
        style={{ width: '500px', padding: '15px' }}
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
            <div style={{ width: '500px', maxHeight: '40vh', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '5px' }}>
                Boutique: {selectedShop || 'Non spécifié'}
              </h3>
              <p style={{ fontWeight: 'bold', margin: '5px 0', fontSize: '12px' }}>
                Semaine: {selectedWeek ? new Date(selectedWeek).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' au ' + new Date(new Date(selectedWeek).setDate(new Date(selectedWeek).getDate() + 6)).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '-'}
              </p>
              <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#e5e5e5' }}>
                    <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '100px', fontSize: '8px' }}>Employé</th>
                    <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '80px', fontSize: '8px' }}>Heures hebdomadaires</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee}>
                      <td style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '100px', fontSize: '8px' }}>{employee}</td>
                      <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '80px', fontSize: '8px' }}>{calculateWeeklyHours(employee)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {getShopDailySchedule().map((dayData, index) => (
                <div key={dayData.day} style={{ marginBottom: '5px' }}>
                  <table className="recap-table" style={{ width: '100%', borderCollapse: 'collapse', margin: '0', backgroundColor: dayData.color }}>
                    <thead>
                      <tr style={{ backgroundColor: '#e5e5e5' }}>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>Jour</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '90px', fontSize: '8px' }}>Employé</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>Arrivée</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>Sortie</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>Retour</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>Fin</th>
                        <th style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '70px', fontSize: '8px' }}>Heures effectives</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayData.employees.map((emp) => (
                        <tr key={emp.name}>
                          <td style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '60px', fontSize: '8px' }}>{dayData.day}</td>
                          <td style={{ padding: '4px', fontWeight: 'bold', textAlign: 'left', width: '90px', fontSize: '8px' }}>{emp.name}</td>
                          <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '8px' }}>{emp.arrival}</td>
                          <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '8px' }}>{emp.departure}</td>
                          <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '8px' }}>{emp.return}</td>
                          <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '60px', fontSize: '8px' }}>{emp.end}</td>
                          <td style={{ padding: '4px', fontWeight: 'normal', textAlign: 'left', width: '70px', fontSize: '8px' }}>{emp.totalHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
              <p style={{ marginTop: '8px', fontSize: '12px' }}>Voulez-vous exporter en PDF ?</p>
              <p style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>© Nicolas Lefèvre 2025 Klick Planning</p>
            </div>
          </div>
        }
        style={{ width: '500px', padding: '15px' }}
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
      <p style={{ margin: '10px 0', fontSize: '16px', fontWeight: 'bold' }}>Jour : {selectedDay}, 30 juin 2025</p>
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
      <button
        onClick={() => {
          console.log('Opening reset modal');
          setIsModalOpen(true);
        }}
        className="reset-button"
      >
        Réinitialiser
      </button>
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
          {days.map((day) => (
            <div
              key={day}
              className="copy-paste-row"
            >
              <button
                onClick={() => {
                  setSelectedDay(day);
                  console.log(`Switched to ${day}`);
                }}
                className="day-btn"
              >
                {day}
              </button>
              <select
                value={copyMode}
                onChange={(e) => setCopyMode(e.target.value)}
                className="copy-mode-select"
              >
                <option value="all">Tous</option>
                <option value="individual">Individuel</option>
                <option value="employeeToEmployee">Employé vers employé</option>
              </select>
              {copyMode === 'individual' && (
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
              )}
              {copyMode === 'employeeToEmployee' && (
                <>
                  <select
                    value={selectedEmployee || ''}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="employee-select"
                  >
                    <option value="">Employé source</option>
                    {employees.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                  <select
                    value={targetEmployee || ''}
                    onChange={(e) => setTargetEmployee(e.target.value)}
                    className="employee-select"
                  >
                    <option value="">Employé cible</option>
                    {employees.map((emp) => (
                      <option key={emp} value={emp}>
                        {emp}
                      </option>
                    ))}
                  </select>
                </>
              )}
              <button
                onClick={() => copyDay(day, copyMode, selectedEmployee)}
                className="copy-btn"
              >
                Copier
              </button>
              <button
                onClick={() => pasteDay(day, copyMode === 'employeeToEmployee' ? targetEmployee : null)}
                disabled={!copiedData || (copyMode === 'employeeToEmployee' && !targetEmployee)}
                className="paste-btn"
              >
                Coller
              </button>
              {copyFeedback && <span className="copy-feedback">{copyFeedback}</span>}
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: '15px', fontSize: '10px', color: '#666' }}>
        © Nicolas Lefèvre 2025 Klick Planning
      </p>
    </div>
  );
};

export default PlanningTable;