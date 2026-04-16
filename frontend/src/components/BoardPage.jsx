import { useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import List from './List';
import CardModal from './CardModal';
import { boardApi, cardApi, listApi } from '../api';

const reorder = (items, startIndex, endIndex) => {
  const result = Array.from(items);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

const backgroundOptions = ['#f4f4f5', '#ecfdf5', '#eff6ff', '#fff7ed', '#fdf2f8'];

const BoardPage = ({ board }) => {
  const [activeBoard, setActiveBoard] = useState(board);
  const [lists, setLists] = useState([]);
  const [cards, setCards] = useState([]);
  const [labels, setLabels] = useState([]);
  const [members, setMembers] = useState([]);
  const [cardLabels, setCardLabels] = useState([]);
  const [cardMembers, setCardMembers] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [newListTitle, setNewListTitle] = useState('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [filters, setFilters] = useState({ search: '', labelId: '', memberId: '', due: '' });
  const [loading, setLoading] = useState(true);

  const loadBoard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await boardApi.getBoardDetails(board.id);

      setActiveBoard(data.board);
      setLists(data.lists);
      setCards(data.cards);
      setLabels(data.labels);
      setMembers(data.members);
      setCardLabels(data.cardLabels);
      setCardMembers(data.cardMembers);
    } catch (err) {
      console.error(err);
      alert('Unable to load this board.');
    } finally {
      setLoading(false);
    }
  }, [board.id]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const cardMeta = useMemo(() => {
    const meta = {};

    cards.forEach((card) => {
      meta[card.id] = { labels: [], members: [] };
    });

    cardLabels.forEach((label) => {
      if (meta[label.card_id]) meta[label.card_id].labels.push(label);
    });

    cardMembers.forEach((member) => {
      if (meta[member.card_id]) meta[member.card_id].members.push(member);
    });

    return meta;
  }, [cards, cardLabels, cardMembers]);

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const meta = cardMeta[card.id] || { labels: [], members: [] };
      const matchesSearch = card.title.toLowerCase().includes(filters.search.toLowerCase());
      const matchesLabel = !filters.labelId || meta.labels.some((label) => String(label.id) === filters.labelId);
      const matchesMember = !filters.memberId || meta.members.some((member) => String(member.id) === filters.memberId);
      const matchesDue =
        !filters.due ||
        (filters.due === 'overdue' && card.due_date && new Date(card.due_date) < new Date()) ||
        (filters.due === 'hasDue' && Boolean(card.due_date)) ||
        (filters.due === 'noDue' && !card.due_date);

      return matchesSearch && matchesLabel && matchesMember && matchesDue;
    });
  }, [cards, cardMeta, filters]);

  const getCardsForList = (listId) =>
    filteredCards
      .filter((card) => card.list_id === listId)
      .sort((a, b) => a.position - b.position);

  const totalCards = cards.length;
  const hasActiveFilters = Boolean(filters.search || filters.labelId || filters.memberId || filters.due);

  const refreshSelectedCard = async (cardId) => {
    const card = await cardApi.getCardDetails(cardId);
    setSelectedCard(card);
    setCards((currentCards) => currentCards.map((item) => (item.id === card.id ? card : item)));
    setCardLabels((currentLabels) => [
      ...currentLabels.filter((label) => label.card_id !== card.id),
      ...card.labels.map((label) => ({ ...label, card_id: card.id }))
    ]);
    setCardMembers((currentMembers) => [
      ...currentMembers.filter((member) => member.card_id !== card.id),
      ...card.members.map((member) => ({ ...member, card_id: card.id }))
    ]);
    return card;
  };

  const handleCreateList = async (event) => {
    event.preventDefault();

    if (!newListTitle.trim()) {
      alert('List title is required.');
      return;
    }

    try {
      const list = await listApi.createList(activeBoard.id, newListTitle.trim());
      setLists((currentLists) => [...currentLists, list]);
      setNewListTitle('');
    } catch (err) {
      console.error(err);
      alert('Unable to create list.');
    }
  };

  const handleUpdateList = async (listId, title) => {
    if (!title.trim()) {
      alert('List title is required.');
      return false;
    }

    try {
      const updatedList = await listApi.updateList(listId, title.trim());
      setLists((currentLists) => currentLists.map((list) => (list.id === listId ? updatedList : list)));
      return true;
    } catch (err) {
      console.error(err);
      alert('Unable to update list.');
      return false;
    }
  };

  const handleDeleteList = async (listId) => {
    if (!window.confirm('Delete this list and all its cards?')) return;

    try {
      await listApi.deleteList(listId);
      setLists((currentLists) => currentLists.filter((list) => list.id !== listId));
      setCards((currentCards) => currentCards.filter((card) => card.list_id !== listId));
    } catch (err) {
      console.error(err);
      alert('Unable to delete list.');
    }
  };

  const handleCreateCard = async (listId, card) => {
    if (!card.title.trim()) {
      alert('Card title is required.');
      return false;
    }

    try {
      const newCard = await cardApi.createCard(listId, {
        title: card.title.trim(),
        description: card.description.trim(),
        due_date: card.due_date || null,
        cover_image: card.cover_image.trim()
      });

      setCards((currentCards) => [...currentCards, newCard]);
      return true;
    } catch (err) {
      console.error(err);
      alert('Unable to create card.');
      return false;
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Delete this card permanently?')) return;

    try {
      await cardApi.deleteCard(cardId);
      setCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
      alert('Unable to delete card.');
    }
  };

  const handleArchiveCard = async (cardId) => {
    try {
      await cardApi.archiveCard(cardId);
      setCards((currentCards) => currentCards.filter((card) => card.id !== cardId));
      setSelectedCard(null);
    } catch (err) {
      console.error(err);
      alert('Unable to archive card.');
    }
  };

  const handleUpdateCard = async (card) => {
    const updatedCard = await cardApi.updateCard(card.id, card);
    setSelectedCard(updatedCard);
    setCards((currentCards) => currentCards.map((item) => (item.id === updatedCard.id ? updatedCard : item)));
  };

  const handleCreateLabel = async (event) => {
    event.preventDefault();

    if (!newLabelName.trim()) return;

    const colors = ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea'];
    const label = await cardApi.createLabel(activeBoard.id, {
      name: newLabelName.trim(),
      color: colors[labels.length % colors.length]
    });

    setLabels((currentLabels) => [...currentLabels, label]);
    setNewLabelName('');
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();

    if (!newMemberName.trim()) return;

    const colors = ['#2563eb', '#16a34a', '#9333ea', '#be123c', '#0f766e'];
    const member = await cardApi.createMember(activeBoard.id, {
      name: newMemberName.trim(),
      avatar_color: colors[members.length % colors.length]
    });

    setMembers((currentMembers) => [...currentMembers, member]);
    setNewMemberName('');
  };

  const handleBackgroundChange = async (background) => {
    try {
      const updatedBoard = await boardApi.updateBoard(activeBoard.id, {
        title: activeBoard.title,
        background
      });
      setActiveBoard(updatedBoard);
    } catch (err) {
      console.error(err);
      alert('Unable to update board background.');
    }
  };

  const saveListPositions = async (nextLists) => {
    await listApi.updatePositions(nextLists.map((list, index) => ({ id: list.id, position: index + 1 })));
  };

  const saveCardPositions = async (nextCards, listIds) => {
    const payload = listIds.flatMap((listId) =>
      nextCards
        .filter((card) => card.list_id === Number(listId))
        .sort((a, b) => a.position - b.position)
        .map((card, index) => ({ id: card.id, list_id: card.list_id, position: index + 1 }))
    );

    await cardApi.updatePositions(payload);
  };

  const onDragEnd = async (result) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'LIST') {
      const previousLists = lists;
      const nextLists = reorder(lists, source.index, destination.index).map((list, index) => ({
        ...list,
        position: index + 1
      }));

      setLists(nextLists);

      try {
        await saveListPositions(nextLists);
      } catch (err) {
        console.error(err);
        setLists(previousLists);
        alert('Unable to update list order.');
      }

      return;
    }

    if (hasActiveFilters) {
      alert('Clear filters before dragging cards so positions stay accurate.');
      return;
    }

    const sourceListId = Number(source.droppableId);
    const destinationListId = Number(destination.droppableId);
    const previousCards = cards;
    const sourceCards = cards
      .filter((card) => card.list_id === sourceListId)
      .sort((a, b) => a.position - b.position);
    const destinationCards =
      sourceListId === destinationListId
        ? sourceCards
        : cards.filter((card) => card.list_id === destinationListId).sort((a, b) => a.position - b.position);
    const otherCards = cards.filter((card) => card.list_id !== sourceListId && card.list_id !== destinationListId);

    const [movedCard] = sourceCards.splice(source.index, 1);
    destinationCards.splice(destination.index, 0, { ...movedCard, list_id: destinationListId });

    const updatedSourceCards = sourceCards.map((card, index) => ({ ...card, position: index + 1 }));
    const updatedDestinationCards = destinationCards.map((card, index) => ({ ...card, position: index + 1 }));
    const nextCards =
      sourceListId === destinationListId
        ? [...otherCards, ...updatedDestinationCards]
        : [...otherCards, ...updatedSourceCards, ...updatedDestinationCards];

    setCards(nextCards);

    try {
      await saveCardPositions(nextCards, [...new Set([sourceListId, destinationListId])]);
    } catch (err) {
      console.error(err);
      setCards(previousCards);
      alert('Unable to update card position.');
    }
  };

  if (loading) {
    return (
      <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
        Loading lists and cards...
      </div>
    );
  }

  return (
    <section className="rounded-md p-4" style={{ background: activeBoard.background || '#f4f4f5' }}>
      <div className="mb-4 flex flex-col justify-between gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase text-blue-700">Active board</p>
          <h2 className="text-xl font-bold text-zinc-900">{activeBoard.title}</h2>
          <p className="text-sm text-zinc-500">{lists.length} lists, {totalCards} active cards</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {backgroundOptions.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => handleBackgroundChange(color)}
              className="h-8 w-8 rounded-md border border-zinc-300"
              style={{ background: color }}
              aria-label="Change board background"
            />
          ))}
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <input
          value={filters.search}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          placeholder="Search cards by title"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        />
        <select
          value={filters.labelId}
          onChange={(event) => setFilters((current) => ({ ...current, labelId: event.target.value }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        >
          <option value="">All labels</option>
          {labels.map((label) => (
            <option key={label.id} value={label.id}>{label.name}</option>
          ))}
        </select>
        <select
          value={filters.memberId}
          onChange={(event) => setFilters((current) => ({ ...current, memberId: event.target.value }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        >
          <option value="">All members</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>{member.name}</option>
          ))}
        </select>
        <select
          value={filters.due}
          onChange={(event) => setFilters((current) => ({ ...current, due: event.target.value }))}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
        >
          <option value="">Any due date</option>
          <option value="hasDue">Has due date</option>
          <option value="noDue">No due date</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-2">
        <form onSubmit={handleCreateLabel} className="flex gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
          <input
            value={newLabelName}
            onChange={(event) => setNewLabelName(event.target.value)}
            placeholder="New label"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Add Label</button>
        </form>
        <form onSubmit={handleCreateMember} className="flex gap-2 rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
          <input
            value={newMemberName}
            onChange={(event) => setNewMemberName(event.target.value)}
            placeholder="New member"
            className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          />
          <button className="rounded-md bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">Add Member</button>
        </form>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="LIST">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex min-h-[60vh] items-start gap-4 overflow-x-auto pb-5"
            >
              {lists.map((list, index) => (
                <List
                  key={list.id}
                  list={list}
                  index={index}
                  cards={getCardsForList(list.id)}
                  cardMeta={cardMeta}
                  onCreateCard={handleCreateCard}
                  onOpenCard={async (card) => setSelectedCard(await cardApi.getCardDetails(card.id))}
                  onUpdateList={handleUpdateList}
                  onDeleteList={handleDeleteList}
                />
              ))}
              {provided.placeholder}

              <form onSubmit={handleCreateList} className="w-72 shrink-0 rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
                <p className="mb-2 text-sm font-semibold text-zinc-700">Create list</p>
                <input
                  value={newListTitle}
                  onChange={(event) => setNewListTitle(event.target.value)}
                  placeholder="New list title"
                  className="mb-2 w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-600"
                />
                <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
                  Add List
                </button>
              </form>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {selectedCard ? (
        <CardModal
          card={selectedCard}
          labels={labels}
          members={members}
          onClose={() => setSelectedCard(null)}
          onRefresh={refreshSelectedCard}
          onUpdate={handleUpdateCard}
          onDelete={handleDeleteCard}
          onArchive={handleArchiveCard}
        />
      ) : null}
    </section>
  );
};

export default BoardPage;
