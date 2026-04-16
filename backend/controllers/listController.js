const { pool } = require('../config/db');

const sendResponse = (res, statusCode, success, message, data = {}) => {
  return res.status(statusCode).json({ success, message, data });
};

const isEmpty = (value) => !value || !value.trim();

const createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!boardId) {
      return sendResponse(res, 400, false, 'Board id is required');
    }

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'List title is required');
    }

    const [boards] = await pool.query('SELECT id FROM boards WHERE id = ?', [boardId]);

    if (boards.length === 0) {
      return sendResponse(res, 404, false, 'Board not found');
    }

    const [positionResult] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM lists WHERE board_id = ?',
      [boardId]
    );
    const position = positionResult[0].nextPosition;

    const [result] = await pool.query(
      'INSERT INTO lists (title, board_id, position) VALUES (?, ?, ?)',
      [title.trim(), boardId, position]
    );

    const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [result.insertId]);

    return sendResponse(res, 201, true, 'List created successfully', rows[0]);
  } catch (err) {
    console.error('Create list error:', err);
    return sendResponse(res, 500, false, 'Failed to create list');
  }
};

const getListsByBoard = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!boardId) {
      return sendResponse(res, 400, false, 'Board id is required');
    }

    const [lists] = await pool.query(
      'SELECT * FROM lists WHERE board_id = ? ORDER BY position ASC, id ASC',
      [boardId]
    );

    return sendResponse(res, 200, true, 'Lists fetched successfully', lists);
  } catch (err) {
    console.error('Get lists error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch lists');
  }
};

const updateList = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title } = req.body;

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'List title is required');
    }

    const [result] = await pool.query(
      'UPDATE lists SET title = ? WHERE id = ?',
      [title.trim(), listId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'List not found');
    }

    const [rows] = await pool.query('SELECT * FROM lists WHERE id = ?', [listId]);

    return sendResponse(res, 200, true, 'List updated successfully', rows[0]);
  } catch (err) {
    console.error('Update list error:', err);
    return sendResponse(res, 500, false, 'Failed to update list');
  }
};

const deleteList = async (req, res) => {
  try {
    const { listId } = req.params;

    const [result] = await pool.query('DELETE FROM lists WHERE id = ?', [listId]);

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'List not found');
    }

    return sendResponse(res, 200, true, 'List deleted successfully');
  } catch (err) {
    console.error('Delete list error:', err);
    return sendResponse(res, 500, false, 'Failed to delete list');
  }
};

const updateListPosition = async (req, res) => {
  const { lists } = req.body;

  if (!Array.isArray(lists) || lists.length === 0) {
    return sendResponse(res, 400, false, 'Lists array is required');
  }

  const invalidList = lists.find((list) => !list.id || list.position === undefined);

  if (invalidList) {
    return sendResponse(res, 400, false, 'Each list must have id and position');
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const list of lists) {
      await connection.query(
        'UPDATE lists SET position = ? WHERE id = ?',
        [list.position, list.id]
      );
    }

    await connection.commit();

    return sendResponse(res, 200, true, 'List positions updated successfully');
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Update list position error:', err);
    return sendResponse(res, 500, false, 'Failed to update list positions');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  createList,
  getListsByBoard,
  updateList,
  deleteList,
  updateListPosition
};
