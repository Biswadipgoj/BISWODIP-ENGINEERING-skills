---
description: Save the LLM gateway (base URL, API key, model) once; every /dip agent and tool picks it up automatically
argument-hint: <base-url> <api-key> <model> · or: --model <name> · --extra NAME=value · show · test · clear
---

Configure the LLM gateway for the Biswodip system. The arguments are:

$ARGUMENTS

Resolve the CLI first:

```bash
DIP=.claude/skills/biswodip-orchestrator/bin/biswodip.mjs; [ -f "$DIP" ] || DIP="$HOME/.claude/skills/biswodip-orchestrator/bin/biswodip.mjs"
```

Then do exactly one of these:

| Arguments | Run |
|---|---|
| empty or `show` | `node "$DIP" api show` |
| `test` | `node "$DIP" api test` |
| `clear` | `node "$DIP" api clear` |
| a URL, a key and a model | `printf '%s' '<api-key>' \| node "$DIP" setapi --base-url '<base-url>' --model '<model>' --api-key-stdin` |
| only some fields (`--model x`, `--extra TYPESAFE_API_KEY=…`, `--profile work`) | `node "$DIP" setapi <those flags>` — fields not given are kept |

Rules:

- Pass the key through stdin as shown, so it does not sit in the command line; never echo it, `cat` the config file, or print the environment.
- The settings are saved in the user's config folder (`~/.config/biswodip/llm.json`, owner-only permissions), never inside a repository. Never copy a key into `.env`, code, docs, commits or `handoff.md`.
- Any OpenAI-compatible gateway works (OpenRouter, LiteLLM, Cloudflare AI Gateway, Portkey, a local server); an `anthropic.com` URL switches to the Anthropic protocol. Plain `http://` is accepted only for a gateway on this machine.
- After saving, run `node "$DIP" api test` and report the result as the tool printed it (status and provider — never the key).
- Tell the user the key they typed is in this chat's history; if that matters, they can run `node "$DIP" setapi --base-url … --model …` in their own terminal instead, where the key is prompted hidden.

Finish with the masked summary and one line: tools now read it through `dip exec`, e.g. `node "$DIP" exec --for open-code-review -- ocr …`.
