/**
 * PrintService - Comprehensive printing solution for POS system
 * Supports thermal printers (ESC/POS), network printers, and standard printers
 */

class PrintService {
  constructor() {
    this.printerType = 'standard'; // 'thermal', 'network', 'standard'
    this.printerSettings = {
      thermal: {
        width: 48, // characters per line for thermal printer
        fontSize: 'small',
        encoding: 'utf-8'
      },
      network: {
        ip: null,
        port: 9100,
        timeout: 5000
      },
      standard: {
        paperSize: 'A4',
        orientation: 'portrait'
      }
    };
  }

  /**
   * Detect available printers
   */
  async detectPrinters() {
    try {
      // Check for USB thermal printers
      if ('usb' in navigator) {
        const devices = await navigator.usb.getDevices();
        const thermalPrinters = devices.filter(device => 
          this.isThermalPrinter(device.vendorId, device.productId)
        );
        
        if (thermalPrinters.length > 0) {
          return { type: 'thermal', devices: thermalPrinters };
        }
      }

      // Check for network printers (requires backend support)
      const networkPrinters = await this.scanNetworkPrinters();
      if (networkPrinters.length > 0) {
        return { type: 'network', devices: networkPrinters };
      }

      // Fallback to standard browser printing
      return { type: 'standard', devices: ['Browser Print'] };
    } catch (error) {
      console.warn('Printer detection failed:', error);
      return { type: 'standard', devices: ['Browser Print'] };
    }
  }

  /**
   * Check if device is a thermal printer based on vendor/product ID
   */
  isThermalPrinter(vendorId, productId) {
    const thermalPrinterIds = [
      { vendor: 0x04b8, product: 0x0202 }, // Epson
      { vendor: 0x154f, product: 0x154f }, // Generic thermal
      { vendor: 0x0416, product: 0x5011 }, // Star Micronics
      { vendor: 0x067b, product: 0x2305 }  // Prolific
    ];

    return thermalPrinterIds.some(printer => 
      printer.vendor === vendorId && printer.product === productId
    );
  }

  /**
   * Scan for network printers (mock implementation)
   */
  async scanNetworkPrinters() {
    // In a real implementation, this would scan the network
    // For now, return empty array
    return [];
  }

  /**
   * Set printer type and configuration
   */
  setPrinterType(type, config = {}) {
    this.printerType = type;
    if (config) {
      this.printerSettings[type] = { ...this.printerSettings[type], ...config };
    }
  }

  /**
   * Generate ESC/POS commands for thermal printers
   */
  generateESCPOS(content) {
    const ESC = '\x1B';
    const GS = '\x1D';
    
    let commands = '';
    
    // Initialize printer
    commands += ESC + '@'; // Initialize
    commands += ESC + 'a' + '\x01'; // Center align
    
    // Header
    commands += ESC + '!' + '\x18'; // Double height and width
    commands += 'RESTROBIT POS\n';
    commands += ESC + '!' + '\x00'; // Normal size
    commands += '================================\n';
    
    // Content
    commands += ESC + 'a' + '\x00'; // Left align
    commands += content;
    
    // Footer
    commands += '\n================================\n';
    commands += ESC + 'a' + '\x01'; // Center align
    commands += 'Thank you for your business!\n';
    commands += '\n\n\n';
    
    // Cut paper
    commands += GS + 'V' + '\x42' + '\x00';
    
    return commands;
  }

  /**
   * Format receipt content for different printer types
   */
  formatReceipt(orderData) {
    const { items, subtotal, discount, total, dining, table, timestamp } = orderData;
    
    if (this.printerType === 'thermal') {
      return this.formatThermalReceipt(orderData);
    } else {
      return this.formatStandardReceipt(orderData);
    }
  }

  /**
   * Format receipt for thermal printers (48 characters wide)
   */
  formatThermalReceipt(orderData) {
    const { items, subtotal, discount, total, dining, table } = orderData;
    const width = this.printerSettings.thermal.width;
    
    let receipt = '';
    
    // Header
    receipt += this.centerText('RESTROBIT POS', width) + '\n';
    receipt += '='.repeat(width) + '\n';
    receipt += `Date: ${new Date().toLocaleString()}\n`;
    receipt += `Dining: ${dining || 'N/A'}\n`;
    receipt += `Table: ${table || 'N/A'}\n`;
    receipt += '-'.repeat(width) + '\n';
    
    // Items
    receipt += 'ITEMS:\n';
    items.forEach(item => {
      const itemLine = `${item.quantity}x ${item.name}`;
      const price = `$${(item.price * item.quantity).toFixed(2)}`;
      const spaces = width - itemLine.length - price.length;
      receipt += itemLine + ' '.repeat(Math.max(1, spaces)) + price + '\n';
    });
    
    receipt += '-'.repeat(width) + '\n';
    
    // Totals
    receipt += this.formatLine('Subtotal:', `$${subtotal.toFixed(2)}`, width) + '\n';
    if (discount > 0) {
      receipt += this.formatLine('Discount:', `-$${discount.toFixed(2)}`, width) + '\n';
    }
    receipt += '='.repeat(width) + '\n';
    receipt += this.formatLine('TOTAL:', `$${total.toFixed(2)}`, width) + '\n';
    receipt += '='.repeat(width) + '\n';
    
    return receipt;
  }

