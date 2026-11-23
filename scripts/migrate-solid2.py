#!/usr/bin/env python3
"""Mechanical Solid 1.x -> 2.0 codemod for moraine. Prints manual-follow-up notes."""

import os
import re

ROOTS = ["src", "docs", "test", "build"]
EXTS = (".ts", ".tsx", ".mts", ".cts")

REMOVED_FROM_SOLID = {
    "splitProps",
    "on",
    "batch",
    "produce",
    "createComputed",
    "createSelector",
    "catchError",
    "observable",
    "createMutable",
    "modifyMutable",
    "indexArray",
    "startTransition",
    "useTransition",
    "createResource",
    "Index",
    "SuspenseList",
    "Suspense",
    "ErrorBoundary",
}

RENAMES = {
    "mergeProps": "merge",
    "onMount": "onSettled",
    "unwrap": "snapshot",
    "getListener": "getObserver",
    "equalFn": "equals",
}

flags = []


def note(path, msg):
    flags.append(f"{path}: {msg}")


def scan_string(s, i):
    q = s[i]
    i += 1
    n = len(s)
    while i < n:
        c = s[i]
        if c == "\\":
            i += 2
            continue
        if q == "`" and c == "$" and i + 1 < n and s[i + 1] == "{":
            i = scan_balanced(s, i + 1, "{", "}")
            continue
        if c == q:
            return i + 1
        i += 1
    return n


def scan_balanced(s, i, open_ch, close_ch):
    depth = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in "'\"`":
            i = scan_string(s, i)
            continue
        if c == "/" and i + 1 < n and s[i + 1] == "/":
            j = s.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if c == "/" and i + 1 < n and s[i + 1] == "*":
            j = s.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c == open_ch:
            depth += 1
        elif c == close_ch:
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return n


def split_args(s, track_angle=False):
    args = []
    depth = 0
    angle = 0
    start = 0
    i = 0
    n = len(s)
    while i < n:
        c = s[i]
        if c in "'\"`":
            i = scan_string(s, i)
            continue
        if c == "/" and i + 1 < n and s[i + 1] == "/":
            j = s.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if c == "/" and i + 1 < n and s[i + 1] == "*":
            j = s.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        elif track_angle and c == "<" and i > 0 and (s[i - 1].isalnum() or s[i - 1] in "_>."):
            angle += 1
        elif track_angle and c == ">" and angle > 0:
            angle -= 1
        elif c == "," and depth == 0 and angle == 0:
            args.append(s[start:i])
            start = i + 1
        i += 1
    tail = s[start:]
    if tail.strip() or not args:
        args.append(tail)
    return args


def find_call(s, name, start=0):
    m = re.compile(r"(?<![\w$.])" + re.escape(name) + r"\s*\(").search(s, start)
    if not m:
        return -1, -1
    return m.start(), m.end() - 1


def call_span(s, paren_idx):
    return paren_idx, scan_balanced(s, paren_idx, "(", ")")


def array_elements(src):
    inner = src.strip()
    return [a.strip() for a in split_args(inner[1:-1]) if a.strip()]


def is_string_list(src):
    inner = src.strip()
    if not (inner.startswith("[") and inner.endswith("]")):
        return None
    keys = []
    for e in array_elements(inner):
        m = re.fullmatch(r"['\"]([\w$:-]+)['\"]", e)
        if not m:
            return None
        keys.append(m.group(1))
    return keys


def transform_effects(s, path):
    needs_render_effect = False
    for fname in ("createComputed", "createRenderEffect", "createEffect"):
        # Collect every call first, then rewrite right-to-left so nested calls are
        # handled independently and earlier positions stay valid.
        calls = []
        pos = 0
        while True:
            name_start, pi = find_call(s, fname, pos)
            if pi < 0:
                break
            _, end = call_span(s, pi)
            calls.append((name_start, pi, end))
            pos = pi + 1  # descend into the call so nested calls are collected too
        for name_start, pi, end in reversed(calls):
            inner = s[pi + 1 : end - 1]
            args = split_args(inner)
            new_fn = "createRenderEffect" if fname == "createComputed" else fname
            if args and args[0].strip().startswith("on("):
                oncall = args[0].strip()
                opi = oncall.index("(")
                oend = scan_balanced(oncall, opi, "(", ")")
                if oend < len(oncall):
                    note(path, f"on() not sole first arg in {fname}")
                    continue
                on_args = split_args(oncall[opi + 1 : oend - 1])
                if len(on_args) < 2:
                    note(path, f"on() with <2 args inside {fname}")
                    continue
                deps = on_args[0].strip()
                if deps.startswith("["):
                    els = array_elements(deps)
                    dep_expr = "() => [" + ", ".join(f"({e})()" for e in els) + "]"
                else:
                    dep_expr = deps
                tail_args = [dep_expr]
                tail_args.extend(a.strip() for a in on_args[1:])
                replacement = f"{new_fn}(" + ", ".join(tail_args) + ")"
                s = s[:name_start] + replacement + s[end:]
                if fname == "createComputed":
                    needs_render_effect = True
                continue
            if fname == "createComputed":
                replacement = "createRenderEffect(" + inner + ")"
                s = s[:name_start] + replacement + s[end:]
                needs_render_effect = True
                note(path, "createComputed without on() -> createRenderEffect; review split")
                continue
            if len(args) == 1 or re.match(r"^\s*(['\"0-9{\[]|true\b|false\b|null\b|undefined\b)", args[1]):
                note(path, f"manual: {fname} call needs compute/apply review")
    return s, needs_render_effect


