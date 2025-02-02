import { useQuery } from '@tanstack/react-query';
import { fetchRooms } from '../services/api/roomsRequests';
import { RoomData, groupedRoomData } from '@shared-types/RoomsSchema';

const RoomDisplay = () => {
  const { isLoading, isError, data } = useQuery({
    queryKey: ['roomData'],
    queryFn: () => fetchRooms(),
  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (isError) {
    return <div>Error</div>;
  }

  if (data as groupedRoomData) {
    return (
      <div>
        <h2>Rooms</h2>
        {/* Loop through roomsDb */}
        <div>
          <h4>Rooms from DB:</h4>
          {data.roomsDb && data.roomsDb.length > 0 ? (
            data.roomsDb.map((dbRoom: RoomData, dbIndex: number) => (
              <div key={dbIndex}>
                <p>Url: {dbRoom.url}</p>
                <p>GameTableId: {dbRoom.gameTableId}</p>
                <p>RoomOpenTime: {dbRoom.roomOpenTime.toString()}</p>
                <p>RoomCloseTime: {dbRoom.roomCloseTime?.toString()}</p>
                <p>MaxRoomSize: {dbRoom.maxRoomSize}</p>
              </div>
            ))
          ) : (
            <p>No rooms from DB</p>
          )}
        </div>

        {/* Loop through roomsCache */}
        <div>
          <h4>Rooms from Cache:</h4>
          {data.roomsCache && data.roomsCache.length > 0 ? (
            data.roomsCache.map((cacheRoom: RoomData, cacheIndex: number) => (
              <div key={cacheIndex}>
                <p>Url: {cacheRoom.url}</p>
                <p>GameTableId: {cacheRoom.gameTableId}</p>
                <p>RoomOpenTime: {cacheRoom.roomOpenTime.toString()}</p>
                <p>RoomCloseTime: {cacheRoom.roomCloseTime?.toString()}</p>
                <p>MaxRoomSize: {cacheRoom.maxRoomSize}</p>
              </div>
            ))
          ) : (
            <p>No rooms from Cache</p>
          )}
        </div>
      </div>
    );
  }
};

export default RoomDisplay;

