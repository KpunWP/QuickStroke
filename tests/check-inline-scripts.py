#!/usr/bin/env python3
"""Extract inline scripts from QuickStroke HTML files and run node --check."""
from html.parser import HTMLParser
from pathlib import Path
import subprocess
import sys
import tempfile

class ScriptParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_script = False
        self.external = False
        self.buffer = []
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'script':
            values = dict(attrs)
            self.in_script = True
            self.external = bool(values.get('src'))
            self.buffer = []
    def handle_endtag(self, tag):
        if tag.lower() == 'script' and self.in_script:
            script = ''.join(self.buffer)
            if not self.external and script.strip():
                self.scripts.append(script)
            self.in_script = False
            self.external = False
            self.buffer = []
    def handle_data(self, data):
        if self.in_script and not self.external:
            self.buffer.append(data)

def main(paths):
    failed = False
    with tempfile.TemporaryDirectory(prefix='qs-inline-js-') as temp:
        for raw in paths:
            path = Path(raw)
            parser = ScriptParser()
            parser.feed(path.read_text(encoding='utf-8'))
            for index, script in enumerate(parser.scripts):
                target = Path(temp) / f'{path.stem}-{index}.js'
                target.write_text(script, encoding='utf-8')
                result = subprocess.run(['node', '--check', str(target)], capture_output=True, text=True)
                if result.returncode:
                    failed = True
                    print(f'FAIL {path} inline script {index}\n{result.stderr}')
            if not failed:
                print(f'PASS {path.name}: {len(parser.scripts)} inline scripts')
    return 1 if failed else 0

if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
