var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var core = require('@actions/core');
var github = require('@actions/github');
var WebClient = require('@slack/web-api').WebClient;
function createBlocks(githubToken, config, url, unfurlLinksContextStr) {
    return __awaiter(this, void 0, void 0, function () {
        function parseUrl(url) {
            var values = url.split('#');
            var urlParams = values[0].split('/');
            var params = {};
            if (values[1].includes('issuecomment')) {
                var qParams = values[1].split('-');
                params['type'] = qParams[0];
                params['typeId'] = qParams[1];
            }
            else if (values[0].includes('files')) {
                params['type'] = urlParams[urlParams.length - 1];
                params['typeId'] = values[1].replace('r', '');
            }
            else if (values[1].includes('discussion')) {
                var qParams = values[1].split('_');
                params['type'] = qParams[0];
                params['typeId'] = qParams[1].replace('r', '');
            }
            return {
                owner: urlParams[3],
                repoName: urlParams[4],
                type: params['type'],
                typeId: params['typeId']
            };
        }
        function fetchComment(githubToken, owner, repoName, type, typeId) {
            return __awaiter(this, void 0, void 0, function () {
                var octokit;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            octokit = github.getOctokit(githubToken);
                            if (!(type == 'issuecomment')) return [3 /*break*/, 2];
                            return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', {
                                    owner: owner,
                                    repo: repoName,
                                    comment_id: typeId
                                })];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2:
                            if (!(type == 'files')) return [3 /*break*/, 4];
                            return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/pulls/comments/{comment_id}', {
                                    owner: owner,
                                    repo: repoName,
                                    comment_id: typeId
                                })];
                        case 3: return [2 /*return*/, _a.sent()];
                        case 4:
                            if (!(type == 'discussion')) return [3 /*break*/, 6];
                            return [4 /*yield*/, octokit.request('GET /repos/{owner}/{repo}/pulls/comments/{comment_id}', {
                                    owner: owner,
                                    repo: repoName,
                                    comment_id: typeId
                                })];
                        case 5: return [2 /*return*/, _a.sent()];
                        case 6: throw new Error('error');
                    }
                });
            });
        }
        function formatDate(dateString) {
            var date = new Date(dateString);
            var y = date.getFullYear();
            var m = ('00' + (date.getMonth() + 1)).slice(-2);
            var d = ('00' + date.getDate()).slice(-2);
            return (y + '/' + m + '/' + d);
        }
        function unfurlIfNeeded(unfurlLinksContextStr, githubToken, body) {
            return __awaiter(this, void 0, void 0, function () {
                var urls, unfurlBody, i, params_1, res_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (unfurlLinksContextStr === 'false') {
                                return [2 /*return*/, []];
                            }
                            urls = body.match(/https:\/\/github.com[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+(discussion_r\d{9}|issuecomment-\d{9}|files#r\d{9})/g);
                            if (urls === null) {
                                return [2 /*return*/, []];
                            }
                            unfurlBody = '\n';
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < urls.length)) return [3 /*break*/, 4];
                            params_1 = parseUrl(urls[i]);
                            return [4 /*yield*/, fetchComment(githubToken, params_1.owner, params_1.repoName, params_1.type, params_1.typeId)["catch"](function (e) { return console.error(e); })];
                        case 2:
                            res_1 = _a.sent();
                            unfurlBody += "\n\nAuthor: ".concat(res_1.data.user.login, " \nComment: ").concat(res_1.data.body);
                            _a.label = 3;
                        case 3:
                            i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/, [
                                {
                                    'type': 'divider'
                                },
                                {
                                    'type': 'section',
                                    'text': {
                                        'type': 'mrkdwn',
                                        'text': unfurlBody
                                    }
                                },
                                {
                                    'type': 'divider'
                                },
                            ]];
                    }
                });
            });
        }
        function detectTargetConfig(config) {
            var keys = Object.keys(config);
            for (var i = 0; i < keys.length; i++) {
                if (comment.body.startsWith(keys[i])) {
                    return { key: keys[i], channelId: config[keys[i]] };
                }
            }
            throw new Error('there is no detected value');
        }
        var params, res, comment, targetConfig, body, blocks, _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    ;
                    ;
                    params = parseUrl(url);
                    return [4 /*yield*/, fetchComment(githubToken, params.owner, params.repoName, params.type, params.typeId)["catch"](function (e) { return console.error(e); })];
                case 1:
                    res = _c.sent();
                    comment = res.data;
                    targetConfig = {};
                    try {
                        targetConfig = detectTargetConfig(config);
                    }
                    catch (error) {
                        throw new Error(error);
                    }
                    body = comment.body.startsWith(targetConfig.key) ? comment.body.slice(targetConfig.key.length) : comment.body;
                    blocks = [
                        {
                            'type': 'section',
                            'text': {
                                'type': 'mrkdwn',
                                'text': "*\u8CEA\u554F\u3084\u5171\u6709\u5185\u5BB9\u304C\u8FFD\u52A0\u3055\u308C\u307E\u3057\u305F\uFF01by ".concat(comment.user.login, "*")
                            }
                        },
                        {
                            'type': 'section',
                            'text': {
                                'type': 'mrkdwn',
                                'text': "".concat(body, " \n\n <").concat(url, "|").concat(params.owner, "/").concat(params.repoName, "> | ").concat(formatDate(comment.created_at))
                            },
                            'accessory': {
                                'type': 'image',
                                'image_url': comment.user.avatar_url,
                                'alt_text': 'avatar image'
                            }
                        },
                    ];
                    _b = (_a = blocks).concat;
                    return [4 /*yield*/, unfurlIfNeeded(unfurlLinksContextStr, githubToken, body)["catch"](function (e) { return console.error(e); })];
                case 2:
                    blocks = _b.apply(_a, [_c.sent()]);
                    return [2 /*return*/, [targetConfig.channelId, blocks]];
            }
        });
    });
}
var SlackService = /** @class */ (function () {
    function SlackService() {
    }
    // NOTE: https://slack.dev/node-slack-sdk/web-api
    SlackService.callPostChat = function (channelId, blocks) {
        return __awaiter(this, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = new WebClient(core.getInput('slack_bot_token'));
                        return [4 /*yield*/, client.chat.postMessage({
                                text: '質問や共有内容が追加されました!',
                                channel: channelId,
                                blocks: blocks,
                                unfurl_links: true
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return SlackService;
}());
(function () { return __awaiter(_this, void 0, void 0, function () {
    var githubToken, githubCommentUrl, channelerTargetCongfig, unfurlLinksContextStr, config, _a, channelId, blocks, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                githubToken = core.getInput('github_token');
                githubCommentUrl = core.getInput('github_comment_url');
                channelerTargetCongfig = core.getInput('channeler_target_config');
                unfurlLinksContextStr = core.getInput('unfurl_links_context');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                config = JSON.parse(channelerTargetCongfig);
                return [4 /*yield*/, createBlocks(githubToken, config, githubCommentUrl, unfurlLinksContextStr)];
            case 2:
                _a = _b.sent(), channelId = _a[0], blocks = _a[1];
                SlackService.callPostChat(channelId, blocks)["catch"](function (e) { return console.error(e); });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                console.log(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); })();
