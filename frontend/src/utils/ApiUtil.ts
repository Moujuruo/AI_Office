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
    static API_Item_UPDATE = ApiUtil.URL_ROOT + '/updateItem';
    static API_Item_DELETE = ApiUtil.URL_ROOT + '/deleteItem/';
    static API_Item_LIST_BY_ACTIVITY = ApiUtil.URL_ROOT + '/getItemListByActivity/';


    static API_LOGIN = ApiUtil.URL_ROOT + '/login';
}