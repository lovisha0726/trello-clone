const { pool } = require('../config/db');

const sendResponse = (res, statusCode, success, message, data = {}) => {
  return res.status(statusCode).json({ success, message, data });
};

const isEmpty = (value) => !value || !value.trim();

const createBoard = async (req, res) => {
  try {
    const { title, background } = req.body;

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'Board title is required');
    }

    const [result] = await pool.query(
      'INSERT INTO boards (title, background) VALUES (?, ?)',
      [title.trim(), background || '#f4f4f5']
    );

    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [result.insertId]);

    return sendResponse(res, 201, true, 'Board created successfully', rows[0]);
  } catch (err) {
    console.error('Create board error:', err);
    return sendResponse(res, 500, false, 'Failed to create board');
  }
};

const getBoardDetails = async (req, res) => {
  try {
    const { boardId } = req.params;

    const [boards] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);

    if (boards.length === 0) {
      return sendResponse(res, 404, false, 'Board not found');
    }

    const [lists] = await pool.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC, id ASC',
      [boardId]
    );

    const [cards] = await pool.query(
      `SELECT c.*
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = ? AND c.is_archived = FALSE
       ORDER BY c.list_id ASC, c.position ASC, c.id ASC`,
      [boardId]
    );

    const [labels] = await pool.query(
      'SELECT * FROM labels WHERE board_id = ? ORDER BY id ASC',
      [boardId]
    );

    const [members] = await pool.query(
      'SELECT * FROM members WHERE board_id = ? ORDER BY id ASC',
      [boardId]
    );

    const [cardLabels] = await pool.query(
      `SELECT cl.card_id, l.*
       FROM card_labels cl
       JOIN labels l ON cl.label_id = l.id
       WHERE l.board_id = ?`,
      [boardId]
    );

    const [cardMembers] = await pool.query(
      `SELECT cm.card_id, m.*
       FROM card_members cm
       JOIN members m ON cm.member_id = m.id
       WHERE m.board_id = ?`,
      [boardId]
    );

    return sendResponse(res, 200, true, 'Board details fetched successfully', {
      board: boards[0],
      lists,
      cards,
      labels,
      members,
      cardLabels,
      cardMembers
    });
  } catch (err) {
    console.error('Get board details error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch board details');
  }
};

const updateBoard = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title, background } = req.body;

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'Board title is required');
    }

    const [result] = await pool.query(
      'UPDATE boards SET title = ?, background = ? WHERE id = ?',
      [title.trim(), background || '#f4f4f5', boardId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Board not found');
    }

    const [rows] = await pool.query('SELECT * FROM boards WHERE id = ?', [boardId]);

    return sendResponse(res, 200, true, 'Board updated successfully', rows[0]);
  } catch (err) {
    console.error('Update board error:', err);
    return sendResponse(res, 500, false, 'Failed to update board');
  }
};

const getBoards = async (req, res) => {
  try {
    const [boards] = await pool.query('SELECT * FROM boards ORDER BY created_at DESC, id DESC');

    return sendResponse(res, 200, true, 'Boards fetched successfully', boards);
  } catch (err) {
    console.error('Get boards error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch boards');
  }
};

const deleteBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      return sendResponse(res, 400, false, 'Board id is required');
    }

    const [result] = await pool.query('DELETE FROM boards WHERE id = ?', [boardId]);

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Board not found');
    }

    return sendResponse(res, 200, true, 'Board deleted successfully');
  } catch (err) {
    console.error('Delete board error:', err);
    return sendResponse(res, 500, false, 'Failed to delete board');
  }
};

module.exports = {
  createBoard,
  getBoards,
  getBoardDetails,
  updateBoard,
  deleteBoard
};
