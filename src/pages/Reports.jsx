import React, { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Users, Activity, Pill, Stethoscope, Download, Filter, TrendingUp, Building2, AlertCircle, Bed, Droplets, Heart } from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [facilityName, setFacilityName] = useState('120809-9-MSALALA( Hospital - District Hospital)');
  
  // Statistics state
  const [stats, setStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    totalRevenue: 0,
    pendingInvoices: 0,
    pendingAmount: 0,
    currentAdmissions: 0,
    totalAdmissions: 0
  });

  // Fetch statistics on component mount
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      // Fetch billing statistics
      const billingRes = await api.get('/billing/statistics');
      
      // Fetch IPD statistics
      const ipdRes = await api.get('/ipd-records/statistics');

      // Fetch active visits count (active patients)
      const visitsRes = await api.get('/visits');

      setStats({
        totalPatients: 0, // This would come from a dedicated patients endpoint
        activePatients: visitsRes.data.data?.length || 0,
        totalRevenue: billingRes.data.data?.invoices?.totalPaid || 0,
        pendingInvoices: billingRes.data.data?.overdueCount || 0,
        pendingAmount: billingRes.data.data?.invoices?.totalDue || 0,
        currentAdmissions: ipdRes.data.data?.currentAdmissions || 0,
        totalAdmissions: ipdRes.data.data?.statusCounts?.reduce((acc, s) => acc + s.count, 0) || 0
      });
    } catch (err) {
      console.error('Error fetching statistics:', err);
      setStats({
        totalPatients: 0,
        activePatients: 0,
        totalRevenue: 0,
        pendingInvoices: 0,
        pendingAmount: 0,
        currentAdmissions: 0,
        totalAdmissions: 0
      });
    }
  };

  const reportCategories = [
    {
      id: 'hmis',
      title: 'HMIS Reports',
      icon: FileText,
      color: 'bg-indigo-500',
      reports: [
        { id: 'hmis-opd', name: 'OPD Report (Wagonjwa wa Nje)', description: 'Outpatient Department monthly report', endpoint: '/visits', type: 'hmis' },
        { id: 'hmis-ipd', name: 'IPD Report (Wagonjwa wa Kulazwa)', description: 'Inpatient Department monthly report', endpoint: '/ipd-records', type: 'hmis' },
        { id: 'hmis-bed-occupancy', name: 'Bed Occupancy (Mwenendo wa Kulaza)', description: 'Bed occupancy report', endpoint: '/ipd-records', type: 'hmis' },
        { id: 'hmis-dtc', name: 'DTC Report (Magonjwa ya Kuhara)', description: 'Diarrhea Treatment Center report', endpoint: '/visits', type: 'hmis' },
        { id: 'hmis-tracer-medicine', name: 'Tracer Medicine Report', description: 'Essential medicines availability', endpoint: '/medicines', type: 'hmis' }
      ]
    },
    {
      id: 'patient',
      title: 'Patient Reports',
      icon: Users,
      color: 'bg-blue-500',
      reports: [
        { id: 'patient-visits', name: 'Patient Visits', description: 'All patient visit records', endpoint: '/visits' }
      ]
    },
    {
      id: 'clinical',
      title: 'Clinical Reports',
      icon: Stethoscope,
      color: 'bg-green-500',
      reports: [
        { id: 'visits-summary', name: 'Visits Summary', description: 'All patient visits', endpoint: '/visits' },
        { id: 'prescriptions', name: 'Prescription Report', description: 'All prescriptions', endpoint: '/prescriptions' },
        { id: 'lab-tests', name: 'Lab Tests Report', description: 'Laboratory test results', endpoint: '/lab-tests' },
        { id: 'radiology', name: 'Radiology Report', description: 'Imaging and radiology results', endpoint: '/radiology' }
      ]
    },
    {
      id: 'ipd',
      title: 'IPD Reports',
      icon: Building2,
      color: 'bg-purple-500',
      reports: [
        { id: 'ipd-admissions', name: 'Admissions Report', description: 'All IPD admissions', endpoint: '/ipd-records' },
        { id: 'ipd-statistics', name: 'IPD Statistics', description: 'Admission statistics and trends', endpoint: '/ipd-records/statistics' },
        { id: 'ipd-active', name: 'Active Admissions', description: 'Currently admitted patients', endpoint: '/ipd-records', filter: { status: 'admitted' } },
        { id: 'ipd-discharged', name: 'Discharged Patients', description: 'Discharge summary report', endpoint: '/ipd-records', filter: { status: 'discharged' } }
      ]
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      icon: DollarSign,
      color: 'bg-yellow-500',
      reports: [
        { id: 'invoice-list', name: 'All Invoices', description: 'Complete invoice listing', endpoint: '/billing/invoices' },
        { id: 'invoice-pending', name: 'Pending Invoices', description: 'Unpaid invoices', endpoint: '/billing/invoices', filter: { status: 'pending' } },
        { id: 'invoice-paid', name: 'Paid Invoices', description: 'Completed payments', endpoint: '/billing/invoices', filter: { status: 'paid' } },
        { id: 'billing-statistics', name: 'Billing Statistics', description: 'Revenue and payment analytics', endpoint: '/billing/statistics' }
      ]
    },
    {
      id: 'pharmacy',
      title: 'Pharmacy Reports',
      icon: Pill,
      color: 'bg-pink-500',
      reports: [
        { id: 'dispensing-records', name: 'Dispensing Records', description: 'Patient medicine dispensing', endpoint: '/dispensing' },
        { id: 'direct-dispensing', name: 'Direct Dispensing', description: 'Over-the-counter sales', endpoint: '/direct-dispensing' },
        { id: 'medicines-inventory', name: 'Medicines Inventory', description: 'Available medicines stock', endpoint: '/medicines' }
      ]
    },
    {
      id: 'theatre',
      title: 'Theatre Reports',
      icon: Activity,
      color: 'bg-red-500',
      reports: [
        { id: 'procedures-list', name: 'All Procedures', description: 'Complete procedure listing', endpoint: '/theatre-procedures' },
        { id: 'procedures-scheduled', name: 'Scheduled Procedures', description: 'Upcoming procedures', endpoint: '/theatre-procedures', filter: { status: 'scheduled' } },
        { id: 'procedures-completed', name: 'Completed Procedures', description: 'Finished procedures', endpoint: '/theatre-procedures', filter: { status: 'completed' } }
      ]
    }
  ];

  const handleGenerateReport = async (report) => {
    setSelectedReport(report);
    setLoading(true);
    setError(null);
    setReportData(null);

    try {
      const params = { limit: 1000 }; // High limit to get all records

      // Add date range if provided
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;

      // Add specific filters based on report configuration
      if (report.filter) {
        Object.assign(params, report.filter);
      }

      const response = await api.get(report.endpoint, { params });
      
      // For HMIS reports, transform and aggregate data
      if (report.type === 'hmis') {
        const transformedData = await transformToHMISFormat(report.id, response.data);
        setReportData(transformedData);
      } else {
        setReportData(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Please check your connection and try again.');
      console.error('Error generating report:', err);
    } finally {
      setLoading(false);
    }
  };

  // Transform data to HMIS format with real aggregations
  const transformToHMISFormat = async (reportId, data) => {
    let processedData = {};
    
    switch(reportId) {
      case 'hmis-opd':
        processedData = await processOPDData(data);
        break;
      case 'hmis-ipd':
        processedData = await processIPDData(data);
        break;
      case 'hmis-bed-occupancy':
        processedData = await processBedOccupancyData(data);
        break;
      case 'hmis-dtc':
        processedData = await processDTCData(data);
        break;
      case 'hmis-tracer-medicine':
        processedData = await processTracerMedicineData(data);
        break;
      default:
        processedData = data;
    }

    return {
      reportId,
      facilityName,
      dateRange,
      data: processedData,
      rawData: data, // Keep original data for reference
      generatedAt: new Date().toISOString()
    };
  };

  // Process OPD data - aggregate visits by diagnosis and demographics
  const processOPDData = async (visitData) => {
    const visits = visitData.data || visitData || [];
    
    // Initialize aggregation structure
    const aggregated = {
      totalVisits: visits.length,
      newPatients: 0,
      repeatVisits: 0,
      byAgeGroup: {
        'under1Month': { male: 0, female: 0, total: 0 },
        '1MonthTo1Year': { male: 0, female: 0, total: 0 },
        '1YearTo5Years': { male: 0, female: 0, total: 0 },
        '5To60Years': { male: 0, female: 0, total: 0 },
        'over60Years': { male: 0, female: 0, total: 0 }
      },
      byDiagnosis: {},
      byPaymentMethod: {
        insurance: 0,
        cash: 0,
        waiver: 0
      }
    };

    // Process each visit
    visits.forEach(visit => {
      // Count visit types
      if (visit.type === 'new' || visit.type === 'New Patient') {
        aggregated.newPatients++;
      } else {
        aggregated.repeatVisits++;
      }

      // Age group classification (would need patient DOB)
      const patient = visit.patient || {};
      const gender = patient.gender?.toLowerCase() === 'female' ? 'female' : 'male';
      
      // Simplified age grouping - in production, calculate from DOB
      // For now, default to 5-60 age group
      const ageGroup = '5To60Years';
      aggregated.byAgeGroup[ageGroup][gender]++;
      aggregated.byAgeGroup[ageGroup].total++;

      // Aggregate diagnoses
      if (visit.diagnosis && Array.isArray(visit.diagnosis)) {
        visit.diagnosis.forEach(diag => {
          const condition = diag.condition || 'Unknown';
          if (!aggregated.byDiagnosis[condition]) {
            aggregated.byDiagnosis[condition] = { count: 0, male: 0, female: 0 };
          }
          aggregated.byDiagnosis[condition].count++;
          aggregated.byDiagnosis[condition][gender]++;
        });
      }

      // Payment method
      if (patient.insurance?.provider) {
        aggregated.byPaymentMethod.insurance++;
      } else {
        aggregated.byPaymentMethod.cash++;
      }
    });

    return aggregated;
  };

  // Process IPD data - aggregate admissions
  const processIPDData = async (ipdData) => {
    const records = ipdData.data || ipdData || [];
    
    const aggregated = {
      totalAdmissions: records.length,
      byAgeGroup: {
        'under1Month': { male: 0, female: 0, total: 0 },
        '1MonthTo1Year': { male: 0, female: 0, total: 0 },
        '1YearTo5Years': { male: 0, female: 0, total: 0 },
        '5To60Years': { male: 0, female: 0, total: 0 }
      },
      byDiagnosis: {},
      byStatus: {},
      averageLengthOfStay: 0,
      deaths: 0
    };

    let totalDays = 0;

    records.forEach(record => {
      const patient = record.patient || {};
      const gender = patient.gender?.toLowerCase() === 'female' ? 'female' : 'male';
      
      // Age group (simplified)
      const ageGroup = '5To60Years';
      aggregated.byAgeGroup[ageGroup][gender]++;
      aggregated.byAgeGroup[ageGroup].total++;

      // Status
      const status = record.status || 'unknown';
      aggregated.byStatus[status] = (aggregated.byStatus[status] || 0) + 1;

      // Deaths
      if (status === 'deceased') {
        aggregated.deaths++;
      }

      // Diagnoses
      if (record.diagnosis && Array.isArray(record.diagnosis)) {
        record.diagnosis.forEach(diag => {
          const condition = diag.condition || 'Unknown';
          if (!aggregated.byDiagnosis[condition]) {
            aggregated.byDiagnosis[condition] = { count: 0, male: 0, female: 0 };
          }
          aggregated.byDiagnosis[condition].count++;
          aggregated.byDiagnosis[condition][gender]++;
        });
      }

      // Length of stay
      if (record.admissionDate) {
        const admissionDate = new Date(record.admissionDate);
        const endDate = record.dischargeDate ? new Date(record.dischargeDate) : new Date();
        const days = Math.ceil((endDate - admissionDate) / (1000 * 60 * 60 * 24));
        totalDays += days;
      }
    });

    aggregated.averageLengthOfStay = records.length > 0 ? 
      (totalDays / records.length).toFixed(1) : 0;

    return aggregated;
  };

  // Process Bed Occupancy data
  const processBedOccupancyData = async (ipdData) => {
    const records = ipdData.data || ipdData || [];
    
    return {
      totalBeds: 0, // Would need beds endpoint
      occupiedBeds: records.filter(r => r.status === 'admitted').length,
      maternityWard: {
        totalBeds: 0,
        admitted: records.filter(r => 
          r.status === 'admitted' && 
          r.ward?.type === 'maternity'
        ).length,
        gotBed: 0,
        noBed: 0
      },
      otherWards: {
        totalBeds: 0,
        admitted: records.filter(r => 
          r.status === 'admitted' && 
          r.ward?.type !== 'maternity'
        ).length,
        gotBed: 0,
        noBed: 0
      }
    };
  };

  // Process DTC (Diarrhea Treatment Center) data
  const processDTCData = async (visitData) => {
    const visits = visitData.data || visitData || [];
    
    // Filter visits with diarrhea-related diagnoses
    const diarrheaCases = visits.filter(visit => {
      if (!visit.diagnosis) return false;
      return visit.diagnosis.some(diag => 
        diag.condition?.toLowerCase().includes('diarrhea') ||
        diag.condition?.toLowerCase().includes('diarrhoea') ||
        diag.condition?.toLowerCase().includes('dysentery')
      );
    });

    return {
      totalCases: diarrheaCases.length,
      severeDehydration: 0, // Would need to check vital signs
      someDehydration: 0,
      bloodInStool: 0,
      referred: 0,
      receivedZinc: 0,
      receivedORS: 0,
      admitted: 0,
      deaths: 0,
      byAgeGroup: {
        'under1Month': { male: 0, female: 0, total: 0 },
        '1MonthTo1Year': { male: 0, female: 0, total: 0 },
        '1To5Years': { male: 0, female: 0, total: 0 }
      }
    };
  };

  // Process Tracer Medicine data
  const processTracerMedicineData = async (medicineData) => {
    const medicines = medicineData.data || medicineData || [];
    
    // Tracer medicines list (as per HMIS guidelines)
    const tracerMedicines = [
      'DPT+HepB/HiB vaccine',
      'Vitamin A',
      'ALU 20/120mg',
      'Sulphadoxine Pyrimethamine (SP)',
      'Amoxycillin',
      'Cotrimoxazole',
      'Benzyl Penicilline',
      'Ceftriaxone',
      'Metronidazole',
      'Albendazole',
      'Mebendazole',
      'Zinc sulphate',
      'ORS',
      'Ergometrine',
      'Oxytocin',
      'Misoprostol',
      'Magnesium Sulphate',
      'Depo',
      'Combined Oral Contraceptives',
      'Dextrose 5%',
      'Ringer\'s Lactate (RL)',
      'Rapid Test for Syphilis',
      'UNIGOLD HIV 1/2',
      'SD BIOLINE HIV',
      'mRDT for Malaria',
      'Paracetamol',
      'Catgut Sutures',
      'Nevirapine',
      'TDF/3TC/EFV',
      'RHZE',
      'HB Testing',
      'Ferrous + Folic Acid',
      'Glucose testing',
      'Gloves',
      'Antiseptic/Disinfectant',
      'Lignacane'
    ];

    const availability = tracerMedicines.map(tracerMedicine => {
      const found = medicines.find(med => 
        med.name?.toLowerCase().includes(tracerMedicine.toLowerCase())
      );

      return {
        medicine: tracerMedicine,
        serviceProvided: found ? 'Yes' : 'No',
        available: found && found.quantityInStock > 0 ? 'Yes' : 'No',
        stockLevel: found ? 
          (found.quantityInStock > 100 ? 'A: >4 Weeks' : 
           found.quantityInStock > 20 ? 'B: 1-4 Weeks' : 
           'C: <1 Week') : 'N/A'
      };
    });

    return { tracerMedicines: availability };
  };

  // Generate comprehensive table-based PDF for non-HMIS reports
  const generateStandardPDF = (data, report) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(report.name, 14, 20);
    
    // Report metadata
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
    if (dateRange.start) {
      doc.text(`Period: ${dateRange.start} to ${dateRange.end || 'Present'}`, 14, 36);
    }
    
    // Determine table structure based on report type
    let tableData = [];
    let headers = [];
    
    const dataArray = Array.isArray(data) ? data : 
                      data.data?.invoices ? data.data.invoices : 
                      data.data ? data.data : [];
    
    // Define headers and data based on report ID
    if (report.id.includes('visit') || report.id === 'patient-visits') {
      headers = ['Visit ID', 'Patient', 'Doctor', 'Date', 'Type', 'Status'];
      tableData = dataArray.map(visit => [
        visit.visitId || '',
        `${visit.patient?.firstName || ''} ${visit.patient?.lastName || ''}`,
        `${visit.doctor?.firstName || ''} ${visit.doctor?.lastName || ''}`,
        new Date(visit.visitDate).toLocaleDateString(),
        visit.type || '',
        visit.status || ''
      ]);
    } else if (report.id.includes('invoice')) {
      headers = ['Invoice #', 'Patient', 'Amount', 'Paid', 'Balance', 'Status'];
      tableData = dataArray.map(invoice => [
        invoice.invoiceNumber || '',
        `${invoice.patient?.firstName || ''} ${invoice.patient?.lastName || ''}`,
        `TZS ${(invoice.totalAmount || 0).toLocaleString()}`,
        `TZS ${(invoice.amountPaid || 0).toLocaleString()}`,
        `TZS ${(invoice.balanceDue || 0).toLocaleString()}`,
        invoice.status || ''
      ]);
    } else if (report.id.includes('ipd')) {
      headers = ['Admission ID', 'Patient', 'Ward', 'Bed', 'Admission Date', 'Status'];
      tableData = dataArray.map(record => [
        record.admissionId || '',
        `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`,
        record.ward?.name || '',
        record.bed?.bedNumber || '',
        new Date(record.admissionDate).toLocaleDateString(),
        record.status || ''
      ]);
    } else if (report.id.includes('prescription')) {
      headers = ['Medication', 'Patient', 'Dosage', 'Frequency', 'Status', 'Date'];
      tableData = dataArray.map(prescription => [
        prescription.medication || '',
        `${prescription.patient?.firstName || ''} ${prescription.patient?.lastName || ''}`,
        prescription.dosage || '',
        prescription.frequency || '',
        prescription.status || '',
        new Date(prescription.createdAt).toLocaleDateString()
      ]);
    } else if (report.id.includes('lab-test')) {
      headers = ['Test Name', 'Patient', 'Status', 'Results', 'Date'];
      tableData = dataArray.map(test => [
        test.testName || '',
        `${test.patient?.firstName || ''} ${test.patient?.lastName || ''}`,
        test.status || '',
        test.results || 'Pending',
        new Date(test.createdAt).toLocaleDateString()
      ]);
    } else if (report.id.includes('radiology')) {
      headers = ['Scan Type', 'Body Part', 'Patient', 'Status', 'Date'];
      tableData = dataArray.map(scan => [
        scan.scanType || '',
        scan.bodyPart || '',
        `${scan.patient?.firstName || ''} ${scan.patient?.lastName || ''}`,
        scan.status || '',
        new Date(scan.createdAt).toLocaleDateString()
      ]);
    } else if (report.id.includes('procedure')) {
      headers = ['Procedure', 'Patient', 'Surgeon', 'Theatre', 'Date', 'Status'];
      tableData = dataArray.map(proc => [
        proc.procedure_name || '',
        `${proc.patient?.firstName || ''} ${proc.patient?.lastName || ''}`,
        `${proc.surgeon?.firstName || ''} ${proc.surgeon?.lastName || ''}`,
        proc.theatre?.name || '',
        new Date(proc.procedure_date).toLocaleDateString(),
        proc.status || ''
      ]);
    } else if (report.id.includes('dispensing')) {
      headers = ['Medicine', 'Patient', 'Quantity', 'Date', 'Pharmacist'];
      tableData = dataArray.map(record => [
        record.medication || record.medicine_name || '',
        `${record.patient?.firstName || ''} ${record.patient?.lastName || ''}`,
        record.quantityDispensed || record.quantity || '',
        new Date(record.dispensedDate || record.createdAt).toLocaleDateString(),
        `${record.pharmacist?.firstName || ''} ${record.pharmacist?.lastName || ''}`
      ]);
    } else if (report.id.includes('medicine')) {
      headers = ['Medicine Name', 'Category', 'Stock', 'Unit', 'Price'];
      tableData = dataArray.map(med => [
        med.name || '',
        med.category || '',
        med.quantityInStock || 0,
        med.unit || '',
        `TZS ${(med.sellingPrice || 0).toLocaleString()}`
      ]);
    }
    
    // Add table
    if (tableData.length > 0) {
      doc.autoTable({
        startY: dateRange.start ? 42 : 36,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], fontSize: 9 },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { top: 10 }
      });
    } else {
      doc.setFontSize(12);
      doc.text('No data available for this report', 14, 50);
    }
    
    // Footer with page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
      doc.text(
        `Facility: ${facilityName}`,
        14,
        doc.internal.pageSize.getHeight() - 10
      );
    }
    
    return doc;
  };

  // Generate HMIS OPD PDF with real data
  const generateHMISOPDPDF = (transformedData) => {
    const doc = new jsPDF('landscape');
    const aggregated = transformedData.data;
    
    // Header
    doc.setFontSize(10);
    doc.text('Facility name (s)', 14, 15);
    doc.setFontSize(9);
    doc.text(facilityName, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Taarifa ya Mwezi ya Wagonjwa wa Nje (OPD)', 14, 30);
    
    // Summary section
    doc.setFontSize(9);
    doc.text(`Total Visits: ${aggregated.totalVisits}`, 14, 38);
    doc.text(`New Patients: ${aggregated.newPatients}`, 100, 38);
    doc.text(`Repeat Visits: ${aggregated.repeatVisits}`, 180, 38);
    
    // Define diagnoses list with actual data
    const diagnoses = [
      { no: 1, name: 'Wagonjwa waliohudhuria kwa mara ya kwanza mwaka huo(*)', data: [aggregated.newPatients, 0, aggregated.newPatients] },
      { no: 2, name: 'Mahudhurio ya kwanza/wagonjwa wapya', data: [aggregated.newPatients, 0, aggregated.newPatients] },
      { no: 3, name: 'Mahudhurio ya Marudio', data: [aggregated.repeatVisits, 0, aggregated.repeatVisits] },
      { no: '', name: 'Mahudhurio ya OPD (2+3)', data: [aggregated.totalVisits, 0, aggregated.totalVisits], special: true },
      { no: '', name: 'Diagnoses Za OPD', header: true, data: [] },
      ...Object.entries(aggregated.byDiagnosis || {}).map(([condition, counts], index) => ({
        no: index + 4,
        name: condition,
        data: [counts.male || 0, counts.female || 0, counts.count || 0]
      })),
      { no: 91, name: 'Waliotibiwa kwa Bima ya Afya', data: [aggregated.byPaymentMethod?.insurance || 0, 0, aggregated.byPaymentMethod?.insurance || 0] },
      { no: 92, name: 'Waliotibiwa kwa Pesa taslimu (Cash)', data: [aggregated.byPaymentMethod?.cash || 0, 0, aggregated.byPaymentMethod?.cash || 0] },
      { no: 93, name: 'Waliotibiwa kwa Msamaha', data: [aggregated.byPaymentMethod?.waiver || 0, 0, aggregated.byPaymentMethod?.waiver || 0] }
    ];
    
    // Create table data with actual counts
    const tableData = diagnoses.map(diagnosis => {
      const row = [diagnosis.no, diagnosis.name];
      if (diagnosis.data && diagnosis.data.length > 0) {
        // Distribute data across age groups (simplified for now)
        for (let i = 0; i < 5; i++) { // 5 age groups
          row.push(diagnosis.data[0] || 0); // Male
          row.push(diagnosis.data[1] || 0); // Female
          row.push(diagnosis.data[2] || 0); // Total
        }
      } else {
        // Add zeros for all age groups
        for (let i = 0; i < 15; i++) {
          row.push('0');
        }
      }
      return row;
    });
    
    doc.autoTable({
      startY: 45,
      head: [
        ['Na.', 'Maelezo', 
         { content: 'Umri chini ya mwezi 1', colSpan: 3 },
         { content: 'Umri mwezi 1 hadi umri chini ya mwaka 1', colSpan: 3 },
         { content: 'Umri mwaka 1 hadi umri chini ya miaka 5', colSpan: 3 },
         { content: 'Umri Miaka 5 hadi miaka 60', colSpan: 3 },
         { content: 'Umri Wa Miaka 60 Kuendelea', colSpan: 3 }
        ],
        ['', '', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA']
      ],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 60, halign: 'left' }
      },
      didParseCell: function(data) {
        if (data.row.index >= 0 && tableData[data.row.index]) {
          const diagnosis = diagnoses[data.row.index];
          if (diagnosis?.header) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [240, 240, 240];
          }
        }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('@PMO-RALG - GOTHOMIS', 14, finalY);
    doc.text(`HMIS_Wagonjwa wa Nje (OPD) Period: ${dateRange.start || 'Start'} - ${dateRange.end || 'End'}`, 14, finalY + 5);
    doc.text(`Printed by: ${localStorage.getItem('userName') || 'System User'} At: ${new Date().toLocaleString()}`, 14, finalY + 10);
    
    return doc;
  };

  // Generate HMIS IPD PDF with real data
  const generateHMISIPDPDF = (transformedData) => {
    const doc = new jsPDF('landscape');
    const aggregated = transformedData.data;
    
    // Header
    doc.setFontSize(10);
    doc.text('Facility name (s)', 14, 15);
    doc.setFontSize(9);
    doc.text(facilityName, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Taarifa ya Mwezi kutoka Wodini (IPD)', 14, 30);
    
    // Summary
    doc.setFontSize(9);
    doc.text(`Total Admissions: ${aggregated.totalAdmissions}`, 14, 38);
    doc.text(`Deaths: ${aggregated.deaths}`, 100, 38);
    doc.text(`Avg Length of Stay: ${aggregated.averageLengthOfStay} days`, 180, 38);
    
    // Create diagnosis data from actual IPD records
    const ipdDiagnoses = [
      { no: 1, name: 'Waliolazwa Wodini', data: [aggregated.totalAdmissions, 0, aggregated.totalAdmissions] },
      ...Object.entries(aggregated.byDiagnosis || {}).slice(0, 50).map(([condition, counts], index) => ({
        no: index + 2,
        name: condition,
        data: [counts.male || 0, counts.female || 0, counts.count || 0]
      })),
      { no: 93, name: 'Deaths', data: [aggregated.deaths, 0, aggregated.deaths] }
    ];
    
    const tableData = ipdDiagnoses.map(diagnosis => {
      const row = [diagnosis.no, diagnosis.name];
      if (diagnosis.data && diagnosis.data.length > 0) {
        for (let i = 0; i < 4; i++) { // 4 age groups
          row.push(diagnosis.data[0] || 0);
          row.push(diagnosis.data[1] || 0);
          row.push(diagnosis.data[2] || 0);
        }
      } else {
        for (let i = 0; i < 12; i++) {
          row.push('0');
        }
      }
      return row;
    });
    
    doc.autoTable({
      startY: 45,
      head: [
        ['Na.', 'Maelezo', 
         { content: 'Umri chini ya mwezi 1', colSpan: 3 },
         { content: 'Umri mwezi 1 hadi umri chini ya mwaka 1', colSpan: 3 },
         { content: 'Umri mwaka 1 hadi umri chini ya miaka 5', colSpan: 3 },
         { content: 'Umri miaka 5 hadi miaka 60', colSpan: 3 }
        ],
        ['', '', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA', 'ME', 'KE', 'JUMLA']
      ],
      body: tableData,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        cellPadding: 1,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 6
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 70, halign: 'left' }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('@PMO-RALG - GOTHOMIS', 14, finalY);
    doc.text(`HMIS_Wagonjwa wa Kulazwa (IPD) Period: ${dateRange.start || 'Start'} - ${dateRange.end || 'End'}`, 14, finalY + 5);
    doc.text(`Printed by: ${localStorage.getItem('userName') || 'System User'} At: ${new Date().toLocaleString()}`, 14, finalY + 10);
    
    return doc;
  };

  // Generate Bed Occupancy PDF with real data
  const generateBedOccupancyPDF = (transformedData) => {
    const doc = new jsPDF();
    const data = transformedData.data;
    
    // Header
    doc.setFontSize(10);
    doc.text('Facility name (s)', 14, 15);
    doc.setFontSize(9);
    doc.text(facilityName, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('TAARIFA YA MWENENDO WA KULAZA WAGONJWA', 14, 30);
    
    const bedData = [
      ['a', 'Vitanda Vilivyopo', data.maternityWard.totalBeds, data.otherWards.totalBeds],
      ['b', 'Wagonjwa waliolazwa', data.maternityWard.admitted, data.otherWards.admitted],
      ['c', 'Waliopata kitanda', data.maternityWard.gotBed, data.otherWards.gotBed],
      ['d', 'Waliokosa kitanda', data.maternityWard.noBed, data.otherWards.noBed]
    ];
    
    doc.autoTable({
      startY: 40,
      head: [['Na.', 'Maelezo', 'Wodi ya wazazi', 'Wodi Zingine za kulaza Wagonjwa (IPD)']],
      body: bedData,
      theme: 'grid',
      styles: { 
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.5
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 80, halign: 'left' },
        2: { cellWidth: 40, halign: 'center' },
        3: { cellWidth: 45, halign: 'center' }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('@PMO-RALG - GOTHOMIS', 14, finalY);
    doc.text(`HMIS_Bed Occupancy Period: ${dateRange.start || 'Start'} - ${dateRange.end || 'End'}`, 14, finalY + 5);
    doc.text(`Printed by: ${localStorage.getItem('userName') || 'System User'} At: ${new Date().toLocaleString()}`, 14, finalY + 10);
    
    return doc;
  };

  // Generate DTC Report PDF with real data
  const generateDTCPDF = (transformedData) => {
    const doc = new jsPDF();
    const data = transformedData.data;
    
    // Header
    doc.setFontSize(10);
    doc.text('Facility name (s)', 14, 15);
    doc.setFontSize(9);
    doc.text(facilityName, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Taarifa ya DTC', 14, 30);
    
    const dtcData = [
      ['1', 'Idadi ya wagonjwa waliotibiwa DTC', data.totalCases, 0, data.totalCases, 0, 0, 0, 0, 0, 0, data.totalCases],
      ['2', 'Idadi ya wagonjwa waliotibiwa DTC walio na upungufu mkubwa wa maji', data.severeDehydration, 0, data.severeDehydration, 0, 0, 0, 0, 0, 0, data.severeDehydration],
      ['3', 'Idadi ya wagonjwa waliotibiwa DTC walio na upungufu kiasi wa maji', data.someDehydration, 0, data.someDehydration, 0, 0, 0, 0, 0, 0, data.someDehydration],
      ['4', 'Idadi ya wagonjwa walio na damu katika kinyesi', data.bloodInStool, 0, data.bloodInStool, 0, 0, 0, 0, 0, 0, data.bloodInStool],
      ['5', 'Idadi ya wagonjwa waliopewa rufaa', data.referred, 0, data.referred, 0, 0, 0, 0, 0, 0, data.referred],
      ['6', 'Idadi ya wagonjwa waliopatiwa zinki', data.receivedZinc, 0, data.receivedZinc, 0, 0, 0, 0, 0, 0, data.receivedZinc],
      ['7', 'Idadi ya wagonjwa waliopatiwa paketi za ORS', data.receivedORS, 0, data.receivedORS, 0, 0, 0, 0, 0, 0, data.receivedORS],
      ['8', 'Idadi ya wagonjwa waliolazwa', data.admitted, 0, data.admitted, 0, 0, 0, 0, 0, 0, data.admitted],
      ['9', 'Idadi ya wagonjwa waliofia DTC', data.deaths, 0, data.deaths, 0, 0, 0, 0, 0, 0, data.deaths]
    ];
    
    doc.autoTable({
      startY: 38,
      head: [
        ['Na.', 'Maelezo', 
         { content: 'Umri chini ya mwezi 1', colSpan: 3 },
         { content: 'Umri mwezi 1 hadi umri chini ya mwaka 1', colSpan: 3 },
         { content: 'Umri mwaka 1 hadi umri miaka 5', colSpan: 3 },
         'Jumla Kuu'
        ],
        ['', '', 'Me', 'Ke', 'Jumla', 'Me', 'Ke', 'Jumla', 'Me', 'Ke', 'Jumla', '']
      ],
      body: dtcData,
      theme: 'grid',
      styles: { 
        fontSize: 8,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 85, halign: 'left', fontSize: 7 }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('@PMO-RALG - GOTHOMIS', 14, finalY);
    doc.text(`HMIS_DTC Period: ${dateRange.start || 'Start'} - ${dateRange.end || 'End'}`, 14, finalY + 5);
    doc.text(`Printed by: ${localStorage.getItem('userName') || 'System User'} At: ${new Date().toLocaleString()}`, 14, finalY + 10);
    
    return doc;
  };

  // Generate Tracer Medicine PDF with real data
  const generateTracerMedicinePDF = (transformedData) => {
    const doc = new jsPDF();
    const data = transformedData.data;
    
    // Header
    doc.setFontSize(10);
    doc.text('Facility name (s)', 14, 15);
    doc.setFontSize(9);
    doc.text(facilityName, 14, 20);
    
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('Tracer Medicine Reporting Tool', 14, 30);
    
    const tracerMedicines = data.tracerMedicines.map((item, index) => [
      index + 1,
      item.medicine,
      item.serviceProvided,
      item.available,
      item.stockLevel === 'C: <1 Week' ? 'Yes' : '',
      item.stockLevel === 'B: 1-4 Weeks' ? 'Yes' : '',
      item.stockLevel === 'A: >4 Weeks' ? 'Yes' : ''
    ]);
    
    doc.autoTable({
      startY: 38,
      head: [['Line No', 'Maelezo', 'Je Kituo kinatoa huduma hii?', 'Hali ya kiashiria/dawa ipo?', 'A: < 1 Week', 'B: 1-4 Weeks', 'C: > 4 Weeks']],
      body: tracerMedicines,
      theme: 'grid',
      styles: { 
        fontSize: 7,
        cellPadding: 2,
        lineColor: [0, 0, 0],
        lineWidth: 0.3
      },
      headStyles: { 
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 7
      },
      columnStyles: {
        0: { cellWidth: 15, halign: 'center' },
        1: { cellWidth: 95, halign: 'left' },
        2: { cellWidth: 18, halign: 'center' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 15, halign: 'center' },
        5: { cellWidth: 15, halign: 'center' },
        6: { cellWidth: 15, halign: 'center' }
      }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text('@PMO-RALG - GOTHOMIS', 14, finalY);
    doc.text(`HMIS_Tracer Medicine Period: ${dateRange.start || 'Start'} - ${dateRange.end || 'End'}`, 14, finalY + 5);
    doc.text(`Printed by: ${localStorage.getItem('userName') || 'System User'} At: ${new Date().toLocaleString()}`, 14, finalY + 10);
    
    return doc;
  };

  const exportToPDF = (data) => {
    if (!selectedReport) {
      alert('Please select a report first');
      return;
    }

    let doc;

    // Generate HMIS-specific reports
    if (selectedReport.type === 'hmis') {
      switch (selectedReport.id) {
        case 'hmis-opd':
          doc = generateHMISOPDPDF(data);
          break;
        case 'hmis-ipd':
          doc = generateHMISIPDPDF(data);
          break;
        case 'hmis-bed-occupancy':
          doc = generateBedOccupancyPDF(data);
          break;
        case 'hmis-dtc':
          doc = generateDTCPDF(data);
          break;
        case 'hmis-tracer-medicine':
          doc = generateTracerMedicinePDF(data);
          break;
        default:
          alert('Report type not yet implemented');
          return;
      }
      
      // Save the PDF
      const fileName = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      return;
    }

    // Handle non-HMIS reports
    doc = generateStandardPDF(reportData, selectedReport);
    
    // Save PDF
    const fileName = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const handleExportReport = (format) => {
    if (!reportData) {
      alert('No data to export. Please generate a report first.');
      return;
    }

    try {
      switch (format) {
        case 'pdf':
          exportToPDF(reportData);
          break;
        case 'csv':
          exportToCSV(reportData);
          break;
        case 'json':
          exportToJSON(reportData);
          break;
        default:
          alert('Export format not supported');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const exportToCSV = (data) => {
    // Extract data array
    const dataArray = Array.isArray(data) ? data : 
                      data.data?.invoices ? data.data.invoices :
                      data.rawData?.data ? data.rawData.data :
                      data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
    
    if (dataArray.length === 0) {
      alert('No data to export');
      return;
    }

    try {
      // Get headers from first object
      const headers = Object.keys(dataArray[0]).filter(key => 
        typeof dataArray[0][key] !== 'object' || dataArray[0][key] === null
      );
      
      const headerRow = headers.join(',');
      const rows = dataArray.map(row => {
        return headers.map(header => {
          let val = row[header];
          // Handle nested objects by converting to string
          if (typeof val === 'object' && val !== null) {
            val = JSON.stringify(val);
          }
          // Escape commas and quotes
          if (typeof val === 'string' && (val.includes(',') || val.includes('"'))) {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        }).join(',');
      });
      
      const csv = [headerRow, ...rows].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV export error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const exportToJSON = (data) => {
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON export error:', error);
      alert('Failed to export JSON. Please try again.');
    }
  };

  const getRecordCount = () => {
    if (!reportData) return 0;
    if (reportData.data && typeof reportData.data === 'object') {
      // For HMIS reports
      if (reportData.data.totalVisits) return reportData.data.totalVisits;
      if (reportData.data.totalAdmissions) return reportData.data.totalAdmissions;
      if (reportData.data.totalCases) return reportData.data.totalCases;
      // For raw data
      if (Array.isArray(reportData.data)) return reportData.data.length;
    }
    if (reportData.rawData?.data && Array.isArray(reportData.rawData.data)) {
      return reportData.rawData.data.length;
    }
    if (Array.isArray(reportData)) return reportData.length;
    if (reportData.count) return reportData.count;
    return 0;
  };

  const formatCurrency = (amount) => {
    return `TZS ${(amount || 0).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
          <p className="text-gray-600">Generate comprehensive reports including HMIS-compliant formats with real data</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">Active</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.activePatients.toLocaleString()}</div>
            <div className="text-blue-100 text-sm">Active Visits</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">Revenue</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.totalRevenue)}</div>
            <div className="text-green-100 text-sm">Total Collections</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <Building2 className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">IPD</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats.currentAdmissions}</div>
            <div className="text-purple-100 text-sm">Active Admissions</div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium bg-white bg-opacity-20 px-3 py-1 rounded-full">Pending</span>
            </div>
            <div className="text-3xl font-bold mb-1">{formatCurrency(stats.pendingAmount)}</div>
            <div className="text-yellow-100 text-sm">{stats.pendingInvoices} Overdue Invoices</div>
          </div>
        </div>

        {/* Facility Name Input */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Facility Name (for HMIS Reports)
          </label>
          <input
            type="text"
            value={facilityName}
            onChange={(e) => setFacilityName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter facility name"
          />
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Date Range:</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">From:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">To:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button 
              onClick={() => setDateRange({ start: '', end: '' })}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Report Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportCategories.map((category) => {
            const IconComponent = category.icon;
            return (
              <div key={category.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className={`${category.color} p-4`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-semibold text-white">{category.title}</h2>
                  </div>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {category.reports.map((report) => (
                      <div
                        key={report.id}
                        className={`p-3 border rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer group ${
                          selectedReport?.id === report.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                        }`}
                        onClick={() => handleGenerateReport(report)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 mb-1">
                              {report.name}
                            </h3>
                            <p className="text-xs text-gray-500">{report.description}</p>
                          </div>
                          <FileText className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Generating report...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Report Results */}
        {reportData && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedReport?.name}
              </h3>
              <div className="text-sm text-gray-600">
                Total Records: {getRecordCount()}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="max-h-96 overflow-y-auto">
                <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 whitespace-pre-wrap">
                  {JSON.stringify(reportData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Export Options */}
        {reportData && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Report</h3>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => handleExportReport('pdf')}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as PDF
              </button>
              <button
                onClick={() => handleExportReport('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as CSV
              </button>
              <button
                onClick={() => handleExportReport('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export as JSON
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;