import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  FileCheck,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Eye,
  FileCode,
  File,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DocumentManager({
  eventId,
  documents = [],
  onDocumentUploaded,
  canUpload = false,
  canReview = false,
}) {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('proposal');
  const [version, setVersion] = useState('v1.0');
  const [remarks, setRemarks] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Handle genuine file upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('document_type', documentType);
    formData.append('version', version);
    formData.append('remarks', remarks);

    try {
      const res = await fetch(`/api/documents/upload/${eventId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setUploadSuccess(`"${selectedFile.name}" uploaded successfully!`);
        setSelectedFile(null);
        setRemarks('');
        // Reset file input
        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) fileInput.value = '';
        if (onDocumentUploaded) onDocumentUploaded(data.document);
      } else {
        setUploadError(data.message || 'Upload failed');
      }
    } catch (err) {
      setUploadError('Network error uploading document: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger Word export download
  const handleDownloadWord = () => {
    window.open(`/api/proposals/${eventId}/export-word?token=${token}`, '_blank');
  };

  // Trigger PDF export download
  const handleDownloadPdf = () => {
    window.open(`/api/proposals/${eventId}/export-pdf?token=${token}`, '_blank');
  };

  // Format file size
  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            Document Management & Version Tracking
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Attach proposals, budget sheets, venue permits, and export official Word / PDF dossiers
          </p>
        </div>

        {/* Word & PDF Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadWord}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300 rounded-lg text-xs font-semibold shadow-sm transition"
            title="Download formatted Microsoft Word .docx Proposal Dossier"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            Export Word (.docx)
          </button>

          <button
            onClick={handleDownloadPdf}
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-300 rounded-lg text-xs font-semibold shadow-sm transition"
            title="Download official PDF Dossier"
          >
            <Download className="w-4 h-4 text-rose-600" />
            Export PDF (.pdf)
          </button>
        </div>
      </div>

      {/* Upload Zone (If authorized) */}
      {canUpload && (
        <form onSubmit={handleUploadSubmit} className="mb-6 p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-brand-800" />
            Upload New Document or Revised Version
          </h4>

          {uploadError && (
            <div className="mb-3 p-2.5 bg-rose-50 text-rose-800 text-xs rounded border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {uploadError}
            </div>
          )}

          {uploadSuccess && (
            <div className="mb-3 p-2.5 bg-emerald-50 text-emerald-800 text-xs rounded border border-emerald-200 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              {uploadSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Select File (PDF, DOCX, XLSX, Images)
              </label>
              <input
                id="file-upload-input"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-800 file:text-white hover:file:bg-brand-900 cursor-pointer"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Document Classification
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800"
              >
                <option value="proposal">Proposal Dossier / Brief</option>
                <option value="budget">Detailed Budget Sheet</option>
                <option value="venue_permit">Venue / Facility Permit</option>
                <option value="schedule">Event Schedule / Agenda</option>
                <option value="safety_plan">Safety & Crowd Protocol</option>
                <option value="other">Other Supporting Material</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Version Tag (e.g. v1.0, v1.1)
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes or revision notes (e.g. Added security contact & vendor quotes)"
              className="flex-1 text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-slate-800"
            />
            <button
              type="submit"
              disabled={isUploading}
              className="px-4 py-1.5 bg-brand-800 hover:bg-brand-900 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition shadow-sm"
            >
              {isUploading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  Attach Document
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Existing Documents List */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
          Attached Supporting Documents ({documents.length})
        </h4>

        {documents.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
            {documents.map((doc) => (
              <div
                key={doc.document_id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-brand-800 flex items-center justify-center shrink-0 mt-0.5">
                    {doc.document_type === 'budget' ? (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <FileText className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-slate-900">{doc.original_name}</p>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] rounded font-semibold">
                        {doc.version || 'v1.0'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          doc.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : doc.status === 'changes_requested'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {doc.status?.replace('_', ' ') || 'Submitted'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                      <span>Type: {doc.document_type?.toUpperCase()}</span>
                      <span>•</span>
                      <span>{formatBytes(doc.file_size)}</span>
                      <span>•</span>
                      <span>Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}</span>
                      {doc.uploader?.name && (
                        <>
                          <span>•</span>
                          <span>by {doc.uploader.name}</span>
                        </>
                      )}
                    </div>

                    {doc.remarks && (
                      <p className="text-[11px] text-slate-600 italic mt-1 bg-slate-100/70 p-1.5 rounded">
                        Note: "{doc.remarks}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Document Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <a
                    href={`/api/documents/download/${doc.document_id}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Download File
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-lg border border-slate-200 text-slate-400 text-xs">
            No supporting documents have been attached to this event proposal yet.
          </div>
        )}
      </div>
    </div>
  );
}
