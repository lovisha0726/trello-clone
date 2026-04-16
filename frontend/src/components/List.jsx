import { useState } from 'react';
import { Draggable, Droppable } from '@hello-pangea/dnd';
import Card from './Card';

const List = ({
  list,
  index,
  cards,
  cardMeta,
  onCreateCard,
  onOpenCard,
  onUpdateList,
  onDeleteList
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [listTitle, setListTitle] = useState(list.title);
  const accentColors = ['bg-blue-600', 'bg-emerald-600', 'bg-amber-500', 'bg-rose-600'];
  const accentColor = accentColors[index % accentColors.length];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await onCreateCard(list.id, {
      title,
      description,
      due_date: dueDate,
      cover_image: coverImage
    });

    if (created) {
      setTitle('');
      setDescription('');
      setDueDate('');
      setCoverImage('');
    }
  };

  const handleSaveListTitle = async () => {
    const updated = await onUpdateList(list.id, listTitle);
    if (updated) setEditingTitle(false);
  };

  return (
    <Draggable draggableId={`list-${list.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-72 shrink-0 rounded-md border border-zinc-200 bg-zinc-100 shadow-sm ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-emerald-500' : ''
          }`}
        >
          <div className={`h-1.5 rounded-t-md ${accentColor}`} />

          <div {...provided.dragHandleProps} className="cursor-grab px-3 pb-2 pt-3">
            <div className="flex items-center justify-between gap-2">
              {editingTitle ? (
                <input
                  value={listTitle}
                  onChange={(event) => setListTitle(event.target.value)}
                  onBlur={handleSaveListTitle}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSaveListTitle();
                  }}
                  className="min-w-0 flex-1 rounded-md border border-zinc-300 px-2 py-1 text-sm font-semibold outline-none focus:border-blue-600"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingTitle(true)}
                  className="min-w-0 flex-1 text-left font-semibold text-zinc-900"
                >
                  {list.title}
                </button>
              )}

              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-zinc-600">
                {cards.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onDeleteList(list.id)}
              className="mt-2 text-xs font-semibold text-rose-700 hover:text-rose-900"
            >
              Delete list
            </button>
          </div>

          <Droppable droppableId={String(list.id)} type="CARD">
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`mx-3 min-h-16 space-y-2 rounded-md ${
                  dropSnapshot.isDraggingOver ? 'bg-emerald-100 p-1' : ''
                }`}
              >
                {cards.length === 0 ? (
                  <div className="rounded-md border border-dashed border-zinc-300 bg-white px-3 py-4 text-center text-sm text-zinc-500">
                    Drop a card here
                  </div>
                ) : null}

                {cards.map((card, cardIndex) => (
                  <Card
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    labels={cardMeta[card.id]?.labels || []}
                    members={cardMeta[card.id]?.members || []}
                    onOpen={() => onOpenCard(card)}
                  />
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <form onSubmit={handleSubmit} className="mt-3 space-y-2 border-t border-zinc-200 p-3">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Card title"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Description"
              rows="2"
              className="w-full resize-none rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
            <input
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              type="date"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
            <input
              value={coverImage}
              onChange={(event) => setCoverImage(event.target.value)}
              placeholder="Cover image URL"
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600"
            />
            <button className="w-full rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800">
              Add Card
            </button>
          </form>
        </div>
      )}
    </Draggable>
  );
};

export default List;
