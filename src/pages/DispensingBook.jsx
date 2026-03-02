import { useState, useMemo, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../api";

export default function DispensingBook() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ search: "", from: "", to: "" });

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const res = await api.get('/dispensing');
        setRecords(res.data.data);
      } catch (error) {
        console.error("Failed to fetch dispensing records", error);
      }
    };
    fetchRecords();
  }, []);

  // Filtering
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const patientName = r.patient?.patientName || '';
      const patientId = r.patient?.patientId || '';
      
      const matchesSearch =
        filters.search.trim() === "" ||
        patientName.toLowerCase().includes(filters.search.toLowerCase()) ||
        patientId.toLowerCase().includes(filters.search.toLowerCase()) ||
        r.medicine.toLowerCase().includes(filters.search.toLowerCase());

      const recordDate = new Date(r.date);
      const fromDate = filters.from ? new Date(filters.from) : null;
      const toDate = filters.to ? new Date(filters.to) : null;

      const matchesDate =
        (!fromDate || recordDate >= fromDate) &&
        (!toDate || recordDate <= toDate);

      return matchesSearch && matchesDate;
    });
  }, [filters, records]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
  };

  // Export CSV
  const exportCSV = () => {
    const header = ["Date", "Patient Name", "Patient ID", "Medicine", "Quantity", "Issued By"];
    const rows = filteredRecords.map((r) => [
      new Date(r.date).toLocaleDateString(),
      r.patient?.patientName,
      r.patient?.patientId,
      r.medicine,
      r.quantity,
      r.issuedBy,
    ]);
    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dispensing_book.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Save PDF
  const savePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Dispensing Ledger", 14, 15);

    const tableColumn = ["Date", "Patient Name", "Patient ID", "Medicine", "Quantity", "Issued By"];
    const tableRows = filteredRecords.map((r) => [
      new Date(r.date).toLocaleDateString(),
      r.patient?.patientName,
      r.patient?.patientId,
      r.medicine,
      r.quantity,
      r.issuedBy,
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 25,
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("dispensing_book.pdf");
  };

  return (
    <div>
      {/* Filter */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Dispensing Book</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input
            type="text"
            name="search"
            value={filters.search}
            onChange={handleChange}
            placeholder="Search by patient name, ID, or medicine"
            className="w-full border rounded-lg p-2"
          />
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b text-gray-600">
              <th className="p-3">Date</th>
              <th className="p-3">Patient Name</th>
              <th className="p-3">Patient ID</th>
              <th className="p-3">Medicine</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Issued By</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((r) => (
              <tr key={r._id} className="border-b hover:bg-blue-50">
                <td className="p-3">{new Date(r.date).toLocaleDateString()}</td>
                <td className="p-3">{r.patient?.patientName}</td>
                <td className="p-3">{r.patient?.patientId}</td>
                <td className="p-3">{r.medicine}</td>
                <td className="p-3">{r.quantity}</td>
                <td className="p-3">{r.issuedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Buttons */}
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={exportCSV}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export CSV
          </button>
          <button
            onClick={savePDF}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Save PDF
          </button>
        </div>
      </div>
    </div>
  );
}