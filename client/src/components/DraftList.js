import React, { useState, useEffect } from 'react';
import './DraftList.css';

const DraftList = ({ isOpen, onClose, onRestoreDraft, draftOrders, setDraftOrders }) => {
  const [drafts, setDrafts] = useState([]);
  const [selectedDrafts, setSelectedDrafts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDrafts();
    }
  }, [isOpen, draftOrders]);

  const loadDrafts = () => {
    // Use draftOrders prop if available, otherwise load from localStorage
    const savedDrafts = draftOrders || JSON.parse(localStorage.getItem('orderDrafts') || '[]');
    setDrafts(savedDrafts);
    setSelectedDrafts([]);
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedDrafts([]);
    } else {
      setSelectedDrafts(drafts.map((_, index) => index));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectDraft = (index) => {
    if (selectedDrafts.includes(index)) {
      setSelectedDrafts(selectedDrafts.filter(i => i !== index));
    } else {
      setSelectedDrafts([...selectedDrafts, index]);
    }
  };

  const handleDeleteDraft = (index) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      const updatedDrafts = drafts.filter((_, i) => i !== index);
      setDrafts(updatedDrafts);
      localStorage.setItem('orderDrafts', JSON.stringify(updatedDrafts));
      
      // Update parent state if available
      if (setDraftOrders) {
        setDraftOrders(updatedDrafts);
      }
      
      // Update selected drafts
      setSelectedDrafts(selectedDrafts.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedDrafts.length === 0) {
      alert('Please select drafts to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedDrafts.length} selected draft(s)?`)) {
      const updatedDrafts = drafts.filter((_, index) => !selectedDrafts.includes(index));
      setDrafts(updatedDrafts);
      localStorage.setItem('orderDrafts', JSON.stringify(updatedDrafts));
      
      // Update parent state if available
      if (setDraftOrders) {
        setDraftOrders(updatedDrafts);
      }
      
      setSelectedDrafts([]);
      setSelectAll(false);
    }
  };

  const handleReissueBill = (draft, index) => {
    const itemCount = draft.cart ? draft.cart.length : 0;
    const total = draft.cart ? draft.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    
    const confirmReissue = window.confirm(
      `Reissue bill for this order?\n\nTable: ${draft.table || 'Not selected'}\nItems: ${itemCount}\nTotal: $${total.toFixed(2)}\n\nThis will print a duplicate bill.`
    );
    
    if (confirmReissue) {
      // Simulate bill printing
      alert(`Bill reissued successfully!\n\nTable: ${draft.table || 'Not selected'}\nItems: ${itemCount}\nTotal: $${total.toFixed(2)}\n\nBill sent to printer.`);
    }
  };

  const handleReissueOrderItems = (draft, index) => {
    const itemCount = draft.cart ? draft.cart.length : 0;
    
    const confirmReissue = window.confirm(
      `Reissue order items for kitchen?\n\nTable: ${draft.table || 'Not selected'}\nItems: ${itemCount}\n\nThis will send order items to kitchen printer.`
    );
    
    if (confirmReissue) {
      // Simulate kitchen order printing
      const itemsList = draft.cart ? draft.cart.map(item => `${item.quantity}x ${item.name}`).join('\n') : '';
      alert(`Order items reissued successfully!\n\nTable: ${draft.table || 'Not selected'}\nItems:\n${itemsList}\n\nOrder sent to kitchen printer.`);
    }
  };

  const handleBulkReissueBills = () => {
    if (selectedDrafts.length === 0) {
      alert('Please select drafts to reissue bills.');
      return;
    }

    if (window.confirm(`Reissue bills for ${selectedDrafts.length} selected draft(s)?`)) {
      selectedDrafts.forEach(index => {
        const draft = drafts[index];
        // Simulate bill printing for each selected draft
        console.log(`Reissuing bill for draft ${index + 1}`);
      });
      alert(`${selectedDrafts.length} bill(s) reissued successfully!`);
    }
  };

  const handleBulkReissueOrders = () => {
    if (selectedDrafts.length === 0) {
      alert('Please select drafts to reissue order items.');
      return;
    }

    if (window.confirm(`Reissue order items for ${selectedDrafts.length} selected draft(s)?`)) {
      selectedDrafts.forEach(index => {
        const draft = drafts[index];
        // Simulate kitchen order printing for each selected draft
        console.log(`Reissuing order items for draft ${index + 1}`);
      });
      alert(`${selectedDrafts.length} order(s) reissued successfully!`);
    }
  };

  const handleRestoreDraft = (draft, index) => {
    const itemCount = draft.cart ? draft.cart.length : 0;
    const total = draft.cart ? draft.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    
    const confirmRestore = window.confirm(
      `Restore draft order?\n\nTable: ${draft.table || 'Not selected'}\nItems: ${itemCount}\nTotal: $${total.toFixed(2)}\n\nThis will replace your current order.`
    );
    
    if (confirmRestore && onRestoreDraft) {
      onRestoreDraft(draft);
      
      // Remove the restored draft from localStorage
      const updatedDrafts = drafts.filter((_, i) => i !== index);
      setDrafts(updatedDrafts);
      localStorage.setItem('orderDrafts', JSON.stringify(updatedDrafts));
      
      // Update parent state if available
      if (setDraftOrders) {
        setDraftOrders(updatedDrafts);
      }
      
      onClose();
      alert('Draft order restored successfully!');
    }
  };

  const formatDraftInfo = (draft) => {
    const itemCount = draft.cart ? draft.cart.length : 0;
    const total = draft.cart ? draft.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    return {
      itemCount,
      total: total.toFixed(2),
      table: draft.table || 'No table',
      timestamp: draft.timestamp ? new Date(draft.timestamp).toLocaleString() : 'Unknown'
    };
  };

  if (!isOpen) return null;

  return (
    <div className="draft-list-overlay">
      <div className="draft-list-modal">
        <div className="draft-list-header">
          <h2>Draft Orders ({drafts.length})</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {drafts.length === 0 ? (
          <div className="no-drafts">
            <p>No draft orders found.</p>
          </div>
        ) : (
          <>
            <div className="draft-list-controls">
              <label className="select-all-checkbox">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                />
                Select All
              </label>
              {selectedDrafts.length > 0 && (
                <div className="bulk-actions">
                  <button className="reissue-bills-btn" onClick={handleBulkReissueBills}>
                    📄 Reissue Bills ({selectedDrafts.length})
                  </button>
                  <button className="reissue-orders-btn" onClick={handleBulkReissueOrders}>
                    🍽️ Reissue Orders ({selectedDrafts.length})
                  </button>
                  <button className="delete-selected-btn" onClick={handleDeleteSelected}>
                    🗑️ Delete Selected ({selectedDrafts.length})
                  </button>
                </div>
              )}
            </div>

            <div className="draft-list-content">
              {drafts.map((draft, index) => {
                const info = formatDraftInfo(draft);
                return (
                  <div key={index} className={`draft-item ${selectedDrafts.includes(index) ? 'selected' : ''}`}>
                    <div className="draft-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedDrafts.includes(index)}
                        onChange={() => handleSelectDraft(index)}
                      />
                    </div>
                    
                    <div className="draft-info" onClick={() => handleRestoreDraft(draft, index)}>
                      <div className="draft-main-info">
                        <span className="draft-table">Table: {info.table}</span>
                        <span className="draft-items">{info.itemCount} items</span>
                        <span className="draft-total">${info.total}</span>
                      </div>
                      <div className="draft-timestamp">{info.timestamp}</div>
                    </div>
                    
                    <div className="draft-actions">
                      <button 
                        className="restore-btn"
                        onClick={() => handleRestoreDraft(draft, index)}
                        title="Restore Draft"
                      >
                        📋
                      </button>
                      <button 
                        className="reissue-bill-btn"
                        onClick={() => handleReissueBill(draft, index)}
                        title="Reissue Bill"
                      >
                        📄
                      </button>
                      <button 
                        className="reissue-order-btn"
                        onClick={() => handleReissueOrderItems(draft, index)}
                        title="Reissue Order Items"
                      >
                        🍽️
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleDeleteDraft(index)}
                        title="Delete Draft"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DraftList;