import { Draggable } from '@hello-pangea/dnd';

const Card = ({ card, index, labels, members, onOpen }) => {
  const hasDescription = Boolean(card.description);
  const dueDate = card.due_date ? new Date(card.due_date).toLocaleDateString() : null;

  return (
    <Draggable draggableId={`card-${card.id}`} index={index}>
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onOpen}
          className={`rounded-md border border-zinc-200 bg-white shadow-sm transition ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:border-blue-200'
          }`}
        >
          {card.cover_image ? (
            <img
              src={card.cover_image}
              alt=""
              className="h-24 w-full rounded-t-md object-cover"
            />
          ) : null}

          <div className="p-3">
            {labels.length > 0 ? (
              <div className="mb-2 flex flex-wrap gap-1">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className="h-2 w-10 rounded-md"
                    style={{ background: label.color }}
                    title={label.name}
                  />
                ))}
              </div>
            ) : null}

            <h4 className="text-sm font-semibold leading-5 text-zinc-900">{card.title}</h4>

            {hasDescription ? (
              <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm leading-5 text-zinc-600">
                {card.description}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {dueDate ? (
                <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-800">
                  Due {dueDate}
                </span>
              ) : null}

              {members.map((member) => (
                <span
                  key={member.id}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: member.avatar_color }}
                  title={member.name}
                >
                  {member.name.charAt(0).toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        </article>
      )}
    </Draggable>
  );
};

export default Card;
