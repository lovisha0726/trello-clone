const { pool } = require('../config/db');

const sendResponse = (res, statusCode, success, message, data = {}) => {
  return res.status(statusCode).json({ success, message, data });
};

const isEmpty = (value) => !value || !value.trim();

const addActivity = async (cardId, message, connection = pool) => {
  await connection.query(
    'INSERT INTO card_activity (card_id, message) VALUES (?, ?)',
    [cardId, message]
  );
};

const getCardFullDetails = async (cardId) => {
  const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);

  if (cards.length === 0) return null;

  const [labels] = await pool.query(
    `SELECT l.*
     FROM card_labels cl
     JOIN labels l ON cl.label_id = l.id
     WHERE cl.card_id = ?
     ORDER BY l.id ASC`,
    [cardId]
  );

  const [members] = await pool.query(
    `SELECT m.*
     FROM card_members cm
     JOIN members m ON cm.member_id = m.id
     WHERE cm.card_id = ?
     ORDER BY m.id ASC`,
    [cardId]
  );

  const [checklist] = await pool.query(
    'SELECT * FROM checklist_items WHERE card_id = ? ORDER BY position ASC, id ASC',
    [cardId]
  );

  const [attachments] = await pool.query(
    'SELECT * FROM attachments WHERE card_id = ? ORDER BY created_at DESC',
    [cardId]
  );

  const [comments] = await pool.query(
    'SELECT * FROM comments WHERE card_id = ? ORDER BY created_at DESC',
    [cardId]
  );

  const [activity] = await pool.query(
    'SELECT * FROM card_activity WHERE card_id = ? ORDER BY created_at DESC',
    [cardId]
  );

  return {
    ...cards[0],
    labels,
    members,
    checklist,
    attachments,
    comments,
    activity
  };
};

