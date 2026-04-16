const express = require('express');
const {
  createBoard,
  getBoards,
  getBoardDetails,
  updateBoard,
  deleteBoard
} = require('../controllers/boardController');

const router = express.Router();

router.post('/', createBoard);
router.get('/', getBoards);
router.get('/:boardId', getBoardDetails);
router.put('/:boardId', updateBoard);
router.delete('/:boardId', deleteBoard);

module.exports = router;
