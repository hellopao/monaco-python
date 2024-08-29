# monaco-python

monaco-editor with python lsp in browser

## install
```bash
npm i monaco-python
```

## usage

### basic usage
```javascript
import start from 'monaco-python';

await start(document.getElementById('container'), {
	value: 'print("hello world!")'
});
```

### customize theme
```javascript
import start, { E_EDITOR_THEME } from 'monaco-python';

await start(document.getElementById('container'), {
	theme: E_EDITOR_THEME.MONOKAI,
});
```

### customize typesheds
```javascript
import start from 'monaco-python';

await start(document.getElementById('container'), {
	typesheds: {
		'stubs/testtt/testtt.pyi': 'def test(words: str) -> str: ...'
	}
});
```

### customize typesheds
```javascript
import start from 'monaco-python';

await start(document.getElementById('container'), {
	snippets: {
		testtt: {
			prefix: "tt",
			body: "testtt(${1:words})",
			description: "testtt"
		}
	}
});
```

### vim mode
```javascript
import start from 'monaco-python';
import { initVimMode } from 'monaco-vim';

const wrapper = await start(document.getElementById('container'), {
	value: 'print("hello world!")'
});
const editor = wrapper.getEditor();

const vimMode = initVimMode(editor, document.getElementById('my-statusbar'))
```