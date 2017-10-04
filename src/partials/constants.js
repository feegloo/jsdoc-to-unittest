const ERROR_UNKNOWN = 1;

const ERROR_JSON = 1000;

const ERROR_REFERER = 1001;

const ERROR_STORAGE = 1002;

const ERROR_INIT = 1003;

const ERROR_SEGMENTCHANGE_EVALUATE = 1004;

const ERROR_ORIGIN_MISMATCH = 1005;

const ERROR_EVALUATOR_EVALUATE = 1006;

const ERROR_EVALUATOR_RULE = 1007;

const ERROR_VERSION_DIFF = 1009;

const ERROR_CUSTOMACTION = 1010;

const ERROR_TEMPLATE_RENDER = 1011;

const ERROR_CONVERSION_EVALUATOR_EVALUATE = 1012;

const ERROR_EVENT_QUEUE_FULL = 1013;

const ERROR_INIT_CONTEXT = 1014;

const ERROR_INIT_UID = 1015;

const ERROR_LOCATION = 1016;

const ERROR_BROWSER_VERSION = 1017;

const ERROR_MESSAGE_RESPONSE = 1018;

const ERROR_TRIGGER_FN_CALL = 1019;

const ERROR_TRIGGER_RULE = 1020;

const ERROR_BASE_EVALUATOR_FN_CALL = 1021;

const ERROR_CONTEXT_XDMREADY = 1022;

const ERROR_DOM_SELECTOR = 1023;

const ERROR_CONTEXTAPI = 1024;

const ERROR_JQUERY_UI_MISSING = 1025;

const ERROR_COOKIE_SIZE = 1026;

const ERROR_INIT_QUICK_MESSAGE = 1027;

const ERROR_PREVIEW_TOOL = 1028;

const ERROR_MESSAGE_TRUE_DISPLAY = 1029;

const ERROR_FETCH = 1030;

const ERROR_MESSAGE_SCRIPT = 1031;

const ERROR_JSONP = 1032;

const ERROR_BASE_EVALUATOR_RULE = 1033;

const ERROR_MISSING_MODULE = 1034;

const ERROR_DOM_EVENT = 1035;

const ERROR_XDM_READY = 1036;

const ERROR_GOOGLE_ANALYTICS = 1037;

const ERROR_EVENT_QUEUE_INVALID = 1038;

const ERROR_WAIT_FOR_TIMEOUT = 1039;

const ERROR_SITE_LOCALE = 20008;

const ERROR_SITE_UNKNOWN = 20009;

const ERROR_SITE_USER = 20010;

const ERROR_SITE_CONVERSION = 20021;

const ERROR_SITE_CONVERSION_TRANS_ID_MISSING = 20013;

const ERROR_SITE_CONVERSION_ID = 20014;

const ERROR_SITE_CONVERSION_VALUE = 20015;

const ERROR_SITE_CONVERSION_QUANTITY = 20025;

const ERROR_SITE_JQUERY_MISSING = 20017;

const ERROR_SITE_CUSTOMACTION = 20024;

const ERROR_SITE_CUSTOMACTION_VALUE = 20018;

const ERROR_SITE_INIT = 20019;

const ERROR_SITE_RENDERER = 20023;

const ERROR_SITE_CUSTOM_API = 20020;

const ERROR_SITE_PRODUCT = 20012;

const ERROR_SITE_PRODUCT_ID = 20026;

const ERROR_SITE_PRODUCT_ATTRIBUTE = 20027;

const ERROR_SITE_ELEMENT_MATCHES = 20028;

const ERROR_SITE_TRANSACTION = 20029;

const ERROR_SITE_GENRE = 20001;
const ERROR_SITE_CITY = 20002;
const ERROR_SITE_RESERVATION = 20003;

const ERROR_SITE_PURCHASE = 20004;

const ERROR_SITE_PURCHASE_NAME = 20005;

const ERROR_SITE_PURCHASE_PRICE = 20006;

const ERROR_SITE_PURCHASE_QUANTITY = 20007;
const ERROR_PRODUCT_PARSER = ERROR_SITE_PRODUCT;
const ERROR_SITE_CONFIG_MISSING = 20011;
const ERROR_SITE_TRANS_ID_MISSING = ERROR_SITE_CONVERSION_TRANS_ID_MISSING;
const ERROR_COUNTER_DATA_INVALID = 40002;

const EVENT_SEGMENT_ENTER = 'segment.enter';

const EVENT_SEGMENT_LEAVE = 'segment.leave';

const EVENT_SEGMENTS_READY = 'segments.ready';

const EVENT_CUSTOMACTION = 'customAction';

const EVENT_INIT_START = 'init.start';

const EVENT_INIT_SUCCESS = 'init.success';

const EVENT_INIT_FAILURE = 'init.failure';

const EVENT_INIT_UID = 'init.uid';

const EVENT_UID_CREATED = 'uid.created';

const EVENT_INIT_CONTEXT = 'init.context';

const EVENT_INIT_QUICK_CONTEXT = 'init.quick_context';

const EVENT_LOGIN = 'login';

const EVENT_LOGOUT = 'logout';

const EVENT_EASY_CONFIG = 'const config';

const EVENT_SCRIPT_LOAD = 'scriptLoad';

const EVENT_VISIT = 'visit';

const EVENT_LOCATION = 'location';

const EVENT_LOCATION_FAILURE = 'location.failure';

const EVENT_XDM_REQUEST = 'xdm.request';

const EVENT_XDM_READY = 'xdm.ready';

const EVENT_XDM_FAILURE = 'xdm.failure';

