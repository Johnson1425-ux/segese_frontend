import React, { useState, useEffect } from 'react';
import {
  FileText, Calendar, DollarSign, Users, Activity, Pill,
  Stethoscope, Download, TrendingUp, Building2, AlertCircle,
  Bed, ChevronRight, BarChart2, ClipboardList, X, RefreshCw,
  CheckCircle, Clock, ArrowUpRight, Beaker
} from 'lucide-react';
import api from '../utils/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
const fmt = (n) => Number(n || 0).toLocaleString();
const fmtTZS = (n) => `TZS ${fmt(n)}`;
const fmtDate = (d) => {
  if (!d) return '—';
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};

// Safely extract age in years from a DOB string
const ageFromDOB = (dob) => {
  if (!dob) return null;
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
};

// Classify patient into HMIS age bucket
const ageGroup = (dob) => {
  const months = dob ? Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30.44)) : null;
  if (months === null) return '5To60Years'; // fallback
  if (months < 1)   return 'under1Month';
  if (months < 12)  return '1MonthTo1Year';
  if (months < 60)  return '1YearTo5Years';
  if (months < 720) return '5To60Years';
  return 'over60Years';
};

/* ─────────────────────────────────────────────
   Stat Card
───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, badge }) => (
  <div className={`rounded-xl p-5 text-white shadow-md ${color} flex flex-col gap-3`}>
    <div className="flex items-start justify-between">
      <div className="bg-white/20 rounded-lg p-2">
        <Icon className="w-5 h-5" />
      </div>
      {badge && (
        <span className="text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </div>
    <div>
      <div className="text-2xl font-bold tracking-tight leading-none">{value}</div>
      <div className="text-sm font-medium mt-1 opacity-90">{label}</div>
      {sub && <div className="text-xs mt-0.5 opacity-70">{sub}</div>}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Report Table — renders fetched data nicely
───────────────────────────────────────────── */
const ReportTable = ({ report, data }) => {
  // Unwrap the data array from various API shapes
  const rows = (() => {
    if (Array.isArray(data)) return data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (data?.data?.invoices && Array.isArray(data.data.invoices)) return data.data.invoices;
    if (data?.data?.records && Array.isArray(data.data.records)) return data.data.records;
    return [];
  })();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">No records found for the selected period.</p>
      </div>
    );
  }

  // Per-report column definitions
  const columns = (() => {
    const id = report.id;
    if (id.includes('visit') || id === 'patient-visits') return [
      { label: 'Visit ID',    get: r => r.visitId || r._id?.slice(-6)?.toUpperCase() || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Doctor',      get: r => `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`.trim() || '—' },
      { label: 'Date',        get: r => fmtDate(r.visitDate || r.createdAt) },
      { label: 'Type',        get: r => r.type || '—' },
      { label: 'Status',      get: r => r.status || '—', badge: true },
    ];
    if (id.includes('invoice')) return [
      { label: 'Invoice #',   get: r => r.invoiceNumber || r._id?.slice(-6)?.toUpperCase() || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Amount',      get: r => fmtTZS(r.totalAmount) },
      { label: 'Paid',        get: r => fmtTZS(r.amountPaid) },
      { label: 'Balance',     get: r => fmtTZS(r.balanceDue) },
      { label: 'Status',      get: r => r.status || '—', badge: true },
    ];
    if (id.includes('ipd')) return [
      { label: 'Admission ID', get: r => r.admissionNumber || r._id?.slice(-6)?.toUpperCase() || '—' },
      { label: 'Patient',      get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Ward',         get: r => r.ward?.name || '—' },
      { label: 'Bed',          get: r => r.bed?.bedNumber || '—' },
      { label: 'Admitted',     get: r => fmtDate(r.admissionDate) },
      { label: 'Status',       get: r => r.status || '—', badge: true },
    ];
    if (id.includes('prescription')) return [
      { label: 'Medicine',    get: r => r.medication || r.medicine_name || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Dosage',      get: r => r.dosage || '—' },
      { label: 'Frequency',   get: r => r.frequency || '—' },
      { label: 'Status',      get: r => r.status || '—', badge: true },
      { label: 'Date',        get: r => fmtDate(r.createdAt) },
    ];
    if (id.includes('lab-test')) return [
      { label: 'Test',        get: r => r.testName || r.test_name || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Results',     get: r => r.results || 'Pending' },
      { label: 'Status',      get: r => r.status || '—', badge: true },
      { label: 'Date',        get: r => fmtDate(r.createdAt) },
    ];
    if (id.includes('radiology')) return [
      { label: 'Scan Type',   get: r => r.scanType || '—' },
      { label: 'Body Part',   get: r => r.bodyPart || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Status',      get: r => r.status || '—', badge: true },
      { label: 'Date',        get: r => fmtDate(r.createdAt) },
    ];
    if (id.includes('procedure')) return [
      { label: 'Procedure',   get: r => r.procedure_name || r.procedureName || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Surgeon',     get: r => `${r.surgeon?.firstName || ''} ${r.surgeon?.lastName || ''}`.trim() || '—' },
      { label: 'Theatre',     get: r => r.theatre?.name || '—' },
      { label: 'Date',        get: r => fmtDate(r.procedure_date || r.procedureDate) },
      { label: 'Status',      get: r => r.status || '—', badge: true },
    ];
    if (id.includes('dispensing')) return [
      { label: 'Medicine',    get: r => r.medication || r.medicine_name || r.medicineName || '—' },
      { label: 'Patient',     get: r => `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`.trim() || '—' },
      { label: 'Quantity',    get: r => r.quantityDispensed || r.quantity || '—' },
      { label: 'Pharmacist',  get: r => `${r.pharmacist?.firstName || ''} ${r.pharmacist?.lastName || ''}`.trim() || '—' },
      { label: 'Date',        get: r => fmtDate(r.dispensedDate || r.createdAt) },
    ];
    if (id.includes('medicine')) return [
      { label: 'Name',        get: r => r.name || '—' },
      { label: 'Category',    get: r => r.category || '—' },
      { label: 'Stock',       get: r => fmt(r.quantityInStock) },
      { label: 'Unit',        get: r => r.unit || '—' },
      { label: 'Price',       get: r => fmtTZS(r.sellingPrice) },
    ];
    // Fallback: show first 5 flat keys
    const keys = Object.keys(rows[0] || {}).filter(k => typeof rows[0][k] !== 'object').slice(0, 5);
    return keys.map(k => ({ label: k, get: r => String(r[k] ?? '—') }));
  })();

  const statusColor = (s = '') => {
    const l = s.toLowerCase();
    if (['paid', 'completed', 'discharged', 'active'].includes(l)) return 'bg-green-100 text-green-700';
    if (['pending', 'scheduled', 'admitted'].includes(l)) return 'bg-yellow-100 text-yellow-700';
    if (['overdue', 'cancelled', 'deceased'].includes(l)) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(col => (
              <th key={col.label} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.slice(0, 200).map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map(col => (
                <td key={col.label} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                  {col.badge
                    ? <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(col.get(row))}`}>{col.get(row)}</span>
                    : col.get(row)
                  }
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > 200 && (
        <div className="px-4 py-2 text-xs text-gray-400 bg-gray-50 border-t border-gray-100">
          Showing first 200 of {fmt(rows.length)} records. Export to see all.
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   HMIS Summary Views
───────────────────────────────────────────── */
const HMISSummary = ({ data, reportId }) => {
  if (!data?.data) return null;
  const d = data.data;

  if (reportId === 'hmis-opd') return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Visits', value: fmt(d.totalVisits) },
          { label: 'New Patients', value: fmt(d.newPatients) },
          { label: 'Repeat Visits', value: fmt(d.repeatVisits) },
        ].map(s => (
          <div key={s.label} className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">{s.value}</div>
            <div className="text-xs text-blue-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Insurance', value: fmt(d.byPaymentMethod?.insurance), color: 'green' },
          { label: 'Cash', value: fmt(d.byPaymentMethod?.cash), color: 'yellow' },
          { label: 'Waiver', value: fmt(d.byPaymentMethod?.waiver), color: 'purple' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-4 text-center`}>
            <div className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</div>
            <div className={`text-xs text-${s.color}-500 mt-1`}>{s.label}</div>
          </div>
        ))}
      </div>
      {Object.keys(d.byDiagnosis || {}).length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-600 mb-2">Top Diagnoses</h4>
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Diagnosis</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Male</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Female</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(d.byDiagnosis).sort((a,b) => b[1].count - a[1].count).slice(0, 15).map(([cond, counts]) => (
                  <tr key={cond} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-700">{cond}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{fmt(counts.male)}</td>
                    <td className="px-4 py-2 text-center text-gray-600">{fmt(counts.female)}</td>
                    <td className="px-4 py-2 text-center font-medium text-gray-800">{fmt(counts.count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  if (reportId === 'hmis-ipd') return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Admissions', value: fmt(d.totalAdmissions), color: 'purple' },
          { label: 'Deaths', value: fmt(d.deaths), color: 'red' },
          { label: 'Avg Stay (days)', value: d.averageLengthOfStay ?? '—', color: 'blue' },
        ].map(s => (
          <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-4 text-center`}>
            <div className={`text-2xl font-bold text-${s.color}-700`}>{s.value}</div>
            <div className={`text-xs text-${s.color}-500 mt-1`}>{s.label}</div>
          </div>
        ))}
      </div>
      {Object.keys(d.byStatus || {}).length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(d.byStatus).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
              <span className="capitalize text-gray-600">{status}</span>
              <span className="font-semibold text-gray-800">{fmt(count)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (reportId === 'hmis-bed-occupancy') return (
    <div className="space-y-3">
      {[
        { label: 'Occupied Beds', value: fmt(d.occupiedBeds), color: 'blue' },
        { label: 'Maternity Ward — Admitted', value: fmt(d.maternityWard?.admitted), color: 'pink' },
        { label: 'Other Wards — Admitted', value: fmt(d.otherWards?.admitted), color: 'purple' },
      ].map(s => (
        <div key={s.label} className={`flex items-center justify-between bg-${s.color}-50 rounded-lg px-4 py-3`}>
          <span className={`text-sm text-${s.color}-600`}>{s.label}</span>
          <span className={`text-xl font-bold text-${s.color}-700`}>{s.value}</span>
        </div>
      ))}
    </div>
  );

  if (reportId === 'hmis-dtc') return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Indicator</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Count</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {[
            ['Total DTC Cases', d.totalCases],
            ['Severe Dehydration', d.severeDehydration],
            ['Some Dehydration', d.someDehydration],
            ['Blood in Stool', d.bloodInStool],
            ['Referred', d.referred],
            ['Received Zinc', d.receivedZinc],
            ['Received ORS', d.receivedORS],
            ['Admitted', d.admitted],
            ['Deaths', d.deaths],
          ].map(([label, val]) => (
            <tr key={label} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-700">{label}</td>
              <td className="px-4 py-2 text-center font-semibold text-gray-800">{fmt(val)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (reportId === 'hmis-tracer-medicine') return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">#</th>
            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500">Medicine</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Service?</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Available?</th>
            <th className="px-4 py-2 text-center text-xs font-semibold text-gray-500">Stock Level</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {(d.tracerMedicines || []).map((item, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-2 text-gray-400 text-xs">{i + 1}</td>
              <td className="px-4 py-2 text-gray-700">{item.medicine}</td>
              <td className="px-4 py-2 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.serviceProvided === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.serviceProvided}
                </span>
              </td>
              <td className="px-4 py-2 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.available === 'Yes' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {item.available}
                </span>
              </td>
              <td className="px-4 py-2 text-center text-xs text-gray-600">{item.stockLevel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return null;
};

/* ─────────────────────────────────────────────
   PDF helpers (kept from original, unchanged)
───────────────────────────────────────────── */
const buildStandardPDF = (data, report, dateRange, facilityName) => {
  const doc = new jsPDF();
  const pw = doc.internal.pageSize.getWidth();
  doc.setFontSize(16); doc.setFont(undefined, 'bold');
  doc.text(report.name, 14, 20);
  doc.setFontSize(9); doc.setFont(undefined, 'normal');
  doc.text(`Facility: ${facilityName}`, 14, 28);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 34);
  if (dateRange.start) doc.text(`Period: ${dateRange.start} → ${dateRange.end || 'Present'}`, 14, 40);

  const rows = Array.isArray(data) ? data
    : data?.data?.invoices ? data.data.invoices
    : data?.data ? (Array.isArray(data.data) ? data.data : []) : [];

  let head = [], body = [];
  const id = report.id;
  if (id.includes('visit') || id === 'patient-visits') {
    head = ['Visit ID', 'Patient', 'Doctor', 'Date', 'Type', 'Status'];
    body = rows.map(r => [r.visitId || '', `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`, `${r.doctor?.firstName || ''} ${r.doctor?.lastName || ''}`, fmtDate(r.visitDate), r.type || '', r.status || '']);
  } else if (id.includes('invoice')) {
    head = ['Invoice #', 'Patient', 'Amount', 'Paid', 'Balance', 'Status'];
    body = rows.map(r => [r.invoiceNumber || '', `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`, fmtTZS(r.totalAmount), fmtTZS(r.amountPaid), fmtTZS(r.balanceDue), r.status || '']);
  } else if (id.includes('ipd')) {
    head = ['Admission ID', 'Patient', 'Ward', 'Bed', 'Admitted', 'Status'];
    body = rows.map(r => [r.admissionId || '', `${r.patient?.firstName || ''} ${r.patient?.lastName || ''}`, r.ward?.name || '', r.bed?.bedNumber || '', fmtDate(r.admissionDate), r.status || '']);
  } else if (id.includes('medicine')) {
    head = ['Name', 'Category', 'Stock', 'Unit', 'Price'];
    body = rows.map(r => [r.name || '', r.category || '', fmt(r.quantityInStock), r.unit || '', fmtTZS(r.sellingPrice)]);
  } else {
    const keys = rows[0] ? Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object').slice(0, 6) : [];
    head = keys;
    body = rows.map(r => keys.map(k => String(r[k] ?? '')));
  }

  if (body.length) {
    doc.autoTable({ startY: dateRange.start ? 46 : 40, head: [head], body, theme: 'striped', headStyles: { fillColor: [30, 64, 175], fontSize: 8 }, styles: { fontSize: 7.5, cellPadding: 2 } });
  } else {
    doc.setFontSize(11); doc.text('No records found.', 14, 55);
  }

  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(7.5);
    doc.text(`Page ${i} of ${pages}`, pw / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
  }
  return doc;
};

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const Reports = () => {
  const [selectedReport, setSelectedReport] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [facilityName, setFacilityName] = useState('Segese Medical Clinic');
  const [stats, setStats] = useState({ activePatients: 0, totalRevenue: 0, pendingAmount: 0, pendingInvoices: 0, currentAdmissions: 0, totalAdmissions: 0 });

  useEffect(() => { fetchStatistics(); }, []);

  const fetchStatistics = async () => {
    try {
      const [billingRes, ipdRes, visitsRes] = await Promise.allSettled([
        api.get('/billing/statistics'),
        api.get('/ipd-records/statistics'),
        api.get('/visits'),
      ]);

      const billing = billingRes.status === 'fulfilled' ? billingRes.value.data?.data || billingRes.value.data : null;
      const ipd     = ipdRes.status === 'fulfilled'     ? ipdRes.value.data?.data     || ipdRes.value.data     : null;
      const visits  = visitsRes.status === 'fulfilled'  ? visitsRes.value.data?.data  || visitsRes.value.data  : null;

      setStats({
        activePatients:    Array.isArray(visits) ? visits.length : (visits?.total || 0),
        totalRevenue:      billing?.invoices?.totalPaid    || billing?.totalPaid    || billing?.totalRevenue || 0,
        pendingAmount:     billing?.invoices?.totalDue     || billing?.totalDue     || billing?.pendingAmount || 0,
        pendingInvoices:   billing?.overdueCount           || billing?.pendingCount  || 0,
        currentAdmissions: ipd?.currentAdmissions          || ipd?.activeCount       || 0,
        totalAdmissions:   ipd?.statusCounts?.reduce((a, s) => a + s.count, 0) || ipd?.total || 0,
      });
    } catch { /* silently fail — stats are supplementary */ }
  };

  // ── OPD ──
  const processOPDData = (visitData) => {
    const visits = visitData?.data || (Array.isArray(visitData) ? visitData : []);
    const emptyGroup = () => ({ male: 0, female: 0, total: 0 });
    const byAgeGroup = { under1Month: emptyGroup(), '1MonthTo1Year': emptyGroup(), '1YearTo5Years': emptyGroup(), '5To60Years': emptyGroup(), over60Years: emptyGroup() };
    const byDiagnosis = {};
    const byPaymentMethod = { insurance: 0, cash: 0, waiver: 0 };
    let newPatients = 0, repeatVisits = 0;

    visits.forEach(visit => {
      const type = (visit.type || '').toLowerCase();
      if (type === 'new' || type === 'new patient') newPatients++; else repeatVisits++;

      const patient = visit.patient || {};
      const gender  = (patient.gender || '').toLowerCase() === 'female' ? 'female' : 'male';
      const ag      = ageGroup(patient.dateOfBirth || patient.dob);
      if (byAgeGroup[ag]) { byAgeGroup[ag][gender]++; byAgeGroup[ag].total++; }

      (visit.diagnosis || []).forEach(diag => {
        const cond = diag.condition || diag.name || 'Unknown';
        if (!byDiagnosis[cond]) byDiagnosis[cond] = { count: 0, male: 0, female: 0 };
        byDiagnosis[cond].count++;
        byDiagnosis[cond][gender]++;
      });

      if (patient.insurance?.provider || patient.insuranceProvider) byPaymentMethod.insurance++;
      else if (visit.paymentMethod === 'waiver') byPaymentMethod.waiver++;
      else byPaymentMethod.cash++;
    });

    return { totalVisits: visits.length, newPatients, repeatVisits, byAgeGroup, byDiagnosis, byPaymentMethod };
  };

  // ── IPD ──
  const processIPDData = (ipdData) => {
    const records = ipdData?.data || (Array.isArray(ipdData) ? ipdData : []);
    const emptyGroup = () => ({ male: 0, female: 0, total: 0 });
    const byAgeGroup = { under1Month: emptyGroup(), '1MonthTo1Year': emptyGroup(), '1YearTo5Years': emptyGroup(), '5To60Years': emptyGroup() };
    const byDiagnosis = {}, byStatus = {};
    let deaths = 0, totalDays = 0;

    records.forEach(record => {
      const patient = record.patient || {};
      const gender  = (patient.gender || '').toLowerCase() === 'female' ? 'female' : 'male';
      const ag      = ageGroup(patient.dateOfBirth || patient.dob);
      if (byAgeGroup[ag]) { byAgeGroup[ag][gender]++; byAgeGroup[ag].total++; }

      const status = record.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
      if (status === 'deceased') deaths++;

      (record.diagnosis || []).forEach(diag => {
        const cond = diag.condition || diag.name || 'Unknown';
        if (!byDiagnosis[cond]) byDiagnosis[cond] = { count: 0, male: 0, female: 0 };
        byDiagnosis[cond].count++; byDiagnosis[cond][gender]++;
      });

      if (record.admissionDate) {
        const end = record.dischargeDate ? new Date(record.dischargeDate) : new Date();
        totalDays += Math.max(0, Math.ceil((end - new Date(record.admissionDate)) / 86400000));
      }
    });

    return {
      totalAdmissions: records.length, byAgeGroup, byDiagnosis, byStatus,
      averageLengthOfStay: records.length ? (totalDays / records.length).toFixed(1) : 0,
      deaths,
    };
  };

  const processBedOccupancyData = (ipdData) => {
    const records = ipdData?.data || (Array.isArray(ipdData) ? ipdData : []);
    const admitted = records.filter(r => r.status === 'admitted');
    return {
      occupiedBeds: admitted.length,
      maternityWard: { admitted: admitted.filter(r => r.ward?.type === 'maternity').length, totalBeds: 0, gotBed: 0, noBed: 0 },
      otherWards:   { admitted: admitted.filter(r => r.ward?.type !== 'maternity').length, totalBeds: 0, gotBed: 0, noBed: 0 },
    };
  };

  const processDTCData = (visitData) => {
    const visits = visitData?.data || (Array.isArray(visitData) ? visitData : []);
    const dtc = visits.filter(v => (v.diagnosis || []).some(d =>
      /diarr|dysentery/i.test(d.condition || d.name || '')
    ));
    return { totalCases: dtc.length, severeDehydration: 0, someDehydration: 0, bloodInStool: 0, referred: 0, receivedZinc: 0, receivedORS: 0, admitted: 0, deaths: 0 };
  };

  const processTracerMedicineData = (medicineData) => {
    const medicines = medicineData?.data || (Array.isArray(medicineData) ? medicineData : []);
    const tracerList = ['DPT+HepB/HiB vaccine','Vitamin A','ALU 20/120mg','Sulphadoxine Pyrimethamine (SP)','Amoxycillin','Cotrimoxazole','Benzyl Penicilline','Ceftriaxone','Metronidazole','Albendazole','Mebendazole','Zinc sulphate','ORS','Ergometrine','Oxytocin','Misoprostol','Magnesium Sulphate','Depo','Combined Oral Contraceptives','Dextrose 5%',"Ringer's Lactate (RL)",'Rapid Test for Syphilis','UNIGOLD HIV 1/2','SD BIOLINE HIV','mRDT for Malaria','Paracetamol','Catgut Sutures','Nevirapine','TDF/3TC/EFV','RHZE','HB Testing','Ferrous + Folic Acid','Glucose testing','Gloves','Antiseptic/Disinfectant','Lignacane'];
    return {
      tracerMedicines: tracerList.map(name => {
        const found = medicines.find(m => m.name?.toLowerCase().includes(name.toLowerCase()));
        const qty = found?.quantityInStock || 0;
        return {
          medicine: name,
          serviceProvided: found ? 'Yes' : 'No',
          available: found && qty > 0 ? 'Yes' : 'No',
          stockLevel: !found ? 'N/A' : qty > 100 ? 'A: >4 Weeks' : qty > 20 ? 'B: 1-4 Weeks' : 'C: <1 Week',
        };
      }),
    };
  };

  const transformHMIS = async (reportId, rawData) => {
    const processors = {
      'hmis-opd':             processOPDData,
      'hmis-ipd':             processIPDData,
      'hmis-bed-occupancy':   processBedOccupancyData,
      'hmis-dtc':             processDTCData,
      'hmis-tracer-medicine': processTracerMedicineData,
    };
    return {
      reportId, facilityName, dateRange,
      data: (processors[reportId] || (d => d))(rawData),
      rawData,
      generatedAt: new Date().toISOString(),
    };
  };

  const handleGenerateReport = async (report) => {
    setSelectedReport(report);
    setLoading(true);
    setError(null);
    setReportData(null);
    try {
      const params = { limit: 1000 };
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end)   params.endDate   = dateRange.end;
      if (report.filter)   Object.assign(params, report.filter);

      const res = await api.get(report.endpoint, { params });
      if (report.type === 'hmis') {
        setReportData(await transformHMIS(report.id, res.data));
      } else {
        setReportData(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!reportData) return;
    if (format === 'pdf') {
      const doc = buildStandardPDF(reportData, selectedReport, dateRange, facilityName);
      doc.save(`${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    } else if (format === 'csv') {
      const rows = Array.isArray(reportData) ? reportData
        : reportData?.data?.invoices ? reportData.data.invoices
        : reportData?.rawData?.data  ? reportData.rawData.data
        : reportData?.data           ? (Array.isArray(reportData.data) ? reportData.data : [])
        : [];
      if (!rows.length) return;
      const keys = Object.keys(rows[0]).filter(k => typeof rows[0][k] !== 'object');
      const csv  = [keys.join(','), ...rows.map(r => keys.map(k => {
        let v = r[k]; if (typeof v === 'string' && /[,"]/.test(v)) v = `"${v.replace(/"/g,'""')}"`;
        return v ?? '';
      }).join(','))].join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `${selectedReport.name.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const getRecordCount = () => {
    if (!reportData) return 0;
    const d = reportData;
    if (d?.data?.totalVisits)     return d.data.totalVisits;
    if (d?.data?.totalAdmissions) return d.data.totalAdmissions;
    if (d?.data?.totalCases)      return d.data.totalCases;
    if (Array.isArray(d?.data))   return d.data.length;
    if (d?.rawData?.data && Array.isArray(d.rawData.data)) return d.rawData.data.length;
    if (Array.isArray(d))         return d.length;
    if (d?.count)                 return d.count;
    return 0;
  };

  const reportCategories = [
    {
      id: 'hmis', title: 'HMIS Reports', icon: FileText, color: 'from-indigo-600 to-indigo-700',
      reports: [
        { id: 'hmis-opd',             name: 'OPD Monthly Report',       description: 'Outpatient department monthly summary',        endpoint: '/visits',    type: 'hmis' },
        { id: 'hmis-ipd',             name: 'IPD Monthly Report',       description: 'Inpatient department monthly summary',         endpoint: '/ipd-records', type: 'hmis' },
        { id: 'hmis-bed-occupancy',   name: 'Bed Occupancy Report',     description: 'Ward bed usage and occupancy rates',           endpoint: '/ipd-records', type: 'hmis' },
        { id: 'hmis-dtc',             name: 'DTC Report',               description: 'Diarrhea Treatment Center statistics',         endpoint: '/visits',    type: 'hmis' },
        { id: 'hmis-tracer-medicine', name: 'Tracer Medicine Report',   description: 'Essential medicines availability tracking',    endpoint: '/medicines', type: 'hmis' },
      ],
    },
    {
      id: 'patient', title: 'Patient Reports', icon: Users, color: 'from-blue-600 to-blue-700',
      reports: [
        { id: 'patient-visits', name: 'Patient Visits', description: 'All patient visit records', endpoint: '/visits' },
      ],
    },
    {
      id: 'clinical', title: 'Clinical Reports', icon: Stethoscope, color: 'from-teal-600 to-teal-700',
      reports: [
        { id: 'visits-summary',  name: 'Visits Summary',     description: 'All patient visits',           endpoint: '/visits' },
        { id: 'prescriptions',   name: 'Prescriptions',      description: 'All prescriptions issued',      endpoint: '/prescriptions' },
        { id: 'lab-tests',       name: 'Lab Tests',          description: 'Laboratory test results',       endpoint: '/lab-tests' },
        { id: 'radiology',       name: 'Radiology',          description: 'Imaging and radiology results', endpoint: '/radiology' },
      ],
    },
    {
      id: 'ipd', title: 'IPD Reports', icon: Bed, color: 'from-violet-600 to-violet-700',
      reports: [
        { id: 'ipd-admissions',   name: 'All Admissions',     description: 'Complete IPD admissions list',  endpoint: '/ipd-records' },
        { id: 'ipd-statistics',   name: 'IPD Statistics',     description: 'Admission statistics & trends', endpoint: '/ipd-records/statistics' },
        { id: 'ipd-active',       name: 'Active Admissions',  description: 'Currently admitted patients',   endpoint: '/ipd-records', filter: { status: 'admitted' } },
        { id: 'ipd-discharged',   name: 'Discharged Patients',description: 'Discharge summary report',      endpoint: '/ipd-records', filter: { status: 'discharged' } },
      ],
    },
    {
      id: 'financial', title: 'Financial Reports', icon: DollarSign, color: 'from-emerald-600 to-emerald-700',
      reports: [
        { id: 'invoice-list',       name: 'All Invoices',        description: 'Complete invoice listing',   endpoint: '/billing/invoices' },
        { id: 'invoice-pending',    name: 'Pending Invoices',    description: 'Unpaid invoices',            endpoint: '/billing/invoices', filter: { status: 'pending' } },
        { id: 'invoice-paid',       name: 'Paid Invoices',       description: 'Completed payments',         endpoint: '/billing/invoices', filter: { status: 'paid' } },
        { id: 'billing-statistics', name: 'Billing Statistics',  description: 'Revenue & payment analytics', endpoint: '/billing/statistics' },
      ],
    },
    {
      id: 'pharmacy', title: 'Pharmacy Reports', icon: Pill, color: 'from-rose-600 to-rose-700',
      reports: [
        { id: 'dispensing-records', name: 'Dispensing Records',   description: 'Patient medicine dispensing',  endpoint: '/dispensing' },
        { id: 'direct-dispensing',  name: 'Direct Dispensing',    description: 'Over-the-counter sales',       endpoint: '/direct-dispensing' },
        { id: 'medicines-inventory',name: 'Medicines Inventory',  description: 'Available medicines & stock',  endpoint: '/medicines' },
      ],
    },
    {
      id: 'theatre', title: 'Theatre Reports', icon: Activity, color: 'from-orange-600 to-orange-700',
      reports: [
        { id: 'procedures-list',      name: 'All Procedures',       description: 'Complete procedure listing',  endpoint: '/theatre-procedures' },
        { id: 'procedures-scheduled', name: 'Scheduled Procedures', description: 'Upcoming procedures',         endpoint: '/theatre-procedures', filter: { status: 'scheduled' } },
        { id: 'procedures-completed', name: 'Completed Procedures', description: 'Finished procedures',         endpoint: '/theatre-procedures', filter: { status: 'completed' } },
      ],
    },
  ];

  const isHMIS = selectedReport?.type === 'hmis';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Generate, view, and export clinical and administrative reports</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={Users}       label="Active Visits"      value={fmt(stats.activePatients)}   color="bg-blue-600"   badge="OPD" />
          <StatCard icon={DollarSign}  label="Total Collections"  value={fmtTZS(stats.totalRevenue)}  color="bg-emerald-600" badge="Revenue" />
          <StatCard icon={Bed}         label="Active Admissions"  value={fmt(stats.currentAdmissions)} color="bg-violet-600" badge="IPD" />
          <StatCard icon={AlertCircle} label="Overdue Invoices"   value={fmtTZS(stats.pendingAmount)}
            sub={`${fmt(stats.pendingInvoices)} invoices`}        color="bg-amber-500"  badge="Pending" />
        </div>

        {/* Filters Row */}
        <div className="bg-white rounded-xl border border-gray-200 px-5 py-4 mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Facility Name</label>
            <input
              type="text" value={facilityName}
              onChange={e => setFacilityName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter facility name"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input type="date" value={dateRange.start}
              onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input type="date" value={dateRange.end}
              onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {(dateRange.start || dateRange.end) && (
            <button onClick={() => setDateRange({ start: '', end: '' })}
              className="px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Report Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
          {reportCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <div key={cat.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className={`bg-gradient-to-r ${cat.color} px-4 py-3 flex items-center gap-3`}>
                  <div className="bg-white/20 rounded-lg p-1.5">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-sm font-semibold text-white">{cat.title}</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cat.reports.map(report => {
                    const isSelected = selectedReport?.id === report.id;
                    return (
                      <button key={report.id} onClick={() => handleGenerateReport(report)}
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors group ${isSelected ? 'bg-blue-50' : ''}`}>
                        <div>
                          <div className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-gray-800'} group-hover:text-blue-600`}>
                            {report.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{report.description}</div>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ml-2 ${isSelected ? 'text-blue-500' : 'text-gray-300'} group-hover:text-blue-400`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-10 flex items-center justify-center gap-3 mb-6">
            <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="text-gray-600 text-sm">Generating report…</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to generate report</p>
              <p className="text-sm text-red-600 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Results Panel */}
        {reportData && !loading && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-semibold text-gray-900">{selectedReport?.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {getRecordCount() > 0 ? `${fmt(getRecordCount())} records` : 'Summary view'}
                  {dateRange.start ? ` · ${dateRange.start} → ${dateRange.end || 'now'}` : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleExport('pdf')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => handleExport('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors">
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>
            </div>

            {/* Panel body */}
            <div className="p-5">
              {isHMIS
                ? <HMISSummary data={reportData} reportId={selectedReport.id} />
                : <ReportTable report={selectedReport} data={reportData} />
              }
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Reports;