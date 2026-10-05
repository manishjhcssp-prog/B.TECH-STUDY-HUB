import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileCode, 
  AlertCircle,
  FileSpreadsheet,
  Layers,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export default function FilePreviewModal({ file, onClose }) {
  const [zoom, setZoom] = useState(1);
  const [textContent, setTextContent] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  if (!file) return null;

  const ext = (file.file_type || '').toLowerCase();
  const previewUrl = `/api/files/${file.id}/preview`;
  const downloadUrl = `/api/files/${file.id}/download`;

  const isPdf = ext === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext);
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext);
  const isAudio = ['mp3', 'wav', 'aac'].includes(ext);
  const isText = ['txt', 'md', 'csv', 'json', 'js', 'py', 'java', 'c', 'cpp', 'html', 'css'].includes(ext);

  useEffect(() => {
    if (isText) {
      setTextLoading(true);
      fetch(previewUrl)
        .then(res => res.text())
        .then(txt => {
          setTextContent(txt);
          setTextLoading(false);
        })
        .catch(err => {
          setTextContent(`Failed to load text: ${err.message}`);
          setTextLoading(false);
        });
    }
  }, [file.id, isText, previewUrl]);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content preview-modal" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div className={`file-type-icon ${ext}`} style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              {isPdf ? <FileText size={18} /> : isImage ? <ImageIcon size={18} /> : isVideo ? <Video size={18} /> : <Layers size={18} />}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {file.original_name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {file.file_type.toUpperCase()} • {formatBytes(file.file_size)} • Uploaded {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a 
              href={previewUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary btn-sm"
              title="Open in new browser tab"
            >
              <ExternalLink size={15} />
              <span className="hide-mobile">Open in Tab</span>
            </a>

            <a 
              href={downloadUrl} 
              download={file.original_name}
              className="btn btn-primary btn-sm"
              title="Download file"
            >
              <Download size={15} />
              <span>Download</span>
            </a>

            <button 
              type="button" 
              onClick={onClose} 
              className="action-icon-btn"
              aria-label="Close Preview"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer */}
        <div style={{ flex: 1, overflow: 'hidden', background: '#05070d', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {isPdf ? (
            <iframe
              src={previewUrl}
              title={file.original_name}
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : isImage ? (
            <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', gap: '8px', zIndex: 10, background: 'rgba(0,0,0,0.6)', padding: '6px', borderRadius: '8px' }}>
                <button type="button" className="action-icon-btn" onClick={() => setZoom(z => Math.min(z + 0.25, 3))} title="Zoom In">
                  <ZoomIn size={16} />
                </button>
                <button type="button" className="action-icon-btn" onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))} title="Zoom Out">
                  <ZoomOut size={16} />
                </button>
                <button type="button" className="action-icon-btn" onClick={() => setZoom(1)} title="Reset Zoom">
                  100%
                </button>
              </div>
              <img
                src={previewUrl}
                alt={file.original_name}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  transform: `scale(${zoom})`,
                  transition: 'transform 0.15s ease',
                  borderRadius: '8px'
                }}
              />
            </div>
          ) : isVideo ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              <video
                src={previewUrl}
                controls
                autoPlay
                style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px' }}
              />
            </div>
          ) : isAudio ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                <Music size={36} />
              </div>
              <p style={{ fontWeight: 600, marginBottom: '20px', fontSize: '1.1rem' }}>{file.original_name}</p>
              <audio src={previewUrl} controls style={{ width: '100%', maxWidth: '500px' }} />
            </div>
          ) : isText ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
              {textLoading ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>Loading text contents...</div>
              ) : (
                <pre style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                  color: '#e2e8f0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {textContent}
                </pre>
              )}
            </div>
          ) : (
            /* Fallback for unsupported formats (DOCX, PPTX, XLSX, ZIP, etc.) */
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              textAlign: 'center'
            }}>
              <div className={`file-type-icon ${ext}`} style={{ width: '88px', height: '88px', fontSize: '2.5rem', marginBottom: '20px' }}>
                {ext.toUpperCase()}
              </div>

              <h3 style={{ fontSize: '1.4rem', marginBottom: '10px' }}>
                {file.original_name}
              </h3>

              <p style={{ color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '24px', fontSize: '0.95rem' }}>
                In-browser preview is not directly supported for <strong>.{ext.toUpperCase()}</strong> files.
                You can download the original file to view it in Microsoft Office or your preferred application.
              </p>

              <div style={{ display: 'flex', gap: '16px' }}>
                <a 
                  href={downloadUrl} 
                  download={file.original_name}
                  className="btn btn-primary btn-lg"
                >
                  <Download size={18} />
                  Download File ({formatBytes(file.file_size)})
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
