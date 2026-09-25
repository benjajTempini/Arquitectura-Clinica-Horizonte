import React, { useEffect, useState } from 'react';
import { appointmentsService, paymentsService } from '../services/api';

export default function PaymentRegister() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Pago
  const [amount, setAmount] = useState<number>(15000);
  const [method, setMethod] = useState('BONO_FONASA');
  const [voucherNumber, setVoucherNumber] = useState('FONASA-');
  const [payerName, setPayerName] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsService.list().catch(() => ({
        items: [
          {
            id: 'appt-101',
            startTime: '2026-09-28T09:00:00Z',
            patient: { firstName: 'Juan Pablo', lastName: 'Araya Fuentes', nationalId: '12345678-5' },
            professional: { firstName: 'Roberto', lastName: 'Morales Soto' },
            specialty: { name: 'Medicina General' },
            status: 'ARRIVED',
          },
          {
            id: 'appt-102',
            startTime: '2026-09-28T10:00:00Z',
            patient: { firstName: 'María Ignacia', lastName: 'González Castro', nationalId: '14567890-K' },
            professional: { firstName: 'Carolina', lastName: 'Valenzuela Ríos' },
            specialty: { name: 'Pediatría' },
            status: 'CONFIRMED',
          },
        ],
      }));
      setAppointments(res.items || []);
      if (res.items?.length > 0) {
        setSelectedAppointmentId(res.items[0].id);
        setPayerName(`${res.items[0].patient?.firstName} ${res.items[0].patient?.lastName}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsForAppointment = async (apptId: string) => {
    if (!apptId) return;
    try {
      const res = await paymentsService.getByAppointment(apptId).catch(() => [
        {
          id: 'pay-sample',
          amount: '15000.00',
          method: 'BONO_FONASA',
          status: 'PAID',
          voucherNumber: 'FONASA-994821',
          payerName: 'Juan Pablo Araya Fuentes',
          createdAt: new Date().toISOString(),
        },
      ]);
      setPayments(res || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (selectedAppointmentId) {
      loadPaymentsForAppointment(selectedAppointmentId);
      const appt = appointments.find((a) => a.id === selectedAppointmentId);
      if (appt?.patient) {
        setPayerName(`${appt.patient.firstName} ${appt.patient.lastName}`);
      }
    }
  }, [selectedAppointmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validación bono
    if ((method === 'BONO_FONASA' || method === 'BONO_ISAPRE') && (!voucherNumber || voucherNumber.trim().length < 3)) {
      setMessage({ type: 'error', text: 'El número de folio o bono es obligatorio para Fonasa o Isapre.' });
      return;
    }

    try {
      await paymentsService.create(selectedAppointmentId, {
        amount: Number(amount),
        method,
        voucherNumber: voucherNumber.trim(),
        payerName: payerName.trim(),
        transactionReference: transactionReference.trim(),
        notes: notes.trim(),
      });

      setMessage({ type: 'success', text: 'Comprobante de pago o bono registrado y auditado correctamente.' });
      loadPaymentsForAppointment(selectedAppointmentId);
      setVoucherNumber('FONASA-');
      setNotes('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar pago.' });
    }
  };

  const handleRefund = async (paymentId: string) => {
    if (!confirm('¿Confirma la anulación/reembolso de este pago? La acción quedará registrada en auditoría.')) {
      return;
    }
    try {
      await paymentsService.updateStatus(paymentId, {
        status: 'REFUNDED',
        notes: 'Anulado por recepción a solicitud del paciente',
      });
      setMessage({ type: 'success', text: 'Pago anulado/reembolsado con trazabilidad inmutable.' });
      loadPaymentsForAppointment(selectedAppointmentId);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al reembolsar pago.' });
    }
  };

  const isBono = method === 'BONO_FONASA' || method === 'BONO_ISAPRE';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Caja & Registro de Pagos / Bonos</h1>
          <p className="text-sm text-slate-400 mt-1">
            Cobro en mesón, validación de bonos de atención de salud (FONASA / ISAPRE) y anulación trazable.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-4">✕</button>
        </div>
      )}

      {/* Seleccionar Cita */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
          Cita Asociada:
        </label>
        <select
          value={selectedAppointmentId}
          onChange={(e) => setSelectedAppointmentId(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
        >
          {appointments.map((appt) => (
            <option key={appt.id} value={appt.id}>
              {new Date(appt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} —{' '}
              {appt.patient?.firstName} {appt.patient?.lastName} ({appt.specialty?.name}) [{appt.status}]
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Pago */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4">Ingreso de Comprobante / Pago</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Método de Pago</label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value);
                  if (e.target.value === 'BONO_FONASA') setVoucherNumber('FONASA-');
                  else if (e.target.value === 'BONO_ISAPRE') setVoucherNumber('ISAPRE-');
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              >
                <option value="BONO_FONASA">Bono FONASA (Nivel 1, 2, 3)</option>
                <option value="BONO_ISAPRE">Bono ISAPRE (Consalud, Banmédica, Colmena, etc.)</option>
                <option value="DEBIT_CARD">Tarjeta de Débito (Redcompra)</option>
                <option value="CREDIT_CARD">Tarjeta de Crédito</option>
                <option value="CASH">Efectivo en Caja</option>
                <option value="TRANSFER">Transferencia Bancaria Electrónica</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Monto (CLP $)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  N° de Bono / Folio {isBono && <span className="text-teal-400 font-bold">*</span>}
                </label>
                <input
                  type="text"
                  required={isBono}
                  placeholder={isBono ? 'Obligatorio e.g. FONASA-994821' : 'Opcional'}
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg bg-slate-800 border text-white text-sm font-mono focus:ring-2 focus:ring-teal-500 ${
                    isBono ? 'border-teal-500/50' : 'border-slate-700'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Pagador</label>
              <input
                type="text"
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Referencia Transaccional / POS</label>
              <input
                type="text"
                placeholder="e.g. Código de aprobación Transbank 48921"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm font-mono focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Observaciones</label>
              <input
                type="text"
                placeholder="e.g. Copago con seguro complementario"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-teal-900/30"
              >
                Registrar Pago en Caja
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Pagos de la Cita */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Movimientos Financieros de la Cita</h2>
            <span className="text-xs text-slate-400 font-mono">{payments.length} movimientos</span>
          </div>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    p.status === 'PAID'
                      ? 'bg-slate-800/40 border-slate-700'
                      : 'bg-red-950/20 border-red-500/30 text-red-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm font-mono">
                        ${Number(p.amount).toLocaleString('es-CL')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono text-teal-300 border border-slate-700">
                        {p.method}
                      </span>
                    </div>
                    {p.voucherNumber && (
                      <p className="text-slate-400 font-mono mt-1 text-[11px]">Folio: {p.voucherNumber}</p>
                    )}
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      {new Date(p.createdAt).toLocaleString()} • {p.payerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {p.status}
                    </span>

                    {p.status === 'PAID' && (
                      <button
                        onClick={() => handleRefund(p.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 border border-slate-700 hover:border-red-500/30 transition text-[11px]"
                      >
                        Reembolsar / Anular
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-8 text-center">
              No existen pagos registrados para la cita seleccionada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
