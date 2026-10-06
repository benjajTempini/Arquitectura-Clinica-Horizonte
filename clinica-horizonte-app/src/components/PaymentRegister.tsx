import React, { useEffect, useState } from 'react';
import { appointmentsService, paymentsService } from '../services/api';

export default function PaymentRegister() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario Pago
  const [amount, setAmount] = useState<number | string>('');
  const [method, setMethod] = useState('BONO_FONASA');
  const [voucherNumber, setVoucherNumber] = useState('');
  const [payerName, setPayerName] = useState('');
  const [transactionReference, setTransactionReference] = useState('');
  const [notes, setNotes] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentsService.list();
      setAppointments(res.items || []);
      if (res.items?.length > 0) {
        setSelectedAppointmentId(res.items[0].id);
        setPayerName(`${res.items[0].patient?.firstName} ${res.items[0].patient?.lastName}`);
      } else {
        setSelectedAppointmentId('');
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || 'Error al cargar listado de citas.',
      });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsForAppointment = async (apptId: string) => {
    if (!apptId) return;
    try {
      const res = await paymentsService.getByAppointment(apptId);
      setPayments(res || []);
    } catch (err) {
      setPayments([]);
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

    if (!selectedAppointmentId) {
      setMessage({ type: 'error', text: 'Debe seleccionar una cita médica para registrar el pago o bono.' });
      return;
    }

    // Validación bono
    if ((method === 'BONO_FONASA' || method === 'BONO_ISAPRE') && (!voucherNumber || voucherNumber.trim().length < 3)) {
      setMessage({ type: 'error', text: 'El número de folio o bono es obligatorio para Fonasa o Isapre.' });
      return;
    }

    const numAmount = Number(amount);
    if (amount === '' || isNaN(numAmount) || numAmount < 0) {
      setMessage({ type: 'error', text: 'El monto ingresado debe ser un número válido mayor o igual a cero.' });
      return;
    }

    setIsProcessing(true);
    try {
      await paymentsService.create(selectedAppointmentId, {
        amount: numAmount,
        method,
        voucherNumber: voucherNumber.trim(),
        payerName: payerName.trim(),
        transactionReference: transactionReference.trim(),
        notes: notes.trim(),
      });

      setMessage({ type: 'success', text: 'Comprobante de pago o bono registrado y auditado correctamente.' });
      loadPaymentsForAppointment(selectedAppointmentId);
      setVoucherNumber('');
      setAmount('');
      setNotes('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Error al procesar pago.' });
    } finally {
      setIsProcessing(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Caja & Registro de Pagos / Bonos</h1>
          <p className="text-sm text-slate-500 mt-1">
            Cobro en mesón, validación de bonos de atención de salud (FONASA / ISAPRE) y anulación trazable.
          </p>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold ml-4 hover:opacity-75">✕</button>
        </div>
      )}

      {/* Seleccionar Cita */}
      <div className="p-4 rounded-2xl bg-white border border-sky-100 flex flex-col sm:flex-row items-center gap-4 shadow-xs">
        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider shrink-0 font-mono">
          Cita Asociada:
        </label>
        <select
          value={selectedAppointmentId}
          onChange={(e) => setSelectedAppointmentId(e.target.value)}
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Ingreso de Comprobante / Pago</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Método de Pago</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Monto (CLP $)</label>
                <input
                  type="number"
                  required
                  min="0"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  N° de Bono / Folio {isBono && <span className="text-blue-600 font-bold">*</span>}
                </label>
                <input
                  type="text"
                  required={isBono}
                  placeholder={isBono ? 'Obligatorio e.g. FONASA-994821' : 'Opcional'}
                  value={voucherNumber}
                  onChange={(e) => setVoucherNumber(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition ${
                    isBono ? 'border-sky-300' : 'border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Pagador</label>
              <input
                type="text"
                required
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Referencia Transaccional / POS</label>
              <input
                type="text"
                placeholder="e.g. Código de aprobación Transbank 48921"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Observaciones</label>
              <input
                type="text"
                placeholder="e.g. Copago con seguro complementario"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isProcessing}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold text-sm transition shadow-md shadow-blue-600/20 flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                    <span>Procesando en Caja...</span>
                  </>
                ) : (
                  'Registrar Pago en Caja'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Historial de Pagos de la Cita */}
        <div className="p-6 rounded-2xl bg-white border border-sky-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Movimientos Financieros de la Cita</h2>
            <span className="text-xs text-slate-500 font-mono">{payments.length} movimientos</span>
          </div>

          {payments.length > 0 ? (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    p.status === 'PAID'
                      ? 'bg-slate-50/70 border-slate-200'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-mono">
                        ${Number(p.amount).toLocaleString('es-CL')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-[11px] font-mono text-sky-800 border border-sky-200 font-medium">
                        {p.method}
                      </span>
                    </div>
                    {p.voucherNumber && (
                      <p className="text-slate-500 font-mono mt-1 text-[11px]">Folio: {p.voucherNumber}</p>
                    )}
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {new Date(p.createdAt).toLocaleString()} • {p.payerName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.status === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {p.status}
                    </span>

                    {p.status === 'PAID' && (
                      <button
                        onClick={() => handleRefund(p.id)}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 hover:border-red-200 transition text-[11px]"
                      >
                        Reembolsar / Anular
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-8 text-center">
              No existen pagos registrados para la cita seleccionada.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
