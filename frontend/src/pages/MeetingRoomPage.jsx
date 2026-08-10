import { useParams } from "react-router-dom";

const MeetingRoomPage = () => {
  const { meetingCode } = useParams();

  return (
    <div className="min-h-screen text-white bg-slate-950">

  <header className="flex justify-between p-4 border-b border-slate-800">

    <h1 className="font-bold">
      MeetFlow
    </h1>

    <p>
      Meeting: {meetingCode}
    </p>

  </header>

  <main className="h-[80vh] flex">

    <div className="flex items-center justify-center flex-1">

      <div className="w-[700px] h-[400px] bg-slate-900 rounded-xl flex items-center justify-center">
        Video Area
      </div>

    </div>

    <div className="w-[300px] border-l border-slate-800 p-4">

      <h2 className="mb-4 font-semibold">
        Participants
      </h2>

    </div>

  </main>

  <footer className="flex justify-center gap-4 p-4 border-t border-slate-800">

    <button>
      Mic
    </button>

    <button>
      Camera
    </button>

    <button>
      Screen
    </button>

    <button className="px-4 py-2 bg-red-600 rounded">
      Leave
    </button>

  </footer>

</div>
  );
};

export default MeetingRoomPage;
