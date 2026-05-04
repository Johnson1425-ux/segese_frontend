import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-hot-toast';
import api from '../../utils/api';

const fetchPendingInjections = () => api.get('/visits/injections/pending');

const NurseInjectionsPage = () => {
  const queryClient = useQueryClient();
  const [confirmId, setConfirmId] = useState(null); // prescriptionId being confirmed
  const [activeVisitId, setActiveVisitId] = useState(null);
  const [notes, setNotes] = useState('');

  const { data, isLoading, isError } = useQuery(
    'pendingInjections',
    fetchPendingInjections,
    { refetchInterval: 30000 } // auto-refresh every 30s
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
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading pending injections...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        Failed to load injections. Please refresh.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Injection Administration</h1>
        <p className="text-sm text-gray-500 mt-1">
          Active OPD patients with pending injections · Auto-refreshes every 30s
        </p>
      </div>

      {visits.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No pending injections at the moment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {visits.map((visit) => (
            <div key={visit._id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
              {/* Visit header */}
              <div className="px-5 py-3 bg-gray-50 border-b flex items-center justify-between">
                <div>
                  <span className="font-semibold text-gray-800">
                    {visit.patient?.firstName} {visit.patient?.lastName}
                  </span>
                  <span className="ml-3 text-xs text-gray-500">
                    Visit #{visit.visitId}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Dr. {visit.doctor?.firstName} {visit.doctor?.lastName}
                </div>
              </div>

              {/* Injections list */}
              <div className="divide-y">
                {visit.injections.map((p) => {
                  const remaining = p.remainingDoses ?? p.quantifiedQuantity;
                  const total = p.quantifiedQuantity;
                  const given = total - remaining;
                  const isConfirming = confirmId === p._id && activeVisitId === visit._id;

                  return (
                    <div key={p._id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{p.medication}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {p.dosage} · {p.frequency}
                            {p.duration ? ` · ${p.duration}` : ''}
                          </p>
                          {p.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">{p.notes}</p>
                          )}

                          {/* Dose progress dots */}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex gap-1">
                              {Array.from({ length: total }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    i < given
                                      ? 'bg-green-500 border-green-500'
                                      : 'bg-white border-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {given}/{total} given ·{' '}
                              <span className="font-medium text-blue-600">
                                {remaining} remaining
                              </span>
                            </span>
                          </div>

                          {/* Administration history */}
                          {p.administrations?.length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                                View history ({p.administrations.length} dose{p.administrations.length > 1 ? 's' : ''} given)
                              </summary>
                              <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-gray-100">
                                {p.administrations.map((a, i) => (
                                  <div key={i} className="text-xs text-gray-500 flex gap-2">
                                    <span className="font-medium">#{i + 1}</span>
                                    <span>{new Date(a.administeredAt).toLocaleString()}</span>
                                    {a.notes && <span className="italic">— {a.notes}</span>}
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>

                        {/* Action */}
                        <div className="shrink-0">
                          {!isConfirming ? (
                            <button
                              onClick={() => handleConfirm(visit._id, p._id)}
                              className="btn-primary text-sm"
                            >
                              Give Dose
                            </button>
                          ) : (
                            <div className="flex flex-col gap-2 w-44">
                              <input
                                type="text"
                                className="input-field text-sm"
                                placeholder="Notes (optional)"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={handleAdminister}
                                  disabled={administerMutation.isLoading}
                                  className="btn-primary text-sm flex-1"
                                >
                                  {administerMutation.isLoading ? 'Saving...' : 'Confirm'}
                                </button>
                                <button
                                  onClick={() => { setConfirmId(null); setNotes(''); }}
                                  className="btn-secondary text-sm flex-1"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NurseInjectionsPage;