def transform_split_props(s, path):
    pos = 0
    while True:
        name_start, pi = find_call(s, "splitProps", pos)
        if pi < 0:
            break
        _, end = call_span(s, pi)
        inner = s[pi + 1 : end - 1]
        args = split_args(inner, track_angle=True)
        consts = list(re.finditer(r"\bconst\s*\[", s[:name_start]))
        stmt_start = consts[-1].start() if consts else -1
        head = s[stmt_start:name_start] if stmt_start >= 0 else ""
        m = re.search(r"const\s*\[([^\]]+)\]\s*=\s*$", head)
        if not m or len(args) < 2:
            note(path, "manual: splitProps call shape unrecognized")
            pos = end
            continue
        names = [n.strip() for n in m.group(1).split(",")]
        obj = args[0].strip()
        key_args = [a.strip() for a in args[1:]]
        if len(names) != len(key_args) + 1:
            note(path, f"manual: splitProps {len(names)} names vs {len(key_args)} key args")
            pos = end
            continue
        line_start = s.rfind("\n", 0, stmt_start) + 1
        indent = re.match(r"[ \t]*", s[line_start:stmt_start]).group(0)
        key_lists = []
        for ka in key_args:
            keys = is_string_list(ka)
            if keys is None:
                key_lists.append(f"...{ka}")
                note(path, "splitProps with non-literal key array; verify")
            else:
                key_lists.extend(repr(k) for k in keys)
        stmts = []
        for i, name in enumerate(names[:-1]):
            ka = key_args[i]
            keys = is_string_list(ka)
            kexpr = ", ".join(repr(k) for k in keys) if keys is not None else f"...{ka}"
            if name and name != "_":
                stmts.append(f"const {name} = pick({obj}, {kexpr})")
        rest_name = names[-1]
        stmts.append(f"const {rest_name} = omit({obj}, {', '.join(key_lists)})")
        replacement = ("\n" + indent).join(stmts)
        s = s[:stmt_start] + replacement + s[end:]
        pos = stmt_start + len(replacement)
    return s


def fix_solid_import_names(s):
    return {
        "omit": re.search(r"(?<![\w$.])omit\(", s) is not None,
        "merge": re.search(r"(?<![\w$.])merge\(", s) is not None,
        "pick": re.search(r"(?<![\w$.])pick\(", s) is not None,
        "createSelector": re.search(r"(?<![\w$.])createSelector\(", s) is not None,
        "createRenderEffect": re.search(r"(?<![\w$.])createRenderEffect\(", s) is not None,
        "snapshot": re.search(r"(?<![\w$.])snapshot\(", s) is not None,
        "Loading": re.search(r"<Loading[\s>/]", s) is not None,
        "Errored": re.search(r"<Errored[\s>/]", s) is not None,
        "Reveal": re.search(r"<Reveal[\s>/]", s) is not None,
        "For": re.search(r"<For[\s>/]", s) is not None,
    }


