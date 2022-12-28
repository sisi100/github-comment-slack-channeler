const core = require('@actions/core');
const github = require('@actions/github');
const {WebClient} = require('@slack/web-api');
require('dotenv').config();

async function createBlocks(githubToken, config, url, unfurlLinksContextStr): Promise<[channelId: string, blocks: any]> {
  type GithubInfo = {
    owner: string;
    repoName: string;
    type: string;
    typeId: string;
  }

  function parseUrl(url): GithubInfo {
    const values = url.split('#');
    const urlParams = values[0].split('/');

    const params = {};
    if (values[1].includes('issuecomment')) {
      const qParams = values[1].split('-');
      params['type'] = qParams[0];
      params['typeId'] = qParams[1];
    } else if (values[0].includes('files')) {
      params['type'] = urlParams[urlParams.length - 1];
      params['typeId'] = values[1].replace('r', '');
    } else if (values[1].includes('discussion')) {
      const qParams = values[1].split('_');
      params['type'] = qParams[0];
      params['typeId'] = qParams[1].replace('r', '');
    }

    return {
      owner: urlParams[3],
      repoName: urlParams[4],
      type: params['type'],
      typeId: params['typeId'],
    };
  };

  async function fetchComment(githubToken, owner, repoName, type, typeId): Promise<any> {
    const octokit = github.getOctokit(githubToken);

    if (type == 'issuecomment') {
      return await octokit.request('GET /repos/{owner}/{repo}/issues/comments/{comment_id}', {
        owner: owner,
        repo: repoName,
        comment_id: typeId,
      });
    } else if (type == 'files') {
      return await octokit.request('GET /repos/{owner}/{repo}/pulls/comments/{comment_id}', {
        owner: owner,
        repo: repoName,
        comment_id: typeId,
      });
    } else if (type == 'discussion') {
      return await octokit.request('GET /repos/{owner}/{repo}/pulls/comments/{comment_id}', {
        owner: owner,
        repo: repoName,
        comment_id: typeId,
      });
    } else {
      throw new Error('error');
    }
  }

  function formatDate(dateString): string {
    const date = new Date(dateString);
    const y = date.getFullYear();
    const m = ('00' + (date.getMonth()+1)).slice(-2);
    const d = ('00' + date.getDate()).slice(-2);
    return (y + '/' + m + '/' + d);
  }

  async function unfurlIfNeeded(unfurlLinksContextStr, githubToken, body): Promise<any> {
    if (unfurlLinksContextStr === 'false') {
      return [];
    }

    const urls = body.match(/https:\/\/github.com[-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]+(discussion_r\d{9}|issuecomment-\d{9}|files#r\d{9})/g);
    if (urls === null) {
      return [];
    }

    let unfurlBody = '\n';
    for (let i = 0; i < urls.length; i++) {
      const params: GithubInfo = parseUrl(urls[i]);
      const res = await fetchComment(githubToken, params.owner, params.repoName, params.type, params.typeId).catch((e) => console.error(e));
      unfurlBody += `\n\nAuthor: ${res.data.user.login} \nComment: ${res.data.body}`;
    }

    return [
      {
        'type': 'divider',
      },
      {
        'type': 'section',
        'text': {
          'type': 'mrkdwn',
          'text': unfurlBody,
        },
      },
      {
        'type': 'divider',
      },
    ];
  }

  function detectTargetConfig(config): {key: string, channelId: string} {
    const keys = Object.keys(config);
    for (let i = 0; i < keys.length; i++) {
      if (comment.body.startsWith(keys[i])) {
        return {key: keys[i], channelId: config[keys[i]]};
      }
    }
    throw new Error('there is no detected value');
  };

  const params: GithubInfo = parseUrl(url);
  const res = await fetchComment(githubToken, params.owner, params.repoName, params.type, params.typeId).catch((e) => console.error(e));
  const comment = res.data;

  let targetConfig: any = {};
  try {
    targetConfig = detectTargetConfig(config);
  } catch (error) {
    throw new Error(error);
  }

  const body = comment.body.startsWith(targetConfig.key) ? comment.body.slice(targetConfig.key.length) : comment.body;
  let blocks = [
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `*質問や共有内容が追加されました！by ${comment.user.login}*`,
      },
    },
    {
      'type': 'section',
      'text': {
        'type': 'mrkdwn',
        'text': `${body} \n\n <${url}|${params.owner}/${params.repoName}> | ${formatDate(comment.created_at)}`,
      },
      'accessory': {
        'type': 'image',
        'image_url': comment.user.avatar_url,
        'alt_text': 'avatar image',
      },
    },
  ];

  blocks = blocks.concat(await unfurlIfNeeded(unfurlLinksContextStr, githubToken, body).catch((e) => console.error(e)));

  return [targetConfig.channelId, blocks];
}
class SlackService {
  // NOTE: https://slack.dev/node-slack-sdk/web-api
  static async callPostChat(channelId, blocks) {
    const client = new WebClient(core.getInput('slack_bot_token'));
    return await client.chat.postMessage({
      text: '質問や共有内容が追加されました!',
      channel: channelId,
      blocks: blocks,
      unfurl_links: true,
    });
  }
}

(async () => {
  const githubToken = core.getInput('github_token');
  const githubCommentUrl = core.getInput('github_comment_url');
  const channelerTargetCongfig = core.getInput('channeler_target_config');
  const unfurlLinksContextStr = core.getInput('unfurl_links_context');

  try {
    const config = JSON.parse(channelerTargetCongfig);
    const [channelId, blocks] = await createBlocks(githubToken, config, githubCommentUrl, unfurlLinksContextStr);
    SlackService.callPostChat(channelId, blocks).catch((e) => console.error(e));
  } catch (error) {
    console.log(error);
  }
})();
