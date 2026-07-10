import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FileText, Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { reportsAPI } from '../services/api';

const sampleData = [
  { crop: 'Wheat', yield: 120, revenue: 24000 },
  { crop: 'Rice', yield: 200, revenue: 40000 },
  { crop: 'Corn', yield: 150, revenue: 30000 }
];

export default function Reports() {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.getAll().then(r => r.data)
  });

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePDF = async () => {
    setPdfLoading(true);
    try {
      const res = await reportsAPI.pdf({ type: 'Analytics', data: sampleData });
      downloadBlob(res.data, 'report.pdf');
    } catch { } finally {
      setPdfLoading(false);
    }
  };

  const handleCSV = async () => {
    setCsvLoading(true);
    try {
      const res = await reportsAPI.csv({ data: sampleData });
      downloadBlob(res.data, 'report.csv');
    } catch { } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">Reports</h1>
        <p className="text-gray-500 mt-1">Generate and view reports</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button onClick={handlePDF} disabled={pdfLoading}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Generate PDF Report
        </button>
        <button onClick={handleCSV} disabled={csvLoading}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
          {csvLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          Generate CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-heading font-semibold text-lg mb-4">Previous Reports</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No reports generated yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => (
              <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{report.name || report.type || 'Report'}</p>
                    <p className="text-xs text-gray-400">{report.created_at ? new Date(report.created_at).toLocaleDateString() : ''}</p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
