export{}

interface ApiResponse<T> {
    status: number;
    data: T;
}

interface Room {
    id: number;
    name: string;
    capacity: number;
    floor: number;
    equipment: string;
}

interface Reservation {
    room_id: number;
    start_time: string;
    end_time: string;
    date: string;
}