import { useEffect, useState } from 'react';
import BoardPage from './components/BoardPage';
import { boardApi } from './api';
import heroImage from './assets/hero.png';

function App() {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const data = await boardApi.getBoards();
      setBoards(data);
      setSelectedBoard(data[0] || null);
    } catch (err) {
      console.error(err);
      alert('Unable to load boards. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async (event) => {
    event.preventDefault();

    if (!newBoardTitle.trim()) {
      alert('Board title is required.');
      return;
    }

    try {
      const board = await boardApi.createBoard(newBoardTitle.trim());
      setBoards((currentBoards) => [board, ...currentBoards]);
      setSelectedBoard(board);
      setNewBoardTitle('');
    } catch (err) {
      console.error(err);
      alert('Unable to create board.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-5 py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src={heroImage}
              alt="Project workspace"
              className="h-12 w-12 rounded-md object-cover"
            />
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">Workspace</p>
              <h1 className="text-2xl font-bold">Trello Clone</h1>
              <p className="text-sm text-zinc-500">Plan tasks, move cards, and keep work visible.</p>
            </div>
          </div>

          <form onSubmit={handleCreateBoard} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={newBoardTitle}
              onChange={(event) => setNewBoardTitle(event.target.value)}
              placeholder="New board title"
              className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-emerald-600 sm:w-64"
            />
            <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
              Add Board
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-5">
        {loading ? (
          <div className="rounded-md border border-zinc-200 bg-white p-4 text-sm text-zinc-600 shadow-sm">
            Loading boards...
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {boards.map((board) => (
                <button
                  key={board.id}
                  onClick={() => setSelectedBoard(board)}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                    selectedBoard?.id === board.id
                      ? 'border-emerald-700 bg-emerald-700 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 hover:bg-emerald-50'
                  }`}
                >
                  {board.title}
                </button>
              ))}
            </div>

            {selectedBoard ? (
              <BoardPage board={selectedBoard} />
            ) : (
              <div className="rounded-md border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
                <p className="font-semibold text-zinc-800">No board selected</p>
                <p className="mt-1 text-sm text-zinc-500">Create a board to get started.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
