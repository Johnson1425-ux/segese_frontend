import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import api from '../utils/api';

const fetchPendingInjections = () => api.get('/visits/injections/pending');

const NurseInjectionsPage = () => {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState(null);
  const [activeVisitId, setActiveVisitId] = useState(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError } = useQuery(
    'pendingInjections',
    fetchPendingInjections,
    { refetchInterval: 30000 }
  );

  const visits = data?.data?.data || [];

  const administerMutation = useMutation(
    ({ visitId, prescriptionId, notes }) =>
      api.patch(`/visits/${visitId}/prescriptions/${prescriptionId}/administer`, { notes }),
    {
      onSuccess: () => {
        toast.success('Dose recorded successfully');
        queryClient.invalidateQueries('pendingInjections');
        setConfirmId(null);
        setActiveVisitId(null);
        setNotes('');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to record dose');
        setConfirmId(null);
        setActiveVisitId(null);
      }
    }
  );

  const handleConfirm = (visitId, prescriptionId) => {
    setActiveVisitId(visitId);
    setConfirmId(prescriptionId);
  };

  const handleAdminister = () => {
    administerMutation.mutate({ visitId: activeVisitId, prescriptionId: confirmId, notes });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading pending injections...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-red-500 p-4 text-xs sm:text-sm">
        Failed to load injections. Please refresh.
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-4">
        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-800">Injection Administration</h1>
        <span className="text-xs sm:text-sm text-gray-500">
          Auto-refreshes every 30s
        </span>
      </div>

      {visits.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-8 text-center text-gray-500 text-sm">
          No pending injections at the moment.
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {visits.map((visit) => (
            <div key={visit._id} className="bg-white shadow-md rounded-lg overflow-hidden">

              {/* Visit header */}
              <div className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-sm sm:text-base font-semibold text-gray-800">
                    {visit.patient?.firstName} {visit.patient?.lastName}
                  </span>
                  <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    #{visit.visitId}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs text-gray-500">
                  Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}
                </span>
              </div>

              {/* Injections table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Medication</th>
                      <th className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Dosage</th>
                      <th className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider">History</th>
                      <th className="relative px-3 sm:px-6 py-2 sm:py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visit.injections.map((p) => {
                      const remaining = p.remainingDoses ?? p.quantifiedQuantity;
                      const total = p.quantifiedQuantity;
                      const given = total - remaining;
                      const isConfirming = confirmId === p._id && activeVisitId === visit._id;

                      return (
                        <tr key={p._id} className="hover:bg-gray-50">
                          {/* Medication */}
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <div className="text-[11px] sm:text-sm font-medium text-gray-900">{p.medication}</div>
                            {p.notes && (
                              <div className="text-[9px] sm:text-xs text-gray-400 italic mt-0.5">{p.notes}</div>
                            )}
                            {/* Show dosage on mobile below name */}
                            <div className="sm:hidden text-[9px] text-gray-500 mt-0.5">{p.dosage} · {p.frequency}</div>
                          </td>

                          {/* Dosage */}
                          <td className="hidden sm:table-cell px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-600">
                            {p.dosage}
                          </td>

                          {/* Frequency */}
                          <td className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-4 text-[11px] sm:text-sm text-gray-600">
                            {p.frequency}
                            {p.duration && <span className="text-gray-400"> · {p.duration}</span>}
                          </td>

                          {/* Progress */}
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <div className="flex gap-0.5 sm:gap-1">
                                {Array.from({ length: total }).map((_, i) => (
                                  <div
                                    key={i}
                                    className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 ${
                                      i < given
                                        ? 'bg-green-500 border-green-500'
                                        : 'bg-white border-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[9px] sm:text-xs text-gray-500 whitespace-nowrap">
                                <span className="font-medium text-blue-600">{remaining}</span> left
                              </span>
                            </div>
                          </td>

                          {/* History */}
                          <td className="px-3 sm:px-6 py-2 sm:py-4">
                            {p.administrations?.length > 0 ? (
                              <details>
                                <summary className="text-[9px] sm:text-xs text-gray-400 cursor-pointer hover:text-gray-600 whitespace-nowrap">
                                  {p.administrations.length} dose{p.administrations.length > 1 ? 's' : ''} given
                                </summary>
                                <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-gray-100 min-w-[180px]">
                                  {p.administrations.map((a, i) => (
                                    <div key={i} className="text-[9px] sm:text-xs text-gray-500 flex gap-1 sm:gap-2">
                                      <span className="font-medium">#{i + 1}</span>
                                      <span>{new Date(a.administeredAt).toLocaleString()}</span>
                                      {a.notes && <span className="italic">— {a.notes}</span>}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            ) : (
                              <span className="text-[9px] sm:text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-3 sm:px-6 py-2 sm:py-4 text-right">
                            {!isConfirming ? (
                              <button
                                onClick={() => handleConfirm(visit._id, p._id)}
                                className="btn-primary text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                              >
                                Give Dose
                              </button>
                            ) : (
                              <div className="flex flex-col gap-1.5 items-end">
                                <input
                                  type="text"
                                  className="input-field text-xs w-36 sm:w-44"
                                  placeholder="Notes (optional)"
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                />
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={handleAdminister}
                                    disabled={administerMutation.isLoading}
                                    className="btn-primary text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1"
                                  >
                                    {administerMutation.isLoading
                                      ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                                      : 'Confirm'}
                                  </button>
                                  <button
                                    onClick={() => { setConfirmId(null); setNotes(''); }}
                                    className="btn-secondary text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseInjectionsPage;