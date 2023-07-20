var express = require("express");
var router = express.Router();
var moment = require("moment");

/* GET home page. */
module.exports = function (db) {
  router.get("/", function (req, res, next) {
    res.render("index", { title: "Express" });
  });
  router.get("/data", (req, res) => {
    const url = req.url === "/data" ? "/data/?page=1" : req.url;
    const page = req.query.page || 1;

    const limit = 5;
    const offset = (page - 1) * limit;
    const searchConditions = [];
    const queryParams = [];

    if (req.query.search_string && req.query.string) {
      searchConditions.push(req.query.search_string);
      queryParams.push(`string iLIKE '%' || $${searchConditions.length} ||'%'`);
    }

    if (req.query.search_integer && req.query.integer) {
      searchConditions.push(req.query.search_integer);
      queryParams.push(`integer = $${searchConditions.length}`);
    }

    if (req.query.search_float && req.query.float) {
      searchConditions.push(req.query.search_float);
      queryParams.push(`float = $${searchConditions.length}`);
    }

    if (req.query.search_date && req.query.date) {
      searchConditions.push(req.query.search_date);
      queryParams.push(`date = $${searchConditions.length}`);
    }

    if (req.query.search_boolean && req.query.boolean) {
      searchConditions.push(req.query.search_boolean);
      queryParams.push(`boolean = $${searchConditions.length}`);
    }

    queryCount = "SELECT count(*) as count FROM data";

    if (searchConditions.length > 0) {
      queryCount += ` WHERE  ${queryParams.join(" AND ")}`;
    }

    db.query(queryCount, searchConditions, (err, result) => {
      if (err) {
        console.log(err);
      }
      const totalPages = Math.ceil(result.rows[0].count / limit);

      let query = "select * from data";
      if (searchConditions.length > 0) {
        query += ` WHERE  ${queryParams.join(" AND ")}`;
      }

      const sortOrder = req.query.sortOrder || "asc"; // Ambil query parameter sortOrder
      const sortBy =
        req.query.sortBy ||
        "id" ||
        "string" ||
        "integer" ||
        "float" ||
        "date" ||
        "boolean";

      let sort;
      if (sortOrder === "asc") {
        sort = "ASC"; // Urutan ascending
      } else {
        sort = "DESC"; // Urutan descending
      }

      searchConditions.push(limit, offset);
      query += ` order by ${sortBy} ${sort}`;
      query += ` limit $${searchConditions.length - 1} offset $${
        searchConditions.length
      }`;

      db.query(query, searchConditions, (err, data) => {
        if (err) {
          console.log(err);
        }
        console.log(query);
        res.render("data", {
          data: data.rows,
          pages: totalPages,
          sql: req.query,
          url: url,
          page: page,
          moment: moment,
          sortOrder: sortOrder,
          sortBy: sortBy,
          sort,
        });
      });
    });
  });

  router.get("/data/add", (req, res) => {
    res.render("add", { data: {}, moment });
  });

  router.post("/add", (req, res) => {
    db.query(
      "INSERT INTO data(string, integer, float, date, boolean) VALUES ($1, $2, $3, $4, $5)",
      [
        req.body.string,
        req.body.integer,
        req.body.float,
        req.body.date,
        req.body.boolean,
      ],
      (err, data) => {
        if (err) {
          console.log(err);
        }
        res.redirect("/data");
      }
    );
  });

  router.get("/data/edit/:id", (req, res) => {
    const id = req.params.id;
    db.query("SELECT * FROM data WHERE id = $1", [id], (err, item) => {
      if (err) {
        console.log(err);
      }
      console.log(item);
      res.render("edit", { data: item.rows[0], moment });
    });
  });

  router.post("/data/edit/:id", (req, res) => {
    const id = req.params.id;
    db.query(
      "UPDATE data SET string = $1, integer = $2, float = $3, date = $4, boolean = $5 where id = $6",
      [
        req.body.string,
        req.body.integer,
        req.body.float,
        req.body.date,
        req.body.boolean,
        id,
      ],
      function (err) {
        if (err) {
          console.error(err);
        } else {
          res.redirect("/data");
        }
      }
    );
  });

  // router.get("/data/edit/:id", (req, res) => {
  //   const id = req.params.id;
  //   db.query("SELECT * FROM data WHERE id = ?", [id], (err, row) => {
  //     if (err) {
  //       console.error(err);
  //     } else {
  //       res.render("edit", { data: row, query: req.query });
  //     }
  //   });
  // });

  // router.post("/edit/:id", (req, res) => {
  //   const id = req.params.id;
  //   const { string, integer, float, date, boolean } = req.body;
  //   db.query(
  //     "UPDATE bread SET string = ?, integer = ?, float = ?, date = ?, boolean = ? WHERE id = ?",
  //     [string, integer, float, date, boolean, id],
  //     (err) => {
  //       if (err) {
  //         console.error(err);
  //       }
  //       res.redirect("/data");
  //     }
  //   );
  // });

  router.get("/data/delete/:id", (req, res) => {
    const id = req.params.id;
    db.query("DELETE FROM data WHERE id = $1", [id], (err) => {
      if (err) {
        console.log("hapus data Kontrak gagal");
      } else {
        res.redirect("/data");
      }
    });
  });

  return router;
};
