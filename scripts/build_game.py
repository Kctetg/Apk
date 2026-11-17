#!/usr/bin/env python3
"""
Single-source-of-truth builder & validator for SNAKE: PIXEL RUSH.
Bundles template.html + js/*.js in deterministic load order into:
  - snake_clash_royal.html
  - app/src/main/assets/snake.html
  - public/assets/aistudio/snake_d90c69e2.html
"""
import hashlib
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(ROOT, "template.html")
JS_ORDER = [
    "js/storage.js",
    "js/audio.js",
    "js/snake.js",
    "js/worlds.js",
    "js/enemies.js",
    "js/modes.js",
    "js/progression.js",
    "js/renderer.js",
    "js/core.js",
    "js/ui.js",
]
TARGETS = [
    os.path.join(ROOT, "snake_clash_royal.html"),
    os.path.join(ROOT, "app/src/main/assets/snake.html"),
    os.path.join(ROOT, "public/assets/aistudio/snake_d90c69e2.html"),
]

EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001F9FF"
    "\U0001FA00-\U0001FAFF"
    "\u2600-\u26FF"
    "\u2700-\u27BF"
    "]+",
    flags=re.UNICODE,
)


def read_text(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def check_syntax_node(js_files):
    for rel in js_files:
        full = os.path.join(ROOT, rel)
        res = subprocess.run(["node", "--check", full], capture_output=True, text=True)
        if res.returncode != 0:
            raise RuntimeError(f"Syntax error in {rel}:\n{res.stderr}")


def audit_bundle(template_src, js_sources):
    # 1. Zero Unicode emoji check
    combined = template_src + "\n" + "\n".join(js_sources.values())
    emojis = EMOJI_RE.findall(combined)
    if emojis:
        raise RuntimeError(f"Unicode emoji found (strictly forbidden): {emojis[:5]}")

    # 2. Validate every $('#id') selector in JS exists in template.html or JS
    dom_ids = set(re.findall(r'id="([A-Za-z0-9_-]+)"', template_src))
    for src in js_sources.values():
        dom_ids.update(re.findall(r'id="([A-Za-z0-9_-]+)"', src))
        dom_ids.update(re.findall(r"id='([A-Za-z0-9_-]+)'", src))
    referenced_ids = set()
    for src in js_sources.values():
        referenced_ids.update(re.findall(r"\$\('#([A-Za-z0-9_-]+)'\)", src))
        referenced_ids.update(re.findall(r'\$\("#([A-Za-z0-9_-]+)"\)', src))
    missing_ids = sorted(referenced_ids - dom_ids)
    if missing_ids:
        raise RuntimeError(f"Unwired DOM IDs referenced in JS: {missing_ids}")

    # 3. Validate PX_ICONS keys used in pxImgTag('key', ...) and PX_URLS.key exist in PX_ICONS
    snake_src = js_sources["js/snake.js"]
    defined_icons = set(re.findall(r"^\s{4}([a-zA-Z0-9_]+)\s*:\s*\[", snake_src, flags=re.MULTILINE))
    used_icons = set()
    for src in js_sources.values():
        used_icons.update(re.findall(r"pxImgTag\(\s*'([a-zA-Z0-9_]+)'", src))
        used_icons.update(re.findall(r"PX_URLS\.([a-zA-Z0-9_]+)", src))
    missing_icons = sorted(used_icons - defined_icons)
    if missing_icons:
        raise RuntimeError(f"Missing PX_ICONS definitions: {missing_icons}")


def main():
    template_src = read_text(TEMPLATE_PATH)
    if "<!-- MODULES_BUNDLE -->" not in template_src:
        raise RuntimeError("template.html is missing <!-- MODULES_BUNDLE --> marker")

    js_sources = {rel: read_text(os.path.join(ROOT, rel)) for rel in JS_ORDER}
    check_syntax_node(JS_ORDER)
    audit_bundle(template_src, js_sources)

    bundled_scripts = "\n".join(
        f"<script>\n/* === {rel} === */\n{js_sources[rel]}\n</script>"
        for rel in JS_ORDER
    )
    output_html = template_src.replace("<!-- MODULES_BUNDLE -->", bundled_scripts)
    digest = hashlib.sha256(output_html.encode("utf-8")).hexdigest()[:16]

    for target in TARGETS:
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "w", encoding="utf-8", newline="\n") as f:
            f.write(output_html)
        print(f"Wrote {os.path.relpath(target, ROOT)} ({len(output_html)} bytes, sha256={digest})")

    print("Build & audit OK.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"BUILD FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
