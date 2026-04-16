const express = require('express');
const {
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
} = require('../controllers/cardController');

const router = express.Router();

router.post('/list/:listId', createCard);
router.get('/list/:listId', getCardsByList);
router.put('/position', updateCardPosition);
router.put('/reorder', updateCardPosition);

router.post('/labels/board/:boardId', createLabel);
router.post('/members/board/:boardId', createMember);

router.get('/:cardId', getCardDetails);
router.put('/:cardId', updateCard);
router.delete('/:cardId', deleteCard);
router.patch('/:cardId/archive', archiveCard);

router.post('/:cardId/labels/:labelId', addLabelToCard);
router.delete('/:cardId/labels/:labelId', removeLabelFromCard);

router.post('/:cardId/members/:memberId', addMemberToCard);
router.delete('/:cardId/members/:memberId', removeMemberFromCard);

router.post('/:cardId/checklist', addChecklistItem);
router.put('/:cardId/checklist/:itemId', updateChecklistItem);
router.delete('/:cardId/checklist/:itemId', deleteChecklistItem);

router.post('/:cardId/attachments', addAttachment);
router.post('/:cardId/comments', addComment);

module.exports = router;
