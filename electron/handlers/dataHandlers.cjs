const { ipcMain, dialog, app } = require("electron");
const {
  getDatabase,
  getDatabasePath,
  refreshGoodsTable,
} = require("../database/index.cjs");
const xlsx = require("xlsx");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");

function registerDataHandlers() {
  // 导入数据
  ipcMain.handle("db:import-data", async (event, type, filePath, mode) => {
    try {
      const db = getDatabase();
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);
      const now = dayjs().format("YYYY-MM-DD HH:mm:ss");

      const transaction = db.transaction((type, mode, data, now) => {
        if (type === "product") {
          // 如果是覆盖模式，先清空货品表
          if (mode === "overwrite") {
            // 先删除所有引用货品表的 bundle_items 记录
            db.prepare("DELETE FROM bundle_items").run();
            // 再删除货品表数据
            db.prepare("DELETE FROM products").run();
          }

          // 货品表字段映射 - 包含所有字段
          const stmt = db.prepare(`
            INSERT INTO products (
              change, launch_status, launch_month, delisting_month, category,
              article_code, tu, product_name_en, product_name_cn, cn_registration,
              declared_content, cn_current_price, ean_code, collation, shelf_life,
              net_weight, item_size, country_of_origin, retail, digital, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(article_code, tu) DO UPDATE SET
              change = excluded.change,
              launch_status = excluded.launch_status,
              launch_month = excluded.launch_month,
              delisting_month = excluded.delisting_month,
              category = excluded.category,
              product_name_en = excluded.product_name_en,
              product_name_cn = excluded.product_name_cn,
              cn_registration = excluded.cn_registration,
              declared_content = excluded.declared_content,
              cn_current_price = excluded.cn_current_price,
              ean_code = excluded.ean_code,
              collation = excluded.collation,
              shelf_life = excluded.shelf_life,
              net_weight = excluded.net_weight,
              item_size = excluded.item_size,
              country_of_origin = excluded.country_of_origin,
              retail = excluded.retail,
              digital = excluded.digital,
              updated_at = excluded.updated_at
          `);

          for (const row of data) {
            const articleCode = row["Article Code"] || row["商品代码"] || "";
            const tu = row["TU"] || row["贸易单位"] || "";

            if (articleCode && tu) {
              stmt.run(
                row["Change"] || "",
                row["Launch Status"] || "",
                row["Launch Month"] || "",
                row["Delisting Month"] || "",
                row["Category "] || row["Category"] || row["类别"] || "",
                String(articleCode),
                String(tu),
                row["Product name (EN)"] || row["商品英文名称"] || "",
                row["Product Name (CN)"] || row["商品中文名称"] || "",
                row["CN Registration "] || row["CN Registration"] || "",
                row["Declared Content"] || row["商品内容信息"] || "",
                parseFloat(row["CN Current Price"] || row["中国现价"] || 0) ||
                  0,
                row["EAN Code"] || "",
                row["Collation"] || "",
                row["Shelf Life"] || row["保质期"] || "",
                row["Net Weight Product (kg)"] || row["净重"] || "",
                row["Item Size L x W x H (mm)"] || row["商品尺寸"] || "",
                row["Country of Origin"] || row["原产国"] || "",
                row["Retail"] || "",
                row["Digital"] || "",
                now
              );
            }
          }
        } else if (type === "label") {
          // 标签表导入 - 始终覆盖
          db.prepare("DELETE FROM labels").run();

          // 标签表字段映射
          const stmt = db.prepare(`
            INSERT INTO labels (
              category, product_type, by_sku, fragrance, updated_at
            )
            VALUES (?, ?, ?, ?, ?)
          `);

          // 标签表特殊处理：每列独立读取，而不是按行读取
          // 因为每列的数据量可能不同
          const rawSheet = xlsx.utils.sheet_to_json(sheet, { header: 1 }); // 获取原始数组格式

          if (rawSheet.length > 0) {
            const headers = rawSheet[0]; // 第一行是表头
            const columnData = {}; // 存储每列的数据

            // 初始化每列的数据数组
            headers.forEach((header, index) => {
              columnData[index] = [];
            });

            // 从第二行开始读取数据
            for (let i = 1; i < rawSheet.length; i++) {
              const row = rawSheet[i];
              row.forEach((cell, colIndex) => {
                // 只添加非空值
                if (cell !== undefined && cell !== null && cell !== "") {
                  columnData[colIndex].push(String(cell).trim());
                }
              });
            }

            // 按列插入数据
            // 第0列 - 分类
            if (columnData[0]) {
              columnData[0].forEach((value) => {
                stmt.run(String(value), "", "", "", now);
              });
            }

            // 第1列 - 品类
            if (columnData[1]) {
              columnData[1].forEach((value) => {
                stmt.run("", String(value), "", "", now);
              });
            }

            // 第2列 - 品类 By-sku
            if (columnData[2]) {
              columnData[2].forEach((value) => {
                stmt.run("", "", String(value), "", now);
              });
            }

            // 第3列 - 香型
            if (columnData[3]) {
              columnData[3].forEach((value) => {
                stmt.run("", "", "", String(value), now);
              });
            }
          }
        } else if (type === "inventory") {
          // 如果是覆盖模式，先清空库存表
          if (mode === "overwrite") {
            db.prepare("DELETE FROM inventory").run();
          }

          // 库存表字段映射 - 包含所有字段
          const stmt = db.prepare(`
            INSERT INTO inventory (
              reporting_date, itm_articleid, itm_dg_chemicals, itm_dg_class_cn,
              storerkey, facility, inventory_type, main_rituals, busr8,
              sku, sku_descr, extendedfield01, batch_code, expiry_date,
              remaining_months, remaining_days, qty, qty_allocated, qty_picked,
              qty_available, hold_status, ciq, pk, inv_id, lot, sscc,
              receipt_date, alt_sku, loc, virtual_sku, tu_shelf_life,
              article_shelf_life, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (const row of data) {
            const sku = row["SKU"] || row["库存单位"] || "";

            if (sku) {
              stmt.run(
                row["Reporting Date"] || "",
                row["itm_articleid"] || "",
                row["itm_dg_chemicals"] || "",
                row["itm_dg_class_cn"] || "",
                row["STORERKEY"] || "",
                row["FACILITY"] || "",
                row["Inventory Type"] || "",
                row["Main Rituals"] || "",
                row["Busr8"] || "",
                String(sku),
                row["SKUDescr"] || "",
                row["Extendedfield01"] || "",
                row["BatchCode"] || "",
                row["expiry date"] || "",
                parseInt(row["效期剩余月数"] || 0) || 0,
                parseInt(row["效期剩余天数"] || 0) || 0,
                parseInt(row["Qty"] || 0) || 0,
                parseInt(row["QtyAllocated"] || 0) || 0,
                parseInt(row["QtyPicked"] || 0) || 0,
                parseInt(row["QTYavailable"] || row["可用数量"] || 0) || 0,
                row["holdstatus"] || "",
                row["CIQ"] || "",
                row["PK"] || "",
                row["ID"] || "",
                row["LOT"] || "",
                row["SSCC"] || "",
                row["Receipt Date"] || "",
                row["ALTSKU"] || "",
                row["LOC"] || "",
                row["虚拟SKU"] || row["虚拟 SKU"] || "",
                row["Tu效期"] || row["Tu 效期"] || "",
                row["A码效期"] || row["A 码效期"] || "",
                now
              );
            }
          }
        }
      });

      transaction(type, mode, data, now);

      // 导入货品或库存数据后，刷新 goods 表
      if (type === "product" || type === "inventory") {
        refreshGoodsTable();
      }

      return { success: true, count: data.length };
    } catch (error) {
      console.error("========== Import Error ==========");
      console.error("Error Type:", type);
      console.error("File Path:", filePath);
      console.error("Mode:", mode);
      console.error("Error Message:", error.message);
      console.error("Error Stack:", error.stack);
      console.error("==================================");
      return { success: false, error: error.message };
    }
  });

  // 导出货品表
  ipcMain.handle("db:export-products", async () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare("SELECT * FROM products");
      const rows = stmt.all();
      const results = rows.map((row) => ({
        Change: row.change,
        "Launch Status": row.launch_status,
        "Launch Month": row.launch_month,
        "Delisting Month": row.delisting_month,
        "Category ": row.category,
        "Article Code": row.article_code,
        TU: row.tu,
        "Product name (EN)": row.product_name_en,
        "Product Name (CN)": row.product_name_cn,
        "CN Registration ": row.cn_registration,
        "Declared Content": row.declared_content,
        "CN Current Price": row.cn_current_price,
        "EAN Code": row.ean_code,
        Collation: row.collation,
        "Shelf Life": row.shelf_life,
        "Net Weight Product (kg)": row.net_weight,
        "Item Size L x W x H (mm)": row.item_size,
        "Country of Origin": row.country_of_origin,
        Retail: row.retail,
        Digital: row.digital,
      }));

      const ws = xlsx.utils.json_to_sheet(results);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Products");

      const { filePath } = await dialog.showSaveDialog({
        title: "导出货品表",
        defaultPath: `products_export_${dayjs().format(
          "YYYYMMDD_HHmmss"
        )}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        xlsx.writeFile(wb, filePath);
        return { success: true, filePath, count: results.length };
      } else {
        return { success: false, error: "用户取消了保存" };
      }
    } catch (error) {
      console.error("Export products error:", error);
      return { success: false, error: error.message };
    }
  });

  // 导出库存表
  ipcMain.handle("db:export-inventory", async () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare("SELECT * FROM inventory");
      const rows = stmt.all();
      const results = rows.map((row) => ({
        "Reporting Date": row.reporting_date,
        itm_articleid: row.itm_articleid,
        itm_dg_chemicals: row.itm_dg_chemicals,
        itm_dg_class_cn: row.itm_dg_class_cn,
        STORERKEY: row.storerkey,
        FACILITY: row.facility,
        "Inventory Type": row.inventory_type,
        "Main Rituals": row.main_rituals,
        Busr8: row.busr8,
        SKU: row.sku,
        SKUDescr: row.sku_descr,
        Extendedfield01: row.extendedfield01,
        BatchCode: row.batch_code,
        "expiry date": row.expiry_date,
        效期剩余月数: row.remaining_months,
        效期剩余天数: row.remaining_days,
        Qty: row.qty,
        QtyAllocated: row.qty_allocated,
        QtyPicked: row.qty_picked,
        QTYavailable: row.qty_available,
        holdstatus: row.hold_status,
        CIQ: row.ciq,
        PK: row.pk,
        ID: row.inv_id,
        LOT: row.lot,
        SSCC: row.sscc,
        "Receipt Date": row.receipt_date,
        ALTSKU: row.alt_sku,
        LOC: row.loc,
        虚拟SKU: row.virtual_sku,
        Tu效期: row.tu_shelf_life,
        A码效期: row.article_shelf_life,
      }));

      const ws = xlsx.utils.json_to_sheet(results);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Inventory");

      const { filePath } = await dialog.showSaveDialog({
        title: "导出库存表",
        defaultPath: `inventory_export_${dayjs().format(
          "YYYYMMDD_HHmmss"
        )}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        xlsx.writeFile(wb, filePath);
        return { success: true, filePath, count: results.length };
      } else {
        return { success: false, error: "用户取消了保存" };
      }
    } catch (error) {
      console.error("Export inventory error:", error);
      return { success: false, error: error.message };
    }
  });

  // 导出货组（占位实现）
  ipcMain.handle("db:export-bundles", async () => {
    return { success: true };
  });

  // 清空货品表
  ipcMain.handle("db:clear-products", async () => {
    try {
      const db = getDatabase();
      // 先删除所有引用货品表的 bundle_items 记录，再删除货品表数据
      db.prepare("DELETE FROM bundle_items").run();
      db.prepare("DELETE FROM products").run();
      // 刷新 goods 表
      refreshGoodsTable();
      return { success: true };
    } catch (error) {
      console.error("Clear products error:", error);
      return { success: false, error: error.message };
    }
  });

  // 清空库存表
  ipcMain.handle("db:clear-inventory", async () => {
    try {
      const db = getDatabase();
      db.prepare("DELETE FROM inventory").run();
      // 刷新 goods 表
      refreshGoodsTable();
      return { success: true };
    } catch (error) {
      console.error("Clear inventory error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取备份目录路径
  function getBackupDir() {
    const backupDir = path.join(app.getPath("appData"), "bundle", "BackUp");
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    return backupDir;
  }

  // 备份数据库
  ipcMain.handle("db:backup-database", async () => {
    try {
      const db = getDatabase();
      const dbPath = getDatabasePath();
      const backupDir = getBackupDir();
      const timestamp = Date.now();
      const backupFileName = `${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      // 执行 WAL checkpoint，确保所有数据都写入主数据库文件
      try {
        db.pragma("wal_checkpoint(TRUNCATE)");
      } catch (e) {
        console.warn("WAL checkpoint failed during backup:", e);
      }

      // 复制数据库文件
      fs.copyFileSync(dbPath, backupPath);

      // 同时复制 WAL 文件（如果存在）
      const walPath = dbPath + "-wal";
      const shmPath = dbPath + "-shm";
      if (fs.existsSync(walPath)) {
        fs.copyFileSync(walPath, backupPath + "-wal");
      }
      if (fs.existsSync(shmPath)) {
        fs.copyFileSync(shmPath, backupPath + "-shm");
      }

      return { success: true, timestamp, backupPath };
    } catch (error) {
      console.error("Backup database error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取所有备份列表
  ipcMain.handle("db:get-backups", async () => {
    try {
      const backupDir = getBackupDir();
      const files = fs.readdirSync(backupDir);

      // 过滤出 .db 文件并解析时间戳
      const backups = files
        .filter(
          (f) => f.endsWith(".db") && !f.includes("-wal") && !f.includes("-shm")
        )
        .map((f) => {
          const timestamp = parseInt(f.replace(".db", ""), 10);
          return {
            filename: f,
            timestamp,
            datetime: dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss"),
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp); // 按时间降序

      return { success: true, backups };
    } catch (error) {
      console.error("Get backups error:", error);
      return { success: false, error: error.message };
    }
  });

  // 恢复备份
  ipcMain.handle("db:restore-backup", async (event, timestamp) => {
    try {
      const backupDir = getBackupDir();
      const backupFileName = `${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: "备份文件不存在" };
      }

      // 获取当前数据库实例并执行 checkpoint
      const db = getDatabase();
      const dbPath = getDatabasePath();

      // 执行 WAL checkpoint，将 WAL 文件内容写回主数据库文件
      try {
        db.pragma("wal_checkpoint(TRUNCATE)");
      } catch (e) {
        console.warn("WAL checkpoint failed:", e);
      }

      // 先备份当前数据
      const autoBackupTimestamp = Date.now();
      const autoBackupPath = path.join(backupDir, `${autoBackupTimestamp}.db`);
      fs.copyFileSync(dbPath, autoBackupPath);

      // 复制 WAL 文件（如果存在）
      const walPath = dbPath + "-wal";
      const shmPath = dbPath + "-shm";
      if (fs.existsSync(walPath)) {
        fs.copyFileSync(walPath, autoBackupPath + "-wal");
      }
      if (fs.existsSync(shmPath)) {
        fs.copyFileSync(shmPath, autoBackupPath + "-shm");
      }

      // 关闭当前数据库连接
      db.close();

      // 等待确保数据库完全关闭
      await new Promise((resolve) => setTimeout(resolve, 200));

      // 删除现有的 WAL 和 SHM 文件
      if (fs.existsSync(walPath)) {
        try {
          fs.unlinkSync(walPath);
        } catch (e) {
          console.warn("Failed to delete WAL file:", e);
        }
      }
      if (fs.existsSync(shmPath)) {
        try {
          fs.unlinkSync(shmPath);
        } catch (e) {
          console.warn("Failed to delete SHM file:", e);
        }
      }

      // 只恢复主数据库文件
      // 不复制 WAL 和 SHM 文件，让 SQLite 在重新打开时自动创建新的
      fs.copyFileSync(backupPath, dbPath);

      // 重新初始化数据库（SQLite 会自动创建新的 WAL 和 SHM 文件）
      const { reinitDatabase } = require("../database/index.cjs");
      reinitDatabase();

      return { success: true, autoBackupTimestamp };
    } catch (error) {
      console.error("Restore backup error:", error);
      return { success: false, error: error.message };
    }
  });

  // 删除备份
  ipcMain.handle("db:delete-backup", async (event, timestamp) => {
    try {
      const backupDir = getBackupDir();
      const backupFileName = `${timestamp}.db`;
      const backupPath = path.join(backupDir, backupFileName);

      if (!fs.existsSync(backupPath)) {
        return { success: false, error: "备份文件不存在" };
      }

      // 删除备份文件
      fs.unlinkSync(backupPath);

      // 删除相关的 WAL 和 SHM 文件（如果存在）
      const walPath = backupPath + "-wal";
      const shmPath = backupPath + "-shm";
      if (fs.existsSync(walPath)) {
        fs.unlinkSync(walPath);
      }
      if (fs.existsSync(shmPath)) {
        fs.unlinkSync(shmPath);
      }

      return { success: true };
    } catch (error) {
      console.error("Delete backup error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取最新备份时间
  ipcMain.handle("db:get-last-backup-time", async () => {
    try {
      const backupDir = getBackupDir();
      const files = fs.readdirSync(backupDir);

      const dbFiles = files
        .filter(
          (f) => f.endsWith(".db") && !f.includes("-wal") && !f.includes("-shm")
        )
        .map((f) => parseInt(f.replace(".db", ""), 10))
        .sort((a, b) => b - a);

      if (dbFiles.length === 0) {
        return { success: true, lastBackupTime: null };
      }

      return {
        success: true,
        lastBackupTime: dayjs(dbFiles[0]).format("YYYY-MM-DD HH:mm:ss"),
      };
    } catch (error) {
      console.error("Get last backup time error:", error);
      return { success: false, error: error.message };
    }
  });

  // 根据关键字搜索标签（模糊查询）
  ipcMain.handle("db:search-labels", async (event, field, keyword) => {
    try {
      const db = getDatabase();

      // 字段映射
      const fieldMap = {
        category: "category",
        productType: "product_type",
        bySku: "by_sku",
        fragrance: "fragrance",
      };

      const dbField = fieldMap[field];
      if (!dbField) {
        return { success: false, error: "无效的字段名" };
      }

      // 模糊查询，去重后返回
      // 支持空查询，返回所有选项（受LIMIT限制）
      const query = `
        SELECT DISTINCT ${dbField} as value
        FROM labels
        WHERE ${dbField} IS NOT NULL 
          AND ${dbField} != ''
          AND ${dbField} LIKE ?
        ORDER BY ${dbField}
        LIMIT 50
      `;

      const results = db.prepare(query).all(`%${keyword || ""}%`);

      return {
        success: true,
        data: results.map((row) => row.value).filter((v) => v),
      };
    } catch (error) {
      console.error("Search labels error:", error);
      return { success: false, error: error.message };
    }
  });

  // 获取标签字段的所有唯一值（用于下拉列表初始化）
  ipcMain.handle("db:get-label-values", async (event, field) => {
    try {
      const db = getDatabase();

      // 字段映射
      const fieldMap = {
        category: "category",
        productType: "product_type",
        bySku: "by_sku",
        fragrance: "fragrance",
      };

      const dbField = fieldMap[field];
      if (!dbField) {
        return { success: false, error: "无效的字段名" };
      }

      // 查询所有不重复的值
      const query = `
        SELECT DISTINCT ${dbField} as value
        FROM labels
        WHERE ${dbField} IS NOT NULL 
          AND ${dbField} != ''
        ORDER BY ${dbField}
      `;

      const results = db.prepare(query).all();

      return {
        success: true,
        data: results.map((row) => row.value).filter((v) => v),
      };
    } catch (error) {
      console.error("Get label values error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerDataHandlers,
};
