import apiToken from './apiToken.ts';

const apiEndPoint = new URL('https://api.github.com');

const getTags = function(owner: string, repo: string): Promise<string[]> {
  const url = new URL(`/repos/${owner}/${repo}/tags`, apiEndPoint);

  const headers = new Headers({
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  });
  if(typeof apiToken === 'string') {
    headers.append('Authorization', `Bearer ${apiToken}`);
  }

  return fetch(url, { headers })
    .then((res) => {
      if(!res.ok) {
        throw Error(`Failed to fetch tags: ${res.status}`);
      }
      return res;
    })
    .then((res) => {
      return res.text();
    }).then((body) => {

      const result = JSON.parse(body) as Required<{ name: string }>[];
      return result.map((tag) => tag.name);
    });
}

const getFileContent = function(owner: string, repo: string, ref: string, path: string): Promise<string> {
  if(!path.startsWith('/')) {
    throw Error('path must start with "/".');
  }
  const url = new URL(`https://raw.githubusercontent.com/${owner}/${repo}/${ref}${path}`)

  return fetch(url)
  .then((res) => {
    if(!res.ok) {
      throw Error(`Failed to fetch tags: ${res.status}`);
    }
    return res;
  })
  .then((res) => {
    return res.text();
  });
}

export { getTags, getFileContent };
