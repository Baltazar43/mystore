const express = require("express");
const bodyParser = require("body-parser");
const db = require("./database");
const jwt = require("jsonwebtoken");

const app = express();
const PORT = 3003;
const SECRET_KEY = "1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t";

app.use(bodyParser.json());

// Регистрация нового пользователя
app.post("/register", (req, res) => {
  const { username, password, role, firstName, lastName, city } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ message: "Username, password, and role are required" });
  }

  db.run(
    "INSERT INTO users (username, password, role, firstName, lastName, city) VALUES (?, ?, ?, ?, ?, ?)",
    [username, password, role, firstName, lastName, city],
    function (err) {
      if (err) {
        console.error("Error registering user:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
        return;
      }

      const newUserId = this.lastID;
      res.status(201).json({ id: newUserId, username, role });
    },
  );
});

// Аутентификация и генерация JWT-токена
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const user = { username, role: "user" }; 

  const token = jwt.sign(user, SECRET_KEY, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware для проверки JWT-токена
function verifyToken(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = decoded;
    next();
  });
}

// Пример защищенного маршрута с использованием middleware
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

// Роуты для просмотра продуктов
app.get("/products", (req, res) => {
  db.all("SELECT * FROM products", (err, products) => {
    if (err) {
      console.error("Error getting products:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(products);
  });
});

app.get("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err) {
      console.error("Error getting product:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });
});

// Роуты для управления продуктами
app.post("/products", (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Name and price are required" });
  }

  db.run("INSERT INTO products (name, price) VALUES (?, ?)", [name, price], function (err) {
    if (err) {
      console.error("Error adding product:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    const newProductId = this.lastID;
    res.status(201).json({ id: newProductId, name, price });
  });
});

app.put("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: "Name and price are required" });
  }

  db.run("UPDATE products SET name = ?, price = ? WHERE id = ?", [name, price, productId], function (err) {
    if (err) {
      console.error("Error updating product:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (this.changes > 0) {
      res.json({ id: productId, name, price });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });
});

app.delete("/products/:id", (req, res) => {
  const productId = parseInt(req.params.id);

  db.run("DELETE FROM products WHERE id = ?", [productId], function (err) {
    if (err) {
      console.error("Error deleting product:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    if (this.changes > 0) {
      res.json({ message: "Product deleted successfully" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  });
});

// Роут для просмотра всех пользователей
app.get("/users", (req, res) => {
  db.all("SELECT id, username, role, firstName, lastName, city FROM users", (err, users) => {
    if (err) {
      console.error("Error getting users:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }

    res.json(users);
  });
});

// Обработка завершения работы приложения
process.on("exit", () => {
  db.close();
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