const EVENT_CONVERSION = 'conversion';

const EVENT_PRODUCT_DATA = 'product';

const EVENT_PRODUCT_PURCHASE = 'product.purchase';

const EVENT_DATALAYER = 'dataLayer';

const EVENT_MESSAGE_INIT = 'message.initSuccess';

const EVENT_MESSAGE_REQUEST = 'message.request';

const EVENT_MESSAGE_RECEIVE = 'message.receive';

const EVENT_MESSAGE_SUCCESS = 'message.success';

const EVENT_MESSAGE_FAILURE = 'message.failure';

const EVENT_MESSAGESHOW_COMPLETE = 'messageshow.complete';

const EVENT_MESSAGESHOW_FAILED = 'messageshow.failed';

const EVENT_MESSAGE_SHOW = 'message.showMessage';

const EVENT_MESSAGE_CLICK = 'message.clickMessage';

const EVENT_MESSAGE_TRUE_DISPLAY = 'message.trueDisplay';

const EVENT_URL_CHANGED = 'pageload.urlChanged';

const EVENT_PAGE_CHANGED = 'pagechange.urlChanged';

const EVENT_TARGETGROUP_ENTER = 'targetgroup.enter';

const EVENT_TARGETGROUP_LEAVE = 'targetgroup.leave';

const EVENT_CAMPAIGN_STAMP = 'campaign.stamp';

const EVENT_CAMPAIGN_UNSTAMP = 'campaign.unstamp';

const EVENT_CAMPAIGN_CLICK = 'campaign.click';

const EVENT_DOM_EVENT = 'domEvent';

const EVENT_DOM_WAIT = 'domWait';

const EVENT_EASY_EVENT = 'easyEvent';

const EVENT_JSVAR_WAIT = 'jsvarWait';

const EVENT_TRIGGER_EVENT = 'trigger.event';

const EVENT_TRIGGER_FIRE = 'trigger.fire';

const EVENT_PREVIEW_TOOL_ENABLE = 'previewTool.enable';

const EVENT_PREVIEW_TOOL_DISABLE = 'previewTool.disable';

const EVENT_ERROR_SENT = 'error.sent';

const EVENT_EASY_READY = 'const ready';

const EVENT_DOM_READY = 'domReady';

const EVENT_JQUERY_READY = 'jquery.ready';

const EVENT_STATE_REMOVE = 'state.remove';

const EVENT_STATE_SET = 'state.set';

const EVENT_PROMISE_REJECTION_HANDLED = 'promise.rejectionHandled';

const EVENT_PROMISE_UNHANDLED_REJECTION = 'promise.unhandledRejection';

const XDM_INIT_TIMEOUT = 5000;

const API_QUEUE_MAX_EVENTS = 40;

const DEVEL = false;

const ENV = 'prod';

const COOKIE_QUICK_CONTEXT = 'frosmo_quickContext';

const COOKIE_MAX_SIZE = 3000;

const MESSAGE_TRUE_DISPLAY_TIME = 3000;

const JQUERY_INIT_TIMEOUT = 10000;

const CONTEXT_TYPE_SERVER = 'context.api';

const CONTEXT_TYPE_STORAGE = 'local.storage';

const CONTEXT_TYPE_XDM = 'shared.context';

const MESSAGE_TYPE_BASIC = 'basic';

const MESSAGE_TYPE_CACHED = 'cached';

const STATE_DEVICE = '_device';

const STATE_MODE = '_mode';

const STATE_MODE_TEST = 'test';

const STATE_TYPE_PAGE = 3;

const STATE_TYPE_SESSION = 2;

const DEVICE_REGEXP_IOS = /(iPhone|iPod)/i;

const DEVICE_REGEXP_IPAD = /iPad/i;

const DEVICE_REGEXP_ANDROIDMOBILE = /Android.+(mobile|Opera (mini|mobi))/i;

const DEVICE_REGEXP_ANDROIDTABLET = /Android(?!.+(mobile|Opera (mini|mobi)))/i;

const DEVICE_REGEXP_WINDOWSPHONE = /Windows Phone|Windows CE|Windows Mobile|IEMobile/i;

const DEVICE_REGEXP_WINDOWSTABLET = /Windows.*ARM/i;

const DEVICE_REGEXP_OTHERMOBILE = /(sPPC|Blackberry|Cricket|iPAQ|HTC_Touch|HTC_HD2|HTC-ST7377|Kindle|LGd|LG-G|LG-L|LGE|Teleca|POLARIS|MOT-|MOTd|Nintendo|Nokia|Symbian|SymbOS|SPVs|PalmSource|PalmOS|SAMSUNG|sam-rd|samrd|SCH-A950|SEC-SGH|SHARP|SIE-|UP.BROWSER|sonyericsson|UC(s?)Browser|WebOS|Pantech|MobileExplorer|ZuneWP7|Opera Mini|Opera Mobi)/i;

const DEVICE_REGEXP_OTHERTABLET = /Playbook|hp-tablet|Opera Tab/i;

const MESSAGE_SCRIPT_ID = 'frosmo_message_script_id_';

const MESSAGE_STYLE_ID = 'frosmo_message_style_id_';

const DOM_EVENT_NAMESPACE = 'easy_core';

const LOG_LEVEL_DEBUG = 'debug';

const LOG_LEVEL_INFO = 'info';

const LOG_LEVEL_WARN = 'warn';

const LOG_LEVEL_LOG = 'log';

const LOG_LEVEL_ERROR = 'error';

const sharedContextRpc = null;
