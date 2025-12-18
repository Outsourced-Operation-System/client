const { ipcMain, dialog } = require("electron");
const { getDatabase } = require("../database/index.cjs");
const xlsx = require("xlsx");
const dayjs = require("dayjs");

/**
 * 注册数据导入导出相关的 IPC handlers
 */
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
            db.prepare("DELETE FROM goods").run();
          }

          // 货品表字段映射 - 包含所有字段
          const stmt = db.prepare(`
            INSERT INTO goods (
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

  // 导出产品视图
  ipcMain.handle("db:export-products", async () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare(
        "SELECT * FROM products_view ORDER BY category, article_code"
      );
      const rows = stmt.all();
      const results = rows.map((row) => ({
        Category: row.category,
        "Article Code": row.article_code,
        TU: row.tu,
        "Product Name (EN)": row.product_name_en,
        "Product Name (CN)": row.product_name_cn,
        "Declared Content": row.declared_content,
        "CN Current Price": row.cn_current_price,
        "Shelf Life": row.shelf_life,
        "Net Weight Product (kg)": row.net_weight,
        "Item Size L x W x H (mm)": row.item_size,
        "Country of Origin": row.country_of_origin,
        "Qty Available": row.qty_available || 0,
      }));

      const ws = xlsx.utils.json_to_sheet(results);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "Products");

      const { filePath } = await dialog.showSaveDialog({
        title: "导出商品数据",
        defaultPath: `products_view_export_${dayjs().format(
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

  // 导出货品表
  ipcMain.handle("db:export-goods", async () => {
    try {
      const db = getDatabase();
      const stmt = db.prepare("SELECT * FROM goods");
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
      xlsx.utils.book_append_sheet(wb, ws, "Goods");

      const { filePath } = await dialog.showSaveDialog({
        title: "导出货品表",
        defaultPath: `goods_export_${dayjs().format("YYYYMMDD_HHmmss")}.xlsx`,
        filters: [{ name: "Excel Files", extensions: ["xlsx"] }],
      });

      if (filePath) {
        xlsx.writeFile(wb, filePath);
        return { success: true, filePath, count: results.length };
      } else {
        return { success: false, error: "用户取消了保存" };
      }
    } catch (error) {
      console.error("Export goods error:", error);
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
  ipcMain.handle("db:clear-goods", async () => {
    try {
      const db = getDatabase();
      db.prepare("DELETE FROM goods").run();
      return { success: true };
    } catch (error) {
      console.error("Clear goods error:", error);
      return { success: false, error: error.message };
    }
  });

  // 清空库存表
  ipcMain.handle("db:clear-inventory", async () => {
    try {
      const db = getDatabase();
      db.prepare("DELETE FROM inventory").run();
      return { success: true };
    } catch (error) {
      console.error("Clear inventory error:", error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = {
  registerDataHandlers,
};
