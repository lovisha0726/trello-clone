const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const database = process.env.DB_NAME || 'trello_clone';

const createConnection = () => {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    multipleStatements: true
  });
};

const columnExists = async (connection, tableName, columnName) => {
  const [rows] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [database, tableName, columnName]
  );

  return rows.length > 0;
};

const addColumnIfMissing = async (connection, tableName, columnName, definition) => {
  const exists = await columnExists(connection, tableName, columnName);

  if (!exists) {
    await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
    console.log(`Added ${tableName}.${columnName}`);
  }
};

const run = async () => {
  const connection = await createConnection();

  try {
    await addColumnIfMissing(connection, 'boards', 'background', "VARCHAR(255) DEFAULT '#f4f4f5'");
    await addColumnIfMissing(connection, 'cards', 'due_date', 'DATE');
    await addColumnIfMissing(connection, 'cards', 'cover_image', 'VARCHAR(500)');
    await addColumnIfMissing(connection, 'cards', 'is_archived', 'BOOLEAN DEFAULT FALSE');

    await connection.query(`
      CREATE TABLE IF NOT EXISTS labels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        board_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        color VARCHAR(30) NOT NULL,
        CONSTRAINT fk_labels_board
          FOREIGN KEY (board_id) REFERENCES boards(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS card_labels (
        card_id INT NOT NULL,
        label_id INT NOT NULL,
        PRIMARY KEY (card_id, label_id),
        CONSTRAINT fk_card_labels_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_card_labels_label
          FOREIGN KEY (label_id) REFERENCES labels(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        board_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        avatar_color VARCHAR(30) NOT NULL,
        CONSTRAINT fk_members_board
          FOREIGN KEY (board_id) REFERENCES boards(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS card_members (
        card_id INT NOT NULL,
        member_id INT NOT NULL,
        PRIMARY KEY (card_id, member_id),
        CONSTRAINT fk_card_members_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_card_members_member
          FOREIGN KEY (member_id) REFERENCES members(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        position INT NOT NULL DEFAULT 1,
        CONSTRAINT fk_checklist_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_attachments_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id INT NOT NULL,
        member_name VARCHAR(100) DEFAULT 'Guest',
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_comments_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS card_activity (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_id INT NOT NULL,
        message VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_activity_card
          FOREIGN KEY (card_id) REFERENCES cards(id)
          ON DELETE CASCADE
      );
    `);

    console.log('Database upgrade completed');
  } finally {
    await connection.end();
  }
};

run().catch((err) => {
  console.error('Database upgrade failed:', err.message);
  process.exit(1);
});