  /**
   * Format receipt for standard printers (HTML)
   */
  formatStandardReceipt(orderData) {
    const { items, subtotal, discount, total, dining, table } = orderData;
    
    return `
      <div style="font-family: 'Courier New', monospace; width: 300px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 10px;">
          RESTROBIT POS
        </div>
        <div style="border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 10px 0; margin-bottom: 10px;">
          <div>Date: ${new Date().toLocaleString()}</div>
          <div>Dining: ${dining || 'N/A'}</div>
          <div>Table: ${table || 'N/A'}</div>
        </div>
        
        <div style="margin-bottom: 10px;">
          <div style="font-weight: bold; margin-bottom: 5px;">ITEMS:</div>
          ${items.map(item => `
            <div style="display: flex; justify-content: space-between;">
              <span>${item.quantity}x ${item.name}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 1px solid #000; padding-top: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          ${discount > 0 ? `
            <div style="display: flex; justify-content: space-between;">
              <span>Discount:</span>
              <span>-$${discount.toFixed(2)}</span>
            </div>
          ` : ''}
          <div style="border-top: 2px solid #000; margin-top: 5px; padding-top: 5px; font-weight: bold; display: flex; justify-content: space-between;">
            <span>TOTAL:</span>
            <span>$${total.toFixed(2)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; font-size: 12px;">
          Thank you for your business!
        </div>
      </div>
    `;
  }

  /**
   * Helper function to center text
   */
  centerText(text, width) {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Helper function to format line with left and right alignment
   */
  formatLine(left, right, width) {
    const spaces = width - left.length - right.length;
    return left + ' '.repeat(Math.max(1, spaces)) + right;
  }

  /**
   * Print to thermal printer via USB
   */
  async printToThermal(content) {
    try {
      if (!('usb' in navigator)) {
        throw new Error('WebUSB not supported');
      }

      // Request USB device
      const device = await navigator.usb.requestDevice({
        filters: [
          { vendorId: 0x04b8 }, // Epson
          { vendorId: 0x154f }, // Generic
          { vendorId: 0x0416 }, // Star Micronics
          { vendorId: 0x067b }  // Prolific
        ]
      });

      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);

      // Convert content to ESC/POS commands
      const escposData = this.generateESCPOS(content);
      const encoder = new TextEncoder();
      const data = encoder.encode(escposData);

      // Send data to printer
      await device.transferOut(1, data);
      
      await device.close();
      return { success: true, message: 'Printed successfully to thermal printer' };
    } catch (error) {
      console.error('Thermal printing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print to network printer
   */
  async printToNetwork(content) {
    try {
      const { ip, port } = this.printerSettings.network;
      
      if (!ip) {
        throw new Error('Network printer IP not configured');
      }

      // This would require a backend service to handle network printing
      const response = await fetch('/api/print/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ip,
          port,
          content: this.generateESCPOS(content)
        })
      });

      if (!response.ok) {
        throw new Error('Network printing failed');
      }

      return { success: true, message: 'Printed successfully to network printer' };
    } catch (error) {
      console.error('Network printing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print using standard browser printing
   */
  async printToStandard(content) {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Receipt</title>
          <style>
            body { margin: 0; padding: 0; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      return { success: true, message: 'Print dialog opened' };
    } catch (error) {
      console.error('Standard printing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Main print function - routes to appropriate printer type
   */
  async print(orderData) {
    try {
      const content = this.formatReceipt(orderData);
      
      switch (this.printerType) {
        case 'thermal':
          return await this.printToThermal(content);
        case 'network':
          return await this.printToNetwork(content);
        case 'standard':
        default:
          return await this.printToStandard(content);
      }
    } catch (error) {
      console.error('Printing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Print receipt (for "Print Receipt" button)
   */
  async printReceipt(orderData) {
    return await this.print(orderData);
  }

  /**
   * Print bill (for "Bill & Print" button) - same as receipt but could have different formatting
   */
  async printBill(orderData) {
    // For now, same as receipt. Could be customized for different bill format
    return await this.print(orderData);
  }
}

// Create singleton instance
const printService = new PrintService();

export default printService;