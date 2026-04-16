const express = require('express');
const {
  createList,
  getListsByBoard,
  updateList,
  deleteList,
  updateListPosition
} = require('../controllers/listController');

const router = express.Router();

router.post('/board/:boardId', createList);
router.get('/board/:boardId', getListsByBoard);
router.put('/position', updateListPosition);
router.put('/reorder', updateListPosition);
router.put('/:listId', updateList);
router.delete('/:listId', deleteList);

module.exports = router;
