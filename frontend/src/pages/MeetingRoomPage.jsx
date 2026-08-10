import { useParams } from "react-router-dom";

const MeetingRoomPage = () => {
  const { meetingCode } = useParams();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-slate-950">
      <h1 className="text-4xl font-bold">
        Meeting Room
      </h1>

      <p className="mt-4 text-xl">
        Meeting Code: {meetingCode}
      </p>
    </div>
  );
};

export default MeetingRoomPage;
