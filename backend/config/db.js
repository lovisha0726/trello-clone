const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const requiredTables = [
  'boards',
  'lists',
  'cards',
  'labels',
  'card_labels',
  'members',
  'card_members',
  'checklist_items',
  'attachments',
  'comments',
  'card_activity'
];

const poolConfig = process.env.DATABASE_URL
  ? process.env.DATABASE_URL
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'trello_clone',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    };

const pool = mysql.createPool(poolConfig);

const testConnection = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
    console.log('MySQL database connected');
  } finally {
    connection.release();
  }
};

const tableStatements = [
  `CREATE TABLE IF NOT EXISTS boards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    background VARCHAR(255) DEFAULT '#f4f4f5',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS lists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    board_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_lists_board
      FOREIGN KEY (board_id) REFERENCES boards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    list_id INT NOT NULL,
    position INT NOT NULL DEFAULT 1,
    due_date DATE,
    cover_image VARCHAR(500),
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cards_list
      FOREIGN KEY (list_id) REFERENCES lists(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS labels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(30) NOT NULL,
    CONSTRAINT fk_labels_board
      FOREIGN KEY (board_id) REFERENCES boards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS card_labels (
    card_id INT NOT NULL,
    label_id INT NOT NULL,
    PRIMARY KEY (card_id, label_id),
    CONSTRAINT fk_card_labels_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_card_labels_label
      FOREIGN KEY (label_id) REFERENCES labels(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    board_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(30) NOT NULL,
    CONSTRAINT fk_members_board
      FOREIGN KEY (board_id) REFERENCES boards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS card_members (
    card_id INT NOT NULL,
    member_id INT NOT NULL,
    PRIMARY KEY (card_id, member_id),
    CONSTRAINT fk_card_members_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE,
    CONSTRAINT fk_card_members_member
      FOREIGN KEY (member_id) REFERENCES members(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS checklist_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    position INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_checklist_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS attachments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_attachments_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    member_name VARCHAR(100) DEFAULT 'Guest',
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS card_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    card_id INT NOT NULL,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_activity_card
      FOREIGN KEY (card_id) REFERENCES cards(id)
      ON DELETE CASCADE
  )`
];

const initializeDatabase = async () => {
  await testConnection();

  for (const statement of tableStatements) {
    await pool.query(statement);
  }

  console.log('Database schema ready');
};

const getDatabaseStatus = async () => {
  const [tables] = await pool.query('SHOW TABLES');
  const tableNames = tables.map((row) => Object.values(row)[0]);

  return {
    connected: true,
    missingTables: requiredTables.filter((table) => !tableNames.includes(table)),
    tables: tableNames
  };
};

module.exports = {
  pool,
  testConnection,
  initializeDatabase,
  getDatabaseStatus
};
