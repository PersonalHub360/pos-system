class TableController {
  constructor(db) {
    this.db = db;
  }

  // Get all tables with current status
  async getAllTables(req, res) {
    try {
      const { status, section } = req.query;

      let query = `
        SELECT 
          t.*,
          COUNT(CASE WHEN o.order_status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders,
          MAX(o.created_at) as last_order_time,
          SUM(CASE WHEN o.order_status = 'completed' AND DATE(o.created_at) = DATE('now') THEN o.total ELSE 0 END) as today_revenue
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id
        WHERE t.is_active = 1
      `;

      const params = [];

      if (status) {
        query += ' AND t.status = ?';
        params.push(status);
      }

      if (section) {
        query += ' AND t.section = ?';
        params.push(section);
      }

      query += ' GROUP BY t.id ORDER BY t.table_number';

      const tables = await this.executeQuery(query, params);

      res.json(tables);
    } catch (error) {
      console.error('Get tables error:', error);
      res.status(500).json({ error: 'Failed to fetch tables' });
    }
  }

  // Get single table details
  async getTableDetails(req, res) {
    try {
      const { id } = req.params;

      const tableQuery = `
        SELECT 
          t.*,
          COUNT(CASE WHEN o.order_status IN ('pending', 'confirmed', 'preparing', 'ready') THEN 1 END) as active_orders,
          MAX(o.created_at) as last_order_time
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id
        WHERE t.id = ?
        GROUP BY t.id
      `;

      const tables = await this.executeQuery(tableQuery, [id]);
      
      if (tables.length === 0) {
        return res.status(404).json({ error: 'Table not found' });
      }

      const table = tables[0];

      // Get current orders for this table
      const ordersQuery = `
        SELECT 
          o.*,
          GROUP_CONCAT(p.name || ' x' || oi.quantity) as items_summary
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE o.table_id = ? AND o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;

      const currentOrders = await this.executeQuery(ordersQuery, [id]);
      table.current_orders = currentOrders;

      // Get reservations for today
      const reservationsQuery = `
        SELECT * FROM table_reservations 
        WHERE table_id = ? AND DATE(reservation_date) = DATE('now')
        ORDER BY reservation_time
      `;

      const reservations = await this.executeQuery(reservationsQuery, [id]);
      table.today_reservations = reservations;

      res.json(table);
    } catch (error) {
      console.error('Get table details error:', error);
      res.status(500).json({ error: 'Failed to fetch table details' });
    }
  }

  // Create new table
  async createTable(req, res) {
    try {
      const {
        tableNumber,
        tableName,
        capacity,
        section,
        description,
        isActive = true
      } = req.body;

      // Validate required fields
      if (!tableNumber || !capacity) {
        return res.status(400).json({ error: 'Table number and capacity are required' });
      }

      // Check if table number already exists
      const existingTable = await this.executeQuery(
        'SELECT id FROM tables WHERE table_number = ?',
        [tableNumber]
      );

      if (existingTable.length > 0) {
        return res.status(409).json({ error: 'Table number already exists' });
      }

      const tableId = await this.insertTable({
        tableNumber,
        tableName,
        capacity,
        section,
        description,
        isActive,
        createdBy: req.user?.id
      });

      const newTable = await this.getTableById(tableId);

      res.status(201).json({
        message: 'Table created successfully',
        table: newTable
      });
    } catch (error) {
      console.error('Create table error:', error);
      res.status(500).json({ error: 'Failed to create table' });
    }
  }

  // Update table
  async updateTable(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Check if table exists
      const existingTable = await this.getTableById(id);
      if (!existingTable) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // If updating table number, check for conflicts
      if (updateData.tableNumber && updateData.tableNumber !== existingTable.table_number) {
        const conflictTable = await this.executeQuery(
          'SELECT id FROM tables WHERE table_number = ? AND id != ?',
          [updateData.tableNumber, id]
        );

        if (conflictTable.length > 0) {
          return res.status(409).json({ error: 'Table number already exists' });
        }
      }

      await this.updateTableData(id, updateData);

      const updatedTable = await this.getTableById(id);

      res.json({
        message: 'Table updated successfully',
        table: updatedTable
      });
    } catch (error) {
      console.error('Update table error:', error);
      res.status(500).json({ error: 'Failed to update table' });
    }
  }

  // Update table status
  async updateTableStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['available', 'occupied', 'reserved', 'cleaning', 'out_of_order'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid table status' });
      }

      // Check if table exists
      const existingTable = await this.getTableById(id);
      if (!existingTable) {
        return res.status(404).json({ error: 'Table not found' });
      }

      await this.updateTableData(id, { status });

      res.json({ message: 'Table status updated successfully' });
    } catch (error) {
      console.error('Update table status error:', error);
      res.status(500).json({ error: 'Failed to update table status' });
    }
  }

  // Delete table
  async deleteTable(req, res) {
    try {
      const { id } = req.params;

      // Check if table exists
      const existingTable = await this.getTableById(id);
      if (!existingTable) {
        return res.status(404).json({ error: 'Table not found' });
      }

      // Check if table has active orders
      const activeOrders = await this.executeQuery(
        'SELECT COUNT(*) as count FROM orders WHERE table_id = ? AND order_status IN (?, ?, ?, ?)',
        [id, 'pending', 'confirmed', 'preparing', 'ready']
      );

      if (activeOrders[0].count > 0) {
        return res.status(400).json({ error: 'Cannot delete table with active orders' });
      }

      // Soft delete - mark as inactive instead of actual deletion
      await this.updateTableData(id, { is_active: false });

      res.json({ message: 'Table deleted successfully' });
    } catch (error) {
      console.error('Delete table error:', error);
      res.status(500).json({ error: 'Failed to delete table' });
    }
  }

  // Create table reservation
  async createReservation(req, res) {
    try {
      const {
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        reservationDate,
        reservationTime,
        partySize,
        duration = 120, // default 2 hours
        notes
      } = req.body;

      // Validate required fields
      if (!tableId || !customerName || !customerPhone || !reservationDate || !reservationTime || !partySize) {
        return res.status(400).json({ error: 'Missing required reservation fields' });
      }

      // Check if table exists and is active
      const table = await this.getTableById(tableId);
      if (!table || !table.is_active) {
        return res.status(404).json({ error: 'Table not found or inactive' });
      }

      // Check table capacity
      if (partySize > table.capacity) {
        return res.status(400).json({ 
          error: `Party size (${partySize}) exceeds table capacity (${table.capacity})` 
        });
      }

      // Check for conflicting reservations
      const conflictQuery = `
        SELECT * FROM table_reservations 
        WHERE table_id = ? 
        AND DATE(reservation_date) = DATE(?)
        AND status IN ('confirmed', 'seated')
        AND (
          (reservation_time <= ? AND datetime(reservation_time, '+' || duration || ' minutes') > ?) OR
          (reservation_time < datetime(?, '+' || ? || ' minutes') AND reservation_time >= ?)
        )
      `;

      const conflicts = await this.executeQuery(conflictQuery, [
        tableId, reservationDate, reservationTime, reservationTime, 
        reservationTime, duration, reservationTime
      ]);

      if (conflicts.length > 0) {
        return res.status(409).json({ error: 'Time slot conflicts with existing reservation' });
      }

      const reservationId = await this.insertReservation({
        tableId,
        customerName,
        customerPhone,
        customerEmail,
        reservationDate,
        reservationTime,
        partySize,
        duration,
        notes,
        createdBy: req.user?.id
      });

      const newReservation = await this.getReservationById(reservationId);

      res.status(201).json({
        message: 'Reservation created successfully',
        reservation: newReservation
      });
    } catch (error) {
      console.error('Create reservation error:', error);
      res.status(500).json({ error: 'Failed to create reservation' });
    }
  }

  // Get reservations
  async getReservations(req, res) {
    try {
      const { date, tableId, status } = req.query;

      let query = `
        SELECT 
          tr.*,
          t.table_number,
          t.table_name,
          t.section
        FROM table_reservations tr
        JOIN tables t ON tr.table_id = t.id
        WHERE 1=1
      `;

      const params = [];

      if (date) {
        query += ' AND DATE(tr.reservation_date) = ?';
        params.push(date);
      }

      if (tableId) {
        query += ' AND tr.table_id = ?';
        params.push(tableId);
      }

      if (status) {
        query += ' AND tr.status = ?';
        params.push(status);
      }

      query += ' ORDER BY tr.reservation_date, tr.reservation_time';

      const reservations = await this.executeQuery(query, params);

      res.json(reservations);
    } catch (error) {
      console.error('Get reservations error:', error);
      res.status(500).json({ error: 'Failed to fetch reservations' });
    }
  }

  // Update reservation status
  async updateReservationStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['confirmed', 'seated', 'completed', 'cancelled', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid reservation status' });
      }

      // Check if reservation exists
      const reservation = await this.getReservationById(id);
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found' });
      }

      await this.updateReservationData(id, { status });

      // Update table status based on reservation status
      if (status === 'seated') {
        await this.updateTableData(reservation.table_id, { status: 'occupied' });
      } else if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
        // Check if there are other active reservations or orders for this table
        const activeReservations = await this.executeQuery(`
          SELECT COUNT(*) as count FROM table_reservations 
          WHERE table_id = ? AND status = 'seated' AND id != ?
        `, [reservation.table_id, id]);

        const activeOrders = await this.executeQuery(`
          SELECT COUNT(*) as count FROM orders 
          WHERE table_id = ? AND order_status IN ('pending', 'confirmed', 'preparing', 'ready')
        `, [reservation.table_id]);

        if (activeReservations[0].count === 0 && activeOrders[0].count === 0) {
          await this.updateTableData(reservation.table_id, { status: 'available' });
        }
      }

      res.json({ message: 'Reservation status updated successfully' });
    } catch (error) {
      console.error('Update reservation status error:', error);
      res.status(500).json({ error: 'Failed to update reservation status' });
    }
  }

  // Get table analytics
  async getTableAnalytics(req, res) {
    try {
      const { dateFrom, dateTo } = req.query;
      
      let dateFilter = '';
      const params = [];
      
      if (dateFrom && dateTo) {
        dateFilter = 'AND DATE(o.created_at) BETWEEN ? AND ?';
        params.push(dateFrom, dateTo);
      }

      // Table utilization
      const utilizationQuery = `
        SELECT 
          t.id,
          t.table_number,
          t.table_name,
          t.capacity,
          t.section,
          COUNT(o.id) as total_orders,
          SUM(o.total) as total_revenue,
          AVG(o.total) as average_order_value,
          COUNT(CASE WHEN o.order_status = 'completed' THEN 1 END) as completed_orders
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id ${dateFilter}
        WHERE t.is_active = 1
        GROUP BY t.id
        ORDER BY total_revenue DESC
      `;

      // Section performance
      const sectionQuery = `
        SELECT 
          t.section,
          COUNT(DISTINCT t.id) as table_count,
          COUNT(o.id) as total_orders,
          SUM(o.total) as total_revenue,
          AVG(o.total) as average_order_value
        FROM tables t
        LEFT JOIN orders o ON t.id = o.table_id ${dateFilter}
        WHERE t.is_active = 1
        GROUP BY t.section
        ORDER BY total_revenue DESC
      `;

      // Peak hours analysis
      const peakHoursQuery = `
        SELECT 
          strftime('%H', o.created_at) as hour,
          COUNT(*) as order_count,
          SUM(o.total) as revenue
        FROM orders o
        JOIN tables t ON o.table_id = t.id
        WHERE 1=1 ${dateFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      const [utilization, sectionPerformance, peakHours] = await Promise.all([
        this.executeQuery(utilizationQuery, params),
        this.executeQuery(sectionQuery, params),
        this.executeQuery(peakHoursQuery, params)
      ]);

      res.json({
        utilization,
        sectionPerformance,
        peakHours
      });
    } catch (error) {
      console.error('Get table analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch table analytics' });
    }
  }

  // Helper methods
  async getTableById(id) {
    const tables = await this.executeQuery('SELECT * FROM tables WHERE id = ?', [id]);
    return tables[0];
  }

  async getReservationById(id) {
    const reservations = await this.executeQuery(`
      SELECT 
        tr.*,
        t.table_number,
        t.table_name
      FROM table_reservations tr
      JOIN tables t ON tr.table_id = t.id
      WHERE tr.id = ?
    `, [id]);
    return reservations[0];
  }

  async insertTable(tableData) {
    return new Promise((resolve, reject) => {
      const {
        tableNumber, tableName, capacity, section, description, isActive, createdBy
      } = tableData;

      this.db.run(`
        INSERT INTO tables (
          table_number, table_name, capacity, section, description, is_active, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [tableNumber, tableName, capacity, section, description, isActive, createdBy], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async insertReservation(reservationData) {
    return new Promise((resolve, reject) => {
      const {
        tableId, customerName, customerPhone, customerEmail,
        reservationDate, reservationTime, partySize, duration, notes, createdBy
      } = reservationData;

      this.db.run(`
        INSERT INTO table_reservations (
          table_id, customer_name, customer_phone, customer_email,
          reservation_date, reservation_time, party_size, duration, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tableId, customerName, customerPhone, customerEmail,
        reservationDate, reservationTime, partySize, duration, notes, createdBy
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  async updateTableData(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        const dbKey = key === 'tableNumber' ? 'table_number' :
                     key === 'tableName' ? 'table_name' :
                     key === 'isActive' ? 'is_active' : key;
        fields.push(`${dbKey} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async updateReservationData(id, updateData) {
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) return;

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    return new Promise((resolve, reject) => {
      this.db.run(`UPDATE table_reservations SET ${fields.join(', ')} WHERE id = ?`, values, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async executeQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = TableController;