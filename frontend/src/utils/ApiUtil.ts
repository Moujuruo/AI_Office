export interface ApiResponse<T> {
    status: number;
    data: T;
}
export default class ApiUtil {
    static URL_IP = 'http://127.0.0.1:5001';
    static URL_ROOT = '/api/v1';

    static API_STAFF_UPDATE = ApiUtil.URL_ROOT + '/updateStaff';
    static API_STAFF_LIST = ApiUtil.URL_ROOT + '/getStaffList/';
    static API_STAFF_DELETE = ApiUtil.URL_ROOT + '/deleteStaff/';
    static API_STAFF_SEARCH_3 = ApiUtil.URL_ROOT + '/searchStaff_3';  //只搜索3个属性
    static API_Activity_UPDATE = ApiUtil.URL_ROOT + '/updateActivity';
    static API_Activity_LIST = ApiUtil.URL_ROOT + '/getActivityList/';
    static API_Activity_DELETE = ApiUtil.URL_ROOT + '/deleteActivity/';

    static API_Activity_STATISTICS = ApiUtil.URL_ROOT + '/getActivityStatistics/';

    static API_Item_UPDATE = ApiUtil.URL_ROOT + '/updateItem';
    static API_Item_DELETE = ApiUtil.URL_ROOT + '/deleteItem/';
    static API_Item_LIST_BY_ACTIVITY = ApiUtil.URL_ROOT + '/getItemListByActivity/';

    static API_NOTE_UPDATE = ApiUtil.URL_ROOT + '/updateNote';
    static API_NOTE_LIST = ApiUtil.URL_ROOT + '/getNoteList/';
    static API_NOTE_CONTENT = ApiUtil.URL_ROOT + '/getNoteContent/';
    static API_NOTE_DELETE = ApiUtil.URL_ROOT + '/deleteNote/';

    static API_LOGIN = ApiUtil.URL_ROOT + '/login';
    static API_REGISTER = ApiUtil.URL_ROOT + '/register';
    static API_CHANGE_USER_STATUS = ApiUtil.URL_ROOT + '/changeUserStatus';
    static API_UPLOAD_AVATAR = ApiUtil.URL_ROOT + '/uploadAvatar';
    static API_GET_AVATOR_BY_ID = ApiUtil.URL_ROOT + '/getAvatarById';

    static API_GET_ALL_ROOMS = ApiUtil.URL_ROOT + '/getAllRooms';
    static API_GET_ALL_RESERVATIONS = ApiUtil.URL_ROOT + '/getAllReservations';
    static API_GET_ROOM_RESERVATIONS = ApiUtil.URL_ROOT + '/getRoomReservations';
    static API_INSERT_RESERVATION = ApiUtil.URL_ROOT + '/insertReservation';

    static API_GET_USER_RESERVATIONS = ApiUtil.URL_ROOT + '/getUserReservations';
    static API_DELETE_RESERVATION
    = ApiUtil.URL_ROOT + '/deleteReservation';
    static API_UPDATE_RESERVATION
    = ApiUtil.URL_ROOT + '/updateReservation';

    static API_AI_CHAT
    = ApiUtil.URL_ROOT + '/aiChat';

    static API_GET_ALL_TEAMS = ApiUtil.URL_ROOT + '/getAllTeams';
    static API_INSERT_TEAM = ApiUtil.URL_ROOT + '/insertTeam';
    static API_INVITE_MEMBER = ApiUtil.URL_ROOT + '/inviteMember';
    static API_GET_BE_INVITED_TEAMS = ApiUtil.URL_ROOT + '/getBeInvitedTeams';
    static API_ACCEPT_INVITATION = ApiUtil.URL_ROOT + '/agreeinvitation';
    static API_REJECT_INVITATION = ApiUtil.URL_ROOT + '/disagreeinvitation';
    static API_DELETE_TEAM = ApiUtil.URL_ROOT + '/deleteTeam';
    static API_GET_CAPTAIN_TEAMS = ApiUtil.URL_ROOT + '/getCaptainTeams';
    static API_DELETE_MEMBER = ApiUtil.URL_ROOT + '/deleteMember';
    static API_UPDATE_TEAM_NAME = ApiUtil.URL_ROOT + '/updateTeamName';
}