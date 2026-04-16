CREATE DATABASE IF NOT EXISTS trello_clone;
USE trello_clone;

DROP TABLE IF EXISTS card_activity;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS attachments;
DROP TABLE IF EXISTS checklist_items;
DROP TABLE IF EXISTS card_members;
DROP TABLE IF EXISTS members;
DROP TABLE IF EXISTS card_labels;
DROP TABLE IF EXISTS labels;
DROP TABLE IF EXISTS cards;
DROP TABLE IF EXISTS lists;
DROP TABLE IF EXISTS boards;

CREATE TABLE boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  background VARCHAR(255) DEFAULT '#f4f4f5',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  board_id INT NOT NULL,
  position INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_lists_board
    FOREIGN KEY (board_id) REFERENCES boards(id)
    ON DELETE CASCADE
);

CREATE TABLE cards (
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
);

CREATE TABLE labels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(30) NOT NULL,
  CONSTRAINT fk_labels_board
    FOREIGN KEY (board_id) REFERENCES boards(id)
    ON DELETE CASCADE
);

CREATE TABLE card_labels (
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

CREATE TABLE members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_color VARCHAR(30) NOT NULL,
  CONSTRAINT fk_members_board
    FOREIGN KEY (board_id) REFERENCES boards(id)
    ON DELETE CASCADE
);

CREATE TABLE card_members (
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

CREATE TABLE checklist_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  position INT NOT NULL DEFAULT 1,
  CONSTRAINT fk_checklist_card
    FOREIGN KEY (card_id) REFERENCES cards(id)
    ON DELETE CASCADE
);

CREATE TABLE attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_attachments_card
    FOREIGN KEY (card_id) REFERENCES cards(id)
    ON DELETE CASCADE
);

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  member_name VARCHAR(100) DEFAULT 'Guest',
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_card
    FOREIGN KEY (card_id) REFERENCES cards(id)
    ON DELETE CASCADE
);

CREATE TABLE card_activity (
  id INT AUTO_INCREMENT PRIMARY KEY,
  card_id INT NOT NULL,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_activity_card
    FOREIGN KEY (card_id) REFERENCES cards(id)
    ON DELETE CASCADE
);

INSERT INTO boards (title) VALUES
('Main Project Board');

INSERT INTO lists (title, board_id, position) VALUES
('To Do', 1, 1),
('In Progress', 1, 2),
('Done', 1, 3);

INSERT INTO cards (title, description, list_id, position, due_date, cover_image) VALUES
('Design Database Schema', 'Create boards, lists and cards tables.', 1, 1, DATE_ADD(CURDATE(), INTERVAL 2 DAY), ''),
('Setup React Project', 'Prepare frontend structure.', 1, 2, DATE_ADD(CURDATE(), INTERVAL 4 DAY), ''),
('Develop Backend API', 'Build Express APIs for Trello clone.', 2, 1, DATE_ADD(CURDATE(), INTERVAL 7 DAY), ''),
('Gather Requirements', 'Understand required features.', 3, 1, NULL, '');

INSERT INTO labels (board_id, name, color) VALUES
(1, 'Frontend', '#2563eb'),
(1, 'Backend', '#16a34a'),
(1, 'Important', '#dc2626'),
(1, 'Review', '#ca8a04');

INSERT INTO members (board_id, name, avatar_color) VALUES
(1, 'Aarav', '#2563eb'),
(1, 'Meera', '#16a34a'),
(1, 'Rohan', '#9333ea');

INSERT INTO card_labels (card_id, label_id) VALUES
(1, 2),
(2, 1),
(3, 2),
(4, 4);

INSERT INTO card_members (card_id, member_id) VALUES
(1, 1),
(2, 2),
(3, 1),
(3, 3);

INSERT INTO checklist_items (card_id, title, is_completed, position) VALUES
(1, 'Create boards table', true, 1),
(1, 'Create lists table', true, 2),
(1, 'Create cards table', false, 3),
(3, 'Add controllers', true, 1),
(3, 'Test APIs', false, 2);

INSERT INTO comments (card_id, member_name, comment) VALUES
(1, 'Aarav', 'Schema looks good. Need to check cascade delete.'),
(3, 'Rohan', 'Backend routes are ready for frontend integration.');

INSERT INTO card_activity (card_id, message) VALUES
(1, 'Card created'),
(3, 'Moved to In Progress');
