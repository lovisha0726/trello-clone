import { useState } from 'react';
import { cardApi } from '../api';

const CardModal = ({
  card,
  labels,
  members,
  onClose,
  onRefresh,
  onUpdate,
  onDelete,
  onArchive
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.due_date ? card.due_date.slice(0, 10) : '');
  const [coverImage, setCoverImage] = useState(card.cover_image || '');
  const [checklistTitle, setChecklistTitle] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [comment, setComment] = useState('');

  const cardLabelIds = new Set((card.labels || []).map((label) => label.id));
  const cardMemberIds = new Set((card.members || []).map((member) => member.id));
  const checklist = card.checklist || [];
  const completedCount = checklist.filter((item) => item.is_completed).length;
  const progress = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;

  const saveCard = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      alert('Card title is required.');
      return;
    }

    await onUpdate({
      id: card.id,
      title: title.trim(),
      description: description.trim(),
      due_date: dueDate || null,
      cover_image: coverImage.trim()
    });
  };

  const toggleLabel = async (label) => {
    if (cardLabelIds.has(label.id)) {
      await cardApi.removeLabel(card.id, label.id);
    } else {
      await cardApi.addLabel(card.id, label.id);
    }

    await onRefresh(card.id);
  };

  const toggleMember = async (member) => {
    if (cardMemberIds.has(member.id)) {
      await cardApi.removeMember(card.id, member.id);
    } else {
      await cardApi.addMember(card.id, member.id);
    }

    await onRefresh(card.id);
  };

  const addChecklistItem = async (event) => {
    event.preventDefault();

    if (!checklistTitle.trim()) return;

    await cardApi.addChecklistItem(card.id, checklistTitle.trim());
    setChecklistTitle('');
    await onRefresh(card.id);
  };

  const toggleChecklistItem = async (item) => {
    await cardApi.updateChecklistItem(card.id, item.id, {
      is_completed: !item.is_completed
    });
    await onRefresh(card.id);
  };

  const removeChecklistItem = async (itemId) => {
    await cardApi.deleteChecklistItem(card.id, itemId);
    await onRefresh(card.id);
  };

  const addAttachment = async (event) => {
    event.preventDefault();

    if (!attachmentName.trim() || !attachmentUrl.trim()) {
      alert('Attachment name and URL are required.');
      return;
    }

    await cardApi.addAttachment(card.id, {
      file_name: attachmentName.trim(),
      file_url: attachmentUrl.trim()
    });
    setAttachmentName('');
    setAttachmentUrl('');
    await onRefresh(card.id);
  };

  const addComment = async (event) => {
    event.preventDefault();

    if (!comment.trim()) return;

    await cardApi.addComment(card.id, {
      member_name: 'Guest',
      comment: comment.trim()
    });
    setComment('');
    await onRefresh(card.id);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-zinc-950/60 p-4">
      <div className="mx-auto max-w-5xl rounded-md bg-white shadow-xl">
        {coverImage ? (
          <img src={coverImage} alt="" className="h-56 w-full rounded-t-md object-cover" />
        ) : null}

        <div className="flex items-center justify-between border-b border-zinc-200 p-4">
          <div>
            <p className="text-xs font-semibold uppercase text-blue-700">Card details</p>
            <h2 className="text-xl font-bold text-zinc-900">{card.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 p-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="space-y-5">
            <form onSubmit={saveCard} className="space-y-3 rounded-md border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-900">Edit card</h3>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows="4"
                placeholder="Description"
                className="w-full resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
              />
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <input
                  value={coverImage}
                  onChange={(event) => setCoverImage(event.target.value)}
                  placeholder="Cover image URL"
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
              </div>
              <button className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">
                Save Card
              </button>
            </form>

            <div className="rounded-md border border-zinc-200 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Checklist</h3>
                <span className="text-sm font-semibold text-zinc-600">{progress}%</span>
              </div>
              <div className="mb-3 h-2 rounded-md bg-zinc-200">
                <div className="h-2 rounded-md bg-emerald-600" style={{ width: `${progress}%` }} />
              </div>

              <div className="space-y-2">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-md bg-zinc-50 p-2">
                    <input
                      type="checkbox"
                      checked={Boolean(item.is_completed)}
                      onChange={() => toggleChecklistItem(item)}
                    />
                    <span className={`min-w-0 flex-1 text-sm ${item.is_completed ? 'line-through text-zinc-400' : 'text-zinc-700'}`}>
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeChecklistItem(item.id)}
                      className="text-xs font-semibold text-rose-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={addChecklistItem} className="mt-3 flex gap-2">
                <input
                  value={checklistTitle}
                  onChange={(event) => setChecklistTitle(event.target.value)}
                  placeholder="Checklist item"
                  className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <button className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">Add</button>
              </form>
            </div>

            <div className="rounded-md border border-zinc-200 p-4">
              <h3 className="mb-3 font-semibold text-zinc-900">Comments</h3>
              <form onSubmit={addComment} className="mb-3 flex gap-2">
                <input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Write a comment"
                  className="min-w-0 flex-1 rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <button className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white">Post</button>
              </form>
              <div className="space-y-2">
                {(card.comments || []).map((item) => (
                  <div key={item.id} className="rounded-md bg-zinc-50 p-3">
                    <p className="text-sm text-zinc-700">{item.comment}</p>
                    <p className="mt-1 text-xs font-semibold text-zinc-500">{item.member_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-md border border-zinc-200 p-4">
              <h3 className="mb-3 font-semibold text-zinc-900">Labels</h3>
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={`rounded-md px-3 py-2 text-sm font-semibold text-white ${cardLabelIds.has(label.id) ? 'ring-2 ring-zinc-900' : ''}`}
                    style={{ background: label.color }}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 p-4">
              <h3 className="mb-3 font-semibold text-zinc-900">Members</h3>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member)}
                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold ${
                      cardMemberIds.has(member.id) ? 'border-zinc-900 bg-zinc-100' : 'border-zinc-200'
                    }`}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ background: member.avatar_color }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                    {member.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 p-4">
              <h3 className="mb-3 font-semibold text-zinc-900">Attachments</h3>
              <form onSubmit={addAttachment} className="space-y-2">
                <input
                  value={attachmentName}
                  onChange={(event) => setAttachmentName(event.target.value)}
                  placeholder="File name"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <input
                  value={attachmentUrl}
                  onChange={(event) => setAttachmentUrl(event.target.value)}
                  placeholder="File URL"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
                />
                <button className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white">
                  Add Attachment
                </button>
              </form>
              <div className="mt-3 space-y-2">
                {(card.attachments || []).map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-md bg-zinc-50 p-2 text-sm font-semibold text-blue-700"
                  >
                    {attachment.file_name}
                  </a>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-zinc-200 p-4">
              <h3 className="mb-3 font-semibold text-zinc-900">Activity</h3>
              <div className="space-y-2">
                {(card.activity || []).map((item) => (
                  <p key={item.id} className="rounded-md bg-zinc-50 p-2 text-sm text-zinc-600">
                    {item.message}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onArchive(card.id)}
                className="rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => onDelete(card.id)}
                className="rounded-md bg-rose-700 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              >
                Delete
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default CardModal;
