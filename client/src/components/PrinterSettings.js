import React, { useState, useEffect } from 'react';
import printService from '../services/PrintService';
import './PrinterSettings.css';

const PrinterSettings = ({ isOpen, onClose }) => {
  const [printerType, setPrinterType] = useState('standard');
  const [networkIP, setNetworkIP] = useState('');
  const [networkPort, setNetworkPort] = useState('9100');
  const [availablePrinters, setAvailablePrinters] = useState([]);
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      detectPrinters();
    }
  }, [isOpen]);

  const detectPrinters = async () => {
    setIsDetecting(true);
    try {
      const result = await printService.detectPrinters();
      setAvailablePrinters(result.devices);
      setPrinterType(result.type);
    } catch (error) {
      console.error('Printer detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSaveSettings = () => {
    const config = {};
    
    if (printerType === 'network') {
      config.ip = networkIP;
      config.port = parseInt(networkPort);
    }
    
    printService.setPrinterType(printerType, config);
    alert('Printer settings saved successfully!');
    onClose();
  };

  const handleTestPrint = async () => {
    const testData = {
      items: [
        { id: 1, name: 'Test Item', quantity: 1, price: 10.00 }
      ],
      subtotal: 10.00,
      discount: 0,
      total: 10.00,
      dining: 'Test',
      table: '1',
      timestamp: new Date().toISOString()
    };

    try {
      const result = await printService.printReceipt(testData);
      if (result.success) {
        alert('Test print successful!');
      } else {
        alert(`Test print failed: ${result.error}`);
      }
    } catch (error) {
      alert('Test print failed. Please check your printer settings.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="printer-settings-overlay">
      <div className="printer-settings-modal">
        <div className="printer-settings-header">
          <h2>Printer Settings</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="printer-settings-content">
          <div className="setting-group">
            <label>Printer Type:</label>
            <select 
              value={printerType} 
              onChange={(e) => setPrinterType(e.target.value)}
              className="setting-select"
            >
              <option value="standard">Standard Printer (Browser)</option>
              <option value="thermal">Thermal Printer (USB)</option>
              <option value="network">Network Printer</option>
            </select>
          </div>

          {printerType === 'network' && (
            <div className="network-settings">
              <div className="setting-group">
                <label>IP Address:</label>
                <input
                  type="text"
                  value={networkIP}
                  onChange={(e) => setNetworkIP(e.target.value)}
                  placeholder="192.168.1.100"
                  className="setting-input"
                />
              </div>
              <div className="setting-group">
                <label>Port:</label>
                <input
                  type="number"
                  value={networkPort}
                  onChange={(e) => setNetworkPort(e.target.value)}
                  placeholder="9100"
                  className="setting-input"
                />
              </div>
            </div>
          )}

          <div className="setting-group">
            <label>Available Printers:</label>
            <div className="printer-detection">
              <button 
                onClick={detectPrinters} 
                disabled={isDetecting}
                className="detect-btn"
              >
                {isDetecting ? 'Detecting...' : 'Detect Printers'}
              </button>
              <div className="printer-list">
                {availablePrinters.length > 0 ? (
                  availablePrinters.map((printer, index) => (
                    <div key={index} className="printer-item">
                      {typeof printer === 'string' ? printer : `Printer ${index + 1}`}
                    </div>
                  ))
                ) : (
                  <div className="no-printers">No printers detected</div>
                )}
              </div>
            </div>
          </div>

          <div className="printer-info">
            <h3>Printer Type Information:</h3>
            <div className="info-content">
              {printerType === 'standard' && (
                <p>Uses browser's built-in print dialog. Compatible with all printers connected to your computer.</p>
              )}
              {printerType === 'thermal' && (
                <p>Direct USB connection to thermal printers. Supports ESC/POS commands for receipt printing.</p>
              )}
              {printerType === 'network' && (
                <p>Connects to network printers via IP address. Requires printer to support raw TCP printing.</p>
              )}
            </div>
          </div>
        </div>

        <div className="printer-settings-actions">
          <button onClick={handleTestPrint} className="test-btn">
            Test Print
          </button>
          <button onClick={handleSaveSettings} className="save-btn">
            Save Settings
          </button>
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrinterSettings;