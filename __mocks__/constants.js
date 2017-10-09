export const ERROR_UNKNOWN = 1;

export const ERROR_JSON = 1000;

export const ERROR_REFERER = 1001;

export const ERROR_STORAGE = 1002;

export const ERROR_INIT = 1003;

export const ERROR_SEGMENTCHANGE_EVALUATE = 1004;

export const ERROR_ORIGIN_MISMATCH = 1005;

export const ERROR_EVALUATOR_EVALUATE = 1006;

export const ERROR_EVALUATOR_RULE = 1007;

export const ERROR_VERSION_DIFF = 1009;

export const ERROR_CUSTOMACTION = 1010;

export const ERROR_TEMPLATE_RENDER = 1011;

export const ERROR_CONVERSION_EVALUATOR_EVALUATE = 1012;

export const ERROR_EVENT_QUEUE_FULL = 1013;

export const ERROR_INIT_CONTEXT = 1014;

export const ERROR_INIT_UID = 1015;

export const ERROR_LOCATION = 1016;

export const ERROR_BROWSER_VERSION = 1017;

export const ERROR_MESSAGE_RESPONSE = 1018;

export const ERROR_TRIGGER_FN_CALL = 1019;

export const ERROR_TRIGGER_RULE = 1020;

export const ERROR_BASE_EVALUATOR_FN_CALL = 1021;

export const ERROR_CONTEXT_XDMREADY = 1022;

export const ERROR_DOM_SELECTOR = 1023;

export const ERROR_CONTEXTAPI = 1024;

export const ERROR_JQUERY_UI_MISSING = 1025;

export const ERROR_COOKIE_SIZE = 1026;

export const ERROR_INIT_QUICK_MESSAGE = 1027;

export const ERROR_PREVIEW_TOOL = 1028;

export const ERROR_MESSAGE_TRUE_DISPLAY = 1029;

export const ERROR_FETCH = 1030;

export const ERROR_MESSAGE_SCRIPT = 1031;

export const ERROR_JSONP = 1032;

export const ERROR_BASE_EVALUATOR_RULE = 1033;

export const ERROR_MISSING_MODULE = 1034;

export const ERROR_DOM_EVENT = 1035;

export const ERROR_XDM_READY = 1036;

export const ERROR_GOOGLE_ANALYTICS = 1037;

export const ERROR_EVENT_QUEUE_INVALID = 1038;

export const ERROR_WAIT_FOR_TIMEOUT = 1039;

export const ERROR_SITE_LOCALE = 20008;

export const ERROR_SITE_UNKNOWN = 20009;

export const ERROR_SITE_USER = 20010;

export const ERROR_SITE_CONVERSION = 20021;

export const ERROR_SITE_CONVERSION_TRANS_ID_MISSING = 20013;

export const ERROR_SITE_CONVERSION_ID = 20014;

export const ERROR_SITE_CONVERSION_VALUE = 20015;

export const ERROR_SITE_CONVERSION_QUANTITY = 20025;

export const ERROR_SITE_JQUERY_MISSING = 20017;

export const ERROR_SITE_CUSTOMACTION = 20024;

export const ERROR_SITE_CUSTOMACTION_VALUE = 20018;

export const ERROR_SITE_INIT = 20019;

export const ERROR_SITE_RENDERER = 20023;

export const ERROR_SITE_CUSTOM_API = 20020;

export const ERROR_SITE_PRODUCT = 20012;

export const ERROR_SITE_PRODUCT_ID = 20026;

export const ERROR_SITE_PRODUCT_ATTRIBUTE = 20027;

export const ERROR_SITE_ELEMENT_MATCHES = 20028;

export const ERROR_SITE_TRANSACTION = 20029;

export const ERROR_SITE_GENRE = 20001;
export const ERROR_SITE_CITY = 20002;
export const ERROR_SITE_RESERVATION = 20003;

export const ERROR_SITE_PURCHASE = 20004;

export const ERROR_SITE_PURCHASE_NAME = 20005;

export const ERROR_SITE_PURCHASE_PRICE = 20006;

export const ERROR_SITE_PURCHASE_QUANTITY = 20007;
export const ERROR_PRODUCT_PARSER = ERROR_SITE_PRODUCT;
export const ERROR_SITE_CONFIG_MISSING = 20011;
export const ERROR_SITE_TRANS_ID_MISSING = ERROR_SITE_CONVERSION_TRANS_ID_MISSING;
export const ERROR_COUNTER_DATA_INVALID = 40002;

export const EVENT_SEGMENT_ENTER = 'segment.enter';

export const EVENT_SEGMENT_LEAVE = 'segment.leave';

export const EVENT_SEGMENTS_READY = 'segments.ready';

export const EVENT_CUSTOMACTION = 'customAction';

export const EVENT_INIT_START = 'init.start';

export const EVENT_INIT_SUCCESS = 'init.success';

export const EVENT_INIT_FAILURE = 'init.failure';

export const EVENT_INIT_UID = 'init.uid';

export const EVENT_UID_CREATED = 'uid.created';

export const EVENT_INIT_CONTEXT = 'init.context';

export const EVENT_INIT_QUICK_CONTEXT = 'init.quick_context';

export const EVENT_LOGIN = 'login';

export const EVENT_LOGOUT = 'logout';

export const EVENT_EASY_CONFIG = 'export const config';

export const EVENT_SCRIPT_LOAD = 'scriptLoad';

export const EVENT_VISIT = 'visit';

export const EVENT_LOCATION = 'location';

export const EVENT_LOCATION_FAILURE = 'location.failure';

export const EVENT_XDM_REQUEST = 'xdm.request';

export const EVENT_XDM_READY = 'xdm.ready';

export const EVENT_XDM_FAILURE = 'xdm.failure';

export const EVENT_CONVERSION = 'conversion';

export const EVENT_PRODUCT_DATA = 'product';

export const EVENT_PRODUCT_PURCHASE = 'product.purchase';

export const EVENT_DATALAYER = 'dataLayer';

export const EVENT_MESSAGE_INIT = 'message.initSuccess';

export const EVENT_MESSAGE_REQUEST = 'message.request';

export const EVENT_MESSAGE_RECEIVE = 'message.receive';

export const EVENT_MESSAGE_SUCCESS = 'message.success';

export const EVENT_MESSAGE_FAILURE = 'message.failure';

export const EVENT_MESSAGESHOW_COMPLETE = 'messageshow.complete';

export const EVENT_MESSAGESHOW_FAILED = 'messageshow.failed';

export const EVENT_MESSAGE_SHOW = 'message.showMessage';

export const EVENT_MESSAGE_CLICK = 'message.clickMessage';

export const EVENT_MESSAGE_TRUE_DISPLAY = 'message.trueDisplay';

export const EVENT_URL_CHANGED = 'pageload.urlChanged';

export const EVENT_PAGE_CHANGED = 'pagechange.urlChanged';

export const EVENT_TARGETGROUP_ENTER = 'targetgroup.enter';

export const EVENT_TARGETGROUP_LEAVE = 'targetgroup.leave';

export const EVENT_CAMPAIGN_STAMP = 'campaign.stamp';

export const EVENT_CAMPAIGN_UNSTAMP = 'campaign.unstamp';

export const EVENT_CAMPAIGN_CLICK = 'campaign.click';

export const EVENT_DOM_EVENT = 'domEvent';

export const EVENT_DOM_WAIT = 'domWait';

export const EVENT_EASY_EVENT = 'easyEvent';

export const EVENT_JSVAR_WAIT = 'jsvarWait';

export const EVENT_TRIGGER_EVENT = 'trigger.event';

export const EVENT_TRIGGER_FIRE = 'trigger.fire';

export const EVENT_PREVIEW_TOOL_ENABLE = 'previewTool.enable';

export const EVENT_PREVIEW_TOOL_DISABLE = 'previewTool.disable';

export const EVENT_ERROR_SENT = 'error.sent';

export const EVENT_EASY_READY = 'export const ready';

export const EVENT_DOM_READY = 'domReady';

export const EVENT_JQUERY_READY = 'jquery.ready';

export const EVENT_STATE_REMOVE = 'state.remove';

export const EVENT_STATE_SET = 'state.set';

export const EVENT_PROMISE_REJECTION_HANDLED = 'promise.rejectionHandled';

export const EVENT_PROMISE_UNHANDLED_REJECTION = 'promise.unhandledRejection';

export const XDM_INIT_TIMEOUT = 5000;

export const API_QUEUE_MAX_EVENTS = 40;

export const DEVEL = false;

export const ENV = 'prod';

export const COOKIE_QUICK_CONTEXT = 'frosmo_quickContext';

export const COOKIE_MAX_SIZE = 3000;

export const MESSAGE_TRUE_DISPLAY_TIME = 3000;

export const JQUERY_INIT_TIMEOUT = 10000;

export const CONTEXT_TYPE_SERVER = 'context.api';

export const CONTEXT_TYPE_STORAGE = 'local.storage';

export const CONTEXT_TYPE_XDM = 'shared.context';

export const MESSAGE_TYPE_BASIC = 'basic';

export const MESSAGE_TYPE_CACHED = 'cached';

export const STATE_DEVICE = '_device';

export const STATE_MODE = '_mode';

export const STATE_MODE_TEST = 'test';

export const STATE_TYPE_PAGE = 3;

export const STATE_TYPE_SESSION = 2;

export const DEVICE_REGEXP_IOS = /(iPhone|iPod)/i;

export const DEVICE_REGEXP_IPAD = /iPad/i;

export const DEVICE_REGEXP_ANDROIDMOBILE = /Android.+(mobile|Opera (mini|mobi))/i;

export const DEVICE_REGEXP_ANDROIDTABLET = /Android(?!.+(mobile|Opera (mini|mobi)))/i;

export const DEVICE_REGEXP_WINDOWSPHONE = /Windows Phone|Windows CE|Windows Mobile|IEMobile/i;

export const DEVICE_REGEXP_WINDOWSTABLET = /Windows.*ARM/i;

export const DEVICE_REGEXP_OTHERMOBILE = /(sPPC|Blackberry|Cricket|iPAQ|HTC_Touch|HTC_HD2|HTC-ST7377|Kindle|LGd|LG-G|LG-L|LGE|Teleca|POLARIS|MOT-|MOTd|Nintendo|Nokia|Symbian|SymbOS|SPVs|PalmSource|PalmOS|SAMSUNG|sam-rd|samrd|SCH-A950|SEC-SGH|SHARP|SIE-|UP.BROWSER|sonyericsson|UC(s?)Browser|WebOS|Pantech|MobileExplorer|ZuneWP7|Opera Mini|Opera Mobi)/i;

export const DEVICE_REGEXP_OTHERTABLET = /Playbook|hp-tablet|Opera Tab/i;

export const MESSAGE_SCRIPT_ID = 'frosmo_message_script_id_';

export const MESSAGE_STYLE_ID = 'frosmo_message_style_id_';

export const DOM_EVENT_NAMESPACE = 'easy_core';

export const LOG_LEVEL_DEBUG = 'debug';

export const LOG_LEVEL_INFO = 'info';

export const LOG_LEVEL_WARN = 'warn';

export const LOG_LEVEL_LOG = 'log';

export const LOG_LEVEL_ERROR = 'error';

export const sharedContextRpc = null;
