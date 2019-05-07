import sqlite3 from 'sqlite3';

const sql = sqlite3.verbose();

export class BananaStand {
    constructor() {
        this.open();
    }
    open(dbFile = 'api/db/bananas.db'  ) {   
        this.db = new sql.Database(dbFile, sql.OPEN_READWRITE | sql.CREATE, (err) => {
            if (err) {
                console.error(err);
            } else {
                this.db.run('CREATE TABLE IF NOT EXISTS stand( \
                        id INTEGER PRIMARY KEY, \
                        dt REAL NOT NULL, \
                        qty INT NOT NULL, \
                        orig_qty INT NOT NULL, \
                        trans TEXT NOT NULL, \
                        created_at REAL NOT NULL, \
                        updated_at REAL NOT NULL \
                    );', (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
                console.log(`connected to bananas db: ${dbFile}`);
            }
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
              return console.error(err.message);
            }
            console.log('bananas db closed');
          });
    }

    purchase(qty, date, resolve, reject) {
        if (qty <= 0) {
            reject('bad quantity');
            return;
        }
        try {
            this.db.run('INSERT INTO stand(dt,qty,orig_qty,trans,created_at,updated_at) \
            VALUES(julianday(?),?,?,\'BUY\',julianday(\'now\'),julianday(\'now\'));',[date,qty,qty],(err) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                console.log(`purchased ${qty} bananas on ${date}`);      
                resolve();          
            });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    }

    sell(qty, date, resolve, reject) {
        if (qty <= 0) {
            reject('bad quantity');
            return;
        }
        try {
            // count rows first
            this.db.get('SELECT COUNT(*) as cnt FROM stand \
                WHERE trans=\'BUY\' AND qty > 0 AND julianday(?) - dt BETWEEN 0 AND 10;',[date], (err, row) => {
                if (err) {
                    console.error(err);
                    reject(err);
                    return;
                }
                let count = row.cnt;
                let i = 0;
                let working = {
                    num: qty,
                    rows: []
                };
                if (count == 0) {
                    // no bananas today!
                    resolve(0);
                }
                // retrieve data
                this.db.each('SELECT id, dt, qty, date(dt) AS pretty_dt FROM stand \
                    WHERE trans=\'BUY\' AND qty > 0 AND julianday(?) - dt BETWEEN 0 AND 10 ORDER BY dt ASC;',[date], (err, row) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }
                    if (row && (working.num > 0)) {
                        let inventory = row.qty;
                        if (inventory >= working.num) {
                            // filled the order
                            inventory -= working.num;
                            working.num = 0;
                        }
                        else {
                            // need to get more
                            working.num -= inventory;
                            inventory = 0;
                        }
                        working.rows.push({ 
                            id: row.id,
                            qty: inventory,
                            pretty_dt: row.pretty_dt
                        });
                        let sold = row.qty - inventory;
                        console.log(`sold ${sold} bananas on ${row.pretty_dt}`); 
                        if ((working.num == 0) || (++i == count)) { // done
                            try {
                                resolve(this.sold(qty, date, working));
                            }
                            catch (err) {                                
                                console.error(err);
                                reject(err);
                                return;
                            }
                        }   
                    }            
                });
            });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    }
    sold(qty, date, working) {
        // make adjustments to table
        working.rows.forEach((row) => {
            console.log(`updating row ${row.id}`);
            if (1) { // KEEP ALL BUY RECORDS ...   if (row.qty > 0) {
                this.db.run('UPDATE stand SET qty=?, updated_at=julianday(\'now\') WHERE id=?',[row.qty,row.id], (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${row.id} updated ${row.qty} bananas on ${row.pretty_dt}`);
                });
            /* Keep all the BUY records ... 
            } else {
                this.db.run('DELETE FROM stand WHERE id=?',[row.id], (err) => {
                    if (err) {
                        throw err;
                    }
                    console.log(`${row.id} deleted bananas on ${row.pretty_dt}`);
                });
            */
            }
        });
        // record sale
        let sold = qty - working.num;
        if (sold > 0) {
                this.db.run('INSERT INTO stand(dt,qty,orig_qty,trans,created_at,updated_at) VALUES(julianday(?),?,?,\'SELL\',julianday(\'now\'),julianday(\'now\'));',[date,sold,qty], (err) => {
                if (err) {
                    throw err;
                }
                console.log(`completed sale of ${sold} bananas on ${date}`);
            });
        } 

        // success
        return sold;
    }
      


    metrics(end, resolve, reject) {
        let data = {
            sold: 0,
            inventory: 0,
            expired: 0,
            pnl: 0
        };
        try {
            this.db.get('SELECT \
                IFNULL(SUM(CASE trans WHEN \'SELL\' THEN qty ELSE 0 END),0) AS sold, \
                IFNULL(SUM(CASE trans WHEN \'BUY\' THEN CASE WHEN (julianday(?) - dt > 10) THEN 0 ELSE qty END ELSE 0 END),0) AS inventory, \
                IFNULL(SUM(CASE trans WHEN \'BUY\' THEN CASE WHEN (julianday(?) - dt > 10) THEN qty ELSE 0 END ELSE 0 END),0) AS expired \
                FROM stand \
                WHERE dt <= julianday(?);', [end, end, end], (err, row) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }
                    // get the answers
                    data = row;
                    data.pnl = (0.35 * row.sold) - (0.20 * (row.inventory + row.expired));
                    console.log(`${data.sold} sold, ${data.inventory} inventory, ${data.expired} expired, ${data.pnl} PNL`);
                    resolve(data);
                });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    }

    dump(resolve, reject) {
        try {
            this.db.all('SELECT id, date(dt) as date, qty, orig_qty, trans, date(created_at)||\' \'||time(created_at) as created, date(updated_at)||\' \'||time(updated_at) as modified from stand;', (err, rows) => {
                    if (err) {
                        console.error(err);
                        reject(err);
                        return;
                    }
                    console.log(`${rows.length} rows dumped`);
                    resolve(rows);
                });
        }
        catch (err) {
            console.error(err);
            reject(err);
        }
    }

}

const stand = new BananaStand();
export default stand;

