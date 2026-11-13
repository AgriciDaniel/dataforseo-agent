# Security

## Reporting a problem

Please do not open a public issue for a security problem. Use GitHub's private reporting instead:
on the repository page, open **Security**, then **Report a vulnerability**. You will get a reply
within a few days.

Worth reporting, for example:

- A way to make a paid DataForSEO call without the approval prompt, or past the session budget.
- A way for a prompt, a web page or a tool result to read or leak the DataForSEO login.
- Anything that sends data somewhere the README's "Privacy and network" section does not list.

## How credentials are handled

- The DataForSEO login is stored in `~/.config/dataforseo-agent/credentials.env`, readable only by
  your user, and loaded by the launcher. It is never sent to an AI model.
- From an env file you point to, only the `DATAFORSEO_*` lines are read.

## Supported versions

Fixes go into the latest version on `main`.
