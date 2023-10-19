import * as colors from 'fmt/colors.ts';

const apiToken = Deno.env.get('VPMPKG_GH_API_TOKEN');

if (typeof apiToken !== 'string') {
  console.log(
    `${
      colors.yellow('Warning')
    }: GitHub API Token not found. Using public API.`,
  );
}

export { apiToken };
