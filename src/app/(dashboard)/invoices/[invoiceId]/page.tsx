
"use client";

import { use } from "react";
import { useDoc, useMemoFirebase, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { useTenant } from "@/hooks/use-tenant";
import { Loader2, ArrowLeft, Printer, Download, Mail, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function InvoiceDetailPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = use(params);
  const { companyId, company, isLoading: isTenantLoading } = useTenant();
  const db = useFirestore();

  const invoiceRef = useMemoFirebase(() => {
    if (!db || !companyId || !invoiceId) return null;
    return doc(db, 'companies', companyId, 'invoices', invoiceId);
  }, [db, companyId, invoiceId]);

  const { data: invoice, isLoading: isInvoiceLoading } = useDoc(invoiceRef);

  const clientRef = useMemoFirebase(() => {
    if (!db || !companyId || !invoice?.client_id) return null;
    return doc(db, 'companies', companyId, 'leads', invoice.client_id);
  }, [db, companyId, invoice?.client_id]);

  const { data: client } = useDoc(clientRef);

  if (isTenantLoading || isInvoiceLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Invoice not found</h2>
        <Link href="/invoices">
          <Button variant="link">Back to Ledger</Button>
        </Link>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between no-print">
        <Link href="/invoices">
          <Button variant="ghost" className="rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to List
          </Button>
        </Link>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" /> Print
          </Button>
          <Button className="rounded-xl gap-2">
            <Download className="h-4 w-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document Layout */}
      <div className="bg-white shadow-xl rounded-[2.5rem] p-12 md:p-16 border min-h-[1100px] flex flex-col print:shadow-none print:border-none print:rounded-none">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {company?.name?.substring(0, 2).toUpperCase() || 'DP'}
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tighter text-slate-800">{company?.name || 'DP Media OS'}</h1>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Media Production Hub</p>
              </div>
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground font-medium">
              <div className="flex gap-2">
                <span className="w-24 font-bold text-slate-400">Project :</span>
                <span className="text-slate-800 font-bold uppercase">{invoice.project_ref || invoice.project_name || 'GENERAL'}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 font-bold text-slate-400">Invoice No :</span>
                <span className="text-slate-800 font-bold">{invoice.invoice_number}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 font-bold text-slate-400">Invoice Date :</span>
                <span className="text-slate-800 font-bold">{new Date(invoice.issue_date).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 font-bold text-slate-400">Payable To :</span>
                <span className="text-slate-800 font-bold">{company?.name}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 font-bold text-slate-400">Due Date :</span>
                <span className="text-slate-800 font-bold">{new Date(invoice.due_date).toLocaleDateString('en-GB')}</span>
              </div>
            </div>
          </div>

          <div className="text-right space-y-4">
            <div>
              <h2 className="text-4xl font-black text-primary/20 uppercase tracking-tighter mb-1">Invoice</h2>
              <div className="text-xs space-y-1 font-bold">
                <p className="text-rose-500">{company?.name} PVT LTD</p>
                <p className="text-slate-400">CIN: {company?.cin || 'U60200KL2023PTC081308'}</p>
                <p className="text-slate-400">GSTIN: {company?.gstin || '32AAQCM8450P1ZQ'}</p>
              </div>
            </div>

            <div className="pt-8">
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Bill To</p>
              <div className="max-w-[250px] ml-auto space-y-1">
                <p className="font-bold text-slate-800 leading-tight">{client?.company_name || invoice.client_name}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {client?.billing_address || 'Billing address pending update in CRM.'}
                </p>
                {client?.gstin && <p className="text-xs font-bold text-slate-800 mt-2">{client.gstin}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="flex-1">
          <div className="rounded-2xl overflow-hidden border">
            <table className="w-full text-sm">
              <thead className="bg-rose-500 text-white font-bold uppercase text-[11px] tracking-widest">
                <tr>
                  <th className="p-4 text-center w-16">SL No</th>
                  <th className="p-4 text-left">Description</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-center w-24">Quantity</th>
                  <th className="p-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoice.line_items?.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-slate-800">{item.description}</td>
                    <td className="p-4 text-right font-bold text-slate-600">{(item.unit_price || 0).toLocaleString()}</td>
                    <td className="p-4 text-center font-bold text-slate-600">{item.quantity || 1}</td>
                    <td className="p-4 text-right font-black text-slate-800">₹{(item.total || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-8">
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                <span className="text-xs font-black uppercase text-slate-500">Total</span>
                <span className="font-black text-slate-800">₹{(invoice.subtotal || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center px-3">
                <span className="text-xs font-bold text-slate-400">GST @ 18%</span>
                <span className="font-bold text-slate-600">₹{(invoice.gst_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center bg-rose-500 text-white p-4 rounded-xl shadow-lg shadow-rose-500/20">
                <span className="text-sm font-black uppercase tracking-tighter">Grand Total Including GST</span>
                <span className="text-xl font-black">₹{(invoice.total || 0).toLocaleString()}</span>
              </div>
              
              {/* Stamp Placeholder */}
              <div className="pt-6 flex justify-center">
                <div className="h-24 w-24 rounded-full border-4 border-primary/20 border-dashed flex items-center justify-center relative opacity-40 grayscale">
                   <div className="text-[8px] font-black text-primary/40 text-center uppercase leading-none">
                     Digital<br/>Verified<br/>Stamp
                   </div>
                   <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/stamp/100/100')] bg-contain bg-no-repeat opacity-10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Details */}
        <div className="mt-12 pt-12 border-t border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="font-black text-sm uppercase text-slate-800">Account Details</h3>
              <div className="space-y-2 text-xs">
                <p className="font-black text-slate-800">{company?.bank_details?.bank_name || 'Axis Bank'}</p>
                <div className="grid grid-cols-2 max-w-[250px] gap-y-1 font-bold text-muted-foreground">
                  <span>Acc no</span>
                  <span className="text-slate-800">: {company?.bank_details?.account_no || '922020014850667'}</span>
                  <span>Phone</span>
                  <span className="text-slate-800">: {company?.contact_phone || '9947109143'}</span>
                  <span>NAME</span>
                  <span className="text-slate-800">: {company?.name} Private Limited.</span>
                  <span>IFSC</span>
                  <span className="text-slate-800">: {company?.bank_details?.ifsc || 'UTIB0003042'}</span>
                  <span>Branch</span>
                  <span className="text-slate-800">: {company?.bank_details?.branch || 'Sasthamangalam'}</span>
                  <span>PAN</span>
                  <span className="text-slate-800">: {company?.bank_details?.pan || 'AAQCM8450P'}</span>
                  <span>GST</span>
                  <span className="text-slate-800">: {company?.gstin || '32AAQCM8450P1ZQ'}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end items-end text-right space-y-6">
              <div className="space-y-1">
                <h4 className="font-black text-sm text-slate-800 uppercase">{company?.name} PRIVATE LIMITED</h4>
                <p className="text-[10px] text-slate-400 font-bold max-w-[300px]">
                  {company?.address || 'Dotspace Business Center TC 24/3088 Ushasandya Building, Kowdiar - Devasom Board Road, Kowdiar, Trivandrum, Pin : 695003'}
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Contact Us</p>
                <div className="text-[10px] font-bold text-slate-800">
                  <p>Email: {company?.contact_email || 'info@marzelz.com'}</p>
                  <p>Phone: {company?.contact_phone || '+91 871 400 5550'}</p>
                  <p className="text-primary">{company?.website || 'www.marzelz.com'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          main { padding: 0 !important; }
          .max-w-5xl { max-width: 100% !important; margin: 0 !important; }
          .bg-white { box-shadow: none !important; border: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}
