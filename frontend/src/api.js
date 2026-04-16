import axios from 'axios';

const normalizeApiUrl = (url) => {
  if (!url) {
    return import.meta.env.PROD ? '/api' : 'http://localhost:5000/api';
  }

  const cleanUrl = url.replace(/\/+$/, '');
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const api = axios.create({
  baseURL: normalizeApiUrl(import.meta.env.VITE_API_URL)
});

const getData = (response) => response.data.data;

export const boardApi = {
  getBoards: async () => getData(await api.get('/boards')),
  getBoardDetails: async (boardId) => getData(await api.get(`/boards/${boardId}`)),
  createBoard: async (title, background) => getData(await api.post('/boards', { title, background })),
  updateBoard: async (boardId, board) => getData(await api.put(`/boards/${boardId}`, board))
};

export const listApi = {
  getListsByBoard: async (boardId) => getData(await api.get(`/lists/board/${boardId}`)),
  createList: async (boardId, title) => getData(await api.post(`/lists/board/${boardId}`, { title })),
  updateList: async (listId, title) => getData(await api.put(`/lists/${listId}`, { title })),
  deleteList: async (listId) => getData(await api.delete(`/lists/${listId}`)),
  updatePositions: async (lists) => getData(await api.put('/lists/position', { lists }))
};

export const cardApi = {
  getCardsByList: async (listId) => getData(await api.get(`/cards/list/${listId}`)),
  createCard: async (listId, card) => getData(await api.post(`/cards/list/${listId}`, card)),
  getCardDetails: async (cardId) => getData(await api.get(`/cards/${cardId}`)),
  updateCard: async (cardId, card) => getData(await api.put(`/cards/${cardId}`, card)),
  updatePositions: async (cards) => getData(await api.put('/cards/position', { cards })),
  deleteCard: async (cardId) => getData(await api.delete(`/cards/${cardId}`)),
  archiveCard: async (cardId) => getData(await api.patch(`/cards/${cardId}/archive`)),
  createLabel: async (boardId, label) => getData(await api.post(`/cards/labels/board/${boardId}`, label)),
  createMember: async (boardId, member) => getData(await api.post(`/cards/members/board/${boardId}`, member)),
  addLabel: async (cardId, labelId) => getData(await api.post(`/cards/${cardId}/labels/${labelId}`)),
  removeLabel: async (cardId, labelId) => getData(await api.delete(`/cards/${cardId}/labels/${labelId}`)),
  addMember: async (cardId, memberId) => getData(await api.post(`/cards/${cardId}/members/${memberId}`)),
  removeMember: async (cardId, memberId) => getData(await api.delete(`/cards/${cardId}/members/${memberId}`)),
  addChecklistItem: async (cardId, title) => getData(await api.post(`/cards/${cardId}/checklist`, { title })),
  updateChecklistItem: async (cardId, itemId, item) =>
    getData(await api.put(`/cards/${cardId}/checklist/${itemId}`, item)),
  deleteChecklistItem: async (cardId, itemId) =>
    getData(await api.delete(`/cards/${cardId}/checklist/${itemId}`)),
  addAttachment: async (cardId, attachment) => getData(await api.post(`/cards/${cardId}/attachments`, attachment)),
  addComment: async (cardId, comment) => getData(await api.post(`/cards/${cardId}/comments`, comment))
};

export default api;
