USE trello_clone;

ALTER TABLE boards
  ADD COLUMN background VARCHAR(255) DEFAULT '#f4f4f5';

ALTER TABLE cards
  ADD COLUMN due_date DATE,
  ADD COLUMN cover_image VARCHAR(500),
  ADD COLUMN is_archived BOOLEAN DEFAULT FALSE;

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
