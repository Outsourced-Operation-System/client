const { ipcMain } = require("electron");
const { getDatabase } = require("../database/index.cjs");

function registerProductHandlers() {
  // 搜索产品（分页）
  ipcMain.handle(
    "db:search-products",
    async (
      event,
      query,
      page = 1,
      pageSize = 20,
      sortProp = "",
      sortOrder = "",
      filterZeroStock = false,
      filterNoInfo = false
    ) => {
      try {
        const db = getDatabase();
        let sql = "SELECT * FROM goods WHERE 1=1";
        let countSql = "SELECT COUNT(*) as total FROM goods WHERE 1=1";
        const params = [];

        if (query) {
          const whereClause =
            " AND (product_name_en LIKE ? OR product_name_cn LIKE ? OR article_code LIKE ? OR tu LIKE ?)";
          sql += whereClause;
          countSql += whereClause;
          params.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
        }

        if (filterZeroStock) {
          sql += " AND qty_available > 0";
          countSql += " AND qty_available > 0";
        }

        if (filterNoInfo) {
          sql +=
            " AND NOT ((product_name_en IS NULL OR product_name_en = '') AND (product_name_cn IS NULL OR product_name_cn = ''))";
          countSql +=
            " AND NOT ((product_name_en IS NULL OR product_name_en = '') AND (product_name_cn IS NULL OR product_name_cn = ''))";
        }

        if (sortProp && sortOrder) {
          const direction = sortOrder === "ascending" ? "ASC" : "DESC";
          sql += ` ORDER BY ${sortProp} ${direction}`;
        }

        const offset = (page - 1) * pageSize;
        sql += ` LIMIT ${pageSize} OFFSET ${offset}`;

        const countStmt = db.prepare(countSql);
        const countResult = countStmt.get(...params);
        const total = countResult ? countResult.total : 0;

        const stmt = db.prepare(sql);
        const results = stmt.all(...params);

        // 清理结果，确保可以通过 IPC 传输
        const cleanResults = JSON.parse(JSON.stringify(results));

        return { list: cleanResults, total: Number(total) };
      } catch (error) {
        console.error("Search products error:", error);
        return { list: [], total: 0 };
      }
    }
  );

  // 搜索建议（自动完成）
  ipcMain.handle("db:search-product-suggestions", async (event, query) => {
    try {
      const db = getDatabase();

      if (!query || query.length < 2) {
        return [];
      }

      const sql = `
        SELECT DISTINCT product_name_cn, article_code, tu
        FROM goods
        WHERE product_name_cn LIKE ?
        LIMIT 10
      `;

      const stmt = db.prepare(sql);
      const results = stmt.all(`%${query}%`);

      // 将结果转换为纯 JSON 对象，避免 IPC 克隆错误
      const cleanResults = results.map((row) => {
        const obj = {
          product_name_cn: String(row.product_name_cn || ""),
          article_code: String(row.article_code || ""),
          tu: String(row.tu || ""),
        };
        return JSON.parse(JSON.stringify(obj));
      });

      return cleanResults;
    } catch (error) {
      console.error("Search suggestions error:", error);
      return [];
    }
  });

  // 根据搜索类型搜索产品
  ipcMain.handle(
    "db:search-products-by-types",
    async (event, query, searchTypes, filterZeroStock) => {
      try {
        const db = getDatabase();

        // 验证输入
        if (!query || !query.trim()) {
          return [];
        }

        if (!searchTypes || searchTypes.length === 0) {
          return [];
        }

        let conditions = [];
        const params = [];
        const searchTerm = query.trim();

        // 根据搜索类型构建条件
        if (searchTypes.includes("productName")) {
          conditions.push("product_name_cn LIKE ?");
          params.push(`%${searchTerm}%`);
        }
        if (searchTypes.includes("skuCode")) {
          conditions.push("tu LIKE ?");
          params.push(`%${searchTerm}%`);
        }
        if (searchTypes.includes("articleCode")) {
          conditions.push("article_code LIKE ?");
          params.push(`%${searchTerm}%`);
        }

        // 如果没有任何条件，返回空数组
        if (conditions.length === 0) {
          return [];
        }

        let sql = `
        SELECT 
          id, 
          article_code, 
          tu, 
          product_name_cn,
          product_name_en,
          declared_content,
          cn_current_price,
          qty_available,
          category,
          shelf_life,
          remaining_months,
          net_weight,
          item_size,
          country_of_origin
        FROM goods
        WHERE (${conditions.join(" OR ")})
      `;

        if (filterZeroStock) {
          sql += " AND qty_available > 0";
        }

        sql += " LIMIT 100";

        const stmt = db.prepare(sql);
        const results = stmt.all(...params);

        // 将结果转换为纯 JSON 对象，避免 IPC 克隆错误
        const cleanResults = results.map((row) => {
          const obj = {
            id: Number(row.id) || 0,
            article_code: String(row.article_code ?? "-"),
            tu: String(row.tu ?? "-"),
            product_name_cn: String(row.product_name_cn ?? "-"),
            product_name_en: String(row.product_name_en ?? "-"),
            declared_content: String(row.declared_content ?? "-"),
            cn_current_price: row.cn_current_price,
            qty_available: row.qty_available,
            category: String(row.category ?? "-"),
            shelf_life: String(row.shelf_life ?? "-"),
            remaining_months: String(row.remaining_months) || "",
            net_weight: String(row.net_weight ?? "-"),
            item_size: String(row.item_size ?? "-"),
            country_of_origin: String(row.country_of_origin ?? "-"),
          };
          // console.log("cn_current_price:", obj.cn_current_price);
          return JSON.parse(JSON.stringify(obj));
        });

        return cleanResults;
      } catch (error) {
        console.error("Search products by types error:", error);
        console.error("Query:", query);
        console.error("Search types:", searchTypes);
        console.error("Error details:", error.message, error.stack);
        return [];
      }
    }
  );

  // 查询指定A码的库存总数
  ipcMain.handle("db:get-article-stock-total", async (event, articleCode) => {
    try {
      const db = getDatabase();

      if (!articleCode || !articleCode.trim()) {
        return { total: 0 };
      }

      const sql = `
        SELECT SUM(qty_available) as total
        FROM inventory
        WHERE itm_articleid = ?
      `;

      const stmt = db.prepare(sql);
      const result = stmt.get(articleCode.trim());

      return { total: Number(result?.total) || 0 };
    } catch (error) {
      console.error("Get article stock total error:", error);
      return { total: 0 };
    }
  });
}

module.exports = {
  registerProductHandlers,
};
