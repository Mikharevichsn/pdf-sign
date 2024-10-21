import React, { useState, useEffect, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import 'pdfjs-dist/web/pdf_viewer.css';
import SignatureCanvas from 'react-signature-canvas';

// Set the worker using the CDN
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js`;

const PdfSigner = () => {
  const [pdf, setPdf] = useState(null);
  const [signPlaces, setSignPlaces] = useState([]);
  const [isSigning, setIsSigning] = useState(false);
  const [currentSignPlace, setCurrentSignPlace] = useState(null);
  const canvasRef = useRef(null);
  const signaturePadRef = useRef(null);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = () => {
      const pdfData = new Uint8Array(reader.result);
      pdfjs.getDocument(pdfData).promise.then((loadedPdf) => {
        setPdf(loadedPdf);
      });
    };
  };

  // Handle canvas click to set the signing position
  const onCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Set the current signing position
    setCurrentSignPlace({ x, y });
    setIsSigning(true);  // Open the modal for signature drawing
  };

  const saveSignature = () => {
    const signature = signaturePadRef.current.getTrimmedCanvas().toDataURL('image/png');
    setSignPlaces([...signPlaces, { ...currentSignPlace, signature }]);
    setIsSigning(false); // Close the modal
  };

  useEffect(() => {
    if (pdf && canvasRef.current) {
      pdf.getPage(1).then((page) => {
        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport,
        };
        page.render(renderContext).promise.then(() => {
          // Draw placeholders and signatures
          signPlaces.forEach(({ x, y, signature }) => {
            if (signature) {
              const img = new Image();
              img.src = signature;
              img.onload = () => {
                context.drawImage(img, x - 30, y - 30, 60, 30); // Signature 60x30px
              };
            } else {
              context.fillStyle = 'rgba(255, 0, 0, 0.5)';
              context.fillRect(x - 15, y - 15, 30, 30); // Placeholder 30x30px
            }
          });
        });
      });
    }
  }, [pdf, signPlaces]);

  return (
    <div>
      <input type="file" onChange={onFileChange} accept="application/pdf" />
      <canvas ref={canvasRef} style={{ border: '1px solid black' }} onClick={onCanvasClick}></canvas>

      {isSigning && (
        <div className="modal">
          <div className="modal-content">
            <h3>Draw your signature</h3>
            <SignatureCanvas ref={signaturePadRef} canvasProps={{ width: 500, height: 200, className: 'sigCanvas' }} />
            <button onClick={saveSignature} style={{ marginTop: '10px' }}>Save Signature</button>
            <button onClick={() => setIsSigning(false)} style={{ marginTop: '10px' }}>Close</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          width: 80%;
          max-width: 600px;
        }

        .sigCanvas {
          border: 1px solid black;
        }
      `}</style>
    </div>
  );
};

export default PdfSigner;