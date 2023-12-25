const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database'); // Подключаем наш файл с базой данных

const app = express();
const PORT = 3022;

app.use(bodyParser.json());

// Роуты для просмотра продуктов
app.get('/products', (req, res) => {
  db.all('SELECT * FROM products', (err, products) => {
    if (err) {
      console.error('Error getting products:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    res.json(products);
  });
});


app.get('/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
    if (err) {
      console.error('Error getting product:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  });
});


// Роуты для управления продуктами
app.post('/products', (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  db.run('INSERT INTO products (name, price) VALUES (?, ?)', [name, price], function (err) {
    if (err) {
      console.error('Error adding product:', err.message);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    const newProductId = this.lastID;
    res.status(201).json({ id: newProductId, name, price });
  });
});

app.put('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
    const { name, price } = req.body;
  
    if (!name || !price) {
      return res.status(400).json({ message: 'Name and price are required' });
    }
  
    db.run('UPDATE products SET name = ?, price = ? WHERE id = ?', [name, price, productId], function (err) {
      if (err) {
        console.error('Error updating product:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      if (this.changes > 0) {
        res.json({ id: productId, name, price });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    });
  });

  app.delete('/products/:id', (req, res) => {
    const productId = parseInt(req.params.id);
  
    db.run('DELETE FROM products WHERE id = ?', [productId], function (err) {
      if (err) {
        console.error('Error deleting product:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
        return;
      }
  
      if (this.changes > 0) {
        res.json({ message: 'Product deleted successfully' });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    });
  });
  

// Обработка завершения работы приложения
process.on('exit', () => {
  db.close();
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
