<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright (c) 2026 Biswodip Goj — Biswodip Goj Unified Engineering -->

# LLM gateway — `/dip-setapi`

Several tools in the catalog need a model: Open Code Review, jev-ultrafast, Browser Use and Strix. Save the gateway once, and every tool gets it under the variable names it reads.

## Set it

In Claude Code:

```text
/dip-setapi https://openrouter.ai/api/v1 <your-key> anthropic/claude-sonnet-5
/dip-setapi --model deepseek/deepseek-chat          # change only the model
/dip-setapi --extra TYPESAFE_API_KEY=<key>          # a tool-specific key (jev-ultrafast)
/dip-setapi test                                    # is the gateway reachable, is the key accepted
```

Or in your own terminal. The key is prompted hidden and never enters a chat log:

```bash
dip setapi --base-url https://openrouter.ai/api/v1 --model anthropic/claude-sonnet-5
printf '%s' "$KEY" | dip setapi --base-url … --model … --api-key-stdin
dip setapi --profile local --base-url http://127.0.0.1:4000 --model llama3   # several profiles; the last one saved is active
```

Any OpenAI-compatible endpoint works: OpenAI, OpenRouter, LiteLLM, Cloudflare AI Gateway, Portkey, Groq, DeepSeek, Together, or a local server. An `anthropic.com` URL switches to the Anthropic protocol. Force either one with `--protocol openai|anthropic`. Plain `http://` is accepted only for a gateway on this machine, and a key inside the URL is refused.

## Where it is stored

`~/.config/biswodip/llm.json` (`%APPDATA%\biswodip\llm.json` on Windows, or `$XDG_CONFIG_HOME/biswodip`, or `$DIP_CONFIG_DIR`). The directory is `0700`, the file `0600`, and the file is written atomically. It is never stored inside a project, so it cannot be committed. `dip api show` masks the key to its last four characters.

## How tools get it

```bash
dip exec --for open-code-review -- ocr review …
dip exec --for jev-ultrafast -- uv run jev
dip api env --for open-code-review     # show what would be set (masked; --reveal to print values)
```

| Variables | Filled from |
|---|---|
| `DIP_LLM_BASE_URL` `DIP_LLM_API_KEY` `DIP_LLM_MODEL` `DIP_LLM_PROVIDER` `DIP_LLM_PROTOCOL` | always |
| `OPENAI_API_KEY` `OPENAI_BASE_URL` `OPENAI_API_BASE` `OPENAI_MODEL` | openai protocol |
| `ANTHROPIC_API_KEY` `ANTHROPIC_BASE_URL` `ANTHROPIC_MODEL` | anthropic protocol |
| `STRIX_LLM` (`<protocol>/<model>`) `LLM_API_KEY` `LLM_API_BASE` | always, also used by `dip strix` |
| `OCR_LLM_URL` `OCR_LLM_TOKEN` `OCR_LLM_MODEL` `OCR_LLM_PROTOCOL` | open-code-review |
| `TEXT_MODEL_API_KEY` `TEXT_MODEL_BASE_URL` `TEXT_MODEL` | jev-ultrafast |
| anything saved with `--extra NAME=value` | always |

Variables already set in your shell win over the saved profile. The command log (`.biswodip/evidence/commands.log`) records the command with every saved secret redacted.

## Remove it

```bash
dip api clear                 # the active profile
dip api clear --profile local
```