def rewrite_imports(s, path, relroot):
    used = fix_solid_import_names(s)
    pattern = re.compile(r"import\s+(type\s+)?\{([^}]*)\}\s*from\s*'([^']+)'")
    injected = set()

    def handle(m):
        is_type = bool(m.group(1))
        module = m.group(3)
        parts = [p.strip() for p in m.group(2).split(",") if p.strip()]
        if module != "solid-js" or is_type:
            if module == "solid-js":
                parts = [p for p in parts if re.sub(r"^type\s+", "", p).split(" as ")[0].strip() != "JSX"]
                if not parts:
                    return ""
                return "import type { " + ", ".join(parts) + " } from 'solid-js'"
            return m.group(0)
        names = []
        for p in parts:
            base = re.sub(r"^type\s+", "", p).split(" as ")[0].strip()
            names.append((base, p))
        kept = [p for base, p in names if base != "JSX" and base not in REMOVED_FROM_SOLID]
        extra = []
        for name in ("omit", "merge", "snapshot", "Loading", "Errored", "Reveal", "For", "createRenderEffect"):
            if (
                used.get(name)
                and name not in injected
                and not any(base == name for base, _ in names)
            ):
                extra.append(name)
                injected.add(name)
        if not kept and not extra:
            return ""
        return "import { " + ", ".join(kept + extra) + " } from 'solid-js'"

    s = pattern.sub(handle, s)

    if re.search(r"\bJSX\.", s):
        m = re.search(r"import\s+type\s+\{([^}]*)\}\s*from\s*'@solidjs/web'", s)
        if m:
            inner = m.group(1)
            if not re.search(r"\bJSX\b", inner):
                s = s[: m.start(1)] + inner.rstrip() + ", JSX " + s[m.end(1) :]
        elif not re.search(r"import[^;]*\{[^}]*\bJSX\b[^}]*\}\s*from\s*'@solidjs/web'", s):
            s = "import type { JSX } from '@solidjs/web'\n" + s

    for helper in ("pick", "createSelector"):
        if not used.get(helper):
            continue
        if re.search(r"import[^;]*\{[^}]*\b" + helper + r"\b[^}]*\}\s*from", s):
            continue
        if path.startswith("src" + os.sep) or path.startswith("src/"):
            rel = os.path.relpath("src/shared/utils", os.path.dirname(path))
            if not rel.startswith("."):
                rel = "./" + rel
        else:
            rel = "@src/shared/utils"
        m = re.search(r"import\s+\{([^}]*)\}\s*from\s*'" + re.escape(rel) + "'", s)
        if m:
            s = s[: m.start(1)] + m.group(1).rstrip() + ", " + helper + " " + s[m.end(1) :]
        else:
            s = f"import {{ {helper} }} from '{rel}'\n" + s

    s = re.sub(r"^import\s+\{\s*\}\s*from\s*'[^']*'\s*\n?", "", s, flags=re.M)
    return s


def process(path, relroot):
    s = open(path).read()
    orig = s
    s = s.replace("'solid-js/web'", "'@solidjs/web'")
    s = s.replace('"solid-js/web"', '"@solidjs/web"')
    s = s.replace("'solid-js/store'", "'solid-js'")
    s = s.replace('"solid-js/store"', '"solid-js"')
    s = s.replace("'solid-js/jsx-runtime'", "'@solidjs/web/jsx-runtime'")
    s = re.sub(r"@jsxImportSource\s+solid-js", "@jsxImportSource @solidjs/web", s)

    s = re.sub(r"<(\w+(?:Context|Ctx))\.Provider\b", r"<\1", s)
    s = re.sub(r"</(\w+(?:Context|Ctx))\.Provider>", r"</\1>", s)
    s = re.sub(r"= (\w+(?:Context|Ctx))\.Provider\b", r"= \1", s)
    s = s.replace("context.Provider", "context")

    s = re.sub(r"<Index(\s[^>]*)?>", lambda m: "<For" + (m.group(1) or "") + " keyed={false}>", s)
    s = re.sub(r"</Index>", "</For>", s)

    s = re.sub(r"<Suspense\b", "<Loading", s)
    s = re.sub(r"</Suspense>", "</Loading>", s)
    s = re.sub(r"<ErrorBoundary\b", "<Errored", s)
    s = re.sub(r"</ErrorBoundary>", "</Errored>", s)
    s = re.sub(r"<SuspenseList\b", "<Reveal", s)
    s = re.sub(r"</SuspenseList>", "</Reveal>", s)

    s = re.sub(r"(?<![\w.])classList=", "class=", s)

    s, _needs_re = transform_effects(s, path)
    s = transform_split_props(s, path)

    for old, new in RENAMES.items():
        s = re.sub(r"(?<![\w$.])" + re.escape(old) + r"\b", new, s)

    s = rewrite_imports(s, path, relroot)

    if s != orig:
        open(path, "w").write(s)


def main():
    relroot = os.getcwd()
    for root in ROOTS:
        for dirpath, _dirs, files in os.walk(root):
            if "node_modules" in dirpath or "/dist" in dirpath:
                continue
            for f in files:
                if f.endswith(EXTS):
                    process(os.path.join(dirpath, f), relroot)
    print("\n".join(flags))


if __name__ == "__main__":
    main()
