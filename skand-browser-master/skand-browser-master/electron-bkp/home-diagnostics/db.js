// IndexedDB wrapper for Home Diagnostics
(function(){
  class HomeDxDB {
    constructor() { 
      this.db = null; 
      this.name = 'homeDiagnosticsDB'; 
      this.version = 2; // Bump version for schema changes
      this.init(); 
    }
    
    init() { 
      const open = indexedDB.open(this.name, this.version); 
      
      open.onupgradeneeded = (e) => { 
        const db = e.target.result;
        
        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains('assessments')) { 
          const s = db.createObjectStore('assessments', { keyPath: 'id', autoIncrement: true }); 
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('symptoms')) { 
          const s = db.createObjectStore('symptoms', { keyPath: 'id', autoIncrement: true }); 
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('vitals')) { 
          const s = db.createObjectStore('vitals', { keyPath: 'id', autoIncrement: true }); 
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('profiles')) { 
          db.createObjectStore('profiles', { keyPath: 'id' });
        }
        
        // Add medications store for future use
        if (!db.objectStoreNames.contains('medications')) { 
          const s = db.createObjectStore('medications', { keyPath: 'id', autoIncrement: true });
          s.createIndex('date', 'date', { unique: false });
          s.createIndex('timestamp', 'timestamp', { unique: false });
        }
      }; 
      
      open.onsuccess = (e) => { 
        this.db = e.target.result; 
        // Migrate existing data to use timestamps if needed
        this.migrateToTimestamps();
      }; 
      
      open.onerror = (e) => console.error('DB error', e.target.error); 
    }
    
    // Add a new record to a store
    add(store, data) { 
      return new Promise((resolve, reject) => { 
        if (!this.db) return resolve(false); 
        
        const timestamp = new Date().toISOString();
        const tx = this.db.transaction([store], 'readwrite'); 
        
        tx.oncomplete = () => resolve(true); 
        tx.onerror = (e) => reject(e.target.error); 
        
        // Ensure we have both date and timestamp for all records
        const record = {
          ...data,
          date: data.date || new Date().toISOString().split('T')[0],
          timestamp: data.timestamp || timestamp
        };
        
        tx.objectStore(store).add(record); 
      }); 
    }
    
    // Get all records from a store
    getAll(store) { 
      return new Promise((resolve, reject) => { 
        if (!this.db) return resolve([]); 
        
        const tx = this.db.transaction([store], 'readonly'); 
        const req = tx.objectStore(store).getAll(); 
        
        req.onsuccess = () => resolve(req.result || []); 
        req.onerror = (e) => reject(e.target.error); 
      }); 
    }
    
    // Get records by date range
    getByDateRange(store, startDate, endDate) {
      return new Promise((resolve, reject) => {
        if (!this.db) return resolve([]);
        
        const tx = this.db.transaction([store], 'readonly');
        const storeObj = tx.objectStore(store);
        const index = storeObj.index('timestamp');
        const range = IDBKeyRange.bound(
          startDate.toISOString(),
          endDate.toISOString(),
          false,
          false
        );
        
        const request = index.getAll(range);
        
        request.onsuccess = () => {
          resolve(request.result || []);
        };
        
        request.onerror = (e) => {
          console.error('Error querying by date range:', e.target.error);
          reject(e.target.error);
        };
      });
    }
    
    // Get the most recent record
    getLatest(store) {
      return new Promise((resolve, reject) => {
        if (!this.db) return resolve(null);
        
        const tx = this.db.transaction([store], 'readonly');
        const storeObj = tx.objectStore(store);
        const index = storeObj.index('timestamp');
        const cursor = index.openCursor(null, 'prev');
        
        let latest = null;
        
        cursor.onsuccess = (e) => {
          const cursor = e.target.result;
          if (cursor) {
            latest = cursor.value;
          }
          resolve(latest);
        };
        
        cursor.onerror = (e) => {
          console.error('Error getting latest record:', e.target.error);
          reject(e.target.error);
        };
      });
    }
    
    // Delete a record by ID
    delete(store, id) {
      return new Promise((resolve, reject) => {
        if (!this.db) return resolve(false);
        
        const tx = this.db.transaction([store], 'readwrite');
        const request = tx.objectStore(store).delete(id);
        
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => {
          console.error('Error deleting record:', e.target.error);
          reject(e.target.error);
        };
      });
    }
    
    // Clear all records from a store
    clear(store) {
      return new Promise((resolve, reject) => {
        if (!this.db) return resolve(false);
        
        const tx = this.db.transaction([store], 'readwrite');
        const request = tx.objectStore(store).clear();
        
        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => {
          console.error('Error clearing store:', e.target.error);
          reject(e.target.error);
        };
      });
    }
    
    // Migration function to add timestamps to existing records
    async migrateToTimestamps() {
      const stores = ['symptoms', 'vitals', 'assessments'];
      
      for (const store of stores) {
        try {
          const tx = this.db.transaction([store], 'readwrite');
          const storeObj = tx.objectStore(store);
          const request = storeObj.getAll();
          
          request.onsuccess = async (e) => {
            const records = e.target.result || [];
            
            for (const record of records) {
              // If record has a date but no timestamp, add one
              if (record.date && !record.timestamp) {
                const date = new Date(record.date);
                if (!isNaN(date.getTime())) {
                  record.timestamp = date.toISOString();
                  await new Promise((resolve) => {
                    const updateTx = this.db.transaction([store], 'readwrite');
                    const updateStore = updateTx.objectStore(store);
                    updateStore.put(record);
                    updateTx.oncomplete = resolve;
                  });
                }
              }
            }
          };
        } catch (error) {
          console.error(`Error migrating ${store} to use timestamps:`, error);
        }
      }
    }
  }
  
  // Initialize and expose the database
  window.homeDxDB = new HomeDxDB();
})();
