import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoice.service';
import { Invoice } from '../../types/api';
import { getErrorMessage } from '../../services/api';
import { FileText, Download, AlertCircle, Loader2, ExternalLink } from 'lucide-react';

const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const data = await invoiceService.getMyInvoices();
      setInvoices(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Impossible de charger les factures'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    if (invoice.pdfUrl) {
      window.open(invoice.pdfUrl, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-400 bg-green-400/10';
      case 'ISSUED': return 'text-blue-400 bg-blue-400/10';
      case 'DRAFT': return 'text-slate-400 bg-slate-400/10';
      case 'VOID': return 'text-rose-400 bg-rose-400/10';
      case 'CANCELLED': return 'text-rose-400 bg-rose-400/10';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'ISSUED': return 'Émise';
      case 'DRAFT': return 'Brouillon';
      case 'VOID': return 'Annulée';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-400">Chargement des factures...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Factures</h1>
          <p className="text-slate-400">Historique de vos factures et paiements</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400" />
            <p className="text-sm text-rose-400">{error}</p>
          </div>
        )}

        {/* Invoices List */}
        {invoices.length > 0 ? (
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">N° Facture</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-slate-400">Statut</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-slate-400">Montant</th>
                    <th className="px-6 py-4 text-center text-sm font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <span className="text-white font-medium">{invoice.invoiceNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(invoice.issueDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-white font-semibold">
                        {typeof invoice.totalAmount === 'number' 
                          ? invoice.totalAmount.toLocaleString('fr-FR')
                          : invoice.totalAmount
                        } {invoice.currency}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.pdfUrl ? (
                          <button
                            onClick={() => handleDownload(invoice)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            PDF
                          </button>
                        ) : (
                          <span className="text-slate-500 text-sm">Non disponible</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center">
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Aucune facture</h3>
            <p className="text-slate-400">Vous n'avez pas encore de factures</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoicesPage;