const createCard = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description, due_date, cover_image } = req.body;

    if (!listId) {
      return sendResponse(res, 400, false, 'List id is required');
    }

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'Card title is required');
    }

    const [lists] = await pool.query('SELECT id FROM lists WHERE id = ?', [listId]);

    if (lists.length === 0) {
      return sendResponse(res, 404, false, 'List not found');
    }

    const [positionResult] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM cards WHERE list_id = ? AND is_archived = FALSE',
      [listId]
    );
    const position = positionResult[0].nextPosition;

    const [result] = await pool.query(
      `INSERT INTO cards (title, description, list_id, position, due_date, cover_image)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title.trim(), description || '', listId, position, due_date || null, cover_image || '']
    );

    await addActivity(result.insertId, 'Card created');

    const card = await getCardFullDetails(result.insertId);

    return sendResponse(res, 201, true, 'Card created successfully', card);
  } catch (err) {
    console.error('Create card error:', err);
    return sendResponse(res, 500, false, 'Failed to create card');
  }
};

const getCardsByList = async (req, res) => {
  try {
    const { listId } = req.params;

    if (!listId) {
      return sendResponse(res, 400, false, 'List id is required');
    }

    const [cards] = await pool.query(
      'SELECT * FROM cards WHERE list_id = ? AND is_archived = FALSE ORDER BY position ASC, id ASC',
      [listId]
    );

    return sendResponse(res, 200, true, 'Cards fetched successfully', cards);
  } catch (err) {
    console.error('Get cards error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch cards');
  }
};

const getCardDetails = async (req, res) => {
  try {
    const card = await getCardFullDetails(req.params.cardId);

    if (!card) {
      return sendResponse(res, 404, false, 'Card not found');
    }

    return sendResponse(res, 200, true, 'Card details fetched successfully', card);
  } catch (err) {
    console.error('Get card details error:', err);
    return sendResponse(res, 500, false, 'Failed to fetch card details');
  }
};

const updateCard = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title, description, due_date, cover_image } = req.body;

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'Card title is required');
    }

    const [result] = await pool.query(
      `UPDATE cards
       SET title = ?, description = ?, due_date = ?, cover_image = ?
       WHERE id = ?`,
      [title.trim(), description || '', due_date || null, cover_image || '', cardId]
    );

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Card not found');
    }

    await addActivity(cardId, 'Card details updated');
    const card = await getCardFullDetails(cardId);

    return sendResponse(res, 200, true, 'Card updated successfully', card);
  } catch (err) {
    console.error('Update card error:', err);
    return sendResponse(res, 500, false, 'Failed to update card');
  }
};

const updateCardPosition = async (req, res) => {
  const { cards } = req.body;

  if (!Array.isArray(cards) || cards.length === 0) {
    return sendResponse(res, 400, false, 'Cards array is required');
  }

  const invalidCard = cards.find(
    (card) => !card.id || !card.list_id || card.position === undefined
  );

  if (invalidCard) {
    return sendResponse(res, 400, false, 'Each card must have id, list_id and position');
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const card of cards) {
      await connection.query(
        'UPDATE cards SET list_id = ?, position = ? WHERE id = ?',
        [card.list_id, card.position, card.id]
      );
      await addActivity(card.id, 'Card moved', connection);
    }

    await connection.commit();

    return sendResponse(res, 200, true, 'Card positions updated successfully');
  } catch (err) {
    if (connection) {
      await connection.rollback();
    }

    console.error('Update card position error:', err);
    return sendResponse(res, 500, false, 'Failed to update card positions');
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

const deleteCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const [result] = await pool.query('DELETE FROM cards WHERE id = ?', [cardId]);

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Card not found');
    }

    return sendResponse(res, 200, true, 'Card deleted successfully');
  } catch (err) {
    console.error('Delete card error:', err);
    return sendResponse(res, 500, false, 'Failed to delete card');
  }
};

const archiveCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    const [result] = await pool.query('UPDATE cards SET is_archived = TRUE WHERE id = ?', [cardId]);

    if (result.affectedRows === 0) {
      return sendResponse(res, 404, false, 'Card not found');
    }

    await addActivity(cardId, 'Card archived');
    return sendResponse(res, 200, true, 'Card archived successfully');
  } catch (err) {
    console.error('Archive card error:', err);
    return sendResponse(res, 500, false, 'Failed to archive card');
  }
};

const createLabel = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, color } = req.body;

    if (isEmpty(name)) {
      return sendResponse(res, 400, false, 'Label name is required');
    }

    const [result] = await pool.query(
      'INSERT INTO labels (board_id, name, color) VALUES (?, ?, ?)',
      [boardId, name.trim(), color || '#2563eb']
    );

    const [rows] = await pool.query('SELECT * FROM labels WHERE id = ?', [result.insertId]);

    return sendResponse(res, 201, true, 'Label created successfully', rows[0]);
  } catch (err) {
    console.error('Create label error:', err);
    return sendResponse(res, 500, false, 'Failed to create label');
  }
};

const addLabelToCard = async (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    await pool.query(
      'INSERT IGNORE INTO card_labels (card_id, label_id) VALUES (?, ?)',
      [cardId, labelId]
    );
    await addActivity(cardId, 'Label added');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Label added to card', card);
  } catch (err) {
    console.error('Add label error:', err);
    return sendResponse(res, 500, false, 'Failed to add label');
  }
};

const removeLabelFromCard = async (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    await pool.query('DELETE FROM card_labels WHERE card_id = ? AND label_id = ?', [cardId, labelId]);
    await addActivity(cardId, 'Label removed');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Label removed from card', card);
  } catch (err) {
    console.error('Remove label error:', err);
    return sendResponse(res, 500, false, 'Failed to remove label');
  }
};

const createMember = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, avatar_color } = req.body;

    if (isEmpty(name)) {
      return sendResponse(res, 400, false, 'Member name is required');
    }

    const [result] = await pool.query(
      'INSERT INTO members (board_id, name, avatar_color) VALUES (?, ?, ?)',
      [boardId, name.trim(), avatar_color || '#2563eb']
    );

    const [rows] = await pool.query('SELECT * FROM members WHERE id = ?', [result.insertId]);

    return sendResponse(res, 201, true, 'Member created successfully', rows[0]);
  } catch (err) {
    console.error('Create member error:', err);
    return sendResponse(res, 500, false, 'Failed to create member');
  }
};

const addMemberToCard = async (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    await pool.query(
      'INSERT IGNORE INTO card_members (card_id, member_id) VALUES (?, ?)',
      [cardId, memberId]
    );
    await addActivity(cardId, 'Member assigned');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Member assigned to card', card);
  } catch (err) {
    console.error('Add member error:', err);
    return sendResponse(res, 500, false, 'Failed to assign member');
  }
};

const removeMemberFromCard = async (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    await pool.query('DELETE FROM card_members WHERE card_id = ? AND member_id = ?', [cardId, memberId]);
    await addActivity(cardId, 'Member removed');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Member removed from card', card);
  } catch (err) {
    console.error('Remove member error:', err);
    return sendResponse(res, 500, false, 'Failed to remove member');
  }
};

const addChecklistItem = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title } = req.body;

    if (isEmpty(title)) {
      return sendResponse(res, 400, false, 'Checklist item title is required');
    }

    const [positionResult] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) + 1 AS nextPosition FROM checklist_items WHERE card_id = ?',
      [cardId]
    );

    await pool.query(
      'INSERT INTO checklist_items (card_id, title, position) VALUES (?, ?, ?)',
      [cardId, title.trim(), positionResult[0].nextPosition]
    );
    await addActivity(cardId, 'Checklist item added');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 201, true, 'Checklist item added', card);
  } catch (err) {
    console.error('Add checklist error:', err);
    return sendResponse(res, 500, false, 'Failed to add checklist item');
  }
};

const updateChecklistItem = async (req, res) => {
  try {
    const { cardId, itemId } = req.params;
    const { title, is_completed } = req.body;

    await pool.query(
      'UPDATE checklist_items SET title = COALESCE(?, title), is_completed = COALESCE(?, is_completed) WHERE id = ? AND card_id = ?',
      [title || null, is_completed === undefined ? null : is_completed, itemId, cardId]
    );
    await addActivity(cardId, 'Checklist item updated');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Checklist item updated', card);
  } catch (err) {
    console.error('Update checklist error:', err);
    return sendResponse(res, 500, false, 'Failed to update checklist item');
  }
};

const deleteChecklistItem = async (req, res) => {
  try {
    const { cardId, itemId } = req.params;

    await pool.query('DELETE FROM checklist_items WHERE id = ? AND card_id = ?', [itemId, cardId]);
    await addActivity(cardId, 'Checklist item removed');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 200, true, 'Checklist item removed', card);
  } catch (err) {
    console.error('Delete checklist error:', err);
    return sendResponse(res, 500, false, 'Failed to delete checklist item');
  }
};

const addAttachment = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { file_name, file_url } = req.body;

    if (isEmpty(file_name) || isEmpty(file_url)) {
      return sendResponse(res, 400, false, 'File name and URL are required');
    }

    await pool.query(
      'INSERT INTO attachments (card_id, file_name, file_url) VALUES (?, ?, ?)',
      [cardId, file_name.trim(), file_url.trim()]
    );
    await addActivity(cardId, 'Attachment added');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 201, true, 'Attachment added', card);
  } catch (err) {
    console.error('Add attachment error:', err);
    return sendResponse(res, 500, false, 'Failed to add attachment');
  }
};

const addComment = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { member_name, comment } = req.body;

    if (isEmpty(comment)) {
      return sendResponse(res, 400, false, 'Comment is required');
    }

    await pool.query(
      'INSERT INTO comments (card_id, member_name, comment) VALUES (?, ?, ?)',
      [cardId, member_name || 'Guest', comment.trim()]
    );
    await addActivity(cardId, 'Comment added');

    const card = await getCardFullDetails(cardId);
    return sendResponse(res, 201, true, 'Comment added', card);
  } catch (err) {
    console.error('Add comment error:', err);
    return sendResponse(res, 500, false, 'Failed to add comment');
  }
};

module.exports = {
  createCard,
  getCardsByList,
  getCardDetails,
  updateCard,
  updateCardPosition,
  deleteCard,
  archiveCard,
  createLabel,
  addLabelToCard,
  removeLabelFromCard,
  createMember,
  addMemberToCard,
  removeMemberFromCard,
  addChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
  addAttachment,
  addComment
};
